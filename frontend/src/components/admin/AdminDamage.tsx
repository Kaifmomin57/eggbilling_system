"use client";

import React, { useState } from "react";
import { useStore } from "@/lib/store";
import { formatINR } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function AdminDamage() {
  const { damages, updateDamageStatus } = useStore();
  const [tab, setTab] = useState<"ALL" | "HIGH" | "LOW">("ALL");

  const filteredDamages = damages.filter((d) => {
    if (tab === "HIGH") return d.category === "HIGH";
    if (tab === "LOW") return d.category === "LOW";
    return true;
  });

  const highRateLoss = damages
    .filter((d) => d.category === "HIGH" && d.status === "APPROVED")
    .reduce((acc, d) => acc + d.lossAmount, 0);

  const lowRateLoss = damages
    .filter((d) => d.category === "LOW" && d.status === "APPROVED")
    .reduce((acc, d) => acc + d.lossAmount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-brand-dark tracking-tight">
            Broken & Damage Egg Management
          </h1>
          <p className="text-xs text-brand-muted">
            Track damaged eggs categorized by High-rate & Low-rate impact
          </p>
        </div>
      </div>

      {/* Category Loss Summary Cards (Acceptance Criteria #5) */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
        <Card className="p-3 sm:p-4 bg-white border border-border shadow-xs">
          <span className="text-[10px] sm:text-xs font-semibold text-brand-muted">
            High-Rate Loss
          </span>
          <p className="text-base sm:text-xl font-black text-brand-danger mt-1 tabular-nums">
            {formatINR(highRateLoss)}
          </p>
          <span className="text-[9px] sm:text-[11px] text-brand-muted truncate block">
            Desi / Brown
          </span>
        </Card>

        <Card className="p-3 sm:p-4 bg-white border border-border shadow-xs">
          <span className="text-[10px] sm:text-xs font-semibold text-brand-muted">
            Low-Rate Loss
          </span>
          <p className="text-base sm:text-xl font-black text-brand-warning mt-1 tabular-nums">
            {formatINR(lowRateLoss)}
          </p>
          <span className="text-[9px] sm:text-[11px] text-brand-muted truncate block">
            White Table Eggs
          </span>
        </Card>

        <Card className="p-3 sm:p-4 bg-white border border-border shadow-xs">
          <span className="text-[10px] sm:text-xs font-semibold text-brand-muted">
            Total Loss
          </span>
          <p className="text-base sm:text-xl font-black text-brand-dark mt-1 tabular-nums">
            {formatINR(highRateLoss + lowRateLoss)}
          </p>
          <span className="text-[9px] sm:text-[11px] text-brand-muted truncate block">
            Deducted from profit
          </span>
        </Card>
      </div>

      {/* Tabs Filter */}
      <div className="flex gap-1.5 border-b border-border pb-2 overflow-x-auto scrollbar-none">
        {(["ALL", "HIGH", "LOW"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              tab === t
                ? "bg-brand-teal text-white shadow-xs"
                : "bg-white text-brand-muted border border-border hover:bg-brand-cream"
            }`}
          >
            {t === "ALL" ? "All Damage" : t === "HIGH" ? "High-Rate Only" : "Low-Rate Only"}
          </button>
        ))}
      </div>

      {/* Mobile Damage Cards View (Hidden on Desktop) */}
      <div className="md:hidden space-y-2.5">
        {filteredDamages.map((d) => (
          <Card key={d.id} className="p-3.5 bg-white border border-border shadow-xs space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-sm text-brand-dark">{d.eggTypeName}</span>
                  <Badge variant={d.category === "HIGH" ? "warning" : "secondary"} className="text-[9px] px-1 py-0">
                    {d.category}-rate
                  </Badge>
                </div>
                <p className="text-xs text-brand-muted mt-0.5">
                  Worker: <strong className="text-brand-dark">{d.workerName}</strong> · {d.date}
                </p>
              </div>

              <div className="text-right">
                <span className="font-black text-sm text-brand-danger tabular-nums block">
                  {formatINR(d.lossAmount)}
                </span>
                <span className="text-[11px] font-bold text-brand-muted tabular-nums">
                  {d.qtyEggs} eggs
                </span>
              </div>
            </div>

            {d.reason && (
              <p className="text-xs text-brand-muted bg-brand-cream/60 p-2 rounded-lg italic">
                &ldquo;{d.reason}&rdquo;
              </p>
            )}

            <div className="pt-2 border-t border-border flex items-center justify-between">
              <Badge
                variant={
                  d.status === "APPROVED"
                    ? "mint"
                    : d.status === "PENDING"
                    ? "warning"
                    : "destructive"
                }
                className="text-[10px]"
              >
                {d.status}
              </Badge>

              {d.status === "PENDING" ? (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="mint"
                    onClick={() => {
                      updateDamageStatus(d.id, "APPROVED");
                      toast.success("Damage Approved!");
                    }}
                    className="h-7 px-3 text-xs font-bold"
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      updateDamageStatus(d.id, "REJECTED");
                      toast.info("Damage Rejected");
                    }}
                    className="h-7 px-2.5 text-xs"
                  >
                    Reject
                  </Button>
                </div>
              ) : (
                <span className="text-[11px] text-brand-muted font-medium">Status Updated</span>
              )}
            </div>
          </Card>
        ))}

        {filteredDamages.length === 0 && (
          <div className="p-8 text-center text-xs text-brand-muted bg-white rounded-2xl border border-dashed border-border">
            Koi damage record nahi mila.
          </div>
        )}
      </div>

      {/* Desktop Damage Records Table (Hidden on Mobile) */}
      <Card className="hidden md:block bg-white border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-brand-cream text-brand-muted uppercase font-bold border-b border-border">
              <tr>
                <th className="p-3">Date</th>
                <th className="p-3">Worker</th>
                <th className="p-3">Egg Type</th>
                <th className="p-3">Category</th>
                <th className="p-3">Qty Eggs</th>
                <th className="p-3">Calculated Loss</th>
                <th className="p-3">Reason</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredDamages.map((d) => (
                <tr key={d.id} className="hover:bg-brand-ice/10">
                  <td className="p-3 text-brand-muted">{d.date}</td>
                  <td className="p-3 font-bold text-brand-dark">{d.workerName}</td>
                  <td className="p-3 font-semibold text-brand-dark">{d.eggTypeName}</td>
                  <td className="p-3">
                    <Badge variant={d.category === "HIGH" ? "warning" : "secondary"}>
                      {d.category}-rate
                    </Badge>
                  </td>
                  <td className="p-3 font-bold tabular-nums text-brand-dark">
                    {d.qtyEggs} eggs
                  </td>
                  <td className="p-3 font-black tabular-nums text-brand-danger">
                    {formatINR(d.lossAmount)}
                  </td>
                  <td className="p-3 text-brand-muted max-w-xs truncate">
                    {d.reason}
                  </td>
                  <td className="p-3">
                    <Badge
                      variant={
                        d.status === "APPROVED"
                          ? "mint"
                          : d.status === "PENDING"
                          ? "warning"
                          : "destructive"
                      }
                    >
                      {d.status}
                    </Badge>
                  </td>
                  <td className="p-3 text-right">
                    {d.status === "PENDING" ? (
                      <div className="flex justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="mint"
                          onClick={() => {
                            updateDamageStatus(d.id, "APPROVED");
                            toast.success("Damage Approved!");
                          }}
                          className="h-7 px-2.5 text-[11px] font-bold"
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            updateDamageStatus(d.id, "REJECTED");
                            toast.info("Damage Rejected");
                          }}
                          className="h-7 px-2 text-[11px]"
                        >
                          Reject
                        </Button>
                      </div>
                    ) : (
                      <span className="text-brand-muted text-[11px]">Decided</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
