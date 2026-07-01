package com.qmspharma.model.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class SearchResultResponse {
    private String type;
    private UUID id;
    private String number;
    private String title;
    private String subtitle;
    private String status;
    private String url;
    private Instant updatedAt;
}
