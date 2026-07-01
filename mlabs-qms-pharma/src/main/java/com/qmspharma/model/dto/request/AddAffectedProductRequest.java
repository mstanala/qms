package com.qmspharma.model.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.List;

@Data
public class AddAffectedProductRequest {
    @NotBlank private String productName;
    @NotBlank private String productCode;
    private String dosageForm;
    private List<String> markets;
    private String impactDescription;
}
