package com.qmspharma.repository;

import com.qmspharma.model.entity.TrainingSession;
import com.qmspharma.model.enums.SessionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface TrainingSessionRepository extends JpaRepository<TrainingSession, UUID> {
    List<TrainingSession> findByCurriculumId(UUID curriculumId);
    List<TrainingSession> findByStatusAndScheduledDateAfter(SessionStatus status, Instant after);
    long countByStatusAndScheduledDateAfter(SessionStatus status, Instant after);
}