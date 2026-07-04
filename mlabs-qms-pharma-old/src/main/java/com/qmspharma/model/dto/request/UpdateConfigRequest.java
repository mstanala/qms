package com.qmspharma.model.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UpdateConfigRequest {
    @NotBlank private String configValue;
    private String configType;
    private String description;
}
