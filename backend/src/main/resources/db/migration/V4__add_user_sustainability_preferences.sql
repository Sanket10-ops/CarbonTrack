
ALTER TABLE users
    ADD COLUMN preferred_transport VARCHAR(50),
    ADD COLUMN diet_preference VARCHAR(50),
    ADD COLUMN sustainability_goal VARCHAR(100);
