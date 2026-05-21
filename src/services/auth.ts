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

  return { data: data as User | null, error };
}
