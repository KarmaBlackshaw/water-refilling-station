import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseKey);

export async function getCurrentUserId(): Promise<string> {
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    throw new Error('Not authenticated');
  }

  return data.user.id;
}
