import { ROUTES } from '@/constants/routes';
import { supabase } from '@/helpers/supabase';
import type { User } from '@/types';

export function signIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export function signOut() {
  return supabase.auth.signOut();
}

export function requestPasswordReset(email: string) {
  return supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}${ROUTES.RESET_PASSWORD}`,
  });
}

export function updatePassword(newPassword: string) {
  return supabase.auth.updateUser({ password: newPassword });
}

export async function fetchProfile(userId: string): Promise<{ data: User | null; error: unknown }> {
  const { data, error } = await supabase.from('users').select('*').eq('id', userId).single();

  return { data, error };
}

/**
 * Whether the current tenant user's client blocks login (suspended or expired
 * subscription). Resolves via a SECURITY DEFINER RPC, so it works even when the
 * user's app_metadata.tenant_id is unset. Fails open on any error.
 */
export async function fetchTenantAccess(): Promise<{ blocked: boolean; reason: string | null }> {
  const { data, error } = await supabase.rpc('my_tenant_access');
  const row = data?.[0];

  if (error || !row) {
    return { blocked: false, reason: null };
  }

  return { blocked: row.blocked, reason: row.reason };
}
