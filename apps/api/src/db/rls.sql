-- Enable RLS on tables
ALTER TABLE hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies for hospitals
-- Super admins can see all
CREATE POLICY super_admin_all_hospitals ON hospitals
FOR ALL TO authenticated
USING (
  (SELECT role FROM users WHERE user_id = auth.uid()) = 'super_admin'
);

-- Branch admins and staff can only see their own hospital
CREATE POLICY scoped_hospital_access ON hospitals
FOR SELECT TO authenticated
USING (
  hospital_id = (SELECT hospital_id FROM users WHERE user_id = auth.uid())
);

-- Create policies for users
CREATE POLICY super_admin_all_users ON users
FOR ALL TO authenticated
USING (
  (SELECT role FROM users WHERE user_id = auth.uid()) = 'super_admin'
);

CREATE POLICY scoped_user_access ON users
FOR SELECT TO authenticated
USING (
  hospital_id = (SELECT hospital_id FROM users WHERE user_id = auth.uid())
);

-- Note: auth.uid() is a placeholder for the actual session user ID.
-- In a standard Express setup without Supabase, you would set a session variable
-- like `SET app.current_user_id = '...'` in a transaction or session.
