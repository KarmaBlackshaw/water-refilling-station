import imageCompression from 'browser-image-compression';
import { supabase } from '@/helpers/supabase';

const BUCKET = 'customer-address-photos';
const cache = new Map<string, { url: string; exp: number }>();

export async function uploadAddressPhoto(file: File, tenantId: string, branchId: string, addressId: string): Promise<string> {
  const compressed = await imageCompression(file, {
    maxSizeMB: 0.3,
    maxWidthOrHeight: 1280,
    useWebWorker: true,
  });
  const path = `${tenantId}/${branchId}/${addressId}/${crypto.randomUUID()}.jpg`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, compressed, { contentType: 'image/jpeg', upsert: false });

  if (error) {
    throw error;
  }

  return path;
}

export async function deleteAddressPhoto(path: string): Promise<void> {
  await supabase.storage.from(BUCKET).remove([path]);
}

export async function getAddressPhotoUrl(path: string): Promise<string> {
  const c = cache.get(path);

  if (c && c.exp > Date.now() + 60_000) {
    return c.url;
  }

  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 3600);

  if (error) {
    throw error;
  }

  cache.set(path, { url: data.signedUrl, exp: Date.now() + 3_600_000 });
  return data.signedUrl;
}
