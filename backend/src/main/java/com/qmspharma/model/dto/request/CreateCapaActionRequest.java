package com.qmspharma.model.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
public class CreateCapaActionRequest {
    @NotBlank private String description;
    @NotNull private String type;
    @NotNull private UUID assignedToId;
    @NotNull private Instant dueDate;
}
