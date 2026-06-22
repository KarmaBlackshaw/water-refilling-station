#!/usr/bin/env node
/**
 * Onboard a new admin user for the WRS system.
 *
 * Usage:
 *   SUPABASE_SERVICE_ROLE_KEY=<key> node scripts/onboard-admin.mjs \
 *     --email admin@example.com \
 *     --password secretpass \
 *     --name "Juan dela Cruz" \
 *     --tenant "Dela Cruz Water Station" \
 *     --branch "Main Branch"
 *
 * Required env vars:
 *   VITE_SUPABASE_URL        (already in .env)
 *   VITE_SUPABASE_SERVICE_ROLE_KEY  (from Supabase dashboard → Project Settings → API → service_role)
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// ── Load .env manually (no dotenv dep needed) ──────────────────────────────
function loadEnv() {
  try {
    const raw = readFileSync(resolve(process.cwd(), '.env'), 'utf8');

    for (const line of raw.split('\n')) {
      const [key, ...rest] = line.split('=');

      if (key && !key.startsWith('#') && rest.length) {
        // strip surrounding single/double quotes (Vite-style .env values are often quoted)
        const value = rest.join('=').trim().replace(/^(['"])(.*)\1$/, '$2');

        process.env[key.trim()] ??= value;
      }
    }
  } catch {
    /* .env optional */
  }
}
loadEnv();

// ── Parse args ─────────────────────────────────────────────────────────────
function arg(flag) {
  const i = process.argv.indexOf(flag);

  return i !== -1 ? process.argv[i + 1] : undefined;
}

const email = arg('--email');
const password = arg('--password');
const name = arg('--name');
const tenant = arg('--tenant');
const branch = arg('--branch') ?? 'Main Branch';

if (!email || !password || !name || !tenant) {
  console.error('Missing required args: --email --password --name --tenant');
  console.error('Optional: --branch (default: "Main Branch")');
  process.exit(1);
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing env vars: VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// ── Admin client (service role — never use in frontend) ───────────────────
const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ── Main ───────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\nOnboarding admin: ${email}`);
  console.log(`Tenant: ${tenant}  /  Branch: ${branch}\n`);

  // 1. Create tenant
  const { data: tenantRow, error: tenantErr } = await admin.from('tenants').insert({ name: tenant }).select().single();

  if (tenantErr) {
    throw new Error(`Create tenant: ${tenantErr.message}`);
  }

  console.log(`✓ Tenant created  ${tenantRow.id}`);

  // 2. Create branch
  const { data: branchRow, error: branchErr } = await admin.from('branches').insert({ tenant_id: tenantRow.id, name: branch }).select().single();

  if (branchErr) {
    throw new Error(`Create branch: ${branchErr.message}`);
  }

  console.log(`✓ Branch created  ${branchRow.id}`);

  // 3. Create auth user with app_metadata set from the start
  const { data: authData, error: authErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // skip email confirmation
    app_metadata: {
      tenant_id: tenantRow.id,
      branch_id: branchRow.id,
      role: 'admin',
    },
  });

  if (authErr) {
    throw new Error(`Create auth user: ${authErr.message}`);
  }

  const userId = authData.user.id;

  console.log(`✓ Auth user created  ${userId}`);

  // 4. Insert public.users row
  const { error: userErr } = await admin.from('users').insert({
    id: userId,
    tenant_id: tenantRow.id,
    branch_id: branchRow.id,
    full_name: name,
    role: 'admin',
  });

  if (userErr) {
    throw new Error(`Insert public.users: ${userErr.message}`);
  }

  console.log(`✓ Profile created`);

  // 5. Seed default settings
  const { error: settingsErr } = await admin.rpc('insert_default_settings', {
    p_tenant_id: tenantRow.id,
    p_branch_id: branchRow.id,
  });

  if (settingsErr) {
    throw new Error(`Seed settings: ${settingsErr.message}`);
  }

  console.log(`✓ Default settings seeded`);

  console.log(`
Done! You can now log in:
  URL:      ${supabaseUrl.replace('supabase.co', 'supabase.co').replace(/\/+$/, '').replace('https://', '')}
  Email:    ${email}
  Password: (as provided)

Tenant ID: ${tenantRow.id}
Branch ID: ${branchRow.id}
`);
}

main().catch((err) => {
  console.error('\nFailed:', err.message);
  process.exit(1);
});
