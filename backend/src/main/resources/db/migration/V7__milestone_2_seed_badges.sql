INSERT INTO badges (name, description, trigger_type, threshold) VALUES
('First Steps', 'Log your first activity', 'ACTIVITY_COUNT', 1),
('Consistent Tracker', 'Log ten activities', 'ACTIVITY_COUNT', 10),
('Carbon Cutter', 'Record 10 kg CO2e or more', 'EMISSIONS_TRACKED', 10)
ON CONFLICT (name) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_goal_user_start_date ON goals(user_id, start_date);
CREATE INDEX IF NOT EXISTS idx_activity_user_category_date ON activity_logs(user_id, category, log_date);
