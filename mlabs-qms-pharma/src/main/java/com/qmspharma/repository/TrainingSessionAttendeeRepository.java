package com.qmspharma.repository;

import com.qmspharma.model.entity.TrainingSessionAttendee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TrainingSessionAttendeeRepository extends JpaRepository<TrainingSessionAttendee, UUID> {
    List<TrainingSessionAttendee> findBySessionId(UUID sessionId);
    List<TrainingSessionAttendee> findByAttendeeId(UUID attendeeId);
}