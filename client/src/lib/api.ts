import { queryClient } from "./queryClient";

const API_BASE = "/api";

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem("token");
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

export async function apiRequest<T>(
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH",
  endpoint: string,
  data?: unknown
): Promise<T> {
  const url = endpoint.startsWith("/api") ? endpoint : `${API_BASE}${endpoint}`;

  const config: RequestInit = {
    method,
    headers: getAuthHeaders(),
    credentials: "include",
  };

  if (data && method !== "GET") {
    config.body = JSON.stringify(data);
  }

  const response = await fetch(url, config);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "An error occurred" }));
    throw new Error(error.message || "An error occurred");
  }

  if (response.headers.get("Content-Type")?.includes("text/csv")) {
    return response.text() as unknown as T;
  }

  return response.json();
}

export function invalidateQueries(keys: string[]) {
  keys.forEach((key) => {
    queryClient.invalidateQueries({ queryKey: [key] });
  });
}
