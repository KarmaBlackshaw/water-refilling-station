import { createApp, h, ref } from 'vue';
import type { App } from 'vue';

import BaseConfirm from '@/components/Base/BaseConfirm.vue';

import { tryToCatch } from './useAsync';

type ConfirmVariant = 'blaze-red' | 'tampa';

export type ConfirmOptions = {
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
  onConfirm?: () => void | Promise<void>;
};

const CONTAINER_ID = 'confirm-popup-container';

let currentApp: App | undefined;

function remove() {
  currentApp?.unmount();
  currentApp = undefined;
  document.getElementById(CONTAINER_ID)?.remove();
}

function confirm(options: ConfirmOptions = {}): Promise<boolean> {
  remove();

  return new Promise((resolve) => {
    const open = ref(true);
    const loading = ref(false);

    async function handleConfirm() {
      if (options.onConfirm) {
        loading.value = true;
        await tryToCatch(() => options.onConfirm!());
        loading.value = false;
      }

      open.value = false;
      remove();
      resolve(true);
    }

    function handleCancel() {
      if (loading.value) {
        return;
      }

      open.value = false;
      remove();
      resolve(false);
    }

    const app = createApp({
      render: () =>
        h(BaseConfirm, {
          open: open.value,
          title: options.title,
          message: options.message,
          confirmLabel: options.confirmLabel,
          cancelLabel: options.cancelLabel,
          variant: options.variant,
          loading: loading.value,
          onConfirm: handleConfirm,
          onCancel: handleCancel,
        }),
    });

    currentApp = app;

    let container = document.getElementById(CONTAINER_ID);

    if (!container) {
      container = document.createElement('div');
      container.id = CONTAINER_ID;
    }

    document.body.appendChild(container);
    app.mount(container);
  });
}

export function useConfirm() {
  return { confirm };
}
