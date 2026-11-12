-- User-defined monthly CO2e target used by the personal dashboard.
ALTER TABLE users
    ADD COLUMN monthly_target_kg NUMERIC(12, 2);
