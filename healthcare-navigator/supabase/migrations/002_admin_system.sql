-- Admin System Migration

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Admin roles enum
CREATE TYPE admin_role AS ENUM ('super_admin', 'admin', 'data_manager');

-- Admin accounts table
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role admin_role NOT NULL DEFAULT 'data_manager',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Admin profiles table
CREATE TABLE IF NOT EXISTS admin_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  full_name VARCHAR(255),
  avatar_url TEXT,
  bio TEXT,
  phone VARCHAR(50),
  last_login TIMESTAMPTZ,
  login_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(admin_id)
);

-- Admin permissions table
CREATE TABLE IF NOT EXISTS admin_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role admin_role NOT NULL,
  permission VARCHAR(100) NOT NULL,
  resource VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(role, permission, resource)
);

-- Admin sessions table
CREATE TABLE IF NOT EXISTS admin_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  ip_address INET,
  user_agent TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Admin activity logs table
CREATE TABLE IF NOT EXISTS admin_activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID REFERENCES admins(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  resource VARCHAR(100),
  resource_id VARCHAR(100),
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Import history table
CREATE TABLE IF NOT EXISTS admin_import_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  import_type VARCHAR(50) NOT NULL,
  filename VARCHAR(255),
  total_rows INTEGER DEFAULT 0,
  imported_rows INTEGER DEFAULT 0,
  skipped_rows INTEGER DEFAULT 0,
  errors JSONB,
  status VARCHAR(20) DEFAULT 'completed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_admins_username ON admins(username);
CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);
CREATE INDEX IF NOT EXISTS idx_admins_role ON admins(role);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(token);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_admin_id ON admin_sessions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_admin_id ON admin_activity_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_created_at ON admin_activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_import_history_admin_id ON admin_import_history(admin_id);

-- Insert default permissions for each role
INSERT INTO admin_permissions (role, permission, resource) VALUES
  -- Super Admin: all permissions
  ('super_admin', 'create', 'admins'),
  ('super_admin', 'read', 'admins'),
  ('super_admin', 'update', 'admins'),
  ('super_admin', 'delete', 'admins'),
  ('super_admin', 'manage_roles', 'admins'),
  ('super_admin', 'read', 'audit_logs'),
  ('super_admin', 'manage', 'settings'),
  ('super_admin', 'create', 'doctors'),
  ('super_admin', 'read', 'doctors'),
  ('super_admin', 'update', 'doctors'),
  ('super_admin', 'delete', 'doctors'),
  ('super_admin', 'create', 'hospitals'),
  ('super_admin', 'read', 'hospitals'),
  ('super_admin', 'update', 'hospitals'),
  ('super_admin', 'delete', 'hospitals'),
  ('super_admin', 'create', 'specialties'),
  ('super_admin', 'read', 'specialties'),
  ('super_admin', 'update', 'specialties'),
  ('super_admin', 'delete', 'specialties'),
  ('super_admin', 'create', 'districts'),
  ('super_admin', 'read', 'districts'),
  ('super_admin', 'update', 'districts'),
  ('super_admin', 'delete', 'districts'),
  ('super_admin', 'import', 'csv'),
  ('super_admin', 'export', 'csv'),
  -- Admin: healthcare data permissions
  ('admin', 'create', 'doctors'),
  ('admin', 'read', 'doctors'),
  ('admin', 'update', 'doctors'),
  ('admin', 'delete', 'doctors'),
  ('admin', 'create', 'hospitals'),
  ('admin', 'read', 'hospitals'),
  ('admin', 'update', 'hospitals'),
  ('admin', 'delete', 'hospitals'),
  ('admin', 'create', 'specialties'),
  ('admin', 'read', 'specialties'),
  ('admin', 'update', 'specialties'),
  ('admin', 'delete', 'specialties'),
  ('admin', 'read', 'districts'),
  ('admin', 'import', 'csv'),
  ('admin', 'export', 'csv'),
  ('admin', 'read', 'audit_logs'),
  -- Data Manager: limited permissions
  ('data_manager', 'read', 'doctors'),
  ('data_manager', 'update', 'doctors'),
  ('data_manager', 'read', 'hospitals'),
  ('data_manager', 'update', 'hospitals'),
  ('data_manager', 'read', 'specialties'),
  ('data_manager', 'update', 'specialties'),
  ('data_manager', 'import', 'csv'),
  ('data_manager', 'export', 'csv')
ON CONFLICT (role, permission, resource) DO NOTHING;

-- RLS policies
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_import_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_permissions ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (for admin API routes)
CREATE POLICY "Service role can manage admins" ON admins FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role can manage admin_profiles" ON admin_profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role can manage admin_sessions" ON admin_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role can manage admin_activity_logs" ON admin_activity_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role can manage admin_import_history" ON admin_import_history FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role can manage admin_permissions" ON admin_permissions FOR ALL USING (true) WITH CHECK (true);
