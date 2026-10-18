ALTER TABLE activity_logs
    ADD COLUMN energy_source VARCHAR(50),
    ADD COLUMN meal_type VARCHAR(50),
    ADD COLUMN servings NUMERIC(10,2),
    ADD COLUMN product_category VARCHAR(100),
    ADD COLUMN spend_amount NUMERIC(12,2),
    ADD COLUMN spend_currency VARCHAR(3),
    ADD COLUMN flight_distance_km NUMERIC(12,2);

ALTER TABLE activity_logs
    ADD CONSTRAINT chk_activity_servings
        CHECK (servings IS NULL OR servings > 0),
    ADD CONSTRAINT chk_activity_spend_amount
        CHECK (spend_amount IS NULL OR spend_amount >= 0),
    ADD CONSTRAINT chk_activity_flight_distance
        CHECK (flight_distance_km IS NULL OR flight_distance_km >= 0);

INSERT INTO emission_factors (
    activity_type,
    unit,
    kg_co2e_per_unit,
    source,
    effective_date
)
VALUES (
    'flight_travel',
    'passenger-km',
    0.150000,
    'Development placeholder - verify factor before release',
    DATE '2026-01-01'
);
