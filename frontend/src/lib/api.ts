/* eslint-disable @typescript-eslint/no-explicit-any */
const DEFAULT_PROD_API_URL = "https://eggbilling-system.onrender.com/api/v1";

function getApiBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (envUrl) {
    const clean = envUrl.replace(/\/+$/, "");
    return clean.endsWith("/api/v1") ? clean : `${clean}/api/v1`;
  }
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host !== "localhost" && host !== "127.0.0.1") {
      return DEFAULT_PROD_API_URL;
    }
  }
  return "http://localhost:8000/api/v1";
}

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("eggbill_token") : null;
  const url = `${getApiBaseUrl()}${endpoint}`;
  
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string> || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    headers,
    ...options,
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.detail || `Request failed with status ${res.status}`);
  }

  return res.json();
}

export const api = {
  // Auth
  workerLogin: (phone: string, pin: string) =>
    request<{ access_token: string; user: any }>("/auth/worker-login", {
      method: "POST",
      body: JSON.stringify({ phone, pin }),
    }),

  adminLogin: (phone: string, password: string) =>
    request<{ access_token: string; user: any }>("/auth/admin-login", {
      method: "POST",
      body: JSON.stringify({ phone, password }),
    }),

  getMe: (token?: string) =>
    request<any>("/auth/me", token ? { headers: { Authorization: `Bearer ${token}` } } : undefined),

  // Egg Types
  getEggTypes: () => request<any[]>("/egg-types/"),
  createEggType: (data: {
    name: string;
    category?: "HIGH" | "LOW";
    eggs_per_tray?: number;
    default_rate: number;
    cost_price: number;
    current_stock_trays?: number;
  }) => request<any>("/egg-types/", { method: "POST", body: JSON.stringify(data) }),
  updateEggType: (id: string, data: any) =>
    request<any>(`/egg-types/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteEggType: (id: string) =>
    request<any>(`/egg-types/${id}`, { method: "DELETE" }),

  // Workers
  getWorkers: () => request<any[]>("/workers/"),
  createWorker: (data: { name: string; phone: string; pin: string; role?: string; is_active?: boolean }) =>
    request<any>("/workers/", { method: "POST", body: JSON.stringify(data) }),
  updateWorker: (id: string, data: any) =>
    request<any>(`/workers/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteWorker: (id: string) =>
    request<any>(`/workers/${id}`, { method: "DELETE" }),

  // Customers
  getCustomers: () => request<any[]>("/customers/"),
  createCustomer: (data: { name: string; phone: string; area?: string; opening_due?: number; notes?: string }) =>
    request<any>("/customers/", { method: "POST", body: JSON.stringify(data) }),
  updateCustomer: (id: string, data: any) =>
    request<any>(`/customers/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  setCustomerRate: (customerId: string, eggTypeId: string, rate: number) =>
    request<any>(`/customers/${customerId}/rates`, {
      method: "POST",
      body: JSON.stringify({ egg_type_id: eggTypeId, rate }),
    }),
  collectPayment: (customerId: string, amount: number, mode: string = "CASH", notes?: string) =>
    request<any>(`/customers/${customerId}/collect-payment`, {
      method: "POST",
      body: JSON.stringify({ amount, mode, notes }),
    }),

  // Stock
  getStockEntries: () => request<any[]>("/stock/entries"),
  addStockEntry: (data: {
    date: string;
    egg_type_id: string;
    qty_trays: number;
    purchase_rate_per_egg: number;
    supplier?: string;
    notes?: string;
  }) => request<any>("/stock/entries", { method: "POST", body: JSON.stringify(data) }),
  deleteStockEntry: (id: string) =>
    request<any>(`/stock/entries/${id}`, { method: "DELETE" }),

  // Trips
  getTrips: () => request<any[]>("/trips/"),
  getActiveTrip: () => request<any>("/trips/active"),
  createTrip: (data: any) =>
    request<any>("/trips/", { method: "POST", body: JSON.stringify(data) }),
  updateTripStatus: (tripId: string, status: string) =>
    request<any>(`/trips/${tripId}/status?status=${status}`, { method: "PUT" }),
  updateTripWorker: (tripId: string, workerId: string) =>
    request<any>(`/trips/${tripId}/worker?worker_id=${workerId}`, { method: "PUT" }),
  confirmTripLoad: (tripId: string) =>
    request<any>(`/trips/${tripId}/confirm-load`, { method: "POST" }),
  submitTripSettlement: (tripId: string, data: { declared_cash: number; declared_online: number; declared_empty_trays: number }) =>
    request<any>(`/trips/${tripId}/settlement`, { method: "POST", body: JSON.stringify(data) }),

  // Bills
  getBills: () => request<any[]>("/bills/"),
  createBill: (data: any) =>
    request<any>("/bills/", { method: "POST", body: JSON.stringify(data) }),

  // Damages
  getDamages: () => request<any[]>("/damages/"),
  reportDamage: (data: {
    worker_name: string;
    egg_type_name: string;
    category?: string;
    qty_eggs: number;
    loss_amount: number;
    reason: string;
  }) => request<any>("/damages/", { method: "POST", body: JSON.stringify(data) }),
  updateDamageStatus: (damageId: string, status: string) =>
    request<any>(`/damages/${damageId}/status?status=${status}`, { method: "PUT" }),
};
