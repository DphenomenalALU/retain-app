INSERT INTO categories (id, name, color, icon, is_system) VALUES
  ('cat_001', 'Food & dining', '#EEB390', 'utensils', FALSE),
  ('cat_002', 'Transport', '#BFDBFE', 'car', FALSE),
  ('cat_003', 'Home', '#B7AEE9', 'house', FALSE),
  ('cat_004', 'Wellness', '#B1EBC5', 'heart', FALSE),
  ('cat_005', 'Uncategorized', '#CFCFCF', 'tag', TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, name, email, password_hash, role) VALUES
  ('usr_001', 'Maya Ibrahim', 'maya@retain.app', '$2b$10$6NUrMBCNbHBzvdoQHQCHqOqkpm4K79s0XVmJqIrBbfKTyMunqDP6C', 'admin')
ON CONFLICT (id) DO NOTHING;

INSERT INTO budgets (id, user_id, month, amount) VALUES
  ('bud_001', 'usr_001', '2026-10-01', 1200.00)
ON CONFLICT (id) DO NOTHING;
