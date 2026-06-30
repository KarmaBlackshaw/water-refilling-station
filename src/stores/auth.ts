import type { Session, User as AuthUser } from '@supabase/supabase-js';
import type { User } from '@/types/database';
import { supabase } from '@/helpers/supabase';
import {
  fetchProfile,
  fetchTenantAccess,
  requestPasswordReset as requestPasswordResetService,
  signIn,
  signOut,
  updatePassword as updatePasswordService,
} from '@/services/auth';

/** Login-blocking reasons surfaced to the login page when a client is gated. */
export const AUTH_BLOCK = { SUSPENDED: 'account_suspended', EXPIRED: 'subscription_expired' } as const;

/** Superadmin credentials live in env — a frontend-only gate, no Supabase auth user. */
const SUPERADMIN_EMAIL = (import.meta.env.VITE_SUPERADMIN_EMAIL ?? '').trim().toLowerCase();
const SUPERADMIN_PASSWORD = import.meta.env.VITE_SUPERADMIN_PASSWORD ?? '';
const SUPERADMIN_SESSION_KEY = 'wrs:superadmin';

function isSuperadminCredentials(email: string, password: string): boolean {
  return SUPERADMIN_EMAIL.length > 0 && email.trim().toLowerCase() === SUPERADMIN_EMAIL && password === SUPERADMIN_PASSWORD;
}

export const useAuthStore = defineStore('auth', () => {
  const session = ref<Session | null>(null);
  const authUser = ref<AuthUser | null>(null);
  const profile = ref<User | null>(null);
  const loading = ref(true);
  const superadminActive = ref(false);

  const isSuperadmin = computed(() => superadminActive.value);

  async function clearSession() {
    await signOut();
    session.value = null;
    authUser.value = null;
    profile.value = null;
    superadminActive.value = false;
    localStorage.removeItem(SUPERADMIN_SESSION_KEY);
  }

  async function initialize() {
    loading.value = true;

    if (localStorage.getItem(SUPERADMIN_SESSION_KEY) === '1') {
      superadminActive.value = true;
      loading.value = false;
      return;
    }

    const { data } = await supabase.auth.getSession();

    session.value = data.session;
    authUser.value = data.session?.user ?? null;

    if (authUser.value) {
      const { blocked } = await fetchTenantAccess();

      if (blocked) {
        await clearSession();
      } else {
        const { data: profileData } = await fetchProfile(authUser.value.id);

        profile.value = profileData;
      }
    }

    supabase.auth.onAuthStateChange((event, newSession) => {
      session.value = newSession;
      authUser.value = newSession?.user ?? null;
      if (authUser.value) {
        fetchProfile(authUser.value.id).then(({ data: profileData }) => {
          profile.value = profileData;
        });
      } else {
        profile.value = null;
      }
    });

    loading.value = false;
  }

  async function login(email: string, password: string) {
    // Superadmin: match env credentials, no Supabase auth user involved.
    if (isSuperadminCredentials(email, password)) {
      superadminActive.value = true;
      localStorage.setItem(SUPERADMIN_SESSION_KEY, '1');

      return { error: null };
    }

    const { data, error } = await signIn(email, password);

    if (error) {
      return { error };
    }

    session.value = data.session;
    authUser.value = data.user;

    const { blocked, reason } = await fetchTenantAccess();

    if (blocked) {
      await clearSession();

      return { error: { message: reason === 'expired' ? AUTH_BLOCK.EXPIRED : AUTH_BLOCK.SUSPENDED } };
    }

    if (data.user) {
      const { data: profileData } = await fetchProfile(data.user.id);

      profile.value = profileData;
    }

    return { error: null };
  }

  async function requestPasswordReset(email: string) {
    const { error } = await requestPasswordResetService(email);

    return { error };
  }

  async function updatePassword(newPassword: string) {
    const { error } = await updatePasswordService(newPassword);

    return { error };
  }

  async function logout() {
    await clearSession();
  }

  const isAuthenticated = computed(() => session.value !== null || superadminActive.value);
  const tenantId = computed(() => profile.value?.tenant_id ?? '');
  const branchId = computed(() => profile.value?.branch_id ?? '');
  const userRole = computed(() => profile.value?.role ?? null);

  return {
    session: readonly(session),
    authUser: readonly(authUser),
    profile: readonly(profile),
    loading: readonly(loading),
    isAuthenticated,
    isSuperadmin,
    superadminEmail: SUPERADMIN_EMAIL,
    tenantId,
    branchId,
    userRole,
    initialize,
    login,
    logout,
    requestPasswordReset,
    updatePassword,
  };
});
