"use client";

import React, { useState } from "react";
import { useStore } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Drawer, ConfirmModal, FormField } from "@/components/ui/drawer";
import { Plus, Trash2, Package } from "lucide-react";
import { formatINR } from "@/lib/utils";
import { toast } from "sonner";

type StockFormData = {
  eggTypeId: string;
  qtyTrays: string;
  purchaseRatePerEgg: string;
  supplier: string;
  notes: string;
  date: string;
};

export function AdminStock() {
  const { eggTypes, stockEntries, addStockEntry, deleteStockEntry } = useStore();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const emptyForm: StockFormData = {
    eggTypeId: eggTypes[0]?.id || "",
    qtyTrays: "",
    purchaseRatePerEgg: "",
    supplier: "",
    notes: "",
    date: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
  };
  const [form, setForm] = useState<StockFormData>(emptyForm);

  const totalCost =
    (parseInt(form.qtyTrays) || 0) *
    (eggTypes.find((et) => et.id === form.eggTypeId)?.eggsPerTray || 30) *
    (parseFloat(form.purchaseRatePerEgg) || 0);

  const selectedEggType = eggTypes.find((et) => et.id === form.eggTypeId);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.eggTypeId) errs.eggTypeId = "Egg type select karo";
    if (!form.qtyTrays || parseInt(form.qtyTrays) <= 0) errs.qtyTrays = "Qty must be > 0";
    if (!form.purchaseRatePerEgg || parseFloat(form.purchaseRatePerEgg) <= 0) errs.purchaseRatePerEgg = "Rate must be > 0";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleAdd = async () => {
    if (!validate()) return;
    const et = eggTypes.find((e) => e.id === form.eggTypeId)!;
    try {
      await addStockEntry({
        date: form.date,
        eggTypeId: form.eggTypeId,
        eggTypeName: et.name,
        qtyTrays: parseInt(form.qtyTrays),
        purchaseRatePerEgg: parseFloat(form.purchaseRatePerEgg),
        supplier: form.supplier.trim() || "Direct Purchase",
        notes: form.notes.trim(),
        totalCost,
      });
      toast.success(`Stock added: ${form.qtyTrays} trays of ${et.name}`, { description: `Total Cost: ${formatINR(totalCost)}` });
      setDrawerOpen(false);
      setForm(emptyForm);
      setFormErrors({});
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to add stock";
      toast.error("Stock add nahi hua", { description: msg });
    }
  };

  const field = (key: keyof StockFormData, val: string) => setForm((prev) => ({ ...prev, [key]: val }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-brand-dark tracking-tight">Godown Egg Stock</h1>
          <p className="text-xs text-brand-muted">Single Source of Truth inventory movements & thresholds</p>
        </div>
        <Button variant="primary" onClick={() => { setForm(emptyForm); setFormErrors({}); setDrawerOpen(true); }} className="font-bold text-xs h-10">
          <Plus className="h-4 w-4 mr-1.5" />
          <span> Add Stock Purchase</span>
        </Button>
      </div>

      {/* Stock Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {eggTypes.map((et) => (
          <Card key={et.id} className="p-5 bg-white border border-border space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-brand-muted uppercase">{et.category}-Rate</span>
              <Badge variant={et.currentStockTrays < 100 ? "warning" : "mint"} className="text-[11px]">
                {et.currentStockTrays < 100 ? "Low Stock" : "In Stock"}
              </Badge>
            </div>
            <div>
              <h3 className="font-black text-sm text-brand-dark">{et.name}</h3>
              <p className="text-2xl font-black text-brand-teal mt-1 tabular-nums">{et.currentStockTrays} Trays</p>
              <p className="text-xs text-brand-muted">{(et.currentStockTrays * et.eggsPerTray).toLocaleString()} eggs</p>
            </div>
            {/* Progress bar */}
            <div className="space-y-1">
              <div className="h-1.5 w-full bg-border rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${et.currentStockTrays < 100 ? "bg-amber-400" : "bg-brand-teal"}`}
                  style={{ width: `${Math.min(100, (et.currentStockTrays / 500) * 100)}%` }}
                />
              </div>
            </div>
            <div className="pt-1 border-t border-border flex justify-between text-xs text-brand-muted">
              <span>Standard: ₹{et.defaultRate.toFixed(2)}</span>
              <span>Cost: ₹{et.costPrice.toFixed(2)}</span>
            </div>
          </Card>
        ))}
      </div>

      {/* Stock Entries Table */}
      <Card className="bg-white border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="font-bold text-brand-dark text-sm">Purchase History</h3>
            <p className="text-xs text-brand-muted">{stockEntries.length} entries</p>
          </div>
        </div>

        {stockEntries.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="h-10 w-10 text-brand-muted mx-auto mb-3 opacity-40" />
            <p className="text-sm text-brand-muted">Abhi tak koi stock purchase record nahi hai.</p>
            <p className="text-xs text-brand-muted mt-1">Click &quot; Add Stock Purchase&quot; to add your first entry.</p>
          </div>
        ) : (
          <>
            {/* Mobile Cards (Hidden on Desktop) */}
            <div className="md:hidden divide-y divide-border">
              {stockEntries.map((entry) => (
                <div key={entry.id} className="p-3.5 space-y-1.5 hover:bg-brand-cream/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-extrabold text-xs text-brand-dark">{entry.eggTypeName}</span>
                      <span className="text-[11px] text-brand-muted block">{entry.date} · {entry.supplier}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-sm text-brand-dark tabular-nums block">
                        {formatINR(entry.totalCost)}
                      </span>
                      <span className="text-[11px] font-bold text-brand-teal tabular-nums">
                        {entry.qtyTrays} Trays @ ₹{entry.purchaseRatePerEgg.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-end pt-1">
                    <button
                      onClick={() => setConfirmDeleteId(entry.id)}
                      className="text-xs text-red-500 font-semibold flex items-center gap-1 hover:underline"
                    >
                      <Trash2 className="h-3 w-3" />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table (Hidden on Mobile) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-brand-cream text-brand-muted uppercase font-bold border-b border-border">
                  <tr>
                    <th className="p-3">Date</th>
                    <th className="p-3">Egg Type</th>
                    <th className="p-3">Qty (Trays)</th>
                    <th className="p-3">Rate / Egg</th>
                    <th className="p-3">Supplier</th>
                    <th className="p-3">Total Cost</th>
                    <th className="p-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {stockEntries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-brand-ice/10 transition-colors">
                      <td className="p-3 text-brand-muted">{entry.date}</td>
                      <td className="p-3 font-bold text-brand-dark">{entry.eggTypeName}</td>
                      <td className="p-3 font-black text-brand-teal tabular-nums">{entry.qtyTrays}</td>
                      <td className="p-3 tabular-nums">₹{entry.purchaseRatePerEgg.toFixed(2)}</td>
                      <td className="p-3 text-brand-muted">{entry.supplier}</td>
                      <td className="p-3 font-black text-brand-dark tabular-nums">{formatINR(entry.totalCost)}</td>
                      <td className="p-3">
                        <button
                          onClick={() => setConfirmDeleteId(entry.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-brand-muted hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>

      {/* Add Stock Drawer */}
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Add Stock Purchase"
        subtitle="Naya godown stock entry daalo"
        footer={
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setDrawerOpen(false)} className="flex-1 font-bold text-sm">Cancel</Button>
            <Button variant="primary" onClick={handleAdd} className="flex-1 font-bold text-sm">Add to Stock</Button>
          </div>
        }
      >
        <FormField label="Date" required>
          <Input value={form.date} onChange={(e) => field("date", e.target.value)} />
        </FormField>

        <FormField label="Egg Type" required error={formErrors.eggTypeId}>
          <select
            value={form.eggTypeId}
            onChange={(e) => field("eggTypeId", e.target.value)}
            className="w-full h-10 rounded-xl border border-border bg-white px-3 text-sm font-semibold text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-teal"
          >
            <option value="">-- Egg Type Chunein --</option>
            {eggTypes.map((et) => (
              <option key={et.id} value={et.id}>
                {et.name} ({et.currentStockTrays} Trays in stock)
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Quantity (Trays)" required error={formErrors.qtyTrays}>
          <div className="flex gap-2 items-center">
            <Input
              type="number"
              min={1}
              placeholder="e.g. 100"
              value={form.qtyTrays}
              onChange={(e) => field("qtyTrays", e.target.value)}
              className={`${formErrors.qtyTrays ? "border-red-400 focus:ring-red-400" : ""}`}
            />
            <span className="text-xs text-brand-muted shrink-0">
              = {((parseInt(form.qtyTrays) || 0) * (selectedEggType?.eggsPerTray || 30)).toLocaleString()} eggs
            </span>
          </div>
        </FormField>

        <FormField label="Purchase Rate per Egg (₹)" required error={formErrors.purchaseRatePerEgg}>
          <Input
            type="number"
            step="0.01"
            min={0}
            placeholder="e.g. 5.40"
            value={form.purchaseRatePerEgg}
            onChange={(e) => field("purchaseRatePerEgg", e.target.value)}
            className={formErrors.purchaseRatePerEgg ? "border-red-400 focus:ring-red-400" : ""}
          />
        </FormField>

        <FormField label="Supplier" hint="Supplier ka naam ya firm">
          <Input
            placeholder="e.g. Poultry Farm Direct"
            value={form.supplier}
            onChange={(e) => field("supplier", e.target.value)}
          />
        </FormField>

        <FormField label="Notes (optional)">
          <textarea
            placeholder="Koi extra note..."
            value={form.notes}
            onChange={(e) => field("notes", e.target.value)}
            rows={2}
            className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm text-brand-dark placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-teal resize-none"
          />
        </FormField>

        {/* Live Total */}
        {totalCost > 0 && (
          <div className="rounded-xl bg-brand-cream border border-border p-4 space-y-1 text-xs">
            <p className="font-bold text-brand-dark">Purchase Summary</p>
            <p className="text-brand-muted">
              Qty: <strong>{form.qtyTrays} trays</strong> × <strong>₹{form.purchaseRatePerEgg}/egg</strong>
              {selectedEggType && <> × <strong>{selectedEggType.eggsPerTray} eggs/tray</strong></>}
            </p>
            <p className="text-lg font-black text-brand-teal">Total: {formatINR(totalCost)}</p>
          </div>
        )}
      </Drawer>

      {/* Confirm Delete */}
      <ConfirmModal
        open={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={() => { if (confirmDeleteId) deleteStockEntry(confirmDeleteId); }}
        title="Delete Stock Entry?"
        description="Yeh entry aur iske trays stock se hata diye jayenge. Kya aap sure ho?"
        confirmLabel="Haan, Delete Karo"
        confirmVariant="danger"
      />
    </div>
  );
}
