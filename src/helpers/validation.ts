import type { ZodType } from 'zod';

/** Field-key → first error message. An empty object means the value is valid. */
export type TabErrors = Record<string, string>;

/** Run a zod schema over a value and collapse issues to one message per field path. */
export function zodErrors(schema: ZodType, value: unknown): TabErrors {
  const result = schema.safeParse(value);

  if (result.success) {
    return {};
  }

  const errors: TabErrors = {};

  for (const issue of result.error.issues) {
    const key = issue.path.map(String).join('.') || '_';

    errors[key] ??= issue.message;
  }

  return errors;
}
