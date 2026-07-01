package com.qmspharma.service;

import com.qmspharma.exception.ResourceNotFoundException;
import com.qmspharma.model.dto.request.*;
import com.qmspharma.model.dto.response.*;
import com.qmspharma.model.entity.*;
import com.qmspharma.model.enums.*;
import com.qmspharma.repository.*;
import com.qmspharma.security.CurrentUserProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.extern.slf4j.Slf4j;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class TrainingService {

    private static final String PROCESS_KEY = "trainingProcess";
    private static final String RECORD_TYPE = "TRAINING";

    private final TrainingCurriculumRepository curriculumRepository;
    private final TrainingAssignmentRepository assignmentRepository;
    private final TrainingMatrixRepository matrixRepository;
    private final TrainingSessionRepository sessionRepository;
    private final TrainingSessionAttendeeRepository attendeeRepository;
    private final PlantSiteRepository plantSiteRepository;
    private final DepartmentRepository departmentRepository;
    private final DocumentRepository documentRepository;
    private final UserRepository userRepository;
    private final SequenceGeneratorService sequenceGenerator;
    private final DocumentDistributionRepository distributionRepository;
    private final AuditTrailService auditTrailService;
    private final WorkflowService workflowService;
    private final CurrentUserProvider currentUserProvider;

    // ─── Curricula ────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<CurriculumResponse> listCurricula(List<String> statuses, List<String> categories,
                                                    String search, Pageable pageable) {
        Specification<TrainingCurriculum> spec = Specification.where(null);
        if (statuses != null && !statuses.isEmpty()) {
            var enums = statuses.stream().map(CurriculumStatus::valueOf).toList();
            spec = spec.and((root, q, cb) -> root.get("status").in(enums));
        }
        if (categories != null && !categories.isEmpty()) {
            var enums = categories.stream().map(TrainingCategory::valueOf).toList();
            spec = spec.and((root, q, cb) -> root.get("category").in(enums));
        }
        if (search != null) {
            String pattern = "%" + search.toLowerCase() + "%";
            spec = spec.and((root, q, cb) -> cb.or(
                    cb.like(cb.lower(root.get("title")), pattern),
                    cb.like(cb.lower(root.get("curriculumCode")), pattern)));
        }
        return curriculumRepository.findAll(spec, pageable).map(this::toCurriculumResponse);
    }

    @Transactional(readOnly = true)
    public CurriculumResponse getCurriculumById(UUID id) {
        return toCurriculumResponse(curriculumRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Curriculum", "id", id)));
    }

    @Transactional
    public CurriculumResponse createCurriculum(CreateCurriculumRequest request) {
        User currentUser = currentUserProvider.getCurrentUser();
        TrainingCurriculum cur = new TrainingCurriculum();
        cur.setCurriculumCode(sequenceGenerator.generateNumber("TRAINING"));
        cur.setTitle(request.getTitle());
        cur.setDescription(request.getDescription());
        cur.setCategory(TrainingCategory.valueOf(request.getCategory()));
        cur.setTrainingType(TrainingType.valueOf(request.getTrainingType()));
        if (request.getDepartmentId() != null) cur.setDepartment(departmentRepository.findById(request.getDepartmentId()).orElse(null));
        if (request.getPlantSiteId() != null) cur.setPlantSite(plantSiteRepository.findById(request.getPlantSiteId()).orElse(null));
        cur.setOwner(currentUser);
        cur.setDurationHours(request.getDurationHours());
        cur.setPassingScore(request.getPassingScore());
        cur.setValidityMonths(request.getValidityMonths());
        cur.setIsMandatory(request.getIsMandatory() != null ? request.getIsMandatory() : false);
        cur.setRegulatoryRequirement(request.getRegulatoryRequirement());
        cur.setPrerequisites(request.getPrerequisites());
        if (request.getRelatedDocumentId() != null) {
            cur.setRelatedDocument(documentRepository.findById(request.getRelatedDocumentId()).orElse(null));
        }
        if ("ACTIVE".equals(request.getStatus())) {
            cur.setStatus(CurriculumStatus.ACTIVE);
            cur.setEffectiveDate(Instant.now());
        }
        cur.setCreatedBy(currentUser);
        cur.setUpdatedBy(currentUser);

        TrainingCurriculum saved = curriculumRepository.save(cur);
        auditTrailService.logAction("TRAINING_CURRICULUM", saved.getId(), saved.getCurriculumCode(), "CREATED", null, null, null, null);
        return toCurriculumResponse(saved);
    }

    // ─── Assignments ──────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<TrainingAssignmentResponse> listAssignments(String status, Pageable pageable) {
        Specification<TrainingAssignment> spec = Specification.where(null);
        if (status != null) {
            var statusEnum = TrainingAssignmentStatus.valueOf(status);
            spec = spec.and((root, q, cb) -> cb.equal(root.get("status"), statusEnum));
        }
        return assignmentRepository.findAll(spec, pageable).map(this::toAssignmentResponse);
    }

    @Transactional(readOnly = true)
    public Page<TrainingAssignmentResponse> getMyAssignments(Pageable pageable) {
        UUID userId = currentUserProvider.getCurrentUserId();
        return assignmentRepository.findByAssignedToId(userId, pageable).map(this::toAssignmentResponse);
    }

    @Transactional
    public TrainingAssignmentResponse createAssignment(CreateAssignmentRequest request) {
        User currentUser = currentUserProvider.getCurrentUser();
        TrainingCurriculum curriculum = curriculumRepository.findById(request.getCurriculumId())
                .orElseThrow(() -> new ResourceNotFoundException("Curriculum", "id", request.getCurriculumId()));
        User trainee = userRepository.findById(request.getAssignedToId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", request.getAssignedToId()));

        TrainingAssignment assignment = new TrainingAssignment();
        assignment.setCurriculum(curriculum);
        assignment.setAssignedTo(trainee);
        assignment.setAssignedBy(currentUser);
        assignment.setAssignmentReason(AssignmentReason.valueOf(request.getAssignmentReason()));
        assignment.setDueDate(request.getDueDate());
        assignment.setPriority(request.getPriority() != null ? TrainingPriority.valueOf(request.getPriority()) : TrainingPriority.MEDIUM);
        assignment.setSourceRecordType(request.getSourceRecordType());
        assignment.setSourceRecordId(request.getSourceRecordId());
        assignment.setSourceRecordNumber(request.getSourceRecordNumber());

        TrainingAssignment saved = assignmentRepository.save(assignment);

        // Start Flowable workflow process
        try {
            Map<String, Object> vars = new HashMap<>();
            vars.put("recordId", saved.getId().toString());
            vars.put("traineeId", trainee.getId().toString());
            vars.put("trainingType", curriculum.getTrainingType().name());
            vars.put("assessmentRequired", curriculum.getPassingScore() != null && curriculum.getPassingScore() > 0);
            if (saved.getDueDate() != null) {
                vars.put("dueDate", saved.getDueDate().toString());
            }
            if (curriculum.getDepartment() != null) {
                vars.put("departmentId", curriculum.getDepartment().getId().toString());
            }
            if (curriculum.getRelatedDocument() != null) {
                vars.put("documentId", curriculum.getRelatedDocument().getId().toString());
            }
            // Use assignedBy as trainer if no explicit trainer
            vars.put("trainerId", currentUser.getId().toString());

            String processId = workflowService.startProcess(PROCESS_KEY, saved.getId().toString(), vars);
            saved.setFlowableProcessId(processId);
            saved = assignmentRepository.save(saved);

            workflowService.recordStep(RECORD_TYPE, saved.getId(), "Assigned",
                    WorkflowStepStatus.COMPLETED, currentUser, "Training assigned to " + trainee.getDisplayName(), 1);
            workflowService.recordStep(RECORD_TYPE, saved.getId(), "Training Completion",
                    WorkflowStepStatus.CURRENT, currentUser, null, 2);
        } catch (Exception e) {
            log.warn("Failed to start training workflow for assignment {}: {}", saved.getId(), e.getMessage());
        }

        auditTrailService.logAction("TRAINING_ASSIGNMENT", saved.getId(), null, "CREATED", null, null, null,
                "Assigned to " + trainee.getFirstName() + " " + trainee.getLastName());
        return toAssignmentResponse(saved);
    }

    @Transactional
    public TrainingAssignmentResponse startTraining(UUID id) {
        TrainingAssignment assignment = assignmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment", "id", id));
        User currentUser = currentUserProvider.getCurrentUser();
        assignment.setStatus(TrainingAssignmentStatus.IN_PROGRESS);
        assignment.setAttempts(assignment.getAttempts() + 1);
        TrainingAssignment saved = assignmentRepository.save(assignment);

        workflowService.recordStep(RECORD_TYPE, saved.getId(), "Training In Progress",
                WorkflowStepStatus.CURRENT, currentUser, "Trainee started training (attempt " + saved.getAttempts() + ")", 2);

        auditTrailService.logAction("TRAINING", saved.getId(), null, "STARTED",
                "status", "ASSIGNED", "IN_PROGRESS", null);
        return toAssignmentResponse(saved);
    }

    @Transactional
    public TrainingAssignmentResponse completeAssignment(UUID id, CompleteAssignmentRequest request) {
        TrainingAssignment assignment = assignmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment", "id", id));
        User currentUser = currentUserProvider.getCurrentUser();

        assignment.setStatus(TrainingAssignmentStatus.COMPLETED);
        assignment.setCompletedDate(Instant.now());
        if (request.getScore() != null) assignment.setScore(request.getScore());
        if (request.getTraineeComments() != null) assignment.setTraineeComments(request.getTraineeComments());
        assignment.setAttempts(assignment.getAttempts() + 1);

        TrainingAssignment saved = assignmentRepository.save(assignment);

        // Complete Flowable workflow tasks
        if (saved.getFlowableProcessId() != null) {
            try {
                // Complete trainingCompletion task
                Map<String, Object> taskVars = new HashMap<>();
                taskVars.put("assessmentRequired", false);
                workflowService.completeCurrentTask(saved.getFlowableProcessId(), taskVars);

                // Complete trainerVerification task (flows to this after assessmentRequired=false)
                try {
                    Map<String, Object> verifyVars = new HashMap<>();
                    verifyVars.put("trainingEffective", true);
                    workflowService.completeCurrentTask(saved.getFlowableProcessId(), verifyVars);
                } catch (Exception e) {
                    log.debug("Trainer verification task may not be active yet: {}", e.getMessage());
                }

                workflowService.recordStep(RECORD_TYPE, saved.getId(), "Training Completion",
                        WorkflowStepStatus.COMPLETED, currentUser,
                        "Training completed. Score: " + saved.getScore(), 3);
                workflowService.recordStep(RECORD_TYPE, saved.getId(), "Completed",
                        WorkflowStepStatus.COMPLETED, currentUser, "Training workflow complete", 4);
            } catch (Exception e) {
                log.warn("Failed to complete training workflow task for {}: {}", saved.getId(), e.getMessage());
            }
        }

        auditTrailService.logAction("TRAINING_ASSIGNMENT", saved.getId(), null, "COMPLETED",
                "status", "IN_PROGRESS", "COMPLETED", "Score: " + saved.getScore());

        // Auto-mark document distribution training as complete
        if ("DOCUMENT".equals(saved.getSourceRecordType()) && saved.getSourceRecordId() != null) {
            distributionRepository.findByRecipientId(saved.getAssignedTo().getId()).stream()
                    .filter(d -> d.getTrainingRequired() && !d.getTrainingCompleted()
                            && d.getDocumentVersion().getDocument().getId().equals(saved.getSourceRecordId()))
                    .forEach(d -> {
                        d.setTrainingCompleted(true);
                        distributionRepository.save(d);
                    });
        }

        return toAssignmentResponse(saved);
    }

    // ─── Matrix ───────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<TrainingMatrixResponse> getMatrix(UUID departmentId) {
        List<TrainingMatrix> list = departmentId != null
                ? matrixRepository.findByDepartmentId(departmentId)
                : matrixRepository.findAll();
        return list.stream().map(this::toMatrixResponse).collect(Collectors.toList());
    }

    // ─── Sessions ─────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<TrainingSessionResponse> listSessions(Pageable pageable) {
        return sessionRepository.findAll(pageable).map(this::toSessionResponse);
    }

    // ─── Dashboard ────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public TrainingDashboardResponse getDashboard() {
        long totalAssignments = assignmentRepository.count();
        long completed = assignmentRepository.countByStatus(TrainingAssignmentStatus.COMPLETED);
        long overdue = assignmentRepository.countByStatus(TrainingAssignmentStatus.OVERDUE);
        double complianceRate = totalAssignments > 0 ? Math.round((double) completed / totalAssignments * 1000.0) / 10.0 : 0;

        List<TrainingDashboardResponse.CategoryCount> byCategory = curriculumRepository.countByCategory().stream()
                .map(r -> TrainingDashboardResponse.CategoryCount.builder()
                        .category(r[0].toString()).count((Long) r[1]).build())
                .collect(Collectors.toList());

        List<TrainingDashboardResponse.StatusCount> byStatus = assignmentRepository.countByStatus().stream()
                .map(r -> TrainingDashboardResponse.StatusCount.builder()
                        .status(r[0].toString()).count((Long) r[1]).build())
                .collect(Collectors.toList());

        return TrainingDashboardResponse.builder()
                .totalCurricula(curriculumRepository.count())
                .activeCurricula(curriculumRepository.countByStatus(CurriculumStatus.ACTIVE))
                .totalAssignments(totalAssignments)
                .completedAssignments(completed)
                .overdueAssignments(overdue)
                .complianceRate(complianceRate)
                .upcomingSessions(sessionRepository.countByStatusAndScheduledDateAfter(SessionStatus.SCHEDULED, Instant.now()))
                .byCategory(byCategory)
                .byStatus(byStatus)
                .build();
    }

    // ─── Mappers ──────────────────────────────────────────────────

    private CurriculumResponse toCurriculumResponse(TrainingCurriculum c) {
        return CurriculumResponse.builder()
                .id(c.getId())
                .curriculumCode(c.getCurriculumCode())
                .title(c.getTitle())
                .description(c.getDescription())
                .category(c.getCategory().name())
                .trainingType(c.getTrainingType().name())
                .departmentId(c.getDepartment() != null ? c.getDepartment().getId() : null)
                .departmentName(c.getDepartment() != null ? c.getDepartment().getName() : null)
                .plantSiteId(c.getPlantSite() != null ? c.getPlantSite().getId() : null)
                .plantSiteName(c.getPlantSite() != null ? c.getPlantSite().getName() : null)
                .owner(toUserRef(c.getOwner()))
                .status(c.getStatus().name())
                .durationHours(c.getDurationHours())
                .passingScore(c.getPassingScore())
                .maxAttempts(c.getMaxAttempts())
                .validityMonths(c.getValidityMonths())
                .isMandatory(c.getIsMandatory())
                .regulatoryRequirement(c.getRegulatoryRequirement())
                .prerequisites(c.getPrerequisites())
                .relatedDocumentId(c.getRelatedDocument() != null ? c.getRelatedDocument().getId() : null)
                .relatedDocumentNumber(c.getRelatedDocument() != null ? c.getRelatedDocument().getDocumentNumber() : null)
                .effectiveDate(c.getEffectiveDate())
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .version(c.getVersion())
                .build();
    }

    private TrainingAssignmentResponse toAssignmentResponse(TrainingAssignment a) {
        return TrainingAssignmentResponse.builder()
                .id(a.getId())
                .curriculumId(a.getCurriculum().getId())
                .curriculumCode(a.getCurriculum().getCurriculumCode())
                .curriculumTitle(a.getCurriculum().getTitle())
                .assignedTo(toUserRef(a.getAssignedTo()))
                .assignedBy(toUserRef(a.getAssignedBy()))
                .assignmentReason(a.getAssignmentReason().name())
                .dueDate(a.getDueDate())
                .priority(a.getPriority().name())
                .status(a.getStatus().name())
                .sourceRecordType(a.getSourceRecordType())
                .sourceRecordId(a.getSourceRecordId())
                .sourceRecordNumber(a.getSourceRecordNumber())
                .completedDate(a.getCompletedDate())
                .score(a.getScore())
                .attempts(a.getAttempts())
                .trainer(a.getTrainer() != null ? toUserRef(a.getTrainer()) : null)
                .trainerComments(a.getTrainerComments())
                .traineeComments(a.getTraineeComments())
                .createdAt(a.getCreatedAt())
                .updatedAt(a.getUpdatedAt())
                .build();
    }

    private TrainingMatrixResponse toMatrixResponse(TrainingMatrix m) {
        return TrainingMatrixResponse.builder()
                .id(m.getId())
                .roleId(m.getRole().getId())
                .roleName(m.getRole().getName())
                .curriculumId(m.getCurriculum().getId())
                .curriculumCode(m.getCurriculum().getCurriculumCode())
                .curriculumTitle(m.getCurriculum().getTitle())
                .departmentId(m.getDepartment() != null ? m.getDepartment().getId() : null)
                .departmentName(m.getDepartment() != null ? m.getDepartment().getName() : null)
                .isMandatory(m.getIsMandatory())
                .frequencyMonths(m.getFrequencyMonths())
                .effectiveDate(m.getEffectiveDate())
                .build();
    }

    private TrainingSessionResponse toSessionResponse(TrainingSession s) {
        return TrainingSessionResponse.builder()
                .id(s.getId())
                .curriculumId(s.getCurriculum().getId())
                .curriculumTitle(s.getCurriculum().getTitle())
                .sessionCode(s.getSessionCode())
                .title(s.getTitle())
                .scheduledDate(s.getScheduledDate())
                .endDate(s.getEndDate())
                .location(s.getLocation())
                .instructor(s.getTrainer() != null ? toUserRef(s.getTrainer()) : null)
                .maxParticipants(s.getMaxParticipants())
                .status(s.getStatus().name())
                .notes(s.getNotes())
                .attendees(s.getAttendees().stream().map(a -> TrainingSessionResponse.AttendeeResponse.builder()
                        .id(a.getId())
                        .trainee(toUserRef(a.getAttendee()))
                        .attendanceStatus(a.getAttendanceStatus().name())
                        .score(a.getScore())
                        .passed(a.getPassed())
                        .build()).collect(Collectors.toList()))
                .createdAt(s.getCreatedAt())
                .build();
    }

    private UserRef toUserRef(User user) {
        if (user == null) return null;
        return UserRef.builder()
                .id(user.getId())
                .displayName(user.getFirstName() + " " + user.getLastName())
                .email(user.getEmail())
                .build();
    }
}