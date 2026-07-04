package com.qmspharma.service;

import com.qmspharma.model.dto.response.LookupValueResponse;
import com.qmspharma.repository.LookupValueRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LookupService {

    private final LookupValueRepository lookupValueRepository;

    @Transactional(readOnly = true)
    public List<LookupValueResponse> getByCategory(String category) {
        return lookupValueRepository.findByCategoryAndIsActiveTrueOrderBySortOrderAsc(category)
                .stream().map(lv -> LookupValueResponse.builder()
                        .id(lv.getId()).category(lv.getCategory()).code(lv.getCode())
                        .displayValue(lv.getDisplayValue()).description(lv.getDescription())
                        .sortOrder(lv.getSortOrder()).build())
                .collect(Collectors.toList());
    }
}
