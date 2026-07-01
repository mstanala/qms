package com.qmspharma.repository;

import com.qmspharma.model.entity.ElectronicSignature;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface ElectronicSignatureRepository extends JpaRepository<ElectronicSignature, UUID> {
    List<ElectronicSignature> findByRecordTypeAndRecordIdAndIsValidTrue(String recordType, UUID recordId);
}
