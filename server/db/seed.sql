INSERT INTO categories (id, name, color, is_system) VALUES
  ('cat_001', 'Food & dining', '#E58B58', FALSE),
  ('cat_002', 'Transport', '#4E8C9A', FALSE),
  ('cat_003', 'Home', '#8D7BBD', FALSE),
  ('cat_004', 'Wellness', '#D39A52', FALSE),
  ('cat_005', 'Uncategorized', '#9AA6A2', TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, name, email, password_hash, role) VALUES
  ('usr_001', 'Maya Ibrahim', 'maya@retain.app', '$2b$10$day1seedplaceholder', 'admin')
ON CONFLICT (id) DO NOTHING;

INSERT INTO budgets (id, user_id, month, amount) VALUES
  ('bud_001', 'usr_001', '2026-10-01', 1200.00)
ON CONFLICT (id) DO NOTHING;
