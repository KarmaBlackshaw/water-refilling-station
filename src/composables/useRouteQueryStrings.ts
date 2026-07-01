import type { Ref } from 'vue';
import { useRouteQuery } from '@vueuse/router';

/** Query keys mapped to their default string values; the keys become the returned refs. */
type QueryDefaults = Record<string, string>;

/** A `v-model`-bindable string ref per declared key. */
type QueryStringRefs<K extends QueryDefaults> = { [P in keyof K]: Ref<string> };

/**
 * Map each key of `source` through `map`.
 *
 * The overload reports the precise mapped type `{ [P in keyof K]: V }` (so callers
 * keep per-key, non-optional refs) while the wider implementation builds a plain
 * record. TypeScript does not check the implementation body against the overload's
 * mapped type, so the precise return is produced without an `as` cast.
 */
function mapKeys<K extends QueryDefaults, V>(source: K, map: (key: keyof K & string) => V): { [P in keyof K]: V };
function mapKeys<V>(source: QueryDefaults, map: (key: string) => V): Record<string, V> {
  const result: Record<string, V> = {};

  for (const key of Object.keys(source)) {
    result[key] = map(key);
  }

  return result;
}

/**
 * Exposes the given URL query keys as string-typed, `v-model`-bindable refs.
 *
 * Declare each key with its default; each becomes a `useRouteQuery(key, default)`
 * ref (default write mode `replace`, so typing into a bound input never spams
 * browser history) read back as `string`, so pages never repeat the `LocationQuery`
 * coercion. Fetching stays a page concern — `watch` these refs in `useAsync`.
 *
 * @param defaults - Query keys mapped to their default string values (use `''` for no default).
 * @example
 * const { q: search, status, date } = useRouteQueryStrings({ q: '', status: '', date: today() });
 */
export function useRouteQueryStrings<K extends QueryDefaults>(defaults: K): QueryStringRefs<K> {
  return mapKeys(defaults, (key) => useRouteQuery<string, string>(key, defaults[key] ?? ''));
}
