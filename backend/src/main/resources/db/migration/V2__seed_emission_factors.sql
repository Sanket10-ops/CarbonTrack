
-- CarbonTrack V2: Initial emission factors
-- Source: Central Electricity Authority (CEA), India
-- Factor: 0.710 kg CO2 per kWh (FY 2024-25)

INSERT INTO emission_factors (
    activity_type,
    unit,
    kg_co2e_per_unit,
    source,
    effective_date
)
VALUES (
    'grid_electricity',
    'kWh',
    0.710000,
    'Central Electricity Authority, India - FY 2024-25',
    DATE '2024-04-01'
);
