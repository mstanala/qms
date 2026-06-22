package com.qmspharma.model.dto.request;

import lombok.Data;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@Data
public class AdvancedSearchRequest {
    private String query;
    private List<String> recordTypes;
    private Map<String, List<String>> filters;
    private Instant dateFrom;
    private Instant dateTo;
    private Integer page = 0;
    private Integer size = 20;
}
