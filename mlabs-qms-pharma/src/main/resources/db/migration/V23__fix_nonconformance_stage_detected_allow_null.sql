-- V23: Allow NULL for stage_detected (optional field during NC intake)
ALTER TABLE nonconformances DROP CONSTRAINT IF EXISTS nonconformances_stage_detected_check;
ALTER TABLE nonconformances ADD CONSTRAINT nonconformances_stage_detected_check CHECK (
    stage_detected IS NULL OR stage_detected IN (
        'INCOMING', 'IN_PROCESS', 'FINAL_PRODUCT', 'STABILITY', 'MARKET'
    )
);