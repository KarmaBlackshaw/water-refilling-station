import { supabaseAdmin } from '@/helpers/supabaseAdmin';
import type { SubscriptionPlan, TenantStatus, UserRole } from '@/types/database';

/**
 * Superadmin client-management service.
 *
 * The superadmin is identified by env credentials (no Supabase auth user / JWT),
 * so every operation here runs through the service-role client (`supabaseAdmin`),
 * which bypasses RLS. Provisioning also sets app_metadata.{tenant_id,branch_id}
 * on the created user so its JWT works against tenant RLS immediately.
 */

export type ClientSubscriptionInput = {
  name: string;
  contact_name: string | null;
  contact_phone: string | null;
  subscription_plan: SubscriptionPlan;
  subscription_price_centavos: number;
  subscription_started_on: string;
  subscription_expires_on: string | null;
};

export type CreateClientInput = ClientSubscriptionInput & {
  branch_name: string;
  admin_username: string;
  admin_full_name: string;
  admin_password: string;
};

/** ---- Reads --------------------------------------------------------------- */

/**
 * All clients with aggregated stats, optionally filtered by name or contact name.
 *
 * PostgREST permits `.or()` / `.ilike()` on RPC results, so no second query is needed.
 */
export function listClients(filters?: { search?: string }) {
  let query = supabaseAdmin.rpc('superadmin_tenant_overview');

  if (filters?.search) {
    query = query.or(`name.ilike.%${filters.search}%,contact_name.ilike.%${filters.search}%`);
  }

  return query;
}

/** A single client with aggregated stats. */
export function getClientOverview(tenantId: string) {
  return supabaseAdmin.rpc('superadmin_tenant_overview', { p_tenant_id: tenantId });
}

export function listClientBranches(tenantId: string) {
  return supabaseAdmin.from('branches').select('*').eq('tenant_id', tenantId).order('created_at');
}

export function listClientUsers(tenantId: string) {
  return supabaseAdmin.from('users').select('*').eq('tenant_id', tenantId).is('deleted_at', null).order('created_at');
}

/** ---- Tenant writes ------------------------------------------------------- */

export function updateClient(tenantId: string, data: ClientSubscriptionInput) {
  return supabaseAdmin.from('tenants').update(data).eq('id', tenantId).select().single();
}

export function setClientStatus(tenantId: string, status: TenantStatus) {
  return supabaseAdmin.from('tenants').update({ status }).eq('id', tenantId).select('id, status').single();
}

/** ---- Provisioning (service role) ----------------------------------------- */

/** Create the auth user (with app_metadata) and its `users` row. */
export async function provisionUser(params: {
  tenantId: string;
  branchId: string;
  username: string;
  fullName: string;
  password: string;
  role: UserRole;
}): Promise<string> {
  const email = `${params.username}@${params.tenantId}.internal`;

  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: params.password,
    email_confirm: true,
    app_metadata: { tenant_id: params.tenantId, branch_id: params.branchId },
  });

  if (authError) {
    if (authError.message.includes('already been registered') || authError.message.includes('already exists')) {
      throw new Error('Username already taken — choose another.');
    }

    throw authError;
  }

  const userId = authData.user.id;

  const { error: insertError } = await supabaseAdmin.from('users').insert({
    id: userId,
    tenant_id: params.tenantId,
    branch_id: params.branchId,
    full_name: params.fullName,
    role: params.role,
  });

  if (insertError) {
    console.error('Auth account created but users insert failed. Auth UID:', userId);
    throw insertError;
  }

  return userId;
}

/** Create a branch for a client and seed its default settings. */
export async function createClientBranch(tenantId: string, name: string): Promise<string> {
  const { data: branch, error } = await supabaseAdmin.from('branches').insert({ tenant_id: tenantId, name }).select('id').single();

  if (error || !branch) {
    throw error ?? new Error('Failed to create branch');
  }

  await supabaseAdmin.rpc('insert_default_settings', { p_tenant_id: tenantId, p_branch_id: branch.id });

  return branch.id;
}

/** Create a client end-to-end: tenant + first branch + default settings + first admin user. */
export async function createClient(payload: CreateClientInput): Promise<string> {
  const { data: tenant, error: tenantError } = await supabaseAdmin
    .from('tenants')
    .insert({
      name: payload.name,
      contact_name: payload.contact_name,
      contact_phone: payload.contact_phone,
      subscription_plan: payload.subscription_plan,
      subscription_price_centavos: payload.subscription_price_centavos,
      subscription_started_on: payload.subscription_started_on,
      subscription_expires_on: payload.subscription_expires_on,
    })
    .select('id')
    .single();

  if (tenantError || !tenant) {
    throw tenantError ?? new Error('Failed to create client');
  }

  const branchId = await createClientBranch(tenant.id, payload.branch_name);

  await provisionUser({
    tenantId: tenant.id,
    branchId,
    username: payload.admin_username,
    fullName: payload.admin_full_name,
    password: payload.admin_password,
    role: 'admin',
  });

  return tenant.id;
}
