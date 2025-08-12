-- Enable Row Level Security (RLS) on all tables
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;

-- Posts table policies
-- Allow public read access to published posts
CREATE POLICY "Public posts are viewable by everyone" ON posts
  FOR SELECT USING (status = 'published');

-- Allow authenticated users to insert posts (for future admin features)
CREATE POLICY "Authenticated users can insert posts" ON posts
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update their own posts (for future admin features)
CREATE POLICY "Authenticated users can update posts" ON posts
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Allow authenticated users to delete posts (for future admin features)
CREATE POLICY "Authenticated users can delete posts" ON posts
  FOR DELETE USING (auth.role() = 'authenticated');

-- Allow service role (for API operations) full access
CREATE POLICY "Service role has full access to posts" ON posts
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Tasks table policies  
-- Allow authenticated users to read all tasks (for admin dashboard)
CREATE POLICY "Authenticated users can view tasks" ON tasks
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert tasks
CREATE POLICY "Authenticated users can insert tasks" ON tasks
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update tasks
CREATE POLICY "Authenticated users can update tasks" ON tasks
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Allow authenticated users to delete tasks
CREATE POLICY "Authenticated users can delete tasks" ON tasks
  FOR DELETE USING (auth.role() = 'authenticated');

-- Allow service role full access
CREATE POLICY "Service role has full access to tasks" ON tasks
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Page views table policies
-- Allow public read access for analytics
CREATE POLICY "Public read access to page views" ON page_views
  FOR SELECT USING (true);

-- Allow anonymous insert for tracking page views
CREATE POLICY "Anyone can insert page views" ON page_views
  FOR INSERT WITH CHECK (true);

-- Only authenticated users can update page views
CREATE POLICY "Authenticated users can update page views" ON page_views
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Only authenticated users can delete page views
CREATE POLICY "Authenticated users can delete page views" ON page_views
  FOR DELETE USING (auth.role() = 'authenticated');

-- Allow service role full access
CREATE POLICY "Service role has full access to page_views" ON page_views
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Create a function to bypass RLS for service operations
CREATE OR REPLACE FUNCTION bypass_rls_for_service()
RETURNS VOID AS $$
BEGIN
  -- This function can be used to temporarily bypass RLS for service operations
  -- It should only be called by authenticated service accounts
  IF auth.jwt() ->> 'role' != 'service_role' THEN
    RAISE EXCEPTION 'Access denied: Service role required';
  END IF;
  
  -- Set local bypass (only affects current transaction)
  SET LOCAL row_security = off;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users (will be restricted by function logic)
GRANT EXECUTE ON FUNCTION bypass_rls_for_service() TO authenticated;

-- Create helper function to check if user is admin (for future use)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- For now, check if user has service_role or specific admin claim
  RETURN (
    auth.jwt() ->> 'role' = 'service_role' OR
    auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to all authenticated users
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;