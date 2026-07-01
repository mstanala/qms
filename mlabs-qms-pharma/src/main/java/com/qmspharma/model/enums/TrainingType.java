package com.qmspharma.model.enums;

public enum TrainingType {
    // Legacy values (used by change_training_requirements)
    SOP_READ, OJT, PRACTICAL,
    // Shared values
    CLASSROOM, E_LEARNING,
    // New values (used by training_curricula)
    ON_THE_JOB, SELF_STUDY, WORKSHOP, ASSESSMENT, PRACTICAL_DEMONSTRATION
}