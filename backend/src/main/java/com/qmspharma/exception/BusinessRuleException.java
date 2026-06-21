package com.qmspharma.exception;

import lombok.Getter;

@Getter
public class BusinessRuleException extends RuntimeException {
    private final String ruleCode;

    public BusinessRuleException(String message, String ruleCode) {
        super(message);
        this.ruleCode = ruleCode;
    }
}
