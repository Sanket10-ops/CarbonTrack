-- Organisation employee-level reporting requires separate, explicit consent.
ALTER TABLE users
    ADD COLUMN organisation_reporting_opt_in BOOLEAN NOT NULL DEFAULT FALSE;
