import type { SubscriptionPlan, TenantOverview } from '@/types/database';
import { addDays, today } from './date';

export const PLAN_LABEL: Record<SubscriptionPlan, string> = {
  monthly: 'Monthly',
  yearly: 'Yearly',
  lifetime: 'Lifetime',
};

export type ClientState = 'active' | 'expiring' | 'expired' | 'suspended';

type ClientLike = Pick<TenantOverview, 'status' | 'subscription_plan' | 'subscription_expires_on'>;

/** Effective access state of a client, combining manual status with subscription expiry. */
export function clientState(client: ClientLike): ClientState {
  if (client.status === 'suspended') {
    return 'suspended';
  }

  if (client.subscription_plan === 'lifetime' || !client.subscription_expires_on) {
    return 'active';
  }

  if (client.subscription_expires_on < today()) {
    return 'expired';
  }

  if (client.subscription_expires_on <= addDays(today(), 30)) {
    return 'expiring';
  }

  return 'active';
}

export const STATE_META: Record<ClientState, { label: string; badge: 'success' | 'warning' | 'danger' | 'default' }> = {
  active: { label: 'Active', badge: 'success' },
  expiring: { label: 'Expiring', badge: 'warning' },
  expired: { label: 'Expired', badge: 'danger' },
  suspended: { label: 'Suspended', badge: 'default' },
};
