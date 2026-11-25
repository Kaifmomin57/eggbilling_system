"use client";

import React, { useState } from "react";
import { useStore } from "@/lib/store";
import { useLanguage } from "@/lib/i18n";
import { formatINR } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  Banknote,
  CreditCard,
  AlertCircle,
  Truck,
  ArrowUpRight,
  UserCheck,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export function AdminDashboard() {
  const { trip, bills, customers, eggTypes, damages, collectCustomerPayment } = useStore();
  const { t } = useLanguage();

  const [collectingCustId, setCollectingCustId] = useState<string | null>(null);
  const [collectAmount, setCollectAmount] = useState<number>(1000);

  // Dynamic calculations from actual DB store
  const totalSales = bills.reduce((acc, b) => acc + b.totalAmount, 0);
  const totalCash = bills.reduce((acc, b) => acc + b.paidCash, 0);
  const totalOnline = bills.reduce((acc, b) => acc + b.paidOnline, 0);
  const totalDue = customers.reduce((acc, c) => acc + c.dueAmount, 0);

  const totalDamageLoss = damages
    .filter((d) => d.status === "APPROVED")
    .reduce((acc, d) => acc + d.lossAmount, 0);

  const estimatedProfit = Math.round(totalSales * 0.16) - Math.round(totalDamageLoss);
  const totalGodownTrays = eggTypes.reduce((acc, et) => acc + et.currentStockTrays, 0);

  // Dynamic 7-day trend from real bills
  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const today = new Date();
  const weeklyTrendData = Array.from({ length: 7 }).map((_, idx) => {
    const d = new Date();
    d.setDate(today.getDate() - (6 - idx));
    const dayName = idx === 6 ? "Today" : daysOfWeek[d.getDay()];
    const dateStr = d.toISOString().split("T")[0];
    const dayBills = bills.filter((b) => b.createdAt && b.createdAt.startsWith(dateStr));
    const sales = dayBills.reduce((s, b) => s + b.totalAmount, 0);
    const cash = dayBills.reduce((s, b) => s + b.paidCash, 0);
    const online = dayBills.reduce((s, b) => s + b.paidOnline, 0);
    return { day: dayName, sales, cash, online };
  });

  const handleCollect = (e: React.FormEvent) => {
    e.preventDefault();
    if (collectingCustId) {
      collectCustomerPayment(collectingCustId, collectAmount);
      setCollectingCustId(null);
    }
  };

  const isTripActive = Boolean(trip && trip.id && trip.status === "OUT");

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-brand-dark tracking-tight">
            Admin {t("dashboard")}
          </h1>
          <p className="text-xs text-brand-muted">
            Daily Live Operations, Cash Flows, Stock & Profit Overview
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="mint" className="py-1 px-3 text-xs font-bold">
            Live Business Date: {new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
          </Badge>
        </div>
      </div>

      {/* Row 1: Core Financial Stat Cards (4) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Sale */}
        <Card className="p-3.5 sm:p-5 border-l-4 border-l-brand-teal bg-white shadow-xs">
          <div className="flex items-center justify-between text-brand-muted mb-1">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">{t("todaySale")}</span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-brand-ice/40 text-brand-teal">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
          </div>
          <p className="text-lg sm:text-2xl font-black text-brand-dark tabular-nums">
            {formatINR(totalSales)}
          </p>
          <p className="text-[10px] sm:text-[11px] text-brand-muted font-medium mt-1 flex items-center gap-0.5">
            <ArrowUpRight className="h-3 w-3 text-brand-teal" /> {bills.length} bills
          </p>
        </Card>

        {/* Cash Collected */}
        <Card className="p-3.5 sm:p-5 border-l-4 border-l-[#184d28] bg-white shadow-xs">
          <div className="flex items-center justify-between text-brand-muted mb-1">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">{t("cashCollected")}</span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-brand-mint/50 text-[#184d28]">
              <Banknote className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
          </div>
          <p className="text-lg sm:text-2xl font-black text-[#184d28] tabular-nums">
            {formatINR(totalCash)}
          </p>
          <p className="text-[10px] sm:text-[11px] text-brand-muted font-medium mt-1">
            Cash in hand
          </p>
        </Card>

        {/* Online Collected */}
        <Card className="p-3.5 sm:p-5 border-l-4 border-l-brand-ocean bg-white shadow-xs">
          <div className="flex items-center justify-between text-brand-muted mb-1">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">{t("onlineCollected")}</span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-brand-ice/50 text-brand-teal">
              <CreditCard className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
          </div>
          <p className="text-lg sm:text-2xl font-black text-brand-teal tabular-nums">
            {formatINR(totalOnline)}
          </p>
          <p className="text-[10px] sm:text-[11px] text-brand-muted font-medium mt-1">
            UPI / Bank
          </p>
        </Card>

        {/* Total Due (Udhaar) */}
        <Card className="p-3.5 sm:p-5 border-l-4 border-l-brand-danger bg-white shadow-xs">
          <div className="flex items-center justify-between text-brand-muted mb-1">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">Market Due</span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-brand-danger/10 text-brand-danger">
              <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
          </div>
          <p className="text-lg sm:text-2xl font-black text-brand-danger tabular-nums">
            {formatINR(totalDue)}
          </p>
          <p className="text-[10px] sm:text-[11px] text-brand-muted font-medium mt-1">
            {customers.length} accounts
          </p>
        </Card>
      </div>

      {/* Row 2: Secondary KPI Cards (Profit, Damage, Stock, Trips) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Net Profit */}
        <Card className="p-3.5 sm:p-4 bg-white border border-border shadow-xs">
          <span className="text-[11px] sm:text-xs font-semibold text-brand-muted">{t("profitLoss")}</span>
          <p className="text-lg sm:text-xl font-black text-[#184d28] mt-1 tabular-nums">
            {estimatedProfit >= 0 ? `+${formatINR(estimatedProfit)}` : `-${formatINR(Math.abs(estimatedProfit))}`}
          </p>
          <span className="text-[10px] text-brand-muted truncate block">
            {totalSales > 0 ? `Margin ~${((estimatedProfit / totalSales) * 100).toFixed(1)}%` : "Live margin"}
          </span>
        </Card>

        {/* Damage Loss */}
        <Card className="p-3.5 sm:p-4 bg-white border border-border shadow-xs">
          <span className="text-[11px] sm:text-xs font-semibold text-brand-muted">{t("damageLoss")}</span>
          <p className="text-lg sm:text-xl font-black text-brand-danger mt-1 tabular-nums">
            -{formatINR(totalDamageLoss)}
          </p>
          <span className="text-[10px] text-brand-muted truncate block">
            {damages.filter((d) => d.status === "APPROVED").length} recorded cracks
          </span>
        </Card>

        {/* Stock Left in Godown */}
        <Card className="p-3.5 sm:p-4 bg-white border border-border shadow-xs">
          <span className="text-[11px] sm:text-xs font-semibold text-brand-muted">{t("stockLeft")}</span>
          <p className="text-lg sm:text-xl font-black text-brand-dark mt-1 tabular-nums">
            {totalGodownTrays} Trays
          </p>
          <span className="text-[10px] text-[#184d28] font-semibold truncate block">
            {(totalGodownTrays * 30).toLocaleString()} eggs ready
          </span>
        </Card>

        {/* Live Trips */}
        <Card className="p-3.5 sm:p-4 bg-white border border-border shadow-xs">
          <span className="text-[11px] sm:text-xs font-semibold text-brand-muted">{t("tripsLive")}</span>
          {isTripActive ? (
            <>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-lg sm:text-xl font-black text-brand-teal tabular-nums">
                  1 Vehicle
                </span>
                <Badge variant="mint" className="text-[9px] px-1 py-0">
                  On Road
                </Badge>
              </div>
              <span className="text-[10px] text-brand-muted truncate block">
                {trip.workerName.split(" ")[0]} ({trip.vehicle.split(" ")[0]})
              </span>
            </>
          ) : (
            <>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-lg sm:text-xl font-black text-brand-muted tabular-nums">
                  0 Vehicles
                </span>
                <Badge variant="outline" className="text-[9px] px-1 py-0 text-brand-muted">
                  Godown
                </Badge>
              </div>
              <span className="text-[10px] text-brand-muted truncate block">
                All vehicles in godown
              </span>
            </>
          )}
        </Card>
      </div>

      {/* Row 3: Visual Analytics Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-5 bg-white border border-border">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-extrabold text-sm text-brand-dark">
                Weekly Sales & Payment Trend
              </h3>
              <p className="text-xs text-brand-muted">
                Comparison of Daily Sales and Cash vs Online split
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 font-semibold text-brand-teal">
                <span className="h-3 w-3 rounded-sm bg-brand-teal" />
                Sales
              </span>
              <span className="flex items-center gap-1.5 font-semibold text-brand-ocean">
                <span className="h-3 w-3 rounded-sm bg-brand-ocean" />
                Cash
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyTrendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E7E5E4" />
                <XAxis dataKey="day" stroke="#5F7375" fontSize={12} tickLine={false} />
                <YAxis
                  stroke="#5F7375"
                  fontSize={12}
                  tickLine={false}
                  tickFormatter={(v) => `₹${v >= 1000 ? `${v / 1000}k` : v}`}
                />
                <Tooltip
                  formatter={(val) => [
                    `₹${Number(Array.isArray(val) ? val[0] : val || 0).toLocaleString()}`,
                    "Amount",
                  ]}
                  contentStyle={{
                    backgroundColor: "#FFFFFF",
                    borderRadius: "12px",
                    border: "1px solid #D8E2DC",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                  }}
                />
                <Bar dataKey="sales" fill="#388087" radius={[6, 6, 0, 0]} />
                <Bar dataKey="cash" fill="#6FB3B8" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Stock Distribution by Egg Type */}
        <Card className="p-5 bg-white border border-border flex flex-col justify-between">
          <div>
            <h3 className="font-extrabold text-sm text-brand-dark mb-1">
              Stock by Egg Type
            </h3>
            <p className="text-xs text-brand-muted mb-4">
              Real-time Godown Inventory
            </p>

            {eggTypes.length === 0 ? (
              <div className="text-center py-8 text-xs text-brand-muted">
                No egg types registered in database
              </div>
            ) : (
              <div className="space-y-3">
                {eggTypes.map((et) => {
                  const percent = Math.min(
                    100,
                    Math.round((et.currentStockTrays / 500) * 100)
                  );
                  return (
                    <div key={et.id} className="space-y-1">
                      <div className="flex justify-between text-xs font-bold text-brand-dark">
                        <span>{et.name}</span>
                        <span className="tabular-nums text-brand-teal">
                          {et.currentStockTrays} Trays
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-brand-cream border border-border">
                        <div
                          className="h-full rounded-full bg-brand-ocean"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-brand-muted">
                        <span>Rate: ₹{et.defaultRate.toFixed(2)}/egg</span>
                        <span>Cost: ₹{et.costPrice.toFixed(2)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs">
            <span className="text-brand-muted font-medium">Tray Standard Size:</span>
            <strong className="text-brand-dark">30 Eggs / Tray</strong>
          </div>
        </Card>
      </div>

      {/* Row 4: Live Trip Monitor & Top Due Accounts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Live Trip Status */}
        {isTripActive ? (
          <Card className="p-5 bg-white border border-border">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-brand-teal" />
                <h3 className="font-extrabold text-sm text-brand-dark">
                  Live Delivery Trip: {trip.tripNo}
                </h3>
              </div>
              <Badge variant="mint">Delivery in Progress</Badge>
            </div>

            <div className="rounded-xl bg-brand-cream p-3 border border-border text-xs space-y-2 mb-4">
              <div className="flex justify-between">
                <span className="text-brand-muted">Worker Name:</span>
                <strong className="text-brand-dark">{trip.workerName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-muted">Vehicle:</span>
                <strong className="text-brand-dark">{trip.vehicle}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-muted">Expected Cash to Collect:</span>
                <strong className="text-[#184d28]">{formatINR(trip.expectedCash)}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-muted">Online UPI confirmed:</span>
                <strong className="text-brand-teal">{formatINR(trip.expectedOnline)}</strong>
              </div>
            </div>

            {/* Trip Loads Breakdown */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-brand-dark uppercase tracking-wider">
                Vehicle Inventory Status
              </span>
              {trip.loads.map((l, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-border bg-white text-xs"
                >
                  <div>
                    <p className="font-bold text-brand-dark">{l.eggTypeName}</p>
                    <p className="text-[11px] text-brand-muted">
                      Loaded: {Math.floor(l.qtyLoadedEggs / 30)} trays ({l.qtyLoadedEggs} eggs)
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-[#184d28]">
                      Sold: {Math.floor(l.qtySoldEggs / 30)} trays
                    </span>
                    <p className="text-[11px] text-brand-teal font-medium">
                      Left: {Math.floor((l.qtyLoadedEggs - l.qtySoldEggs) / 30)} trays
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ) : (
          <Card className="p-5 bg-white border border-border flex flex-col items-center justify-center text-center py-10">
            <div className="p-3 rounded-2xl bg-brand-cream text-brand-teal mb-3">
              <Truck className="h-8 w-8 text-brand-teal/50" />
            </div>
            <h3 className="font-extrabold text-sm text-brand-dark">No Active Delivery Trip</h3>
            <p className="text-xs text-brand-muted max-w-xs mt-1">
              Currently all vehicles are in the warehouse. Create and dispatch a delivery trip from the Trips tab.
            </p>
          </Card>
        )}

        {/* Top Due Customers List with Quick Collect */}
        <Card className="p-5 bg-white border border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-brand-teal" />
              <h3 className="font-extrabold text-sm text-brand-dark">
                Top Due Customers (Udhaar)
              </h3>
            </div>
            <span className="text-xs font-semibold text-brand-muted">
              Fast Collect
            </span>
          </div>

          {customers.filter((c) => c.dueAmount > 0).length === 0 ? (
            <div className="py-10 text-center flex flex-col items-center justify-center">
              <div className="p-3 rounded-2xl bg-brand-mint/30 text-[#184d28] mb-2">
                <UserCheck className="h-6 w-6" />
              </div>
              <p className="font-bold text-xs text-brand-dark">No Pending Udhaar</p>
              <p className="text-[11px] text-brand-muted mt-0.5">All customer accounts are clear with zero pending dues.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {customers
                .filter((c) => c.dueAmount > 0)
                .slice(0, 4)
                .map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-border bg-card hover:border-brand-ocean/40 transition-colors"
                  >
                    <div>
                      <p className="font-bold text-sm text-brand-dark">{c.name}</p>
                      <p className="text-xs text-brand-muted">
                        📞 {c.phone} · Trays baaqi: {c.pendingTrays}
                      </p>
                    </div>
                    <div className="text-right flex items-center gap-3">
                      <div>
                        <span className="text-sm font-black text-brand-danger tabular-nums">
                          {formatINR(c.dueAmount)}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant="soft"
                        onClick={() => {
                          setCollectingCustId(c.id);
                          setCollectAmount(Math.min(c.dueAmount, 2000));
                        }}
                        className="text-xs font-bold h-8 px-2.5"
                      >
                        Collect
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </Card>
      </div>

      {/* Payment Collection Modal */}
      {collectingCustId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl border border-border">
            <h3 className="text-base font-black text-brand-dark mb-1">
              Collect Udhaar Payment
            </h3>
            <p className="text-xs text-brand-muted mb-4">
              {customers.find((c) => c.id === collectingCustId)?.name}
            </p>

            <form onSubmit={handleCollect} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-brand-muted mb-1 block">
                  Amount Received (₹)
                </label>
                <input
                  type="number"
                  value={collectAmount}
                  onChange={(e) => setCollectAmount(Number(e.target.value))}
                  className="w-full rounded-xl border border-border p-2.5 text-lg font-bold text-brand-dark"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setCollectingCustId(null)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" className="flex-1 font-bold">
                  Confirm Payment
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
