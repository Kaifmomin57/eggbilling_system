"use client";

import React from "react";
import { useStore } from "@/lib/store";
import { useLanguage } from "@/lib/i18n";
import { formatINR, formatEggsAndTrays } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  PlusCircle,
  Truck,
  Banknote,
  CreditCard,
  AlertCircle,
  Receipt,
  TrendingUp,
  Clock,
  CheckCircle,
} from "lucide-react";

interface WorkerHomeProps {
  onStartNewBill: () => void;
  onViewAllBills: () => void;
}

export function WorkerHome({ onStartNewBill, onViewAllBills }: WorkerHomeProps) {
  const { trip, bills, confirmTripLoad, currentUser, setActiveRole } = useStore();
  const { t } = useLanguage();

  const isTripAssigned = Boolean(trip && trip.id);
  const workerDisplayName = currentUser?.name || (trip.workerName ? trip.workerName.split(" ")[0] : "Delivery Partner");

  // Aggregate today's stats for worker's active trip
  const tripBills = trip && trip.id ? bills.filter((b) => b.tripId === trip.id) : [];
  const totalSaleToday = tripBills.reduce((acc, b) => acc + b.totalAmount, 0);
  const totalCashToday = tripBills.reduce((acc, b) => acc + b.paidCash, 0);
  const totalOnlineToday = tripBills.reduce((acc, b) => acc + b.paidOnline, 0);
  const totalDueToday = tripBills.reduce((acc, b) => acc + b.dueAmount, 0);

  // Loaded vs Sold across all egg types in current trip
  const totalLoadedEggs = trip.loads.reduce((acc, l) => acc + l.qtyLoadedEggs, 0);
  const totalSoldFromLoads = trip.loads.reduce((acc, l) => acc + l.qtySoldEggs, 0);
  const totalSoldFromBills = tripBills.flatMap((b) => b.items || []).reduce((acc, it) => acc + (it.qtyEggs || 0), 0);
  const totalSoldEggs = Math.max(totalSoldFromLoads, totalSoldFromBills);
  const totalLeftEggs = Math.max(0, totalLoadedEggs - totalSoldEggs);

  const percentSold = totalLoadedEggs > 0 ? Math.min(100, Math.round((totalSoldEggs / totalLoadedEggs) * 100)) : 0;

  return (
    <div className="w-full space-y-5 pb-28 md:pb-10 pt-1">
      {/* Worker Greeting */}
      <div className="flex items-center justify-between px-1">
        <div>
          <span className="text-xs font-semibold text-brand-muted">
            Namaste, {workerDisplayName} 🙏
          </span>
          <h1 className="text-xl sm:text-2xl font-extrabold text-brand-dark">
            {t("todayTrip")}
          </h1>
        </div>
        {isTripAssigned ? (
          <Badge
            variant={
              trip.status === "OUT"
                ? "mint"
                : trip.status === "DRAFT"
                ? "warning"
                : "secondary"
            }
          >
            {trip.status === "OUT"
              ? t("statusOut")
              : trip.status === "DRAFT"
              ? t("statusDraft")
              : t("statusSettlement")}
          </Badge>
        ) : (
          <Badge variant="outline" className="text-brand-muted text-xs">
            No Trip Assigned
          </Badge>
        )}
      </div>

      {/* Main Trip Card */}
      {isTripAssigned ? (
        <Card className="overflow-hidden border-2 border-brand-ocean/30 bg-white p-4 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-brand-ice/50 text-brand-teal">
                <Truck className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div>
                <p className="text-sm sm:text-base font-extrabold text-brand-dark">{trip.vehicle}</p>
                <p className="text-xs text-brand-muted">Trip #{trip.tripNo}</p>
              </div>
            </div>
            {trip.status === "DRAFT" && (
              <Button
                size="sm"
                variant="mint"
                onClick={confirmTripLoad}
                className="text-xs font-bold h-9 px-4"
              >
                <CheckCircle className="h-3.5 w-3.5 mr-1" />
                <span>{t("confirmLoad")}</span>
              </Button>
            )}
          </div>

          {/* Progress: Loaded vs Sold vs Left */}
          <div className="pt-4 space-y-3">
            <div className="flex justify-between items-end">
              <div>
                <span className="text-xs text-brand-muted font-medium">Bikri Progress:</span>
                <p className="text-sm sm:text-base font-bold text-brand-dark">
                  {percentSold}% eggs sold today
                </p>
              </div>
              <span className="text-xs sm:text-sm font-bold text-brand-teal tabular-nums">
                {formatEggsAndTrays(totalSoldEggs).formatted} / {formatEggsAndTrays(totalLoadedEggs).formatted}
              </span>
            </div>

            <div className="h-3.5 w-full overflow-hidden rounded-full bg-brand-ice/40 p-0.5 border border-brand-ocean/20">
              <div
                className="h-full rounded-full bg-brand-teal transition-all duration-500"
                style={{ width: `${percentSold}%` }}
              />
            </div>

            {/* Quick breakdown badges */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-center">
              <div className="rounded-xl bg-brand-cream p-2.5 border border-border">
                <span className="text-[10px] text-brand-muted uppercase font-bold">Sold (Bika)</span>
                <p className="text-sm sm:text-base font-extrabold text-brand-dark tabular-nums">
                  {formatEggsAndTrays(totalSoldEggs).formatted}
                </p>
              </div>
              <div className="rounded-xl bg-brand-ice/30 p-2.5 border border-brand-ocean/20">
                <span className="text-[10px] text-brand-teal uppercase font-bold">Left (Gaadi me)</span>
                <p className="text-sm sm:text-base font-extrabold text-brand-teal tabular-nums">
                  {formatEggsAndTrays(totalLeftEggs).formatted}
                </p>
              </div>
              <div className="hidden sm:block rounded-xl bg-white p-2.5 border border-border">
                <span className="text-[10px] text-brand-muted uppercase font-bold">Total Loaded</span>
                <p className="text-sm sm:text-base font-extrabold text-brand-dark tabular-nums">
                  {formatEggsAndTrays(totalLoadedEggs).formatted}
                </p>
              </div>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="border border-border bg-white p-6 sm:p-8 text-center space-y-3 shadow-xs">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-ice/40 text-brand-teal">
            <Truck className="h-7 w-7" />
          </div>
          <div>
            <h3 className="font-extrabold text-brand-dark text-base">
              Koi Delivery Trip Assign Nahi Hai
            </h3>
            <p className="text-xs sm:text-sm text-brand-muted mt-1 max-w-md mx-auto leading-relaxed">
              Abhi godown se koi delivery gaadi load nahi hui hai. Admin jab gaadi load karke trip dispatch karega, tab yahan stock aur billing available hoga.
            </p>
          </div>
          {currentUser?.role === "ADMIN" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setActiveRole("ADMIN")}
              className="text-xs font-bold mt-2"
            >
              Go to Admin Dashboard
            </Button>
          )}
        </Card>
      )}

      {/* Primary Big Call To Action: + New Bill */}
      <Button
        onClick={onStartNewBill}
        disabled={!isTripAssigned || trip.status !== "OUT" || totalLeftEggs <= 0}
        className="h-14 w-full rounded-2xl bg-brand-teal text-white text-base sm:text-lg font-black shadow-md hover:bg-[#2c676d] active:scale-98 transition-all flex items-center justify-center gap-2 min-h-[52px] disabled:opacity-40"
      >
        <PlusCircle className="h-6 w-6 stroke-[2.5]" />
        <span>
          {isTripAssigned && trip.status === "OUT" && totalLeftEggs <= 0
            ? "Gaadi Ka Stock Khatam"
            : t("newBill")}
        </span>
      </Button>

      {/* 4 Quick Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Sale */}
        <div className="rounded-2xl border border-border bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-brand-muted mb-1">
            <span className="text-xs font-semibold">{t("todaySale")}</span>
            <TrendingUp className="h-4 w-4 text-brand-teal" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-brand-dark tabular-nums">
            {formatINR(totalSaleToday)}
          </p>
          <span className="text-[10px] text-brand-muted font-medium">
            {tripBills.length} bills cut
          </span>
        </div>

        {/* Cash Collected */}
        <div className="rounded-2xl border border-border bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-brand-muted mb-1">
            <span className="text-xs font-semibold">{t("cashCollected")}</span>
            <Banknote className="h-4 w-4 text-[#184d28]" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-[#184d28] tabular-nums">
            {formatINR(totalCashToday)}
          </p>
          <span className="text-[10px] text-brand-muted font-medium">
            In delivery bag
          </span>
        </div>

        {/* Online Collected */}
        <div className="rounded-2xl border border-border bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-brand-muted mb-1">
            <span className="text-xs font-semibold">{t("onlineCollected")}</span>
            <CreditCard className="h-4 w-4 text-brand-teal" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-brand-teal tabular-nums">
            {formatINR(totalOnlineToday)}
          </p>
          <span className="text-[10px] text-brand-muted font-medium">
            UPI confirmed
          </span>
        </div>

        {/* Udhaar / Due Given */}
        <div className="rounded-2xl border border-border bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-brand-muted mb-1">
            <span className="text-xs font-semibold">{t("dueGiven")}</span>
            <AlertCircle className="h-4 w-4 text-brand-danger" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-brand-danger tabular-nums">
            {formatINR(totalDueToday)}
          </p>
          <span className="text-[10px] text-brand-muted font-medium">
            Baaqi hisaab
          </span>
        </div>
      </div>

      {/* Recent Bills snippet */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm sm:text-base font-bold text-brand-dark flex items-center gap-1.5">
            <Receipt className="h-4 w-4 text-brand-teal" />
            <span>Aaj Ke Bills ({tripBills.length})</span>
          </h3>
          <button
            onClick={onViewAllBills}
            className="text-xs font-bold text-brand-teal hover:underline"
          >
            Sabhi Dekhein &rarr;
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {tripBills.slice(0, 6).map((bill) => (
            <div
              key={bill.id}
              className="flex items-center justify-between rounded-xl border border-border bg-white p-3.5 shadow-xs"
            >
              <div>
                <p className="text-sm font-bold text-brand-dark">
                  {bill.customerName}
                </p>
                <div className="flex items-center gap-2 text-xs text-brand-muted mt-0.5">
                  <span>{bill.billNo}</span>
                  <span>•</span>
                  <span className="flex items-center gap-0.5">
                    <Clock className="h-3 w-3" />
                    {bill.createdAt}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-black text-brand-dark tabular-nums">
                  {formatINR(bill.totalAmount)}
                </p>
                <Badge
                  variant={bill.dueAmount > 0 ? "warning" : "mint"}
                  className="text-[10px] px-1.5 py-0 mt-0.5"
                >
                  {bill.dueAmount > 0 ? `Baaqi ₹${bill.dueAmount}` : "Full Paid"}
                </Badge>
              </div>
            </div>
          ))}
          {tripBills.length === 0 && (
            <div className="col-span-full text-center py-6 bg-white rounded-xl border border-dashed border-border text-xs text-brand-muted">
              Aaj abhi tak koi bill create nahi hua hai.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
