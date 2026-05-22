import type { Ref, UnwrapRef, WatchSource } from 'vue';
import type { LocationQuery } from 'vue-router';
import debounce from 'lodash/debounce';

type Fn = (...args: any[]) => Promise<any> | any;

type Options<T = any> = {
  immediate?: boolean;
  defaultValue?: any;
  debounce?: number;
  watch?: WatchSource<T> | WatchSource<T>[];
  watchRoute?: boolean | ((query: LocationQuery) => Record<string, unknown>);
  disableResetValue?: boolean;
};

type UseAsync<T> = {
  data: Ref<T | null>;
  error: Ref<Error | null>;
  loading: Ref<boolean>;
  run: Fn;
  debounceRun: Fn;
  reset: () => void;
};

export const tryToCatch = async <T>(fn: (...args: any[]) => PromiseLike<T> | T): Promise<[Error | null, T?]> => {
  try {
    const response: T = await fn();

    return [null, response];
  } catch (error) {
    return [error instanceof Error ? error : new Error(String(error))];
  }
};

export default function useAsync<T>(fn: (...args: any) => PromiseLike<T> | T, optionsRaw?: Options) {
  const options = Object.assign(
    {
      immediate: false,
      defaultValue: null as T | null,
      debounce: 300,
    },
    optionsRaw,
  );

  const data = ref<T | null>(options.defaultValue);
  const error = ref<UnwrapRef<UseAsync<T>['error']>>(null);
  const loading = ref<UnwrapRef<UseAsync<T>['loading']>>(options.immediate);

  const run = async (...args: any) => {
    loading.value = true;

    if (!options.disableResetValue) {
      data.value = options.defaultValue;
    }

    const [err, response] = await tryToCatch(() => fn(...args));

    if (err) {
      if (err.name === 'AbortError') {
        loading.value = true;
        return;
      }

      loading.value = false;
      error.value = err;
      return;
    }

    loading.value = false;
    data.value = response;

    return response;
  };

  const debounceRun = debounce(run, options.debounce);

  if (options.watch) {
    watch(
      options.watch,
      async () => {
        await nextTick();
        debounceRun();
      },
      {
        immediate: options.immediate,
        deep: true,
      },
    );
  }

  // Watch route query params
  if (options.watchRoute) {
    const route = useRoute();

    watch(
      () => route.query,
      async (query) => {
        await nextTick();
        if (typeof options.watchRoute === 'function') {
          const params = options.watchRoute(query);

          debounceRun(params);
        } else {
          debounceRun(query);
        }
      },
      {
        immediate: options.immediate,
        deep: true,
      },
    );
  }

  if (!options.watch && !options.watchRoute && options.immediate) {
    run();
  }

  function reset() {
    data.value = options.defaultValue;
    error.value = null;
    loading.value = false;
  }

  return {
    data,
    error,
    loading,
    run,
    reset,
    debounceRun,
  };
}
