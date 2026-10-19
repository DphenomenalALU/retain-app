INSERT INTO categories (id, name, color, icon, is_system) VALUES
  ('cat_001', 'Food & dining', '#EEB390', 'utensils', FALSE),
  ('cat_002', 'Transport', '#BFDBFE', 'car', FALSE),
  ('cat_003', 'Home', '#B7AEE9', 'house', FALSE),
  ('cat_004', 'Wellness', '#B1EBC5', 'heart', FALSE),
  ('cat_005', 'Uncategorized', '#CFCFCF', 'tag', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Users, budgets, and expenses are provisioned by the API from private environment variables.
