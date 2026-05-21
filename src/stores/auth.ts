import type { Session, User as AuthUser } from '@supabase/supabase-js';
import type { User } from '@/types/database';
import { supabase } from '@/helpers/supabase';
import { fetchProfile, requestPasswordReset as requestPasswordResetService, signIn, signOut, updatePassword as updatePasswordService } from '@/services/auth';

export const useAuthStore = defineStore('auth', () => {
  const session = ref<Session | null>(null);
  const authUser = ref<AuthUser | null>(null);
  const profile = ref<User | null>(null);
  const loading = ref(true);

  async function initialize() {
    loading.value = true;
    const { data } = await supabase.auth.getSession();

    session.value = data.session;
    authUser.value = data.session?.user ?? null;

    if (authUser.value) {
      const { data: profileData } = await fetchProfile(authUser.value.id);

      profile.value = profileData;
    }

    supabase.auth.onAuthStateChange(async (_event, newSession) => {
      session.value = newSession;
      authUser.value = newSession?.user ?? null;
      if (authUser.value) {
        const { data: profileData } = await fetchProfile(authUser.value.id);

        profile.value = profileData;
      } else {
        profile.value = null;
      }
    });

    loading.value = false;
  }

  async function login(email: string, password: string) {
    const { data, error } = await signIn(email, password);

    if (error) {
      return { error };
    }

    session.value = data.session;
    authUser.value = data.user;
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
    await signOut();
    session.value = null;
    authUser.value = null;
    profile.value = null;
  }

  const isAuthenticated = computed(() => session.value !== null);
  const tenantId = computed(() => profile.value?.tenant_id ?? null);
  const branchId = computed(() => profile.value?.branch_id ?? null);
  const userRole = computed(() => profile.value?.role ?? null);

  return {
    session: readonly(session),
    authUser: readonly(authUser),
    profile: readonly(profile),
    loading: readonly(loading),
    isAuthenticated,
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
