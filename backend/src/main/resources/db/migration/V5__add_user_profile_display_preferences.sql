ALTER TABLE users
    ADD COLUMN preferred_units VARCHAR(20) NOT NULL DEFAULT 'metric',
    ADD COLUMN goal_visibility BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE users
    ADD CONSTRAINT chk_users_preferred_units
    CHECK (preferred_units IN ('metric', 'imperial'));
