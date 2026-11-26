"use client";

import React, { useState } from "react";
import { useStore } from "@/lib/store";
import { useLanguage } from "@/lib/i18n";
import { formatINR } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Search, Receipt, Clock } from "lucide-react";

export function WorkerBills() {
  const { bills, trip } = useStore();
  const { t } = useLanguage();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"ALL" | "DUE" | "PAID">("ALL");

  // Only show bills belonging to this worker's active trip
  const tripBills = trip && trip.id ? bills.filter((b) => b.tripId === trip.id) : [];

  const filteredBills = tripBills.filter((b) => {
    const matchesSearch =
      b.customerName.toLowerCase().includes(search.toLowerCase()) ||
      b.billNo.toLowerCase().includes(search.toLowerCase()) ||
      b.customerPhone.includes(search);

    if (!matchesSearch) return false;
    if (filter === "DUE") return b.dueAmount > 0;
    if (filter === "PAID") return b.dueAmount === 0;
    return true;
  });

  return (
    <div className="w-full space-y-5 pb-28 md:pb-10 pt-1">
      {/* Header & Search */}
      <div className="flex items-center justify-between px-1">
        <h1 className="text-xl sm:text-2xl font-extrabold text-brand-dark flex items-center gap-2">
          <Receipt className="h-6 w-6 text-brand-teal" />
          <span>{t("bills")} ({tripBills.length})</span>
        </h1>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-brand-muted" />
          <Input
            placeholder={t("searchBillsPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-11 rounded-xl"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-1.5 bg-brand-cream/60 p-1 rounded-xl border border-border shrink-0">
          {(["ALL", "PAID", "DUE"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setFilter(mode)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                filter === mode
                  ? "bg-brand-teal text-white shadow-xs"
                  : "text-brand-muted hover:text-brand-dark hover:bg-white"
              }`}
            >
              {mode === "ALL" ? t("filterAll") : mode === "PAID" ? t("filterPaid") : t("filterDue")}
            </button>
          ))}
        </div>
      </div>

      {/* Bills List */}
      <div>
        {filteredBills.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-border">
            <Receipt className="h-10 w-10 text-brand-muted mx-auto mb-2 opacity-50" />
            <p className="text-sm font-bold text-brand-dark">{t("noBillsFound")}</p>
            <p className="text-xs text-brand-muted">{t("changeSearchCriteria")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredBills.map((bill) => (
              <Card key={bill.id} className="p-4 bg-white border border-border hover:border-brand-ocean/40 transition-all shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-extrabold text-sm sm:text-base text-brand-dark">
                        {bill.customerName}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-brand-muted mt-0.5">
                        <span>{bill.billNo}</span>
                        <span>•</span>
                        <span className="flex items-center gap-0.5">
                          <Clock className="h-3 w-3" />
                          {bill.createdAt}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-base sm:text-lg font-black text-black tabular-nums">
                        {formatINR(bill.totalAmount)}
                      </span>
                      <div className="mt-0.5">
                        <Badge variant={bill.dueAmount > 0 ? "baaqi_red" : "normal_green"}>
                          {bill.dueAmount > 0 ? `Baaqi ₹${bill.dueAmount}` : "Full Paid"}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Items summary */}
                  <div className="mt-3 pt-2.5 border-t border-border/70 text-xs text-brand-muted space-y-1">
                    {bill.items.map((it, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span>{it.eggTypeName} ({it.qtyEggs} eggs)</span>
                        <span className="font-semibold text-brand-dark tabular-nums">{formatINR(it.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer: Trays & WhatsApp share action */}
                <div className="mt-3 pt-2.5 border-t border-border flex items-center justify-between text-xs">
                  <span className="text-brand-muted">
                    Tray: Di <strong className="text-brand-dark">{bill.traysGiven}</strong> | Wapas <strong className="text-brand-dark">{bill.traysReturned}</strong>
                  </span>
                  <span className="text-[11px] font-semibold text-brand-teal">
                    {bill.paymentMode}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
