// libs
import { computePosition, flip, shift, offset, autoUpdate } from '@floating-ui/dom';
import type { ReferenceElement, Placement } from '@floating-ui/dom';
import type { ComponentPublicInstance, Ref } from 'vue';
type TOptions = {
  placement?: Placement;
  hideTimeout?: number;
  zIndex?: number;
  ignoreRefs?: Ref<HTMLElement | undefined>[];
};

type TCleanUp = () => void;

function isVueComponentInstance(obj: any): obj is ComponentPublicInstance {
  return obj && '$el' in obj;
}

export default function useFloat(_options?: TOptions) {
  const options = Object.assign(
    {
      placement: 'bottom',
      hideTimeout: 0,
      zIndex: 2147483006,
      ignoreRefs: [],
    },
    _options,
  );

  const isVisible = ref(false);
  const id = useId();
  const BUTTON_REF = `button-${id}`;
  const POPPER_REF = `popper-${id}`;
  const button = useTemplateRef<ReferenceElement>(BUTTON_REF);
  const popper = useTemplateRef<HTMLElement>(POPPER_REF);
  const cleanup = ref<TCleanUp>(() => null);

  const isMounted = useMounted();

  const buttonElement = computed(() => (isVueComponentInstance(button.value) ? button.value.$el : button.value));
  const popperElement = computed(() => (isVueComponentInstance(popper.value) ? popper.value.$el : popper.value));

  async function update() {
    while (!isMounted.value) {
      await nextTick();
    }

    if (!buttonElement.value || !popperElement.value) {
      return;
    }

    const { x, y } = await computePosition(buttonElement.value as ReferenceElement, popperElement.value as HTMLElement, {
      placement: options.placement,
      strategy: 'fixed',
      middleware: [
        flip(),
        shift({
          padding: 5,
        }),
        offset(5),
      ],
    });

    Object.assign(popperElement.value.style, {
      left: `${x}px`,
      top: `${y}px`,
      position: 'fixed',
      zIndex: options.zIndex,
    });
  }

  async function show() {
    startAutoUpdate();

    await nextTick();

    if (!cleanup.value) {
      startAutoUpdate();
    }

    if (!buttonElement.value || !popperElement.value) {
      return;
    }

    isVisible.value = true;

    popperElement.value.classList.remove('hidden');
    popperElement.value.classList.add('inline-block');
  }

  function hide() {
    isVisible.value = false;

    setTimeout(() => {
      if (!buttonElement.value || !popperElement.value) {
        return;
      }

      if (isVisible.value) {
        return;
      }

      popperElement.value.classList.add('hidden');
      popperElement.value.classList.remove('inline-block');

      cleanup.value();
      cleanup.value = () => null;
    }, options.hideTimeout);
  }

  function toggle() {
    if (!buttonElement.value || !popperElement.value) {
      return;
    }

    if (popperElement.value.classList.contains('hidden')) {
      show();
    } else {
      hide();
    }
  }

  function startAutoUpdate() {
    if (!buttonElement.value || !popperElement.value) {
      return;
    }

    cleanup.value = autoUpdate(buttonElement.value, popperElement.value, update);
  }

  onClickOutside(
    button as Ref<HTMLElement>,
    () => {
      hide();
    },
    {
      ignore: [popper, ...options.ignoreRefs],
    },
  );

  onMounted(() => {
    popperElement.value?.classList.add('hidden');
    popperElement.value?.classList.remove('inline-block');
  });

  const buttonRect = computed(() => {
    return button.value?.getBoundingClientRect();
  });

  return {
    button: buttonElement,
    buttonRect,
    popper: popperElement,
    show,
    hide,
    toggle,
    BUTTON_REF,
    POPPER_REF,
    isVisible,
  };
}
