-- Remove condition_options column (feature removed by user request)
ALTER TABLE products DROP COLUMN IF EXISTS condition_options;
