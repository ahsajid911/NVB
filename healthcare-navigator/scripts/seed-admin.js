const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

function loadEnvFile() {
  const envPath = path.resolve(__dirname, '../.env.local');
  if (!fs.existsSync(envPath)) return {};
  const content = fs.readFileSync(envPath, 'utf-8');
  const env = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

async function main() {
  const envFile = loadEnvFile();

  const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || envFile.SUPABASE_URL || envFile.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || envFile.SUPABASE_SERVICE_ROLE_KEY || envFile.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;
  const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@healthnav.bd';
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
  const ADMIN_FULL_NAME = process.env.ADMIN_FULL_NAME || 'Super Admin';

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.');
    console.error('Set them in environment variables or in .env.local file.');
    process.exit(1);
  }

  if (!ADMIN_PASSWORD || ADMIN_PASSWORD.length < 12) {
    console.error('Error: ADMIN_PASSWORD environment variable is required (minimum 12 characters).');
    console.error('Set it via: ADMIN_PASSWORD="your-strong-password" node scripts/seed-admin.js');
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const { data: existingAdmin } = await supabase
      .from('admins')
      .select('id')
      .eq('email', ADMIN_EMAIL)
      .single();

    if (existingAdmin) {
      console.log(`Admin with email "${ADMIN_EMAIL}" already exists (ID: ${existingAdmin.id}).`);
      console.log('Skipping seed. No changes made.');
      process.exit(0);
    }

    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);

    const { data: admin, error: adminError } = await supabase
      .from('admins')
      .insert({
        username: ADMIN_USERNAME,
        email: ADMIN_EMAIL,
        password_hash: passwordHash,
        role: 'super_admin',
        is_active: true,
      })
      .select()
      .single();

    if (adminError) {
      throw new Error(`Failed to insert admin: ${adminError.message}`);
    }

    const { error: profileError } = await supabase
      .from('admin_profiles')
      .insert({
        admin_id: admin.id,
        full_name: ADMIN_FULL_NAME,
        bio: 'System administrator',
      });

    if (profileError) {
      throw new Error(`Failed to insert admin profile: ${profileError.message}`);
    }

    const { error: logError } = await supabase
      .from('admin_activity_logs')
      .insert({
        admin_id: admin.id,
        action: 'account_created',
        resource_type: 'admin',
      });

    if (logError) {
      console.warn(`Warning: Could not log activity: ${logError.message}`);
    }

    console.log('');
    console.log('Super admin created successfully!');
    console.log('-----------------------------------');
    console.log(`  ID:          ${admin.id}`);
    console.log(`  Username:    ${ADMIN_USERNAME}`);
    console.log(`  Email:       ${ADMIN_EMAIL}`);
    console.log(`  Full Name:   ${ADMIN_FULL_NAME}`);
    console.log(`  Role:        super_admin`);
    console.log(`  Active:      true`);
    console.log('-----------------------------------');
    console.log('');
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  }
}

main();
