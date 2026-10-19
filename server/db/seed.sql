INSERT INTO categories (id, name, color, icon, is_system) VALUES
  ('cat_001', 'Food & dining', '#EEB390', 'utensils', FALSE),
  ('cat_002', 'Transport', '#BFDBFE', 'car', FALSE),
  ('cat_003', 'Home', '#B7AEE9', 'house', FALSE),
  ('cat_004', 'Wellness', '#B1EBC5', 'heart', FALSE),
  ('cat_005', 'Uncategorized', '#CFCFCF', 'tag', TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, name, email, password_hash, role) VALUES
  ('usr_001', 'Emmanuel Annor', 'emmanuel@retain.app', '$2b$10$E9QH1i3dt52J6l/l41GzsuBut327HAY245FFPB0u3zuwaUAckRmUC', 'admin')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, password_hash = EXCLUDED.password_hash, role = EXCLUDED.role;

INSERT INTO budgets (id, user_id, month, amount) VALUES
  ('bud_001', 'usr_001', '2026-10-01', 1200.00)
ON CONFLICT (id) DO NOTHING;

INSERT INTO expenses (id, user_id, category_id, title, amount, expense_date, payment_method, note) VALUES
  ('exp_001', 'usr_001', 'cat_001', 'Market groceries', 86.40, '2026-10-12', 'Card', 'Weekly staples'),
  ('exp_002', 'usr_001', 'cat_002', 'Ride to the studio', 18.50, '2026-10-11', 'Transfer', NULL),
  ('exp_003', 'usr_001', 'cat_003', 'Home internet', 52.00, '2026-10-10', 'Card', NULL),
  ('exp_004', 'usr_001', 'cat_004', 'Pilates class', 34.00, '2026-10-08', 'Card', NULL),
  ('exp_005', 'usr_001', 'cat_001', 'Sunday lunch', 42.75, '2026-10-05', 'Cash', NULL),
  ('exp_006', 'usr_001', 'cat_004', 'Pharmacy refill', 27.20, '2026-10-03', 'Card', NULL),
  ('exp_007', 'usr_001', 'cat_002', 'Parking', 12.00, '2026-10-02', 'Cash', NULL)
ON CONFLICT (id) DO NOTHING;
