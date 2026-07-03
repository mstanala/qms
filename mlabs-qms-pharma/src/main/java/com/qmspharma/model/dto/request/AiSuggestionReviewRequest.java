package com.qmspharma.model.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.Map;

@Data
public class AiSuggestionReviewRequest {
    @NotBlank(message = "Decision is required")
    private String decision; // ACCEPTED, REJECTED, MODIFIED

    private String comments;
    private Map<String, Object> modification;

    // E-signature fields (required when suggestion.requiresESignature = true)
    private String password;
    private String signatureReason;
}
