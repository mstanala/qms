package com.qmspharma.model.dto.request;

import lombok.Data;

@Data
public class UpdateUserPreferencesRequest {
    private Boolean emailNotifications;
    private Boolean taskReminders;
    private Boolean compactView;
    private String landingPage;
}
