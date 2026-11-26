"use client";

import React, { useState } from "react";
import { useStore } from "@/lib/store";
import { formatINR, formatEggsAndTrays } from "@/lib/utils";
import { Stepper } from "@/components/ui/stepper";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ClipboardCheck, Plus } from "lucide-react";

export function WorkerCount() {
  const { trip, eggTypes, submitTripSettlement, addDamage } = useStore();

  // Evening Closing Form
  const [emptyTraysReturned, setEmptyTraysReturned] = useState(25);
  const [declaredCash, setDeclaredCash] = useState<number>(trip.expectedCash);

  // Damage reporting mini-form (modal UI pending — state kept for future)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [showDamageModal, setShowDamageModal] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [damageEggType, setDamageEggType] = useState(eggTypes[0]?.name || "White Table Egg");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [damageQty, setDamageQty] = useState(6);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [damageCategory, setDamageCategory] = useState<"HIGH" | "LOW">("LOW");
  const [damageReason, setDamageReason] = useState("");

  const cashDiff = declaredCash - trip.expectedCash;

  const handleSubmit = () => {
    submitTripSettlement(declaredCash, trip.expectedOnline, emptyTraysReturned);
    toast.success("Closing Settlement Submitted!", {
      description: "Admin will review and close the trip.",
    });
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleAddDamage = (e: React.FormEvent) => {
    e.preventDefault();
    const eggObj = eggTypes.find((et) => et.name === damageEggType);
    const cost = (eggObj?.costPrice || 6) * damageQty;
    addDamage({
      workerName: trip.workerName,
      eggTypeName: damageEggType,
      category: damageCategory,
      qtyEggs: damageQty,
      lossAmount: cost,
      reason: damageReason || "Transport crack",
    });
    setShowDamageModal(false);
    setDamageReason("");
    toast.success("Damage Egg Record Added!");
  };

  return (
    <div className="w-full space-y-5 pb-28 md:pb-10 pt-1">
      <div className="flex items-center justify-between px-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-brand-dark flex items-center gap-2">
            <ClipboardCheck className="h-6 w-6 text-brand-teal" />
            <span>Evening Closing (Hisaab)</span>
          </h1>
          <p className="text-xs sm:text-sm text-brand-muted">
            Trip #{trip.tripNo} · {trip.date}
          </p>
        </div>
        <Badge variant={trip.status === "SETTLEMENT" ? "warning" : "secondary"} className="py-1 px-3">
          {trip.status}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Stock Reconciliation Summary */}
        <Card className="p-4 sm:p-5 bg-white border border-border">
          <h3 className="text-sm sm:text-base font-bold text-brand-dark mb-3">
            Vehicle Egg Stock Check
          </h3>
          <div className="space-y-3">
            {trip.loads.map((load, idx) => {
              const leftEggs = Math.max(0, load.qtyLoadedEggs - load.qtySoldEggs);
              return (
                <div
                  key={idx}
                  className="rounded-xl bg-brand-cream p-3 border border-border text-xs space-y-1.5"
                >
                  <div className="flex justify-between font-bold text-brand-dark">
                    <span>{load.eggTypeName}</span>
                    <span className="text-brand-teal">
                      Left: {formatEggsAndTrays(leftEggs).formatted}
                    </span>
                  </div>
                  <div className="flex justify-between text-brand-muted">
                    <span>Loaded: {formatEggsAndTrays(load.qtyLoadedEggs).formatted}</span>
                    <span>Sold: {formatEggsAndTrays(load.qtySoldEggs).formatted}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Cash & Money Reconciliation */}
        <Card className="p-4 sm:p-5 bg-white border border-border space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-brand-dark mb-3">
              Cash & UPI Jama Hisaab
            </h3>

            {/* Expected vs Declared Cash */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-brand-muted">System Expected Cash:</span>
                <strong className="text-brand-dark">{formatINR(trip.expectedCash)}</strong>
              </div>
              <div>
                <label className="text-xs font-semibold text-brand-muted block mb-1">
                  Bag me Actual Cash Kitna Hai (₹):
                </label>
                <Input
                  type="number"
                  value={declaredCash}
                  onChange={(e) => setDeclaredCash(Number(e.target.value))}
                  className="text-lg font-bold tabular-nums h-11"
                />
              </div>
              {cashDiff !== 0 && (
                <p
                  className={`text-xs font-bold ${
                    cashDiff < 0 ? "text-brand-danger" : "text-[#184d28]"
                  }`}
                >
                  {cashDiff < 0
                    ? `Short (Kam): ₹${Math.abs(cashDiff)}`
                    : `Excess (Zyada): ₹${cashDiff}`}
                </p>
              )}
            </div>
          </div>

          {/* Trays Returned */}
          <div className="pt-3 border-t border-border">
            <Stepper
              label="Khali Trays Godown Wapas Laye"
              value={emptyTraysReturned}
              min={0}
              onChange={setEmptyTraysReturned}
              unit="trays"
            />
          </div>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        {/* Damage reporting button */}
        <Button
          variant="outline"
          onClick={() => setShowDamageModal(true)}
          className="flex-1 h-12 border-brand-ocean/40 text-brand-dark hover:bg-brand-ice/20 font-bold rounded-xl"
        >
          <Plus className="h-4 w-4 mr-1 text-brand-teal" />
          <span>+ Toota / Damage Anda Add Karein</span>
        </Button>

        {/* Submit Settlement Button */}
        <Button
          onClick={handleSubmit}
          className="flex-1 h-12 rounded-xl bg-brand-teal text-white font-extrabold shadow-md min-h-[48px]"
        >
          <span>Hisaab Jama Karein (Submit Settlement)</span>
        </Button>
      </div>
    </div>
  );
}
