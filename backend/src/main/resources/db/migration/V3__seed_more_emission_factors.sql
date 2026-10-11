-- V3: Additional development emission factors
-- IMPORTANT: Illustrative values only. Verify factors and sources before release.

INSERT INTO emission_factors
    (activity_type, unit, kg_co2e_per_unit, source, effective_date)
VALUES
    ('car_travel',       'km',            0.192000, 'Development placeholder - verify factor', DATE '2026-01-01'),
    ('motorcycle_travel','km',            0.103000, 'Development placeholder - verify factor', DATE '2026-01-01'),
    ('bus_travel',       'passenger-km',  0.089000, 'Development placeholder - verify factor', DATE '2026-01-01'),
    ('train_travel',     'passenger-km',  0.041000, 'Development placeholder - verify factor', DATE '2026-01-01'),
    ('beef',             'kg',           27.000000, 'Development placeholder - verify factor', DATE '2026-01-01'),
    ('chicken',          'kg',            6.900000, 'Development placeholder - verify factor', DATE '2026-01-01'),
    ('plant_based_food', 'kg',            2.000000, 'Development placeholder - verify factor', DATE '2026-01-01'),
    ('clothing',         'kg',           25.000000, 'Development placeholder - verify factor', DATE '2026-01-01'),
    ('electronics',      'item',        300.000000, 'Development placeholder - verify factor', DATE '2026-01-01'),
    ('paper',            'kg',            1.300000, 'Development placeholder - verify factor', DATE '2026-01-01'),
    ('plastic',          'kg',            3.500000, 'Development placeholder - verify factor', DATE '2026-01-01');