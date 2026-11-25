"use client";

import React, { useState } from "react";
import { useStore } from "@/lib/store";
import { formatINR, formatEggsAndTrays } from "@/lib/utils";
import { Trip } from "@/lib/mock-data";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Drawer, FormField } from "@/components/ui/drawer";
import {
  Truck, CheckCircle2, ShieldCheck, Plus, ChevronDown, ChevronUp,
  Calendar, User, Car, Search, SendHorizontal, Check,
} from "lucide-react";
import { toast } from "sonner";

const STATUS_STEPS: Trip["status"][] = ["DRAFT", "OUT", "SETTLEMENT", "CLOSED"];

const statusColor: Record<Trip["status"], string> = {
  DRAFT: "outline",
  OUT: "mint",
  SETTLEMENT: "warning",
  CLOSED: "secondary",
} as const;

type LoadRow = { eggTypeId: string; eggTypeName: string; qtyTrays: number };

export function AdminTrips() {
  const { trip, trips, bills, eggTypes, workers, addTrip, updateTripStatus } = useStore();

  const [expandedId, setExpandedId] = useState<string>(trip.id);
  const [createOpen, setCreateOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | Trip["status"]>("ALL");

  /* ── Filtered Trips ── */
  const filteredTrips = trips.filter((t) => {
    const matchesSearch =
      t.tripNo.toLowerCase().includes(search.toLowerCase()) ||
      t.workerName.toLowerCase().includes(search.toLowerCase()) ||
      t.vehicle.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    if (statusFilter !== "ALL") return t.status === statusFilter;
    return true;
  });

  const handleDispatchTrip = async (tripId: string) => {
    await updateTripStatus(tripId, "OUT");
    toast.success("Gaadi Dispatch Ho Gayi! 🚛", { description: "Trip status is now LIVE (OUT)." });
  };

  const handleSendToSettlement = async (tripId: string) => {
    await updateTripStatus(tripId, "SETTLEMENT");
    toast.info("Trip moved to Settlement", { description: "Awaiting final closing hisaab verification." });
  };

  /* ── Create Trip Form ── */
  const [form, setForm] = useState({
    date: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
    workerId: workers[0]?.id || "",
    vehicle: "",
  });
  const [loadRows, setLoadRows] = useState<LoadRow[]>([
    { eggTypeId: eggTypes[0]?.id || "", eggTypeName: eggTypes[0]?.name || "", qtyTrays: 0 },
  ]);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const selectedWorker = workers.find((w) => w.id === form.workerId);

  const addLoadRow = () => {
    const usedIds = new Set(loadRows.map((r) => r.eggTypeId));
    const nextEgg = eggTypes.find((et) => !usedIds.has(et.id));
    if (nextEgg) {
      setLoadRows((prev) => [...prev, { eggTypeId: nextEgg.id, eggTypeName: nextEgg.name, qtyTrays: 0 }]);
    } else {
      toast.info("All egg types already added");
    }
  };

  const removeLoadRow = (idx: number) => {
    if (loadRows.length === 1) return;
    setLoadRows((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateLoadRow = (idx: number, key: keyof LoadRow, val: string | number) => {
    setLoadRows((prev) => {
      const updated = [...prev];
      if (key === "eggTypeId") {
        const et = eggTypes.find((e) => e.id === val);
        updated[idx] = { ...updated[idx], eggTypeId: String(val), eggTypeName: et?.name || "" };
      } else {
        updated[idx] = { ...updated[idx], [key]: val };
      }
      return updated;
    });
  };

  const validateCreate = () => {
    const errs: Record<string, string> = {};
    if (!form.workerId) errs.worker = "Worker select karo";
    if (!form.vehicle.trim()) errs.vehicle = "Vehicle number daalo";
    if (loadRows.some((r) => r.qtyTrays <= 0)) errs.loads = "Har egg type ke liye qty > 0 honi chahiye";
    return errs;
  };

  const handleCreate = () => {
    const errs = validateCreate();
    if (Object.keys(errs).length > 0) { setFormErrors(errs); return; }

    const worker = workers.find((w) => w.id === form.workerId)!;
    addTrip({
      workerId: worker.id,
      workerName: worker.name,
      workerPhone: worker.phone,
      date: form.date,
      vehicle: form.vehicle.trim(),
      status: "DRAFT",
      loads: loadRows.map((r) => ({
        eggTypeId: r.eggTypeId,
        eggTypeName: r.eggTypeName,
        qtyLoadedEggs: r.qtyTrays * 30,
        qtySoldEggs: 0,
        qtyReturnedEggs: 0,
      })),
    });

    toast.success("New trip created!", { description: `Worker: ${worker.name}` });
    setCreateOpen(false);
    setForm({ date: form.date, workerId: workers[0]?.id || "", vehicle: "" });
    setLoadRows([{ eggTypeId: eggTypes[0]?.id || "", eggTypeName: eggTypes[0]?.name || "", qtyTrays: 0 }]);
    setFormErrors({});
  };

  const handleApproveSettlement = (t: Trip) => {
    updateTripStatus(t.id, "CLOSED");
    toast.success("Trip Closed & Settled!", { description: "Inventory returned to godown, ledger locked." });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-brand-dark tracking-tight">
            Delivery Trips & Settlements
          </h1>
          <p className="text-xs text-brand-muted">
            Audit vehicle loads, reconciliation, dispatch delivery vans and approve closing hisaab
          </p>
        </div>
        <Button variant="primary" onClick={() => setCreateOpen(true)} className="font-bold text-xs h-10 shadow-sm">
          <Plus className="h-4 w-4 mr-1.5" />
          <span>+ New Trip Banayein</span>
        </Button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-brand-muted" />
          <Input
            placeholder="Search by Trip #, Worker, or Vehicle..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-10 rounded-xl"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto scrollbar-none bg-brand-cream/60 p-1 rounded-xl border border-border shrink-0">
          {(["ALL", "OUT", "DRAFT", "SETTLEMENT", "CLOSED"] as const).map((mode) => {
            const count = mode === "ALL" ? trips.length : trips.filter((t) => t.status === mode).length;
            return (
              <button
                key={mode}
                onClick={() => setStatusFilter(mode)}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all whitespace-nowrap ${
                  statusFilter === mode
                    ? "bg-brand-teal text-white shadow-xs"
                    : "text-brand-muted hover:text-brand-dark hover:bg-white"
                }`}
              >
                {mode === "ALL" ? "All Trips" : mode === "OUT" ? "Live (Out)" : mode} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Trip Cards */}
      <div className="space-y-4">
        {filteredTrips.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-border">
            <Truck className="h-10 w-10 text-brand-muted mx-auto mb-2 opacity-40" />
            <p className="text-sm font-bold text-brand-dark">Koi trip nahi mili</p>
            <p className="text-xs text-brand-muted mt-0.5">Filter change karein ya naya trip banayein.</p>
          </div>
        ) : (
          filteredTrips.map((t) => {
            const totalLoaded = t.loads.reduce((acc, l) => acc + l.qtyLoadedEggs, 0);
            const totalSold = t.loads.reduce((acc, l) => acc + l.qtySoldEggs, 0);
            const isExpanded = expandedId === t.id;
            const stepIdx = STATUS_STEPS.indexOf(t.status);

            return (
              <Card key={t.id} className="bg-white border border-border overflow-hidden shadow-xs hover:border-brand-ocean/40 transition-all">
                {/* Trip Header */}
                <button
                  className="w-full text-left p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-brand-cream/30 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? "" : t.id)}
                >
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="h-11 w-11 rounded-2xl bg-brand-ice/50 flex items-center justify-center text-brand-teal shrink-0">
                      <Truck className="h-5 w-5" />
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-brand-dark text-sm sm:text-base">Trip #{t.tripNo}</span>
                        <Badge variant={statusColor[t.status] as "outline" | "mint" | "warning" | "secondary"} className="text-[11px] font-bold">
                          {t.status === "OUT" ? "Live / On Road" : t.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-brand-muted mt-0.5">
                        {t.workerName} · {t.vehicle} · {t.date}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="hidden sm:block text-right">
                      <p className="text-[11px] text-brand-muted">Expected Cash</p>
                      <p className="font-black text-brand-dark text-sm tabular-nums">{formatINR(t.expectedCash)}</p>
                    </div>
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-brand-muted" /> : <ChevronDown className="h-4 w-4 text-brand-muted" />}
                  </div>
                </button>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t border-border px-4 sm:px-5 py-5 space-y-5">
                    {/* Status Stepper */}
                    <div className="flex items-center gap-0 overflow-x-auto scrollbar-none pb-1">
                      {STATUS_STEPS.map((s, i) => (
                        <React.Fragment key={s}>
                          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap shrink-0 ${
                            i <= stepIdx
                              ? "bg-brand-teal text-white"
                              : "bg-brand-cream text-brand-muted border border-border"
                          }`}>
                            {i < stepIdx && <CheckCircle2 className="h-3 w-3" />}
                            {s}
                          </div>
                          {i < STATUS_STEPS.length - 1 && (
                            <div className={`h-0.5 flex-1 min-w-[16px] mx-1 ${i < stepIdx ? "bg-brand-teal" : "bg-border"}`} />
                          )}
                        </React.Fragment>
                      ))}
                    </div>

                    {/* Financials & Stock Highlights */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                      <div className="rounded-xl bg-brand-cream p-4 border border-border">
                        <span className="text-xs font-semibold text-brand-muted uppercase">Expected Cash</span>
                        <p className="text-xl font-black text-[#184d28] mt-1 tabular-nums">{formatINR(t.expectedCash)}</p>
                        {t.declaredCash !== undefined && (
                          <p className={`text-xs mt-1 font-bold ${t.declaredCash === t.expectedCash ? "text-[#184d28]" : "text-red-500"}`}>
                            Declared: {formatINR(t.declaredCash)}
                          </p>
                        )}
                      </div>
                      <div className="rounded-xl bg-brand-cream p-4 border border-border">
                        <span className="text-xs font-semibold text-brand-muted uppercase">Online UPI</span>
                        <p className="text-xl font-black text-brand-teal mt-1 tabular-nums">{formatINR(t.expectedOnline)}</p>
                        {t.declaredOnline !== undefined && (
                          <p className="text-xs mt-1 text-brand-muted">Declared: {formatINR(t.declaredOnline)}</p>
                        )}
                      </div>
                      <div className="rounded-xl bg-brand-ice/20 p-4 border border-brand-ocean/30">
                        <span className="text-xs font-semibold text-brand-teal uppercase">Stock Movement</span>
                        <p className="text-xl font-black text-brand-dark mt-1 tabular-nums">
                          {formatEggsAndTrays(totalSold).formatted} Sold
                        </p>
                        <p className="text-xs text-brand-muted">Loaded: {formatEggsAndTrays(totalLoaded).formatted}</p>
                      </div>
                    </div>

                    {/* Load Breakdown Table */}
                    <div className="overflow-hidden rounded-xl border border-border">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-brand-cream text-brand-muted uppercase font-bold border-b border-border">
                          <tr>
                            <th className="p-3">Egg Variety</th>
                            <th className="p-3">Loaded</th>
                            <th className="p-3">Sold</th>
                            <th className="p-3">Left</th>
                            <th className="p-3">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {t.loads.map((l, i) => {
                            const left = l.qtyLoadedEggs - l.qtySoldEggs;
                            return (
                              <tr key={i} className="hover:bg-brand-ice/10">
                                <td className="p-3 font-bold text-brand-dark">{l.eggTypeName}</td>
                                <td className="p-3 tabular-nums">{formatEggsAndTrays(l.qtyLoadedEggs).formatted}</td>
                                <td className="p-3 font-bold text-[#184d28] tabular-nums">{formatEggsAndTrays(l.qtySoldEggs).formatted}</td>
                                <td className="p-3 font-black text-brand-teal tabular-nums">{formatEggsAndTrays(left).formatted}</td>
                                <td className="p-3">
                                  <span className="flex items-center gap-1 font-bold text-[#184d28]">
                                    <CheckCircle2 className="h-3.5 w-3.5" />Balanced
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Action Bar: Dispatch / Settle / Close */}
                    <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-border">
                      <p className="text-xs text-brand-muted">
                        <strong>{bills.filter((b) => b.tripId === t.id).length} bills</strong> generated on this trip
                      </p>

                      <div className="flex items-center gap-2">
                        {t.status === "DRAFT" && (
                          <Button
                            size="sm"
                            variant="mint"
                            onClick={() => handleDispatchTrip(t.id)}
                            className="font-bold text-xs h-9 px-4"
                          >
                            <SendHorizontal className="h-3.5 w-3.5 mr-1.5" />
                            Dispatch Vehicle (Mark OUT)
                          </Button>
                        )}

                        {t.status === "OUT" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSendToSettlement(t.id)}
                            className="font-bold text-xs h-9 px-3 border-amber-300 text-amber-700 hover:bg-amber-50"
                          >
                            Move to Settlement
                          </Button>
                        )}

                        {t.status === "SETTLEMENT" && (
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => handleApproveSettlement(t)}
                            className="font-bold text-xs h-9 px-4"
                          >
                            <ShieldCheck className="h-4 w-4 mr-1.5" />
                            Approve Closing Hisaab & Close
                          </Button>
                        )}

                        {t.status === "CLOSED" && (
                          <span className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                            Trip Settled & Closed
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>

      {/* Create Trip Drawer */}
      <Drawer
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create New Trip"
        subtitle="Assign worker, vehicle and load quantities for today's delivery"
        footer={
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setCreateOpen(false)} className="flex-1 font-bold text-sm">
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreate} className="flex-1 font-bold text-sm">
              Create Trip
            </Button>
          </div>
        }
      >
        <FormField label="Date" required>
          <div className="relative">
            <Calendar className="absolute left-3 top-3 h-4 w-4 text-brand-muted" />
            <Input
              value={form.date}
              onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
              className="pl-9"
            />
          </div>
        </FormField>

        <FormField label="Delivery Worker" required error={formErrors.worker}>
          <div className="space-y-2">
            {workers.filter((w) => w.isActive && !w.isDeleted).map((w) => (
              <button
                key={w.id}
                onClick={() => setForm((prev) => ({ ...prev, workerId: w.id }))}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all text-sm ${
                  form.workerId === w.id
                    ? "border-brand-teal bg-brand-ice/30 ring-1 ring-brand-teal"
                    : "border-border hover:bg-brand-cream bg-white"
                }`}
              >
                <div className="h-8 w-8 rounded-lg bg-brand-ice/60 flex items-center justify-center text-brand-teal font-black text-sm shrink-0">
                  <User className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-bold text-brand-dark">{w.name}</p>
                  <p className="text-[11px] text-brand-muted">{w.phone}</p>
                </div>
              </button>
            ))}
          </div>
        </FormField>

        <FormField label="Vehicle" required error={formErrors.vehicle} hint="e.g. Piaggio Ape MH-12-AB-1234">
          <div className="relative">
            <Car className="absolute left-3 top-3 h-4 w-4 text-brand-muted" />
            <Input
              placeholder="Vehicle number / type"
              value={form.vehicle}
              onChange={(e) => setForm((prev) => ({ ...prev, vehicle: e.target.value }))}
              className="pl-9"
            />
          </div>
        </FormField>

        <FormField label="Egg Load" required error={formErrors.loads}>
          <div className="space-y-3">
            {loadRows.map((row, idx) => (
              <div key={idx} className="flex gap-2 items-center">
                <select
                  value={row.eggTypeId}
                  onChange={(e) => updateLoadRow(idx, "eggTypeId", e.target.value)}
                  className="flex-1 h-10 rounded-xl border border-border bg-white px-3 text-xs font-semibold text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-teal"
                >
                  {eggTypes.map((et) => (
                    <option key={et.id} value={et.id}>
                      {et.name} ({et.currentStockTrays} trays in godown)
                    </option>
                  ))}
                </select>
                <Input
                  type="number"
                  min={0}
                  value={row.qtyTrays || ""}
                  onChange={(e) => updateLoadRow(idx, "qtyTrays", parseInt(e.target.value) || 0)}
                  placeholder="Trays"
                  className="w-24 text-center"
                />
                <span className="text-xs text-brand-muted shrink-0">trays</span>
                {loadRows.length > 1 && (
                  <button
                    onClick={() => removeLoadRow(idx)}
                    className="text-red-400 hover:text-red-600 text-xs font-bold px-1"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}

            {/* Stock warning */}
            {loadRows.map((row) => {
              const et = eggTypes.find((e) => e.id === row.eggTypeId);
              if (et && row.qtyTrays > et.currentStockTrays) {
                return (
                  <p key={row.eggTypeId} className="text-xs text-red-500 font-semibold">
                    ⚠️ {et.name}: Sirf {et.currentStockTrays} trays stock mein hain, {row.qtyTrays} maang rahe ho
                  </p>
                );
              }
              return null;
            })}

            {loadRows.length < eggTypes.length && (
              <button
                onClick={addLoadRow}
                className="text-xs font-bold text-brand-teal hover:text-brand-dark flex items-center gap-1 mt-1"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Another Egg Type
              </button>
            )}
          </div>
        </FormField>

        {/* Summary */}
        {selectedWorker && form.vehicle && (
          <div className="rounded-xl bg-brand-cream border border-border p-4 space-y-1 text-xs">
            <p className="font-bold text-brand-dark">Trip Summary</p>
            <p className="text-brand-muted">Worker: <span className="text-brand-dark font-semibold">{selectedWorker.name}</span></p>
            <p className="text-brand-muted">Vehicle: <span className="text-brand-dark font-semibold">{form.vehicle}</span></p>
            <p className="text-brand-muted">Total Load: <span className="text-brand-teal font-bold">
              {loadRows.reduce((s, r) => s + r.qtyTrays, 0)} trays ({loadRows.reduce((s, r) => s + r.qtyTrays * 30, 0)} eggs)
            </span></p>
          </div>
        )}
      </Drawer>
    </div>
  );
}
