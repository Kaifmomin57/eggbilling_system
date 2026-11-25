export interface EggType {
  id: string;
  name: string;
  category: "HIGH" | "LOW";
  eggsPerTray: number;
  defaultRate: number;
  costPrice: number;
  currentStockTrays: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  area: string;
  dueAmount: number;
  pendingTrays: number;
  rates?: Record<string, number>;
  notes?: string;
}

export interface Worker {
  id: string;
  name: string;
  phone: string;
  pin: string;
  isActive: boolean;
  isDeleted?: boolean;
  role: "DELIVERY" | "MANAGER";
  joinedDate: string;
}

export interface StockEntry {
  id: string;
  date: string;
  eggTypeId: string;
  eggTypeName: string;
  qtyTrays: number;
  purchaseRatePerEgg: number;
  supplier: string;
  notes?: string;
  totalCost: number;
}

export interface BillItem {
  eggTypeId: string;
  eggTypeName: string;
  qtyEggs: number;
  rate: number;
  amount: number;
}

export interface Bill {
  id: string;
  billNo: string;
  tripId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  items: BillItem[];
  totalAmount: number;
  paidCash: number;
  paidOnline: number;
  dueAmount: number;
  paymentMode: "CASH" | "ONLINE" | "MIX" | "DUE";
  traysGiven: number;
  traysReturned: number;
  customerPendingTraysAfter: number;
  customerDueAfter: number;
  status: "ACTIVE" | "CANCELLED";
  createdAt: string;
}

export interface TripLoad {
  eggTypeId: string;
  eggTypeName: string;
  qtyLoadedEggs: number;
  qtySoldEggs: number;
  qtyReturnedEggs: number;
}

export interface Trip {
  id: string;
  tripNo: string;
  workerId?: string;
  workerName: string;
  workerPhone: string;
  date: string;
  vehicle: string;
  status: "DRAFT" | "OUT" | "SETTLEMENT" | "CLOSED";
  loads: TripLoad[];
  expectedCash: number;
  expectedOnline: number;
  declaredCash?: number;
  declaredOnline?: number;
  declaredEmptyTrays?: number;
}

export interface DamageRecord {
  id: string;
  date: string;
  workerName: string;
  eggTypeName: string;
  category: "HIGH" | "LOW";
  qtyEggs: number;
  lossAmount: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
  reason: string;
}

// Completely empty initial structures - zero mock data
export const INITIAL_EGG_TYPES: EggType[] = [];
export const INITIAL_CUSTOMERS: Customer[] = [];
export const INITIAL_WORKERS: Worker[] = [];
export const INITIAL_BILLS: Bill[] = [];
export const EMPTY_TRIP: Trip = {
  id: "",
  tripNo: "-",
  workerName: "",
  workerPhone: "",
  date: "",
  vehicle: "",
  status: "DRAFT",
  loads: [],
  expectedCash: 0,
  expectedOnline: 0,
};
export const INITIAL_TRIP: Trip = EMPTY_TRIP;
export const INITIAL_DAMAGES: DamageRecord[] = [];
