import { createRouter, createWebHistory } from 'vue-router';
import { routes, handleHotUpdate } from 'vue-router/auto-routes';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/stores/auth';

export const router = createRouter({
  history: createWebHistory(),
  routes,
});

// This will update routes at runtime without reloading the page
if (import.meta.hot) {
  handleHotUpdate(router);
}

router.beforeEach(async (to) => {
  const auth = useAuthStore();

  if (auth.loading) {
    await auth.initialize();
  }

  const publicRoutes: string[] = [ROUTES.LOGIN, ROUTES.FORGOT_PASSWORD, ROUTES.RESET_PASSWORD];

  if (!publicRoutes.includes(to.path) && !auth.isAuthenticated) {
    return ROUTES.LOGIN;
  }

  if (to.path === ROUTES.LOGIN && auth.isAuthenticated) {
    return ROUTES.DASHBOARD;
  }
});
