package com.qmspharma.repository;

import com.qmspharma.model.entity.SequenceCounter;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface SequenceCounterRepository extends JpaRepository<SequenceCounter, UUID> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM SequenceCounter s WHERE s.sequenceName = :name AND s.year = :year AND s.plantSite IS NULL")
    List<SequenceCounter> findAllBySequenceNameAndYearForUpdate(@Param("name") String name, @Param("year") Integer year);
}
