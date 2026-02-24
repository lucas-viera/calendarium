type ApiError = {
  error?: string;
  details?: Record<string, string[]>;
}

async function postJSON<TResponse>(url: string, body: unknown): Promise<TResponse> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    credentials: "include",
  });
  
  const data = (await res.json().catch(() => ({}))) as unknown;
  
  if (!res.ok) {
    const err = data as ApiError;
    const message = err.error ?? `Request failed (${res.status})`;
    const details = err.details;
    const e = new Error(message) as Error & { details?: ApiError["details"]; status?: number };
    e.details = details;
    e.status = res.status;
    throw e;
  }
  
  return data as TResponse;
}

export type LoginResponse = {
  id: string;
  email: string;
  role: string;
  createdAt: string;
};

export type RegisterResponse = {
  id: string;
  email: string;
  name?: string | null;
  surname?: string | null;
  role: string;
  createdAt: string;
};

export function login(input: { email: string; password: string }) {
  return postJSON<LoginResponse>("/api/auth/login", input);
}

export function register(input: { name: string; surname: string; email: string; password: string }) {
  return postJSON<RegisterResponse>("/api/auth/register", input);
}