-- V14: Fix training_type CHECK constraint to include SOP_READ, OJT, PRACTICAL

ALTER TABLE training_curricula DROP CONSTRAINT IF EXISTS training_curricula_training_type_check;
ALTER TABLE training_curricula ADD CONSTRAINT training_curricula_training_type_check
  CHECK (training_type IN (
    'CLASSROOM', 'ON_THE_JOB', 'SELF_STUDY', 'E_LEARNING',
    'WORKSHOP', 'ASSESSMENT', 'PRACTICAL_DEMONSTRATION',
    'SOP_READ', 'OJT', 'PRACTICAL'
  ));