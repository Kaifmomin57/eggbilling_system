"use client";

import React, { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { formatINR } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Truck,
  Package,
  PackageCheck,
  PackageX,
  Layers,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Receipt,
  Banknote,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  Clock,
  Info,
} from "lucide-react";
import { Trip } from "@/lib/mock-data";

/* ─────────── Status helpers ─────────── */
function StatusBadge({ status }: { status: Trip["status"] }) {
  const map: Record<Trip["status"], { label: string; variant: "mint" | "warning" | "secondary" | "outline" }> = {
    OUT:        { label: "Out / Chalu",      variant: "mint" },
    DRAFT:      { label: "Draft / Tayaar",   variant: "warning" },
    SETTLEMENT: { label: "Settlement",       variant: "secondary" },
    CLOSED:     { label: "Closed / Band",    variant: "outline" },
  };
  const { label, variant } = map[status] ?? { label: status, variant: "outline" };
  return <Badge variant={variant}>{label}</Badge>;
}

function StatusIcon({ status }: { status: Trip["status"] }) {
  if (status === "OUT")        return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
  if (status === "DRAFT")      return <Clock className="h-5 w-5 text-amber-500" />;
  if (status === "SETTLEMENT") return <AlertCircle className="h-5 w-5 text-blue-500" />;
  return <Package className="h-5 w-5 text-brand-muted" />;
}

/* ─────────── TripCard ─────────── */
function TripCard({ trip, bills }: { trip: Trip; bills: ReturnType<typeof useStore>["bills"] }) {
  const [expanded, setExpanded] = useState(false);

  const tripBills = bills.filter((b) => b.tripId === trip.id);

  /* Totals */
  const totalLoadedEggs  = trip.loads.reduce((s, l) => s + l.qtyLoadedEggs, 0);
  const totalSoldEggs    = trip.loads.reduce((s, l) => s + l.qtySoldEggs, 0);
  const totalReturnedEggs = trip.loads.reduce((s, l) => s + l.qtyReturnedEggs, 0);
  const totalLeftEggs    = Math.max(0, totalLoadedEggs - totalSoldEggs - totalReturnedEggs);

  const totalLoadedTrays  = Math.floor(totalLoadedEggs / 30);
  const totalSoldTrays    = Math.floor(totalSoldEggs / 30);
  const totalReturnedTrays = Math.floor(totalReturnedEggs / 30);
  const totalLeftTrays    = Math.floor(totalLeftEggs / 30);

  const totalCash   = tripBills.reduce((s, b) => s + b.paidCash, 0);
  const totalOnline = tripBills.reduce((s, b) => s + b.paidOnline, 0);
  const totalDue    = tripBills.reduce((s, b) => s + b.dueAmount, 0);
  const totalSale   = tripBills.reduce((s, b) => s + b.totalAmount, 0);

  /* Trays given & returned across all bills */
  const traysGivenTotal    = tripBills.reduce((s, b) => s + (b.traysGiven ?? 0), 0);
  const traysReturnedTotal = tripBills.reduce((s, b) => s + (b.traysReturned ?? 0), 0);

  const percentSold = totalLoadedEggs > 0
    ? Math.min(100, Math.round((totalSoldEggs / totalLoadedEggs) * 100))
    : 0;

  return (
    <Card className={`overflow-hidden border-2 transition-all ${
      trip.status === "OUT"        ? "border-emerald-200 bg-emerald-50/30" :
      trip.status === "DRAFT"      ? "border-amber-200 bg-amber-50/30" :
      trip.status === "SETTLEMENT" ? "border-blue-200 bg-blue-50/30" :
                                     "border-border bg-white"
    }`}>
      {/* ── Header ── */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer"
        onClick={() => setExpanded((p) => !p)}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-border shadow-xs">
            <StatusIcon status={trip.status} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-black text-sm text-brand-dark">
                Trip #{trip.tripNo}
              </span>
              <StatusBadge status={trip.status} />
            </div>
            <span className="text-[11px] text-brand-muted">
              {new Date(trip.date).toLocaleDateString("hi-IN", {
                day: "2-digit", month: "short", year: "numeric",
              })} · {trip.vehicle || "Vehicle N/A"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-sm text-brand-teal tabular-nums">
            {formatINR(totalSale)}
          </span>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-brand-muted" />
          ) : (
            <ChevronDown className="h-4 w-4 text-brand-muted" />
          )}
        </div>
      </div>

      {/* ── Summary Pills (always visible) ── */}
      <div className="px-4 pb-3 flex flex-wrap gap-2 border-b border-border">
        {/* Loaded */}
        <div className="flex items-center gap-1.5 bg-white rounded-lg px-2.5 py-1.5 border border-border text-xs font-semibold text-brand-dark shadow-xs">
          <Layers className="h-3.5 w-3.5 text-brand-teal" />
          <span>Gaya: <strong>{totalLoadedTrays} tray</strong></span>
        </div>
        {/* Sold */}
        <div className="flex items-center gap-1.5 bg-white rounded-lg px-2.5 py-1.5 border border-border text-xs font-semibold text-brand-dark shadow-xs">
          <PackageCheck className="h-3.5 w-3.5 text-emerald-500" />
          <span>Bika: <strong>{totalSoldTrays} tray</strong></span>
        </div>
        {/* Returned (unsold) */}
        <div className="flex items-center gap-1.5 bg-white rounded-lg px-2.5 py-1.5 border border-border text-xs font-semibold text-brand-dark shadow-xs">
          <PackageX className="h-3.5 w-3.5 text-blue-500" />
          <span>Wapas: <strong>{totalReturnedTrays} tray</strong></span>
        </div>
        {/* Remaining (in truck) */}
        {totalLeftEggs > 0 && (
          <div className="flex items-center gap-1.5 bg-amber-50 rounded-lg px-2.5 py-1.5 border border-amber-200 text-xs font-semibold text-amber-700 shadow-xs">
            <Package className="h-3.5 w-3.5" />
            <span>Bacha: <strong>{totalLeftTrays} tray</strong></span>
          </div>
        )}
      </div>

      {/* ── Sell Progress Bar ── */}
      <div className="px-4 py-2.5 border-b border-border">
        <div className="flex justify-between text-[11px] font-semibold text-brand-muted mb-1">
          <span>Bikri Progress</span>
          <span className="text-brand-teal font-black">{percentSold}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-brand-ice/60 overflow-hidden">
          <div
            className="h-2 rounded-full bg-brand-teal transition-all"
            style={{ width: `${percentSold}%` }}
          />
        </div>
      </div>

      {/* ── Expanded Detail ── */}
      {expanded && (
        <div className="p-4 space-y-4">

          {/* Per Egg Type Breakdown */}
          {trip.loads.length > 0 && (
            <div>
              <p className="text-[11px] font-black text-brand-muted uppercase tracking-wider mb-2">
                📦 Egg Type-wise Breakdown
              </p>
              <div className="space-y-2">
                {trip.loads.map((load) => {
                  const loadedT  = Math.floor(load.qtyLoadedEggs / 30);
                  const soldT    = Math.floor(load.qtySoldEggs / 30);
                  const returnT  = Math.floor(load.qtyReturnedEggs / 30);
                  const leftT    = Math.max(0, Math.floor((load.qtyLoadedEggs - load.qtySoldEggs - load.qtyReturnedEggs) / 30));
                  const pct      = load.qtyLoadedEggs > 0
                    ? Math.round((load.qtySoldEggs / load.qtyLoadedEggs) * 100) : 0;

                  return (
                    <div
                      key={load.eggTypeId}
                      className="bg-white rounded-xl border border-border p-3 shadow-xs"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-black text-brand-dark">
                          {load.eggTypeName}
                        </span>
                        <span className="text-[11px] font-bold text-brand-teal">{pct}% bika</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                        <div className="bg-brand-ice/40 rounded-lg p-1.5">
                          <p className="text-[10px] text-brand-muted font-medium">Gaya</p>
                          <p className="text-sm font-black text-brand-dark">{loadedT}</p>
                          <p className="text-[9px] text-brand-muted">tray</p>
                        </div>
                        <div className="bg-emerald-50 rounded-lg p-1.5">
                          <p className="text-[10px] text-emerald-600 font-medium">Bika</p>
                          <p className="text-sm font-black text-emerald-700">{soldT}</p>
                          <p className="text-[9px] text-emerald-600">tray</p>
                        </div>
                        <div className="bg-blue-50 rounded-lg p-1.5">
                          <p className="text-[10px] text-blue-600 font-medium">Wapas</p>
                          <p className="text-sm font-black text-blue-700">{returnT}</p>
                          <p className="text-[9px] text-blue-600">tray</p>
                        </div>
                        <div className={`rounded-lg p-1.5 ${leftT > 0 ? "bg-amber-50" : "bg-brand-ice/20"}`}>
                          <p className={`text-[10px] font-medium ${leftT > 0 ? "text-amber-600" : "text-brand-muted"}`}>Bacha</p>
                          <p className={`text-sm font-black ${leftT > 0 ? "text-amber-700" : "text-brand-dark"}`}>{leftT}</p>
                          <p className={`text-[9px] ${leftT > 0 ? "text-amber-600" : "text-brand-muted"}`}>tray</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tray Hisaab (physical trays given/returned) */}
          <div>
            <p className="text-[11px] font-black text-brand-muted uppercase tracking-wider mb-2">
              🗂️ Tray Hisaab (Dabbe)
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white rounded-xl border border-border p-3 text-center shadow-xs">
                <RotateCcw className="h-4 w-4 text-amber-500 mx-auto mb-1" />
                <p className="text-[10px] text-brand-muted font-medium">Grahak Ko Diye</p>
                <p className="text-xl font-black text-brand-dark">{traysGivenTotal}</p>
                <p className="text-[10px] text-brand-muted">tray</p>
              </div>
              <div className="bg-white rounded-xl border border-border p-3 text-center shadow-xs">
                <RotateCcw className="h-4 w-4 text-emerald-500 mx-auto mb-1" />
                <p className="text-[10px] text-brand-muted font-medium">Grahak Se Liye</p>
                <p className="text-xl font-black text-brand-dark">{traysReturnedTotal}</p>
                <p className="text-[10px] text-brand-muted">tray</p>
              </div>
            </div>
          </div>

          {/* Payment Breakdown */}
          <div>
            <p className="text-[11px] font-black text-brand-muted uppercase tracking-wider mb-2">
              💰 Payment Breakdown
            </p>
            <div className="bg-white rounded-xl border border-border p-3 space-y-2 shadow-xs">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1.5 text-brand-muted font-medium">
                  <Banknote className="h-4 w-4 text-emerald-500" />
                  <span>Cash Mila</span>
                </div>
                <span className="font-black text-brand-dark tabular-nums">{formatINR(totalCash)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1.5 text-brand-muted font-medium">
                  <CreditCard className="h-4 w-4 text-blue-500" />
                  <span>Online Mila</span>
                </div>
                <span className="font-black text-brand-dark tabular-nums">{formatINR(totalOnline)}</span>
              </div>
              {totalDue > 0 && (
                <div className="flex items-center justify-between text-sm border-t border-dashed border-border pt-2">
                  <div className="flex items-center gap-1.5 text-brand-danger font-medium">
                    <AlertCircle className="h-4 w-4" />
                    <span>Baaki (Due)</span>
                  </div>
                  <span className="font-black text-brand-danger tabular-nums">{formatINR(totalDue)}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm border-t border-border pt-2">
                <span className="font-bold text-brand-dark">Kul Bikri</span>
                <span className="font-black text-brand-teal text-base tabular-nums">{formatINR(totalSale)}</span>
              </div>
            </div>
          </div>

          {/* Bill list */}
          {tripBills.length > 0 && (
            <div>
              <p className="text-[11px] font-black text-brand-muted uppercase tracking-wider mb-2">
                🧾 Bills ({tripBills.length})
              </p>
              <div className="space-y-1.5">
                {tripBills.map((bill) => (
                  <div
                    key={bill.id}
                    className="flex items-center justify-between bg-white rounded-xl border border-border px-3 py-2.5 shadow-xs"
                  >
                    <div>
                      <p className="text-xs font-bold text-brand-dark">{bill.customerName}</p>
                      <p className="text-[10px] text-brand-muted">
                        #{bill.billNo} · {bill.createdAt}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black text-brand-teal tabular-nums">
                        {formatINR(bill.totalAmount)}
                      </p>
                      <p className={`text-[10px] font-semibold ${bill.dueAmount > 0 ? "text-brand-danger" : "text-emerald-600"}`}>
                        {bill.dueAmount > 0 ? `Due: ${formatINR(bill.dueAmount)}` : "✓ Cleared"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tripBills.length === 0 && (
            <div className="text-center py-4 bg-brand-cream/60 rounded-xl border border-dashed border-brand-ocean/30">
              <Receipt className="h-6 w-6 text-brand-muted mx-auto mb-1" />
              <p className="text-xs text-brand-muted font-semibold">Is trip mein koi bill nahi</p>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

/* ─────────── Main Page ─────────── */
export function WorkerTrips() {
  const { trips, bills, currentUser, activeRole } = useStore();

  const isAdmin = activeRole === "ADMIN" || currentUser?.role === "ADMIN";

  /* Admin → saari trips; Worker → sirf apni trips */
  const myTrips = useMemo(() => {
    if (!currentUser) return [];
    const filtered = isAdmin
      ? trips                                          // Admin: show all
      : trips.filter(
          (t) =>
            t.workerId === currentUser.id ||
            t.workerPhone === currentUser.phone
        );
    return filtered.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [trips, currentUser, isAdmin]);

  /* Summary stats across shown trips */
  const allMyBills = useMemo(
    () => bills.filter((b) => myTrips.some((t) => t.id === b.tripId)),
    [bills, myTrips]
  );

  const totalEarned = allMyBills.reduce((s, b) => s + b.totalAmount, 0);
  const totalBills  = allMyBills.length;
  const activeTrip  = myTrips.find((t) => ["OUT", "DRAFT", "SETTLEMENT"].includes(t.status));

  const pageTitle = isAdmin ? "Saari Trips" : "Meri Trips";
  const emptyMsg  = isAdmin
    ? "Koi bhi trip abhi tak create nahi hui hai."
    : "Admin se trip assign karwao, phir yahan dikhega.";

  return (
    <div className="w-full space-y-5 pb-28 md:pb-10 pt-1">
      {/* Page Header */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-brand-dark">{pageTitle}</h1>
          <p className="text-xs sm:text-sm text-brand-muted font-medium">
            {myTrips.length} trip{myTrips.length !== 1 ? "s" : ""} · {totalBills} bills
          </p>
        </div>
        {activeTrip && (
          <Badge variant="mint" className="text-xs font-bold py-1 px-3">
            🚛 Active Trip
          </Badge>
        )}
      </div>

      {/* Summary Card */}
      {myTrips.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-white rounded-2xl border border-border p-3 sm:p-4 text-center shadow-xs">
            <Truck className="h-4 w-4 sm:h-5 sm:w-5 text-brand-teal mx-auto mb-1" />
            <p className="text-lg sm:text-2xl font-black text-brand-dark">{myTrips.length}</p>
            <p className="text-[10px] sm:text-xs text-brand-muted font-medium">Total Trips</p>
          </div>
          <div className="bg-white rounded-2xl border border-border p-3 sm:p-4 text-center shadow-xs">
            <Receipt className="h-4 w-4 sm:h-5 sm:w-5 text-brand-ocean mx-auto mb-1" />
            <p className="text-lg sm:text-2xl font-black text-brand-dark">{totalBills}</p>
            <p className="text-[10px] sm:text-xs text-brand-muted font-medium">Total Bills</p>
          </div>
          <div className="bg-white rounded-2xl border border-border p-3 sm:p-4 text-center shadow-xs">
            <Banknote className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500 mx-auto mb-1" />
            <p className="text-sm sm:text-xl font-black text-brand-dark tabular-nums">
              {formatINR(totalEarned)}
            </p>
            <p className="text-[10px] sm:text-xs text-brand-muted font-medium">Kul Bikri</p>
          </div>
        </div>
      )}

      {/* Trip List */}
      {myTrips.length === 0 ? (
        <div className="text-center py-16 px-6 bg-white rounded-3xl border border-dashed border-brand-ocean/30">
          <Truck className="h-12 w-12 text-brand-teal/30 mx-auto mb-3" />
          <p className="text-base font-bold text-brand-dark mb-1">
            {isAdmin ? "Koi Trip Nahi Mili" : "Koi Trip Assign Nahi Hui"}
          </p>
          <p className="text-xs sm:text-sm text-brand-muted max-w-sm mx-auto">{emptyMsg}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Info hint */}
          <div className="flex items-center gap-2 bg-brand-ice/40 px-3.5 py-2.5 rounded-xl border border-brand-ocean/20">
            <Info className="h-4 w-4 text-brand-teal shrink-0" />
            <p className="text-xs text-brand-teal font-semibold">
              Trip card pe click karke full detail dekho — tray, payment, bills sab.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myTrips.map((trip) => (
              <TripCard key={trip.id} trip={trip} bills={allMyBills} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
