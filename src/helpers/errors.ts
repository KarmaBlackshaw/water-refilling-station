export function getErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (error instanceof Error) {
    return error.message || fallback;
  }

  if (typeof error === 'string' && error.length > 0) {
    return error;
  }

  return fallback;
}
