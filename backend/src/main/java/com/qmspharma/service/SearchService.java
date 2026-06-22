package com.qmspharma.service;

import com.qmspharma.model.dto.request.AdvancedSearchRequest;
import com.qmspharma.model.dto.response.SearchResultResponse;
import com.qmspharma.model.entity.*;
import com.qmspharma.repository.*;
import jakarta.persistence.criteria.JoinType;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

@Service
@RequiredArgsConstructor
public class SearchService {

    private static final int DEFAULT_LIMIT = 8;

    private final CapaRepository capaRepository;
    private final DeviationRepository deviationRepository;
    private final ChangeRequestRepository changeRequestRepository;
    private final DocumentRepository documentRepository;
    private final CapaActionRepository capaActionRepository;
    private final ChangeImplementationTaskRepository changeImplementationTaskRepository;
    private final TrainingAssignmentRepository trainingAssignmentRepository;

    @Transactional(readOnly = true)
    public Map<String, Object> search(String query, String type) {
        List<SearchResultResponse> results = runSearch(query, type, DEFAULT_LIMIT);
        return Map.of("results", results, "total", results.size());
    }

    @Transactional(readOnly = true)
    public Map<String, Object> advancedSearch(AdvancedSearchRequest request) {
        String type = request.getRecordTypes() != null && request.getRecordTypes().size() == 1
                ? request.getRecordTypes().get(0)
                : null;
        int limit = request.getSize() != null && request.getSize() > 0 ? request.getSize() : 20;
        List<SearchResultResponse> results = runSearch(request.getQuery(), type, limit);
        return Map.of("results", results, "total", results.size());
    }

    private List<SearchResultResponse> runSearch(String query, String type, int perGroupLimit) {
        String q = query == null ? "" : query.trim().toLowerCase();
        if (q.length() < 2) return List.of();

        String normalizedType = type == null ? "" : type.trim().toUpperCase();
        List<SearchResultResponse> results = new ArrayList<>();

        if (matches(normalizedType, "CAPA", "RECORD")) searchCapas(q, perGroupLimit, results);
        if (matches(normalizedType, "DEVIATION", "RECORD")) searchDeviations(q, perGroupLimit, results);
        if (matches(normalizedType, "CHANGE_CONTROL", "CHANGE", "RECORD")) searchChanges(q, perGroupLimit, results);
        if (matches(normalizedType, "DOCUMENT", "RECORD")) searchDocuments(q, perGroupLimit, results);
        if (matches(normalizedType, "ACTION", "TASK")) searchActions(q, perGroupLimit, results);

        results.sort(Comparator.comparing(SearchResultResponse::getUpdatedAt, Comparator.nullsLast(Comparator.reverseOrder())));
        return results.stream().limit(Math.max(perGroupLimit, DEFAULT_LIMIT)).toList();
    }

    private boolean matches(String type, String... aliases) {
        if (type == null || type.isBlank()) return true;
        return Arrays.stream(aliases).anyMatch(type::equals);
    }

    private void searchCapas(String q, int limit, List<SearchResultResponse> results) {
        capaRepository.findAll((Specification<Capa>) (root, query, cb) -> {
            String pattern = "%" + q + "%";
            return cb.or(
                    cb.like(cb.lower(root.get("capaNumber")), pattern),
                    cb.like(cb.lower(root.get("title")), pattern),
                    cb.like(cb.lower(root.get("description")), pattern)
            );
        }, PageRequest.of(0, limit, Sort.by(Sort.Direction.DESC, "updatedAt"))).forEach(c -> results.add(
                SearchResultResponse.builder()
                        .type("CAPA").id(c.getId()).number(c.getCapaNumber()).title(c.getTitle())
                        .subtitle(c.getDepartment() != null ? c.getDepartment().getName() : null)
                        .status(c.getStatus().name()).url("/capa/detail/" + c.getId()).updatedAt(c.getUpdatedAt()).build()));
    }

    private void searchDeviations(String q, int limit, List<SearchResultResponse> results) {
        deviationRepository.findAll((Specification<Deviation>) (root, query, cb) -> {
            String pattern = "%" + q + "%";
            return cb.or(
                    cb.like(cb.lower(root.get("deviationNumber")), pattern),
                    cb.like(cb.lower(root.get("title")), pattern),
                    cb.like(cb.lower(root.get("description")), pattern),
                    cb.like(cb.lower(root.get("sourceArea")), pattern)
            );
        }, PageRequest.of(0, limit, Sort.by(Sort.Direction.DESC, "updatedAt"))).forEach(d -> results.add(
                SearchResultResponse.builder()
                        .type("DEVIATION").id(d.getId()).number(d.getDeviationNumber()).title(d.getTitle())
                        .subtitle(d.getDepartment() != null ? d.getDepartment().getName() : null)
                        .status(d.getStatus().name()).url("/deviations/detail/" + d.getId()).updatedAt(d.getUpdatedAt()).build()));
    }

    private void searchChanges(String q, int limit, List<SearchResultResponse> results) {
        changeRequestRepository.findAll((Specification<ChangeRequest>) (root, query, cb) -> {
            String pattern = "%" + q + "%";
            return cb.or(
                    cb.like(cb.lower(root.get("changeNumber")), pattern),
                    cb.like(cb.lower(root.get("title")), pattern),
                    cb.like(cb.lower(root.get("description")), pattern),
                    cb.like(cb.lower(root.get("justification")), pattern)
            );
        }, PageRequest.of(0, limit, Sort.by(Sort.Direction.DESC, "updatedAt"))).forEach(c -> results.add(
                SearchResultResponse.builder()
                        .type("CHANGE_CONTROL").id(c.getId()).number(c.getChangeNumber()).title(c.getTitle())
                        .subtitle(c.getDepartment() != null ? c.getDepartment().getName() : null)
                        .status(c.getStatus().name()).url("/change-control/detail/" + c.getId()).updatedAt(c.getUpdatedAt()).build()));
    }

    private void searchDocuments(String q, int limit, List<SearchResultResponse> results) {
        documentRepository.findAll((Specification<Document>) (root, query, cb) -> {
            String pattern = "%" + q + "%";
            return cb.or(
                    cb.like(cb.lower(root.get("documentNumber")), pattern),
                    cb.like(cb.lower(root.get("title")), pattern),
                    cb.like(cb.lower(root.get("description")), pattern),
                    cb.like(cb.lower(root.get("keywords")), pattern)
            );
        }, PageRequest.of(0, limit, Sort.by(Sort.Direction.DESC, "updatedAt"))).forEach(d -> results.add(
                SearchResultResponse.builder()
                        .type("DOCUMENT").id(d.getId()).number(d.getDocumentNumber()).title(d.getTitle())
                        .subtitle(d.getDocumentType() != null ? d.getDocumentType().name() : null)
                        .status(d.getStatus().name()).url("/documents/detail/" + d.getId()).updatedAt(d.getUpdatedAt()).build()));
    }

    private void searchActions(String q, int limit, List<SearchResultResponse> results) {
        capaActionRepository.findAll((Specification<CapaAction>) (root, query, cb) -> {
            String pattern = "%" + q + "%";
            return cb.or(
                    cb.like(cb.lower(root.get("actionNumber")), pattern),
                    cb.like(cb.lower(root.get("description")), pattern)
            );
        }, PageRequest.of(0, limit, Sort.by(Sort.Direction.DESC, "updatedAt"))).forEach(a -> results.add(
                SearchResultResponse.builder()
                        .type("ACTION").id(a.getId()).number(a.getActionNumber()).title(a.getDescription())
                        .subtitle(a.getCapa() != null ? a.getCapa().getCapaNumber() : "CAPA action")
                        .status(a.getStatus().name())
                        .url(a.getCapa() != null ? "/capa/detail/" + a.getCapa().getId() : "/capa/list")
                        .updatedAt(a.getUpdatedAt()).build()));

        changeImplementationTaskRepository.findAll((Specification<ChangeImplementationTask>) (root, query, cb) -> {
            String pattern = "%" + q + "%";
            return cb.or(
                    cb.like(cb.lower(root.get("title")), pattern),
                    cb.like(cb.lower(root.get("description")), pattern)
            );
        }, PageRequest.of(0, limit, Sort.by(Sort.Direction.DESC, "updatedAt"))).forEach(t -> results.add(
                SearchResultResponse.builder()
                        .type("ACTION").id(t.getId()).number("Task " + t.getTaskNumber()).title(t.getTitle())
                        .subtitle(t.getChangeRequest() != null ? t.getChangeRequest().getChangeNumber() : "Implementation task")
                        .status(t.getStatus().name())
                        .url(t.getChangeRequest() != null ? "/change-control/detail/" + t.getChangeRequest().getId() : "/change-control/list")
                        .updatedAt(t.getUpdatedAt()).build()));

        trainingAssignmentRepository.findAll((Specification<TrainingAssignment>) (root, query, cb) -> {
            String pattern = "%" + q + "%";
            var curriculum = root.join("curriculum", JoinType.LEFT);
            return cb.or(
                    cb.like(cb.lower(curriculum.get("title")), pattern),
                    cb.like(cb.lower(root.get("sourceRecordNumber")), pattern),
                    cb.like(cb.lower(root.get("traineeComments")), pattern)
            );
        }, PageRequest.of(0, limit, Sort.by(Sort.Direction.DESC, "updatedAt"))).forEach(t -> results.add(
                SearchResultResponse.builder()
                        .type("ACTION").id(t.getId()).number(t.getSourceRecordNumber()).title(t.getCurriculum().getTitle())
                        .subtitle("Training assignment").status(t.getStatus().name()).url("/training/my-training")
                        .updatedAt(t.getUpdatedAt() != null ? t.getUpdatedAt() : Instant.now()).build()));
    }
}
