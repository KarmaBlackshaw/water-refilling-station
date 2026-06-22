import { supabase } from '@/helpers/supabase';
import type { StreetInsert } from '@/types/database';

export function getStreets(city: string, barangay: string) {
  return supabase.from('streets').select('*').eq('city', city).eq('barangay', barangay).is('deleted_at', null).order('name');
}

export function createStreet(input: StreetInsert) {
  return supabase.from('streets').insert(input).select().single();
}
