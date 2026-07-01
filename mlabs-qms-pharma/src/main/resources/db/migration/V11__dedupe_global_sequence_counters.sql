-- V11: Repair duplicate global sequence counters.
--
-- PostgreSQL unique constraints allow multiple NULL values, so the existing
-- UNIQUE(sequence_name, plant_site_id, year) did not prevent duplicates where
-- plant_site_id is NULL. Keep the row with the highest current value and add a
-- partial unique index for global counters.

DROP TABLE IF EXISTS tmp_global_sequence_counter_dedupe;

CREATE TEMP TABLE tmp_global_sequence_counter_dedupe AS
SELECT
    id,
    MAX(current_value) OVER (PARTITION BY sequence_name, year) AS max_current_value,
    ROW_NUMBER() OVER (
        PARTITION BY sequence_name, year
        ORDER BY current_value DESC, id
    ) AS row_number
FROM sequence_counters
WHERE plant_site_id IS NULL;

UPDATE sequence_counters sc
SET current_value = t.max_current_value
FROM tmp_global_sequence_counter_dedupe t
WHERE sc.id = t.id
  AND t.row_number = 1;

DELETE FROM sequence_counters sc
USING tmp_global_sequence_counter_dedupe t
WHERE sc.id = t.id
  AND t.row_number > 1;

CREATE UNIQUE INDEX IF NOT EXISTS uk_sequence_counters_global
    ON sequence_counters (sequence_name, year)
    WHERE plant_site_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uk_sequence_counters_site
    ON sequence_counters (sequence_name, plant_site_id, year)
    WHERE plant_site_id IS NOT NULL;

DROP TABLE IF EXISTS tmp_global_sequence_counter_dedupe;
