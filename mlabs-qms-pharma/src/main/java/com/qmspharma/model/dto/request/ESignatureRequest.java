package com.qmspharma.model.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ESignatureRequest {
    @NotBlank private String password;
    @NotBlank private String meaning;
}
