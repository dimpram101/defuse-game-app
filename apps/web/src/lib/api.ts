export class ApiError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
  }
}

export async function api<T>(path: string, init: { method?: string; body?: unknown; headers?: Record<string, string> } = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      method: init.method ?? (init.body === undefined ? "GET" : "POST"),
      headers: { "content-type": "application/json", ...init.headers },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    });
  } catch {
    throw new ApiError(0, "Can't reach the server. Check your connection.");
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    // 422 comes from schema validation; its message is for developers, not players.
    const message = res.status !== 422 && data?.error ? data.error : "Something in the form isn't right. Check it and try again.";
    throw new ApiError(res.status, message);
  }
  return data as T;
}
