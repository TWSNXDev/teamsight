const API_URL = process.env.NEXT_PUBLIC_API_URL;

export class ConflictError extends Error {
  current: unknown;

  constructor(message: string, current: unknown) {
    super(message);
    this.name = "ConflictError";
    this.current = current;
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    if (res.status === 409) {
      throw new ConflictError(
        body?.message ?? "Conflict",
        body?.current,
      );
    }
    throw new Error(body?.message ?? `Request failed with ${res.status}`);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json();
}

export interface Team {
  id: string;
  name: string;
}

export interface SalesRecord {
  id: string;
  product: string;
  amount: string;
  soldAt: string;
  updatedAt: string;
  teamId: string;
  team: Team;
  recordedBy: { id: string; name: string };
}

export const api = {
  getTeams: () => request<Team[]>("/api/teams"),
  getSalesRecords: () => request<SalesRecord[]>("/api/sales-records"),
  createSalesRecord: (data: {
    product: string;
    amount: number;
    soldAt: string;
    teamId: string;
  }) =>
    request<SalesRecord>("/api/sales-records", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateSalesRecord: (
    id: string,
    data: {
      product?: string;
      amount?: number;
      soldAt?: string;
      expectedUpdatedAt: string;
    },
  ) =>
    request<SalesRecord>(`/api/sales-records/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  deleteSalesRecord: (id: string) =>
    request<void>(`/api/sales-records/${id}`, { method: "DELETE" }),
  getInsight: () => request<{ insight: string }>("/api/insights", { method: "POST" }),
};
