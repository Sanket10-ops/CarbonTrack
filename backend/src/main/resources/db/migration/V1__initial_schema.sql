-- ==========================================
-- CarbonTrack V1 Initial Database Schema
-- ==========================================

-- Organisations
CREATE TABLE organisations (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    admin_user_id BIGINT
);

-- Users
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255),
    role VARCHAR(30) NOT NULL,
    org_id BIGINT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_users_organisation
        FOREIGN KEY (org_id)
        REFERENCES organisations(id)
);

-- Emission factors
CREATE TABLE emission_factors (
    id BIGSERIAL PRIMARY KEY,
    activity_type VARCHAR(100) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    kg_co2e_per_unit NUMERIC(12,6) NOT NULL,
    source VARCHAR(255),
    effective_date DATE NOT NULL,

    CONSTRAINT uq_emission_factor_type_unit
        UNIQUE (activity_type, unit)
);

-- Activity logs
CREATE TABLE activity_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    category VARCHAR(50) NOT NULL,
    activity_type VARCHAR(100) NOT NULL,
    quantity NUMERIC(12,4) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    co2e_kg NUMERIC(12,4) NOT NULL,
    log_date DATE NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_activity_user
        FOREIGN KEY (user_id)
        REFERENCES users(id),

    CONSTRAINT fk_activity_emission_factor
        FOREIGN KEY (activity_type, unit)
        REFERENCES emission_factors(activity_type, unit),

    CONSTRAINT chk_activity_quantity
        CHECK (quantity >= 0),

    CONSTRAINT chk_activity_co2e
        CHECK (co2e_kg >= 0)
);

-- Goals
CREATE TABLE goals (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    target_reduction_pct NUMERIC(5,2) NOT NULL,
    period_days INTEGER NOT NULL,
    start_date DATE NOT NULL,
    status VARCHAR(30) NOT NULL,

    CONSTRAINT fk_goal_user
        FOREIGN KEY (user_id)
        REFERENCES users(id),

    CONSTRAINT chk_goal_reduction
        CHECK (target_reduction_pct >= 0 AND target_reduction_pct <= 100),

    CONSTRAINT chk_goal_period
        CHECK (period_days > 0)
);

-- Badges
CREATE TABLE badges (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    trigger_type VARCHAR(30) NOT NULL,
    threshold NUMERIC(12,2)
);

-- User badges
CREATE TABLE user_badges (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    badge_id BIGINT NOT NULL,
    awarded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_user_badge_user
        FOREIGN KEY (user_id)
        REFERENCES users(id),

    CONSTRAINT fk_user_badge_badge
        FOREIGN KEY (badge_id)
        REFERENCES badges(id),

    CONSTRAINT uq_user_badge
        UNIQUE (user_id, badge_id)
);

-- ==========================================
-- Indexes
-- ==========================================

CREATE INDEX idx_activity_user_date
    ON activity_logs(user_id, log_date);

CREATE INDEX idx_activity_category
    ON activity_logs(category);

CREATE INDEX idx_activity_type
    ON activity_logs(activity_type);

CREATE INDEX idx_goal_user
    ON goals(user_id);

CREATE INDEX idx_user_badges_user
    ON user_badges(user_id);