ALTER TABLE users
    ADD COLUMN organisation_membership_active BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN organisation_left_at DATE;
