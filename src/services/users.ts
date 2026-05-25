import { supabase } from '@/helpers/supabase';
import { supabaseAdmin } from '@/helpers/supabaseAdmin';
import type { UserRole } from '@/types/database';

export async function createUserAccount(params: {
  username: string;
  password: string;
  tenantId: string;
  branchId: string;
  fullName: string;
  role: UserRole;
}): Promise<string> {
  const email = `${params.username}@${params.tenantId}.internal`;

  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: params.password,
    email_confirm: true,
  });

  if (authError) {
    if (authError.message.includes('already been registered') || authError.message.includes('already exists')) {
      throw new Error('Username already taken — choose another.');
    }
    throw authError;
  }

  const userId = authData.user.id;

  const { error: insertError } = await supabase.from('users').insert({
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
