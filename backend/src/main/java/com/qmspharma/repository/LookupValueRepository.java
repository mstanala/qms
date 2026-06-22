package com.qmspharma.repository;

import com.qmspharma.model.entity.LookupValue;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface LookupValueRepository extends JpaRepository<LookupValue, UUID> {
    List<LookupValue> findByCategoryAndIsActiveTrueOrderBySortOrderAsc(String category);
}
