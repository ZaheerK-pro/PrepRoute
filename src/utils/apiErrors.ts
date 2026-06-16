type ValidationError = { path?: string; msg?: string; message?: string };

export function getApiErrorMessage(err: unknown, fallback: string): string {
  const data = (err as { response?: { data?: unknown } })?.response?.data;
  if (!data || typeof data !== 'object') return fallback;

  const payload = data as {
    message?: string;
    errors?: ValidationError[] | Record<string, string>;
  };

  if (Array.isArray(payload.errors) && payload.errors.length > 0) {
    return payload.errors
      .map((e) => {
        const field = e.path ?? 'field';
        const msg = e.msg ?? e.message ?? 'invalid';
        return `${field}: ${msg}`;
      })
      .join('; ');
  }

  if (payload.errors && typeof payload.errors === 'object') {
    const parts = Object.entries(payload.errors).map(([key, value]) => `${key}: ${value}`);
    if (parts.length > 0) return parts.join('; ');
  }

  return payload.message ?? fallback;
}
