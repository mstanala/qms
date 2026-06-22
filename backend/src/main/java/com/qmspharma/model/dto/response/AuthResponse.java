package com.qmspharma.model.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class AuthResponse {
    private String accessToken;
    private String refreshToken;
    private Long expiresIn;
    private UserSummary user;

    @Data
    @Builder
    public static class UserSummary {
        private String id;
        private String displayName;
        private List<String> roles;
    }
}
