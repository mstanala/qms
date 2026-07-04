package com.qmspharma.model.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class TrainingSessionResponse {
    private UUID id;
    private UUID curriculumId;
    private String curriculumTitle;
    private String sessionCode;
    private String title;
    private Instant scheduledDate;
    private Instant endDate;
    private String location;
    private UserRef instructor;
    private Integer maxParticipants;
    private String status;
    private String notes;
    private List<AttendeeResponse> attendees;
    private Instant createdAt;

    @Data @Builder
    public static class AttendeeResponse {
        private UUID id;
        private UserRef trainee;
        private String attendanceStatus;
        private Integer score;
        private Boolean passed;
    }
}