import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

export async function getCurrentUserId(): Promise<string> {
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    throw new Error('Not authenticated');
  }

  return data.user.id;
}
