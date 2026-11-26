"use client";

import React, { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { useStore } from "@/lib/store";
import { useLanguage } from "@/lib/i18n";
import { Stepper } from "@/components/ui/stepper";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatINR } from "@/lib/utils";
import { Bill, BillItem } from "@/lib/mock-data";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import {
  Search,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash2,
  CreditCard,
  Banknote,
  Split,
  AlertTriangle,
  RotateCcw,
  X,
  UserPlus,
  Pencil,
  RotateCw,
} from "lucide-react";

interface NewBillFlowProps {
  onBillCreated: () => void;
  onCancel: () => void;
}

export function NewBillFlow({ onBillCreated, onCancel }: NewBillFlowProps) {
  const { customers, eggTypes, trip, addBill, addCustomer } = useStore();
  const { t } = useLanguage();

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");

  // New Customer Quick Add State
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [newCustName, setNewCustName] = useState("");
  const [newCustPhone, setNewCustPhone] = useState("");
  const [newCustArea, setNewCustArea] = useState("");

  const handleQuickAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim() || !newCustPhone.trim()) {
      toast.error("Name aur Phone zaroori hai");
      return;
    }
    const created = await addCustomer({
      name: newCustName,
      phone: newCustPhone,
      area: newCustArea,
    });
    setSelectedCustomerId(created.id);
    setSearchQuery(created.name);
    setShowAddCustomerModal(false);
    setNewCustName("");
    setNewCustPhone("");
    setNewCustArea("");
    toast.success(`Naya customer "${created.name}" add ho gaya!`);
  };

  // Available egg stock remaining in the worker's current trip
  const availableTripStock = useMemo(() => {
    return (trip.loads || [])
      .map((load) => {
        const remainingEggs = Math.max(
          0,
          load.qtyLoadedEggs - load.qtySoldEggs - load.qtyReturnedEggs
        );
        const eggType = eggTypes.find((e) => e.id === load.eggTypeId);
        return eggType && remainingEggs > 0 ? { eggType, remainingEggs } : null;
      })
      .filter(
        (x): x is { eggType: (typeof eggTypes)[number]; remainingEggs: number } =>
          x !== null
      );
  }, [trip.loads, eggTypes]);

  // Step 2: Items — customRate: undefined = use customer/default rate, number = manual override
  const [items, setItems] = useState<
    {
      eggTypeId: string;
      trays: number;
      eggs: number;
      customRate?: number;
      rateEditOpen?: boolean;
      rateInput?: string;
    }[]
  >([{ eggTypeId: "", trays: 1, eggs: 0 }]);

  // Sync items to only valid trip-loaded egg types & clamp qty within remaining trip stock
  useEffect(() => {
    if (availableTripStock.length === 0) return;
    setItems((prev) =>
      prev.map((item) => {
        const match =
          availableTripStock.find((s) => s.eggType.id === item.eggTypeId) ||
          availableTripStock[0];
        const ept = match.eggType.eggsPerTray || 30;
        const maxEggs = match.remainingEggs;
        const currentEggs = item.trays * ept + item.eggs;
        const clampedEggs = Math.min(currentEggs, maxEggs);
        return {
          ...item,
          eggTypeId: match.eggType.id,
          trays: Math.floor(clampedEggs / ept),
          eggs: clampedEggs % ept,
        };
      })
    );
  }, [availableTripStock]);

  // Step 3: Trays
  const [traysGiven, setTraysGiven] = useState(2);
  const [traysReturned, setTraysReturned] = useState(0);

  // Step 4: Payment
  const [paymentMode, setPaymentMode] = useState<"CASH" | "ONLINE" | "MIX">("CASH");
  const [cashAmount, setCashAmount] = useState<number>(0);
  const [onlineAmount, setOnlineAmount] = useState<number>(0);

  // Step 6: Created Bill reference
  const [createdBill, setCreatedBill] = useState<Bill | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Selected Customer details
  const selectedCustomer = useMemo(() => {
    return customers.find((c) => c.id === selectedCustomerId) || null;
  }, [customers, selectedCustomerId]);

  // Filtered customer list: only shown after searching or when a customer is selected
  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) {
      if (selectedCustomerId) {
        return customers.filter((c) => c.id === selectedCustomerId);
      }
      return [];
    }
    const q = searchQuery.toLowerCase().trim();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.area.toLowerCase().includes(q)
    );
  }, [customers, searchQuery, selectedCustomerId]);

  // Compute line items with resolved rates (customRate overrides customer/default rate)
  const computedItems: BillItem[] = useMemo(() => {
    return items
      .filter((it) => eggTypes.some((e) => e.id === it.eggTypeId)) // skip items whose eggType isn't loaded yet
      .map((it) => {
        const eggType = eggTypes.find((e) => e.id === it.eggTypeId)!;
        const baseRate = selectedCustomer?.rates?.[it.eggTypeId] ?? eggType.defaultRate ?? 0;
        const rate =
          it.customRate !== undefined ? it.customRate : baseRate;
        const totalEggs = it.trays * eggType.eggsPerTray + it.eggs;
        const amount = Math.round(totalEggs * rate);
        return {
          eggTypeId: it.eggTypeId,
          eggTypeName: eggType.name,
          qtyEggs: totalEggs,
          rate,
          amount,
        };
      });
  }, [items, eggTypes, selectedCustomer]);

  const billTotal = useMemo(() => {
    return computedItems.reduce((acc, curr) => acc + curr.amount, 0);
  }, [computedItems]);

  const totalTraysInItems = useMemo(() => {
    return items.reduce((acc, curr) => acc + curr.trays, 0);
  }, [items]);

  // Auto-sync given trays when items change
  const handleNextFromItems = () => {
    setTraysGiven(totalTraysInItems);
    setStep(3);
  };

  // Sync payments when arriving at payment step
  const handleProceedToPayment = () => {
    if (paymentMode === "CASH") {
      setCashAmount(billTotal);
      setOnlineAmount(0);
    } else if (paymentMode === "ONLINE") {
      setOnlineAmount(billTotal);
      setCashAmount(0);
    }
    setStep(4);
  };

  // Switch payment mode
  const handleModeChange = (mode: "CASH" | "ONLINE" | "MIX") => {
    setPaymentMode(mode);
    if (mode === "CASH") {
      setCashAmount(billTotal);
      setOnlineAmount(0);
    } else if (mode === "ONLINE") {
      setOnlineAmount(billTotal);
      setCashAmount(0);
    } else if (mode === "MIX") {
      const half = Math.floor(billTotal / 2);
      setCashAmount(half);
      setOnlineAmount(billTotal - half);
    }
  };

  // Auto-fill second input in MIX mode
  const handleCashChange = (val: number) => {
    const clamped = Math.max(0, Math.min(billTotal, val));
    setCashAmount(clamped);
    if (paymentMode === "MIX") {
      setOnlineAmount(billTotal - clamped);
    }
  };

  const handleOnlineChange = (val: number) => {
    const clamped = Math.max(0, Math.min(billTotal, val));
    setOnlineAmount(clamped);
    if (paymentMode === "MIX") {
      setCashAmount(billTotal - clamped);
    }
  };

  const dueAmount = Math.max(0, billTotal - (cashAmount + onlineAmount));

  // Save the Bill (Step 5 -> 6)
  const handleSaveBill = async () => {
    if (isSaving || !selectedCustomer) return;
    setIsSaving(true);

    try {
      const newBill = await addBill({
        tripId: trip.id,
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.name,
        customerPhone: selectedCustomer.phone,
        items: computedItems,
        totalAmount: billTotal,
        paidCash: cashAmount,
        paidOnline: onlineAmount,
        dueAmount,
        paymentMode: dueAmount > 0 ? "MIX" : paymentMode,
        traysGiven,
        traysReturned,
      });

      setCreatedBill(newBill);
      setStep(6);
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: ["#388087", "#6FB3B8", "#C2EDCE", "#BADFE7"],
      });
      toast.success("Bill Created Successfully! 🎉", {
        description: `Bill #${newBill.billNo} for ${selectedCustomer.name}`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error saving bill";
      toast.error("Failed to save bill", { description: msg });
    } finally {
      setIsSaving(false);
    }
  };



  return (
    <div className="mx-auto w-full max-w-xl md:max-w-2xl lg:max-w-3xl pb-28 md:pb-12 pt-1">
      {/* 5-Step Progress Header */}
      {step <= 5 && (
        <div className="mb-4 bg-white rounded-2xl p-4 border border-border shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={step === 1 ? onCancel : () => setStep((s) => (s - 1) as 1 | 2 | 3 | 4 | 5)}
              className="flex items-center gap-1 text-xs font-bold text-brand-dark hover:text-brand-teal"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>{step === 1 ? "Cancel" : "Back"}</span>
            </button>
            <div className="text-xs font-bold text-brand-teal uppercase tracking-wider">
              Step {step} of 5
            </div>
          </div>

          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <div
                key={s}
                className={`h-2 flex-1 rounded-full transition-all duration-300 ${s < step
                  ? "bg-brand-teal"
                  : s === step
                    ? "bg-brand-ocean"
                    : "bg-brand-ice/40"
                  }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* STEP 1: SELECT CUSTOMER */}
      {step === 1 && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="space-y-4"
        >
          <div className="bg-white p-4 rounded-2xl border border-border shadow-xs">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-lg font-bold text-brand-dark">
                {t("selectCustomer")}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setNewCustName(searchQuery);
                  setShowAddCustomerModal(true);
                }}
                className="flex items-center gap-1 text-xs font-bold text-brand-teal hover:underline"
              >
                <UserPlus className="h-3.5 w-3.5" />
                <span>+ Naya Grahak</span>
              </button>
            </div>
            <p className="text-xs text-brand-muted mb-3">
              Kisko delivery de rahe ho? Search karo ya recent list se choose karo.
            </p>

            {/* Recent Customers Quick Chips */}
            <div className="mb-3">
              <span className="text-[11px] font-semibold text-brand-muted uppercase tracking-wider block mb-1.5">
                Recent Grahak:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {customers.slice(0, 4).map((c) => {
                  const isSelected = selectedCustomerId === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setSelectedCustomerId(c.id);
                        setSearchQuery(c.name);
                      }}
                      className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${isSelected
                        ? "bg-brand-teal text-white shadow-xs"
                        : "bg-brand-ice/40 text-brand-dark hover:bg-brand-ice"
                        }`}
                    >
                      {c.name.split(" ")[0]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Search Input with Clear Button */}
            <div className="relative mb-3">
              <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-brand-muted" />
              <Input
                placeholder="Search by name, phone or shop..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-9"
                autoFocus
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-3.5 text-brand-muted hover:text-brand-dark"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Customer List Display (Only shown after search or selection) */}
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {!searchQuery.trim() && !selectedCustomerId ? (
                <div className="text-center py-7 px-4 bg-brand-cream/60 rounded-2xl border border-dashed border-brand-ocean/30">
                  <Search className="h-8 w-8 text-brand-teal/40 mx-auto mb-2" />
                  <p className="text-xs font-bold text-brand-dark mb-1">
                    Grahak Ka Naam Ya Mobile Number Search Karein
                  </p>
                  <p className="text-[11px] text-brand-muted">
                    Search karte hi grahak ka hisaab yahan dikhega, ya upar se recent grahak chunein.
                  </p>
                </div>
              ) : filteredCustomers.length === 0 ? (
                <div className="text-center py-6 px-3 bg-brand-cream rounded-xl border border-dashed border-brand-ocean/40">
                  <p className="text-xs font-semibold text-brand-dark mb-1">
                    Koi grahak nahi mila &ldquo;{searchQuery}&rdquo; ke liye
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    variant="soft"
                    onClick={() => {
                      setNewCustName(searchQuery);
                      setShowAddCustomerModal(true);
                    }}
                    className="mt-2 text-xs font-bold"
                  >

                  </Button>
                </div>
              ) : (
                filteredCustomers.map((c) => {
                  const isSelected = selectedCustomerId === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setSelectedCustomerId(c.id);
                        setSearchQuery(c.name);
                      }}
                      className={`w-full text-left p-3 rounded-xl border transition-all ${isSelected
                        ? "border-brand-teal bg-brand-ice/30 shadow-xs ring-2 ring-brand-teal"
                        : "border-border hover:border-brand-ocean/40 bg-card hover:bg-brand-cream/50"
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-brand-dark">
                          {c.name}
                        </span>
                        {isSelected && (
                          <div className="flex items-center gap-1 text-xs font-bold text-brand-teal">
                            <CheckCircle2 className="h-4 w-4" />
                            <span>Selected</span>
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-brand-muted mt-0.5">
                        📞 {c.phone} · {c.area}
                      </div>

                      {/* Customer balance shown to worker on the spot */}
                      <div className="flex gap-2 mt-2">
                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${c.dueAmount > 0
                            ? "bg-brand-danger/10 text-brand-danger"
                            : "bg-brand-mint text-[#1b5e20]"
                            }`}
                        >
                          Baaqi: ₹{c.dueAmount}
                        </span>
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-brand-ice text-[#174654]">
                          Trays: {c.pendingTrays}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Quick Add Customer Modal */}
          {showAddCustomerModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md">
              <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl border border-border">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-black text-brand-dark flex items-center gap-1.5">
                    <UserPlus className="h-5 w-5 text-brand-teal" />
                    <span>Naya Grahak Jodein</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowAddCustomerModal(false)}
                    className="p-1 text-brand-muted hover:text-brand-dark"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleQuickAddCustomer} className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-brand-muted mb-1 block">
                      Shop / Grahak Ka Naam *
                    </label>
                    <Input
                      placeholder="e.g. Sharma Cafe, Khan Hotel"
                      value={newCustName}
                      onChange={(e) => setNewCustName(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-brand-muted mb-1 block">
                      Phone Number (10 Digits) *
                    </label>
                    <Input
                      type="tel"
                      placeholder="98xxxxxxxx"
                      value={newCustPhone}
                      onChange={(e) => setNewCustPhone(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-brand-muted mb-1 block">
                      Area / Pata (Address)
                    </label>
                    <Input
                      placeholder="e.g. Market Chowk, Station Road"
                      value={newCustArea}
                      onChange={(e) => setNewCustArea(e.target.value)}
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setShowAddCustomerModal(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button type="submit" variant="primary" className="flex-1 font-bold">
                      Grahak Save Karein
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <Button
            onClick={() => setStep(2)}
            disabled={!selectedCustomerId}
            className="w-full h-12 rounded-xl text-base font-bold shadow-md bg-brand-teal hover:bg-brand-teal/90 text-white disabled:opacity-40"
          >
            <span>Aage Badhein (Next) &rarr;</span>
          </Button>
        </motion.div>
      )}

      {/* STEP 2: EGG ITEMS & QUANTITY */}
      {step === 2 && selectedCustomer && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="space-y-4"
        >
          {/* Customer quick bar */}
          <div className="flex items-center justify-between bg-brand-ice/30 p-3 rounded-xl border border-brand-ocean/30">
            <div>
              <span className="text-xs text-brand-muted font-medium">Customer:</span>
              <p className="font-bold text-sm text-brand-dark">
                {selectedCustomer.name}
              </p>
            </div>
            <Badge variant="mint">Active Customer</Badge>
          </div>

          {/* Items List */}
          <div className="space-y-3">
            {eggTypes.length === 0 ? (
              <div className="text-center py-8 bg-brand-cream/60 rounded-2xl border border-dashed border-brand-ocean/30">
                <p className="text-sm font-bold text-brand-dark mb-1">Egg Types Load Ho Rahe Hain…</p>
                <p className="text-xs text-brand-muted">Backend se data aa raha hai, ek second ruko.</p>
              </div>
            ) : availableTripStock.length === 0 ? (
              <div className="text-center py-8 px-4 bg-amber-50 rounded-2xl border border-dashed border-amber-300">
                <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                <p className="text-sm font-bold text-brand-dark mb-1">Gaadi Mein Koi Egg Stock Bacha Nahi Hai</p>
                <p className="text-xs text-brand-muted">
                  Aapki trip ke saare loaded trays bik chuke hain ya abhi load assign nahi hua hai.
                </p>
              </div>
            ) : (
              items.map((item, idx) => {
                const stockEntry =
                  availableTripStock.find((s) => s.eggType.id === item.eggTypeId) ??
                  availableTripStock[0];
                const eggType = stockEntry.eggType;
                const ept = eggType.eggsPerTray || 30;
                const otherRowsEggs = items.reduce(
                  (sum, other, oIdx) =>
                    oIdx !== idx && other.eggTypeId === eggType.id
                      ? sum + other.trays * ept + other.eggs
                      : sum,
                  0
                );
                const maxEggsForRow = Math.max(0, stockEntry.remainingEggs - otherRowsEggs);
                const maxTraysForRow = Math.floor(maxEggsForRow / ept);
                const maxKhullaForRow = Math.min(
                  ept - 1,
                  Math.max(0, maxEggsForRow - item.trays * ept)
                );
                const availTraysDisplay = Math.floor(maxEggsForRow / ept);
                const availEggsDisplay = maxEggsForRow % ept;

                const baseRate = selectedCustomer.rates?.[eggType.id] ?? eggType.defaultRate ?? 0;
                const effectiveRate = item.customRate !== undefined ? item.customRate : baseRate;
                const isCustomRate = item.customRate !== undefined && item.customRate !== baseRate;
                const lineTotal = Math.round(
                  (item.trays * ept + item.eggs) * effectiveRate
                );

                return (
                  <Card key={idx} className={`p-4 border-2 ${isCustomRate ? "border-amber-300" : "border-brand-ice/60"}`}>
                    <div className="flex items-center justify-between mb-2">
                      {/* Egg Type Selector Chips — ONLY trip-loaded egg types */}
                      <div className="flex flex-wrap gap-1.5">
                        {availableTripStock.map(({ eggType: et }) => (
                          <button
                            key={et.id}
                            type="button"
                            onClick={() => {
                              const targetStock = availableTripStock.find((s) => s.eggType.id === et.id);
                              const targetEpt = et.eggsPerTray || 30;
                              const otherUsed = items.reduce(
                                (sum, other, oIdx) =>
                                  oIdx !== idx && other.eggTypeId === et.id
                                    ? sum + other.trays * targetEpt + other.eggs
                                    : sum,
                                0
                              );
                              const avail = Math.max(0, (targetStock?.remainingEggs ?? 0) - otherUsed);
                              const clamped = Math.min(item.trays * targetEpt + item.eggs, avail);
                              const newItems = [...items];
                              newItems[idx] = {
                                ...newItems[idx],
                                eggTypeId: et.id,
                                trays: Math.floor(clamped / targetEpt),
                                eggs: clamped % targetEpt,
                                customRate: undefined,
                                rateEditOpen: false,
                              };
                              setItems(newItems);
                            }}
                            className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${eggType.id === et.id
                              ? "bg-brand-teal text-white shadow-xs"
                              : "bg-brand-cream text-brand-dark hover:bg-brand-ice/50"
                              }`}
                          >
                            {et.name.split(" ")[0]}
                          </button>
                        ))}
                      </div>

                      {items.length > 1 && (
                        <button
                          onClick={() =>
                            setItems(items.filter((_, i) => i !== idx))
                          }
                          className="text-brand-danger/80 hover:text-brand-danger p-1"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    {/* Remaining in Gaadi indicator */}
                    <div className="mb-3 flex items-center justify-between text-[11px] font-semibold text-brand-teal bg-brand-ice/30 px-2.5 py-1 rounded-lg">
                      <span>Gaadi mein bacha ({eggType.name.split(" ")[0]}):</span>
                      <span className="font-black">
                        {availTraysDisplay} Tray{availEggsDisplay > 0 ? ` + ${availEggsDisplay} Egg` : ""}
                      </span>
                    </div>

                    {/* Quantity Stepper (Trays & Eggs) */}
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <Stepper
                        label={`Tray (${ept} eggs)`}
                        value={item.trays}
                        min={0}
                        max={maxTraysForRow}
                        onChange={(trays) => {
                          const clampedTrays = Math.min(trays, maxTraysForRow);
                          const remainingAfterTrays = Math.max(0, maxEggsForRow - clampedTrays * ept);
                          const clampedEggs = Math.min(item.eggs, remainingAfterTrays);
                          const newItems = [...items];
                          newItems[idx] = { ...newItems[idx], trays: clampedTrays, eggs: clampedEggs };
                          setItems(newItems);
                        }}
                        unit="tray"
                      />

                      <Stepper
                        label="Khulla Egg"
                        value={item.eggs}
                        min={0}
                        max={maxKhullaForRow}
                        onChange={(eggs) => {
                          const clampedEggs = Math.min(eggs, maxKhullaForRow);
                          const newItems = [...items];
                          newItems[idx] = { ...newItems[idx], eggs: clampedEggs };
                          setItems(newItems);
                        }}
                        unit="egg"
                      />
                    </div>

                  {/* Rate Row — editable */}
                  <div className="pt-2 border-t border-border">
                    {item.rateEditOpen ? (
                      /* ── Rate Edit Input ── */
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-brand-muted shrink-0">₹</span>
                        <input
                          type="text"
                          inputMode="decimal"
                          autoFocus
                          value={item.rateInput ?? (item.customRate !== undefined ? item.customRate : baseRate).toString()}
                          onChange={(e) => {
                            const newItems = [...items];
                            newItems[idx] = { ...newItems[idx], rateInput: e.target.value };
                            setItems(newItems);
                          }}
                          onBlur={() => {
                            const parsed = parseFloat(item.rateInput ?? "");
                            const newItems = [...items];
                            newItems[idx] = {
                              ...newItems[idx],
                              customRate: isNaN(parsed) ? undefined : parsed,
                              rateInput: undefined,
                              rateEditOpen: false,
                            };
                            setItems(newItems);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              const parsed = parseFloat(item.rateInput ?? "");
                              const newItems = [...items];
                              newItems[idx] = {
                                ...newItems[idx],
                                customRate: isNaN(parsed) ? undefined : parsed,
                                rateInput: undefined,
                                rateEditOpen: false,
                              };
                              setItems(newItems);
                            }
                            if (e.key === "Escape") {
                              const newItems = [...items];
                              newItems[idx] = { ...newItems[idx], rateInput: undefined, rateEditOpen: false };
                              setItems(newItems);
                            }
                          }}
                          className="flex-1 h-9 rounded-xl border-2 border-brand-teal bg-white px-3 text-sm font-black text-brand-dark focus:outline-none tabular-nums"
                          placeholder={baseRate.toFixed(2)}
                        />
                        <span className="text-xs text-brand-muted shrink-0">/ egg</span>
                        {/* Reset to base rate */}
                        {isCustomRate && (
                          <button
                            type="button"
                            onClick={() => {
                              const newItems = [...items];
                              newItems[idx] = { ...newItems[idx], customRate: undefined, rateEditOpen: false };
                              setItems(newItems);
                            }}
                            title="Reset to standard rate"
                            className="p-1.5 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 shrink-0"
                          >
                            <RotateCw className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    ) : (
                      /* ── Rate Display Row ── */
                      <div className="flex items-center justify-between text-xs">
                        <button
                          type="button"
                          onClick={() => {
                            const newItems = [...items];
                            newItems[idx] = {
                              ...newItems[idx],
                              rateEditOpen: true,
                              rateInput: (item.customRate !== undefined ? item.customRate : baseRate).toString(),
                            };
                            setItems(newItems);
                          }}
                          className={`flex items-center gap-1.5 group ${isCustomRate ? "text-amber-600" : "text-brand-muted hover:text-brand-teal"}`}
                          title="Rate badlo"
                        >
                          <Pencil className="h-3 w-3 group-hover:scale-110 transition-transform" />
                          <span>
                            Rate:{" "}
                            <strong className={isCustomRate ? "text-amber-700" : "text-brand-dark"}>
                              ₹{effectiveRate.toFixed(2)}
                            </strong>
                            {" "}<span className="text-brand-muted">/ egg</span>
                          </span>
                          {isCustomRate && (
                            <span className="ml-1 text-[10px] font-black px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-700">
                              Custom
                            </span>
                          )}
                          {!isCustomRate && selectedCustomer.rates?.[item.eggTypeId] !== undefined && (
                            <span className="ml-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-brand-ice text-brand-teal">
                              Special
                            </span>
                          )}
                        </button>
                        <span className="font-extrabold text-sm text-brand-teal tabular-nums">
                          {formatINR(lineTotal)}
                        </span>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })
            )}

            {/* Add More Egg Type Button - only allowed if there are more trip-loaded egg types to add */}
            {availableTripStock.length > items.length && (
              <Button
                type="button"
                variant="outline"
                disabled={availableTripStock.length === 0}
                onClick={() => {
                  const unusedStock = availableTripStock.find(
                    (s) => !items.some((it) => it.eggTypeId === s.eggType.id)
                  );
                  const nextEggTypeId = unusedStock ? unusedStock.eggType.id : (availableTripStock[0]?.eggType.id ?? "");
                  setItems([
                    ...items,
                    { eggTypeId: nextEggTypeId, trays: 1, eggs: 0, customRate: undefined, rateEditOpen: false },
                  ]);
                }}
                className="w-full border-dashed border-brand-ocean py-2 text-xs font-bold text-brand-teal hover:bg-brand-ice/20"
              >
                <Plus className="h-4 w-4 mr-1" />
                <span>+ Dusra Egg Type Jodein</span>
              </Button>
            )}
          </div>

          {/* Sticky Total Bar */}
          <div className="rounded-2xl bg-brand-teal text-white p-4 shadow-md flex items-center justify-between">
            <div>
              <span className="text-xs text-brand-ice font-medium">Kul Bill (Subtotal):</span>
              <p className="text-2xl font-black tabular-nums">{formatINR(billTotal)}</p>
            </div>
            <Button
              onClick={handleNextFromItems}
              disabled={billTotal <= 0}
              variant="mint"
              className="h-11 px-5 rounded-xl font-bold"
            >
              <span>Trays &rarr;</span>
            </Button>
          </div>
        </motion.div>
      )}

      {/* STEP 3: TRAYS (GIVEN & RETURNED) */}
      {step === 3 && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="space-y-4"
        >
          <div className="bg-white p-4 rounded-2xl border border-border">
            <h2 className="text-lg font-bold text-brand-dark mb-1">
              Tray Ka Hisaab
            </h2>
            <p className="text-xs text-brand-muted mb-4">
              Kitni tray di aur khali kitni wapas mili?
            </p>

            <div className="space-y-4">
              <Stepper
                label="Kitni Tray Di (Given)"
                value={traysGiven}
                min={0}
                onChange={setTraysGiven}
                unit="trays"
              />

              <Stepper
                label="Khali Tray Wapas Mili (Returned)"
                value={traysReturned}
                min={0}
                onChange={setTraysReturned}
                unit="trays"
              />
            </div>

            {/* Tray Net Impact */}
            <div className="mt-4 rounded-xl bg-brand-cream p-3 text-xs space-y-1 border border-border">
              <div className="flex justify-between">
                <span className="text-brand-muted">Grahak ke paas pehle se:</span>
                <strong>{selectedCustomer?.pendingTrays || 0} trays</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-muted">Aaj ka net (Di − Wapas):</span>
                <strong className={traysGiven - traysReturned > 0 ? "text-brand-danger" : "text-[#184d28]"}>
                  {traysGiven - traysReturned > 0 ? `+${traysGiven - traysReturned}` : traysGiven - traysReturned} trays
                </strong>
              </div>
              <div className="flex justify-between font-bold pt-1 border-t border-border/60">
                <span className="text-brand-dark">Ab kul baaqi trays:</span>
                <span className="text-brand-teal text-sm">
                  {Math.max(0, (selectedCustomer?.pendingTrays || 0) + (traysGiven - traysReturned))} trays
                </span>
              </div>
            </div>
          </div>

          <Button
            onClick={handleProceedToPayment}
            className="w-full h-12 rounded-xl text-base font-bold shadow-md"
          >
            <span>Payment Par Jayein</span>
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </motion.div>
      )}

      {/* STEP 4: PAYMENT (CASH / ONLINE / MIX / DUE) */}
      {step === 4 && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="space-y-4"
        >
          <div className="bg-white p-4 rounded-2xl border border-border">
            <h2 className="text-lg font-bold text-brand-dark mb-1">
              Payment Kaise Mili?
            </h2>
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs text-brand-muted">Total Bill:</span>
              <span className="text-xl font-black text-brand-teal tabular-nums">
                {formatINR(billTotal)}
              </span>
            </div>

            {/* Payment Mode Selector */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <button
                type="button"
                onClick={() => handleModeChange("CASH")}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold transition-all ${paymentMode === "CASH"
                  ? "border-brand-teal bg-brand-ice/40 text-brand-teal shadow-xs ring-1 ring-brand-teal"
                  : "border-border text-brand-dark hover:bg-brand-cream"
                  }`}
              >
                <Banknote className="h-5 w-5 mb-1" />
                <span>Poora Cash</span>
              </button>

              <button
                type="button"
                onClick={() => handleModeChange("ONLINE")}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold transition-all ${paymentMode === "ONLINE"
                  ? "border-brand-teal bg-brand-ice/40 text-brand-teal shadow-xs ring-1 ring-brand-teal"
                  : "border-border text-brand-dark hover:bg-brand-cream"
                  }`}
              >
                <CreditCard className="h-5 w-5 mb-1" />
                <span>Online UPI</span>
              </button>

              <button
                type="button"
                onClick={() => handleModeChange("MIX")}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold transition-all ${paymentMode === "MIX"
                  ? "border-brand-teal bg-brand-ice/40 text-brand-teal shadow-xs ring-1 ring-brand-teal"
                  : "border-border text-brand-dark hover:bg-brand-cream"
                  }`}
              >
                <Split className="h-5 w-5 mb-1" />
                <span>Mix Dono</span>
              </button>
            </div>

            {/* Payment Inputs */}
            <div className="space-y-3">
              {(paymentMode === "CASH" || paymentMode === "MIX") && (
                <div>
                  <label className="text-xs font-semibold text-brand-muted mb-1 block">
                    Cash Mila (₹):
                  </label>
                  <Input
                    type="number"
                    value={cashAmount || ""}
                    onChange={(e) => handleCashChange(Number(e.target.value))}
                    placeholder="0"
                    className="text-lg font-bold tabular-nums"
                  />
                </div>
              )}

              {(paymentMode === "ONLINE" || paymentMode === "MIX") && (
                <div>
                  <label className="text-xs font-semibold text-brand-muted mb-1 block">
                    Online / UPI Aaya (₹):
                  </label>
                  <Input
                    type="number"
                    value={onlineAmount || ""}
                    onChange={(e) => handleOnlineChange(Number(e.target.value))}
                    placeholder="0"
                    className="text-lg font-bold tabular-nums"
                  />
                </div>
              )}
            </div>

            {/* Due (Udhaar) Detection */}
            <div className="mt-4 rounded-xl p-3 bg-brand-cream border border-border">
              <div className="flex justify-between items-center text-sm font-bold">
                <span className="text-brand-dark">Baaqi / Udhaar (Due):</span>
                <span
                  className={`text-base tabular-nums ${dueAmount > 0 ? "text-brand-danger font-extrabold" : "text-[#184d28]"
                    }`}
                >
                  {formatINR(dueAmount)}
                </span>
              </div>
              {dueAmount > 0 && (
                <p className="text-[11px] text-brand-danger/90 mt-1 flex items-center gap-1 font-medium">
                  <AlertTriangle className="h-3 w-3" />
                  Ye amount grahak ke udhaar khate me jud jayega.
                </p>
              )}
            </div>
          </div>

          <Button
            onClick={() => setStep(5)}
            className="w-full h-12 rounded-xl text-base font-bold shadow-md"
          >
            <span>Bill Check Karein</span>
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </motion.div>
      )}

      {/* STEP 5: FINAL CONFIRMATION RECEIPT */}
      {step === 5 && selectedCustomer && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-4"
        >
          <div className="bg-white p-5 rounded-2xl border-2 border-brand-teal/40 shadow-sm">
            <div className="text-center pb-3 border-b border-border">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-teal">
                Receipt Preview
              </span>
              <h3 className="text-lg font-black text-brand-dark mt-0.5">
                {selectedCustomer.name}
              </h3>
              <p className="text-xs text-brand-muted">📞 {selectedCustomer.phone}</p>
            </div>

            {/* Items summary */}
            <div className="py-3 space-y-1.5 border-b border-border text-xs">
              {computedItems.map((it, i) => (
                <div key={i} className="flex justify-between">
                  <span className="text-brand-dark font-medium">
                    {it.eggTypeName} ({it.qtyEggs} eggs)
                  </span>
                  <span className="font-bold tabular-nums text-brand-dark">
                    {formatINR(it.amount)}
                  </span>
                </div>
              ))}
            </div>

            {/* Trays & Payment Summary */}
            <div className="py-3 space-y-1 border-b border-border text-xs">
              <div className="flex justify-between">
                <span className="text-brand-muted">Trays Di:</span>
                <strong>{traysGiven}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-muted">Trays Wapas:</span>
                <strong>{traysReturned}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-muted">Cash Jama:</span>
                <strong className="text-brand-dark">{formatINR(cashAmount)}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-muted">Online Jama:</span>
                <strong className="text-brand-dark">{formatINR(onlineAmount)}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-muted">Due (Udhaar):</span>
                <strong className={dueAmount > 0 ? "text-brand-danger" : "text-[#184d28]"}>
                  {formatINR(dueAmount)}
                </strong>
              </div>
            </div>

            {/* Total */}
            <div className="flex justify-between items-center pt-3 text-brand-dark">
              <span className="text-sm font-bold">Total Bill:</span>
              <span className="text-2xl font-black text-brand-teal tabular-nums">
                {formatINR(billTotal)}
              </span>
            </div>
          </div>

          <Button
            onClick={handleSaveBill}
            disabled={isSaving}
            className="w-full h-13 rounded-2xl text-lg font-black shadow-lg bg-brand-teal hover:bg-brand-teal/90 min-h-[52px]"
          >
            {isSaving ? "Saving Bill..." : "✓ Bill Save Karo (Confirm)"}
          </Button>
        </motion.div>
      )}

      {/* STEP 6: SUCCESS SCREEN */}
      {step === 6 && createdBill && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-4"
        >
          <div className="bg-white p-6 rounded-3xl border border-border text-center shadow-md">
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-brand-mint text-[#184d28]">
              <CheckCircle2 className="h-10 w-10 stroke-[2.5]" />
            </div>
            <h2 className="text-xl font-black text-brand-dark">
              Bill Ban Gaya!
            </h2>
            <p className="text-xs text-brand-muted mt-1">
              Bill No: <strong className="text-brand-teal">{createdBill.billNo}</strong>
            </p>
            <p className="text-2xl font-black text-brand-teal mt-2 tabular-nums">
              {formatINR(createdBill.totalAmount)}
            </p>

            <div className="mt-4 p-3 rounded-xl bg-brand-cream text-xs text-left space-y-1">
              <div className="flex justify-between">
                <span className="text-brand-muted">Grahak:</span>
                <strong>{createdBill.customerName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-muted">Baaqi Tray:</span>
                <strong>{createdBill.customerPendingTraysAfter} trays</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-muted">Ab Kul Udhaar:</span>
                <strong className="text-brand-danger">
                  {formatINR(createdBill.customerDueAfter)}
                </strong>
              </div>
            </div>
          </div>

          {/* Action Buttons: WhatsApp & Print */}
          <div className="space-y-2">


            <div className="grid grid-cols-2 gap-2">


              <Button
                onClick={() => {
                  setStep(1);
                  setSelectedCustomerId("");
                  setItems([{ eggTypeId: eggTypes[0].id, trays: 2, eggs: 0 }]);
                  setCreatedBill(null);
                  setSearchQuery("");
                }}
                className="h-11 rounded-xl font-bold text-xs bg-brand-teal text-white"
              >
                <RotateCcw className="mr-1.5 h-4 w-4" />
                <span>Naya Bill Banao</span>
              </Button>

              <Button
                onClick={onBillCreated}
                className="h-11 rounded-xl font-bold text-xs bg-brand-teal text-white"
              >
                Go to Home Screen
              </Button>
            </div>


          </div>

        </motion.div>
      )}
    </div>
  );
}
