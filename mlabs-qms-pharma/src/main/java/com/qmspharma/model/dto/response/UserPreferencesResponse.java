package com.qmspharma.model.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UserPreferencesResponse {
    private Boolean emailNotifications;
    private Boolean taskReminders;
    private Boolean compactView;
    private String landingPage;
}
