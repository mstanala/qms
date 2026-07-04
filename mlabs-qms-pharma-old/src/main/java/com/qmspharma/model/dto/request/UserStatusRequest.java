package com.qmspharma.model.dto.request;

import lombok.Data;

@Data
public class UserStatusRequest {
    private Boolean isActive;
    private Boolean isLocked;
    private String reason;
}
