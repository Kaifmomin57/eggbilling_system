/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import {
  EggType,
  Customer,
  Bill,
  Trip,
  DamageRecord,
  Worker,
  StockEntry,
  EMPTY_TRIP,
} from "./mock-data";
import { api } from "./api";

export interface AuthUser {
  id: string;
  name: string;
  phone: string;
  role: "ADMIN" | "DELIVERY" | "MANAGER";
}

interface StoreContextType {
  eggTypes: EggType[];
  customers: Customer[];
  bills: Bill[];
  trip: Trip;
  trips: Trip[];
  damages: DamageRecord[];
  workers: Worker[];
  stockEntries: StockEntry[];
  isLoading: boolean;

  // Auth state
  currentUser: AuthUser | null;
  activeRole: "ADMIN" | "WORKER";
  loginAsWorker: (phone: string, pin: string) => Promise<void>;
  loginAsAdmin: (phone: string, pin: string) => Promise<void>;
  logout: () => void;

  // Sync / refresh
  refreshData: () => Promise<void>;

  // Bill actions
  addBill: (billData: Omit<Bill, "id" | "billNo" | "createdAt" | "status" | "customerPendingTraysAfter" | "customerDueAfter">) => Promise<Bill>;

  // Damage actions
  addDamage: (damage: Omit<DamageRecord, "id" | "date" | "status">) => Promise<void>;
  updateDamageStatus: (id: string, status: "APPROVED" | "REJECTED") => Promise<void>;

  // Trip actions (worker)
  confirmTripLoad: () => Promise<void>;
  submitTripSettlement: (declaredCash: number, declaredOnline: number, declaredTrays: number) => Promise<void>;

  // Trip CRUD (admin)
  addTrip: (data: Omit<Trip, "id" | "tripNo" | "expectedCash" | "expectedOnline">) => Promise<Trip>;
  updateTripStatus: (id: string, status: Trip["status"]) => Promise<void>;

  // Customer actions
  collectCustomerPayment: (customerId: string, amount: number) => Promise<void>;
  addCustomer: (data: { name: string; phone: string; area?: string; openingDue?: number; notes?: string }) => Promise<Customer>;
  updateCustomer: (id: string, data: Partial<Pick<Customer, "name" | "phone" | "area" | "notes">>) => Promise<void>;
  updateCustomerRate: (customerId: string, eggTypeId: string, rate: number) => Promise<void>;

  // Worker CRUD
  addWorker: (data: Omit<Worker, "id">) => Promise<Worker>;
  updateWorker: (id: string, data: Partial<Omit<Worker, "id">>) => Promise<void>;
  deleteWorker: (id: string) => Promise<void>;

  // Stock CRUD
  addStockEntry: (data: Omit<StockEntry, "id">) => Promise<void>;
  deleteStockEntry: (id: string) => Promise<void>;

  // Product / Egg Type CRUD
  addEggType: (data: Omit<EggType, "id">) => Promise<EggType>;
  updateEggType: (id: string, data: Partial<Omit<EggType, "id">>) => Promise<void>;
  deleteEggType: (id: string) => Promise<void>;

  setActiveRole: (role: "ADMIN" | "WORKER") => void;

  // Active view navigation tabs & mobile drawer
  adminTab: "dashboard" | "trips" | "customers" | "rates" | "stock" | "damage" | "workers";
  setAdminTab: (tab: "dashboard" | "trips" | "customers" | "rates" | "stock" | "damage" | "workers") => void;
  workerTab: "home" | "new-bill" | "bills" | "trips" | "count";
  setWorkerTab: (tab: "home" | "new-bill" | "bills" | "trips" | "count") => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

const StoreContext = createContext<StoreContextType | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [activeRole, setActiveRole] = useState<"ADMIN" | "WORKER">("WORKER");
  const [adminTab, setAdminTab] = useState<"dashboard" | "trips" | "customers" | "rates" | "stock" | "damage" | "workers">("dashboard");
  const [workerTab, setWorkerTab] = useState<"home" | "new-bill" | "bills" | "trips" | "count">("home");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [eggTypes, setEggTypes] = useState<EggType[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [trip, setTrip] = useState<Trip>(EMPTY_TRIP);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [damages, setDamages] = useState<DamageRecord[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [stockEntries, setStockEntries] = useState<StockEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const currentUserRef = useRef<AuthUser | null>(null);

  const updateCurrentUser = (user: AuthUser | null) => {
    currentUserRef.current = user;
    setCurrentUser(user);
  };

  // Restore login session from localStorage
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem("eggbill_user");
      const savedToken = localStorage.getItem("eggbill_token");
      if (savedUser && savedToken) {
        const parsed = JSON.parse(savedUser);
        updateCurrentUser(parsed);
        setActiveRole(parsed.role === "ADMIN" ? "ADMIN" : "WORKER");
        refreshData(parsed);
      } else {
        setIsLoading(false);
      }
    } catch (e) {
      console.error(e);
      setIsLoading(false);
    }
  }, []);

  const loginAsWorker = async (phone: string, pin: string) => {
    const res = await api.workerLogin(phone, pin);
    localStorage.setItem("eggbill_token", res.access_token);
    localStorage.setItem("eggbill_user", JSON.stringify(res.user));
    updateCurrentUser(res.user);
    setActiveRole("WORKER");
    await refreshData(res.user);
  };

  const loginAsAdmin = async (phone: string, pin: string) => {
    const res = await api.adminLogin(phone, pin);
    localStorage.setItem("eggbill_token", res.access_token);
    localStorage.setItem("eggbill_user", JSON.stringify(res.user));
    updateCurrentUser(res.user);
    setActiveRole("ADMIN");
    await refreshData(res.user);
  };

  const logout = () => {
    localStorage.removeItem("eggbill_token");
    localStorage.removeItem("eggbill_user");
    updateCurrentUser(null);
    setTrip(EMPTY_TRIP);
    setEggTypes([]);
    setWorkers([]);
    setCustomers([]);
    setBills([]);
    setTrips([]);
    setStockEntries([]);
    setDamages([]);
  };

  // Fetch data from PostgreSQL
  const refreshData = useCallback(async (userOverride?: AuthUser | null) => {
    const activeUser = userOverride !== undefined ? userOverride : currentUserRef.current;
    const token = typeof window !== "undefined" ? localStorage.getItem("eggbill_token") : null;
    if (!activeUser || !token) {
      setIsLoading(false);
      return;
    }
    try {
      const [
        fetchedEggs,
        fetchedWorkers,
        fetchedCustomers,
        fetchedStock,
        fetchedTrips,
        fetchedBills,
        fetchedDamages,
      ] = await Promise.all([
        api.getEggTypes().catch(() => []),
        api.getWorkers().catch(() => []),
        api.getCustomers().catch(() => []),
        api.getStockEntries().catch(() => []),
        api.getTrips().catch(() => []),
        api.getBills().catch(() => []),
        api.getDamages().catch(() => []),
      ]);

      if (fetchedEggs) {
        setEggTypes(
          fetchedEggs.map((e) => ({
            id: e.id,
            name: e.name,
            category: e.category,
            eggsPerTray: e.eggs_per_tray,
            defaultRate: e.default_rate,
            costPrice: e.cost_price,
            currentStockTrays: e.current_stock_trays,
          }))
        );
      }

      if (fetchedWorkers) {
        setWorkers(
          fetchedWorkers.map((w) => ({
            id: w.id,
            name: w.name,
            phone: w.phone,
            pin: w.pin || "****",
            role: w.role,
            isActive: w.is_active,
            joinedDate: w.joined_date || "Recently",
          }))
        );
      }

      if (fetchedCustomers) {
        setCustomers(
          fetchedCustomers.map((c) => ({
            id: c.id,
            name: c.name,
            phone: c.phone,
            area: c.area,
            dueAmount: c.due_amount,
            pendingTrays: c.pending_trays,
            notes: c.notes,
            rates: c.rates || {},
          }))
        );
      }

      if (fetchedStock) {
        setStockEntries(
          fetchedStock.map((s) => ({
            id: s.id,
            date: s.date,
            eggTypeId: s.egg_type_id,
            eggTypeName: s.egg_type_name,
            qtyTrays: s.qty_trays,
            purchaseRatePerEgg: s.purchase_rate_per_egg,
            supplier: s.supplier,
            notes: s.notes,
            totalCost: s.total_cost,
          }))
        );
      }

      if (fetchedTrips && fetchedTrips.length > 0) {
        const formattedTrips = fetchedTrips.map((t) => ({
          id: t.id,
          tripNo: t.trip_no,
          workerId: t.worker_id,
          workerName: t.worker_name,
          workerPhone: t.worker_phone,
          date: t.date,
          vehicle: t.vehicle,
          status: t.status,
          expectedCash: t.expected_cash,
          expectedOnline: t.expected_online,
          declaredCash: t.declared_cash,
          declaredOnline: t.declared_online,
          declaredEmptyTrays: t.declared_empty_trays,
          loads: (t.loads || []).map((l: any) => ({
            eggTypeId: l.egg_type_id,
            eggTypeName: l.egg_type_name,
            qtyLoadedEggs: l.qty_loaded_eggs,
            qtySoldEggs: l.qty_sold_eggs,
            qtyReturnedEggs: l.qty_returned_eggs,
          })),
        }));
        setTrips(formattedTrips);

        // Determine active trip based on currently logged-in user
        const effectiveUser = userOverride !== undefined ? userOverride : currentUserRef.current;
        if (effectiveUser && effectiveUser.role !== "ADMIN") {
          // Worker view: ONLY match trip assigned to THIS specific worker!
          const workerTrip = formattedTrips.find(
            (t) =>
              (t.workerId === effectiveUser.id || t.workerPhone === effectiveUser.phone) &&
              ["OUT", "DRAFT", "SETTLEMENT"].includes(t.status)
          );
          setTrip(workerTrip || EMPTY_TRIP);
        } else {
          // Admin view: shows active godown trip
          const activeOne = formattedTrips.find((t) => ["OUT", "DRAFT", "SETTLEMENT"].includes(t.status));
          setTrip(activeOne || formattedTrips[0] || EMPTY_TRIP);
        }
      } else {
        setTrips([]);
        setTrip(EMPTY_TRIP);
      }

      if (fetchedBills) {
        setBills(
          fetchedBills.map((b) => ({
            id: b.id,
            billNo: b.bill_no,
            tripId: b.trip_id,
            customerId: b.customer_id,
            customerName: b.customer_name,
            customerPhone: b.customer_phone,
            items: (b.items || []).map((i: any) => ({
              eggTypeId: i.egg_type_id,
              eggTypeName: i.egg_type_name,
              qtyEggs: i.qty_eggs,
              rate: i.rate,
              amount: i.amount,
            })),
            totalAmount: b.total_amount,
            paidCash: b.paid_cash,
            paidOnline: b.paid_online,
            dueAmount: b.due_amount,
            paymentMode: b.payment_mode,
            traysGiven: b.trays_given,
            traysReturned: b.trays_returned,
            customerPendingTraysAfter: b.customer_pending_trays_after,
            customerDueAfter: b.customer_due_after,
            status: b.status,
            createdAt: b.created_at_time || "10:00 AM",
          }))
        );
      }

      if (fetchedDamages) {
        setDamages(
          fetchedDamages.map((d) => ({
            id: d.id,
            date: d.date,
            workerName: d.worker_name,
            eggTypeName: d.egg_type_name,
            category: d.category,
            qtyEggs: d.qty_eggs,
            lossAmount: d.loss_amount,
            status: d.status,
            reason: d.reason,
          }))
        );
      }
    } catch (err) {
      console.error("Failed to load data from backend:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /* ───────── Bill ───────── */
  const addBill: StoreContextType["addBill"] = async (billData) => {
    const payload = {
      trip_id: billData.tripId || trip.id,
      customer_id: billData.customerId,
      customer_name: billData.customerName,
      customer_phone: billData.customerPhone,
      items: billData.items.map((i) => ({
        egg_type_id: i.eggTypeId,
        egg_type_name: i.eggTypeName,
        qty_eggs: i.qtyEggs,
        rate: i.rate,
        amount: i.amount,
      })),
      total_amount: billData.totalAmount,
      paid_cash: billData.paidCash,
      paid_online: billData.paidOnline,
      due_amount: billData.dueAmount,
      payment_mode: billData.paymentMode,
      trays_given: billData.traysGiven,
      trays_returned: billData.traysReturned,
    };

    const res = await api.createBill(payload);
    await refreshData();

    const created: Bill = {
      ...billData,
      id: res.id,
      billNo: res.bill_no,
      customerPendingTraysAfter: res.customer_pending_trays_after,
      customerDueAfter: res.customer_due_after,
      status: "ACTIVE",
      createdAt: res.created_at_time || "Now",
    };
    return created;
  };

  /* ───────── Damage ───────── */
  const addDamage: StoreContextType["addDamage"] = async (damageData) => {
    await api.reportDamage({
      worker_name: damageData.workerName,
      egg_type_name: damageData.eggTypeName,
      category: damageData.category,
      qty_eggs: damageData.qtyEggs,
      loss_amount: damageData.lossAmount,
      reason: damageData.reason,
    });
    await refreshData();
  };

  const updateDamageStatus = async (id: string, status: "APPROVED" | "REJECTED") => {
    await api.updateDamageStatus(id, status);
    await refreshData();
  };

  /* ───────── Trip (worker) ───────── */
  const confirmTripLoad = async () => {
    await api.confirmTripLoad(trip.id);
    await refreshData();
  };

  const submitTripSettlement = async (cash: number, online: number, trays: number) => {
    await api.submitTripSettlement(trip.id, {
      declared_cash: cash,
      declared_online: online,
      declared_empty_trays: trays,
    });
    await refreshData();
  };

  /* ───────── Trip CRUD (admin) ───────── */
  const addTrip = async (data: Omit<Trip, "id" | "tripNo" | "expectedCash" | "expectedOnline">) => {
    const payload = {
      worker_id: data.workerId,
      worker_name: data.workerName,
      worker_phone: data.workerPhone,
      date: data.date,
      vehicle: data.vehicle,
      status: data.status || "DRAFT",
      loads: data.loads.map((l) => ({
        egg_type_id: l.eggTypeId,
        egg_type_name: l.eggTypeName,
        qty_loaded_eggs: l.qtyLoadedEggs,
        qty_sold_eggs: l.qtySoldEggs,
        qty_returned_eggs: l.qtyReturnedEggs,
      })),
    };
    const res = await api.createTrip(payload);
    await refreshData();
    return {
      ...data,
      id: res.id,
      tripNo: res.trip_no,
      expectedCash: 0,
      expectedOnline: 0,
    };
  };

  const updateTripStatus = async (id: string, status: Trip["status"]) => {
    await api.updateTripStatus(id, status);
    await refreshData();
  };

  /* ───────── Customer ───────── */
  const collectCustomerPayment = async (customerId: string, amount: number) => {
    await api.collectPayment(customerId, amount);
    await refreshData();
  };

  const addCustomer = async (data: { name: string; phone: string; area?: string; openingDue?: number; notes?: string }) => {
    const res = await api.createCustomer({
      name: data.name,
      phone: data.phone,
      area: data.area,
      opening_due: data.openingDue,
      notes: data.notes,
    });
    await refreshData();
    return {
      id: res.id,
      name: res.name,
      phone: res.phone,
      area: res.area,
      dueAmount: res.due_amount,
      pendingTrays: res.pending_trays,
      notes: res.notes,
    };
  };

  const updateCustomer = async (id: string, data: Partial<Pick<Customer, "name" | "phone" | "area" | "notes">>) => {
    await api.updateCustomer(id, data);
    await refreshData();
  };

  const updateCustomerRate = async (customerId: string, eggTypeId: string, rate: number) => {
    await api.setCustomerRate(customerId, eggTypeId, rate);
    await refreshData();
  };

  /* ───────── Worker CRUD ───────── */
  const addWorker = async (data: Omit<Worker, "id">) => {
    const res = await api.createWorker({
      name: data.name,
      phone: data.phone,
      pin: data.pin,
      role: data.role,
      is_active: data.isActive,
    });
    await refreshData();
    return {
      ...data,
      id: res.id,
    };
  };

  const updateWorker = async (id: string, data: Partial<Omit<Worker, "id">>) => {
    await api.updateWorker(id, {
      name: data.name,
      phone: data.phone,
      pin: data.pin,
      role: data.role,
      is_active: data.isActive,
    });
    await refreshData();
  };

  const deleteWorker = async (id: string) => {
    await api.deleteWorker(id);
    await refreshData();
  };

  /* ───────── Stock CRUD ───────── */
  const addStockEntry = async (data: Omit<StockEntry, "id">) => {
    await api.addStockEntry({
      date: data.date,
      egg_type_id: data.eggTypeId,
      qty_trays: data.qtyTrays,
      purchase_rate_per_egg: data.purchaseRatePerEgg,
      supplier: data.supplier,
      notes: data.notes,
    });
    await refreshData();
  };

  const deleteStockEntry = async (id: string) => {
    await api.deleteStockEntry(id);
    await refreshData();
  };

  const addEggType = async (data: Omit<EggType, "id">): Promise<EggType> => {
    const res = await api.createEggType({
      name: data.name,
      category: data.category,
      eggs_per_tray: data.eggsPerTray,
      default_rate: data.defaultRate,
      cost_price: data.costPrice,
      current_stock_trays: data.currentStockTrays || 0,
    });
    const newEggType: EggType = {
      id: res.id,
      name: res.name,
      category: res.category,
      eggsPerTray: res.eggs_per_tray,
      defaultRate: res.default_rate,
      costPrice: res.cost_price,
      currentStockTrays: res.current_stock_trays,
    };
    setEggTypes((prev) => [...prev, newEggType]);
    return newEggType;
  };

  const updateEggType = async (id: string, data: Partial<Omit<EggType, "id">>) => {
    const payload: any = {};
    if (data.name !== undefined) payload.name = data.name;
    if (data.category !== undefined) payload.category = data.category;
    if (data.eggsPerTray !== undefined) payload.eggs_per_tray = data.eggsPerTray;
    if (data.defaultRate !== undefined) payload.default_rate = data.defaultRate;
    if (data.costPrice !== undefined) payload.cost_price = data.costPrice;
    if (data.currentStockTrays !== undefined) payload.current_stock_trays = data.currentStockTrays;

    const res = await api.updateEggType(id, payload);
    setEggTypes((prev) =>
      prev.map((et) =>
        et.id === id
          ? {
              ...et,
              name: res.name,
              category: res.category,
              eggsPerTray: res.eggs_per_tray,
              defaultRate: res.default_rate,
              costPrice: res.cost_price,
              currentStockTrays: res.current_stock_trays,
            }
          : et
      )
    );
  };

  const deleteEggType = async (id: string) => {
    await api.deleteEggType(id);
    setEggTypes((prev) => prev.filter((et) => et.id !== id));
  };

  return (
    <StoreContext.Provider
      value={{
        eggTypes,
        customers,
        bills,
        trip,
        trips,
        damages,
        workers,
        stockEntries,
        isLoading,
        currentUser,
        activeRole,
        loginAsWorker,
        loginAsAdmin,
        logout,
        refreshData,
        addBill,
        addDamage,
        updateDamageStatus,
        confirmTripLoad,
        submitTripSettlement,
        addTrip,
        updateTripStatus,
        collectCustomerPayment,
        addCustomer,
        updateCustomer,
        updateCustomerRate,
        addWorker,
        updateWorker,
        deleteWorker,
        addStockEntry,
        deleteStockEntry,
        addEggType,
        updateEggType,
        deleteEggType,
        setActiveRole,
        adminTab,
        setAdminTab,
        workerTab,
        setWorkerTab,
        mobileMenuOpen,
        setMobileMenuOpen,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) throw new Error("useStore must be used within StoreProvider");
  return context;
}
