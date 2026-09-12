DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'customers'::regclass AND conname = 'customers_email_unique'
  ) THEN
    ALTER TABLE customers ADD CONSTRAINT customers_email_unique UNIQUE (email);
  END IF;
END $$;
