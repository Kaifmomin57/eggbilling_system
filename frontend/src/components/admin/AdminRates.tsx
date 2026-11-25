/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import { useStore } from "@/lib/store";
import { formatINR } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Drawer, FormField } from "@/components/ui/drawer";
import {
  Tag,
  Plus,
  Pencil,
  Trash2,
  TrendingUp,
  Package,
  Layers,
  Coins,
  Check,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { EggType } from "@/lib/mock-data";

type ProductFormData = {
  name: string;
  category: "HIGH" | "LOW";
  eggsPerTray: string;
  defaultRate: string;
  costPrice: string;
  initialStockTrays: string;
};

const emptyProductForm: ProductFormData = {
  name: "",
  category: "LOW",
  eggsPerTray: "30",
  defaultRate: "",
  costPrice: "",
  initialStockTrays: "0",
};

export function AdminRates() {
  const { eggTypes, customers, addEggType, updateEggType, deleteEggType, updateCustomerRate } = useStore();

  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingEggType, setEditingEggType] = useState<EggType | null>(null);
  const [form, setForm] = useState<ProductFormData>(emptyProductForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Inline rate editing state: { eggTypeId: rateValue }
  const [inlineRates, setInlineRates] = useState<Record<string, string>>({});
  const [editingRateId, setEditingRateId] = useState<string | null>(null);

  // Customer custom rate override selector
  const [selectedCustId, setSelectedCustId] = useState<string>(customers[0]?.id || "");

  const filteredEggTypes = eggTypes.filter((et) =>
    et.name.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
    setEditingEggType(null);
    setForm(emptyProductForm);
    setErrors({});
    setDrawerOpen(true);
  };

  const openEdit = (et: EggType) => {
    setEditingEggType(et);
    setForm({
      name: et.name,
      category: et.category,
      eggsPerTray: String(et.eggsPerTray),
      defaultRate: String(et.defaultRate),
      costPrice: String(et.costPrice),
      initialStockTrays: String(et.currentStockTrays),
    });
    setErrors({});
    setDrawerOpen(true);
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim() || form.name.trim().length < 2) {
      errs.name = "Product name must be at least 2 characters";
    }
    const rate = parseFloat(form.defaultRate);
    if (isNaN(rate) || rate <= 0) {
      errs.defaultRate = "Valid selling rate daalo";
    }
    const cost = parseFloat(form.costPrice);
    if (isNaN(cost) || cost <= 0) {
      errs.costPrice = "Valid cost price daalo";
    }
    const traySize = parseInt(form.eggsPerTray, 10);
    if (isNaN(traySize) || traySize <= 0) {
      errs.eggsPerTray = "Eggs per tray must be at least 1";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setLoading(true);

    try {
      if (editingEggType) {
        // Update existing egg type
        await updateEggType(editingEggType.id, {
          name: form.name.trim(),
          category: form.category,
          eggsPerTray: parseInt(form.eggsPerTray, 10),
          defaultRate: parseFloat(form.defaultRate),
          costPrice: parseFloat(form.costPrice),
        });
        toast.success(`Product "${form.name}" updated successfully!`);
      } else {
        // Add new egg type
        await addEggType({
          name: form.name.trim(),
          category: form.category,
          eggsPerTray: parseInt(form.eggsPerTray, 10),
          defaultRate: parseFloat(form.defaultRate),
          costPrice: parseFloat(form.costPrice),
          currentStockTrays: parseInt(form.initialStockTrays || "0", 10),
        });
        toast.success(`Naya product "${form.name}" add ho gaya! 🎉`);
      }
      setDrawerOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to save product");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove "${name}"?`)) return;
    try {
      await deleteEggType(id);
      toast.success(`Product "${name}" removed`);
    } catch (err: any) {
      toast.error(err.message || "Failed to delete product");
    }
  };

  const handleQuickRateSave = async (eggTypeId: string) => {
    const val = parseFloat(inlineRates[eggTypeId]);
    if (isNaN(val) || val <= 0) {
      toast.error("Valid rate daalein");
      return;
    }
    try {
      await updateEggType(eggTypeId, { defaultRate: val });
      setEditingRateId(null);
      toast.success("Rate updated successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to update rate");
    }
  };

  // Stats calculation
  const totalStockTrays = eggTypes.reduce((acc, et) => acc + et.currentStockTrays, 0);
  const avgSellingRate =
    eggTypes.length > 0
      ? eggTypes.reduce((acc, et) => acc + et.defaultRate, 0) / eggTypes.length
      : 0;

  // Selected customer for custom rate override
  const selectedCustomer = customers.find((c) => c.id === selectedCustId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-brand-dark tracking-tight flex items-center gap-2">
            <Tag className="h-6 w-6 text-brand-teal" />
            Product & Rate Master
          </h1>
          <p className="text-xs text-brand-muted mt-0.5">
            Manage egg products, daily selling rates, tray configurations and profit margins
          </p>
        </div>
        <Button
          onClick={openAdd}
          variant="primary"
          className="font-bold text-xs h-10 px-4 self-start sm:self-auto shadow-sm"
        >
          <Plus className="h-4 w-4 mr-1.5" /> Add New Product
        </Button>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-3.5 sm:p-4 bg-white border border-border shadow-xs">
          <div className="flex items-center justify-between text-brand-muted mb-1">
            <span className="text-[10px] sm:text-xs font-semibold">Active Products</span>
            <Layers className="h-4 w-4 text-brand-teal" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-brand-dark tabular-nums">
            {eggTypes.length} Types
          </p>
          <span className="text-[10px] text-brand-muted truncate block">Registered</span>
        </Card>

        <Card className="p-3.5 sm:p-4 bg-white border border-border shadow-xs">
          <div className="flex items-center justify-between text-brand-muted mb-1">
            <span className="text-[10px] sm:text-xs font-semibold">Avg. Rate</span>
            <Coins className="h-4 w-4 text-[#184d28]" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-[#184d28] tabular-nums">
            ₹{avgSellingRate.toFixed(2)}
          </p>
          <span className="text-[10px] text-brand-muted truncate block">Base shop price</span>
        </Card>

        <Card className="p-3.5 sm:p-4 bg-white border border-border shadow-xs">
          <div className="flex items-center justify-between text-brand-muted mb-1">
            <span className="text-[10px] sm:text-xs font-semibold">Godown Stock</span>
            <Package className="h-4 w-4 text-brand-ocean" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-brand-dark tabular-nums">
            {totalStockTrays} Trays
          </p>
          <span className="text-[10px] text-[#184d28] font-bold truncate block">
            {(totalStockTrays * 30).toLocaleString()} eggs
          </span>
        </Card>

        <Card className="p-3.5 sm:p-4 bg-white border border-border shadow-xs">
          <div className="flex items-center justify-between text-brand-muted mb-1">
            <span className="text-[10px] sm:text-xs font-semibold">Packaging</span>
            <TrendingUp className="h-4 w-4 text-brand-teal" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-brand-teal tabular-nums">
            30 Eggs
          </p>
          <span className="text-[10px] text-brand-muted truncate block">Standard tray</span>
        </Card>
      </div>

      {/* Main Section: Master Products & Rates Table */}
      <Card className="p-5 bg-white border border-border space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-black text-brand-dark">
              Daily Master Rate Card
            </h2>
            <p className="text-xs text-brand-muted">
              Live selling rate aur purchase cost per egg / tray
            </p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-brand-muted" />
            <Input
              placeholder="Search product..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 text-xs h-9"
            />
          </div>
        </div>

        {filteredEggTypes.length === 0 ? (
          <div className="py-12 text-center text-xs text-brand-muted space-y-2">
            <Package className="h-10 w-10 mx-auto text-brand-muted/40 mb-1" />
            <p className="font-bold text-brand-dark">Koi product nahi mila</p>
            <p>Naya product add karne ke liye upar &quot;+ Add New Product&quot; par click karein.</p>
          </div>
        ) : (
          <>
            {/* Mobile Cards View (Hidden on Desktop) */}
            <div className="md:hidden space-y-3">
              {filteredEggTypes.map((et) => {
                const trayPrice = et.defaultRate * et.eggsPerTray;
                const marginPerEgg = et.defaultRate - et.costPrice;
                const marginPercent = et.costPrice > 0 ? ((marginPerEgg / et.costPrice) * 100).toFixed(1) : "0";
                const isEditingRate = editingRateId === et.id;

                return (
                  <div key={et.id} className="p-3.5 rounded-xl border border-border bg-white shadow-xs space-y-2.5">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-black text-sm text-brand-dark">{et.name}</span>
                          <Badge variant={et.category === "HIGH" ? "mint" : "ice"} className="text-[10px]">
                            {et.category === "HIGH" ? "Premium" : "Standard"}
                          </Badge>
                        </div>
                        <span className="text-[11px] text-brand-muted font-medium">
                          {et.eggsPerTray} Eggs / Tray · Cost: ₹{et.costPrice.toFixed(2)}
                        </span>
                      </div>

                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openEdit(et)}
                          className="h-7 w-7 p-0"
                        >
                          <Pencil className="h-3.5 w-3.5 text-brand-muted" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(et.id, et.name)}
                          className="h-7 w-7 p-0 hover:text-red-500"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-brand-muted hover:text-red-500" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 bg-brand-cream/60 p-2.5 rounded-xl border border-border/80 text-xs">
                      <div>
                        <span className="text-[10px] text-brand-muted font-bold block uppercase">Selling Rate</span>
                        {isEditingRate ? (
                          <div className="flex items-center gap-1 mt-1">
                            <Input
                              type="number"
                              step="0.05"
                              value={inlineRates[et.id] ?? String(et.defaultRate)}
                              onChange={(e) =>
                                setInlineRates({ ...inlineRates, [et.id]: e.target.value })
                              }
                              className="h-7 w-16 text-xs px-1.5 font-bold"
                              autoFocus
                            />
                            <button
                              onClick={() => handleQuickRateSave(et.id)}
                              className="p-1 rounded bg-[#184d28] text-white"
                            >
                              <Check className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => setEditingRateId(null)}
                              className="p-1 text-brand-muted"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className="font-black text-sm text-[#184d28] tabular-nums">
                              ₹{et.defaultRate.toFixed(2)}
                            </span>
                            <span className="text-[10px] text-brand-muted">/ egg</span>
                            <button
                              onClick={() => {
                                setEditingRateId(et.id);
                                setInlineRates({ ...inlineRates, [et.id]: String(et.defaultRate) });
                              }}
                              className="text-brand-muted hover:text-brand-teal p-0.5 ml-1"
                            >
                              <Pencil className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                        <span className="text-[10px] text-brand-teal font-semibold block mt-0.5">
                          ₹{trayPrice.toFixed(0)} / tray
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-brand-muted font-bold block uppercase">Profit Margin</span>
                        <span className={`font-black text-sm tabular-nums mt-0.5 block ${marginPerEgg >= 0 ? "text-emerald-700" : "text-red-500"}`}>
                          +₹{marginPerEgg.toFixed(2)}
                        </span>
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded inline-block">
                          +{marginPercent}% margin
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table View (Hidden on Mobile) */}
            <div className="hidden md:block overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-xs text-left">
              <thead className="bg-brand-cream text-brand-muted uppercase font-bold border-b border-border">
                <tr>
                  <th className="p-3.5">Product Name</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Tray Size</th>
                  <th className="p-3.5">Purchase Cost</th>
                  <th className="p-3.5">Selling Rate (₹/Egg)</th>
                  <th className="p-3.5">Rate / Tray</th>
                  <th className="p-3.5">Margin / Egg</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredEggTypes.map((et) => {
                  const trayPrice = et.defaultRate * et.eggsPerTray;
                  const trayCost = et.costPrice * et.eggsPerTray;
                  const marginPerEgg = et.defaultRate - et.costPrice;
                  const marginPercent = et.costPrice > 0 ? ((marginPerEgg / et.costPrice) * 100).toFixed(1) : "0";
                  const isEditingRate = editingRateId === et.id;

                  return (
                    <tr key={et.id} className="hover:bg-brand-ice/10 transition-colors">
                      <td className="p-3.5">
                        <p className="font-bold text-sm text-brand-dark">{et.name}</p>
                        <p className="text-[10px] text-brand-muted">ID: {et.id}</p>
                      </td>
                      <td className="p-3.5">
                        <Badge variant={et.category === "HIGH" ? "mint" : "ice"}>
                          {et.category === "HIGH" ? "Premium" : "Standard"}
                        </Badge>
                      </td>
                      <td className="p-3.5 font-bold text-brand-dark tabular-nums">
                        {et.eggsPerTray} Eggs
                      </td>
                      <td className="p-3.5 tabular-nums">
                        <p className="font-bold text-brand-dark">₹{et.costPrice.toFixed(2)}</p>
                        <p className="text-[10px] text-brand-muted">₹{trayCost.toFixed(1)}/tray</p>
                      </td>
                      <td className="p-3.5">
                        {isEditingRate ? (
                          <div className="flex items-center gap-1.5">
                            <Input
                              type="number"
                              step="0.05"
                              value={inlineRates[et.id] ?? String(et.defaultRate)}
                              onChange={(e) =>
                                setInlineRates({ ...inlineRates, [et.id]: e.target.value })
                              }
                              className="h-7 w-20 text-xs px-2 font-bold"
                              autoFocus
                            />
                            <button
                              onClick={() => handleQuickRateSave(et.id)}
                              className="p-1 rounded-md bg-[#184d28] text-white hover:opacity-90"
                              title="Save Rate"
                            >
                              <Check className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => setEditingRateId(null)}
                              className="p-1 text-brand-muted hover:text-brand-dark text-xs"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span className="font-black text-sm text-[#184d28] tabular-nums">
                              ₹{et.defaultRate.toFixed(2)}
                            </span>
                            <button
                              onClick={() => {
                                setEditingRateId(et.id);
                                setInlineRates({ ...inlineRates, [et.id]: String(et.defaultRate) });
                              }}
                              className="text-brand-muted hover:text-brand-teal p-0.5"
                              title="Edit Rate"
                            >
                              <Pencil className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="p-3.5 font-black text-brand-teal tabular-nums text-sm">
                        ₹{trayPrice.toFixed(2)}
                      </td>
                      <td className="p-3.5 tabular-nums">
                        <p className={`font-bold ${marginPerEgg >= 0 ? "text-[#184d28]" : "text-red-500"}`}>
                          +{formatINR(marginPerEgg)}
                        </p>
                        <p className="text-[10px] text-brand-muted">+{marginPercent}%</p>
                      </td>
                      <td className="p-3.5 text-right space-x-1 whitespace-nowrap">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openEdit(et)}
                          className="h-8 w-8 p-0"
                          title="Full Edit"
                        >
                          <Pencil className="h-3.5 w-3.5 text-brand-muted hover:text-brand-dark" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(et.id, et.name)}
                          className="h-8 w-8 p-0 hover:text-red-500"
                          title="Delete Product"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-brand-muted hover:text-red-500" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Card>

      {/* Customer Custom Rate Setup Panel */}
      {customers.length > 0 && (
        <Card className="p-5 bg-white border border-border space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-black text-brand-dark">
                Customer-Wise Custom Rates
              </h2>
              <p className="text-xs text-brand-muted">
                Kisi khaas dukaandar/grahak ke liye custom rate set karein
              </p>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-brand-muted">Select Customer:</label>
              <select
                value={selectedCustId}
                onChange={(e) => setSelectedCustId(e.target.value)}
                className="rounded-xl border border-border bg-white px-3 py-1.5 text-xs font-bold text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-teal"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.area})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedCustomer && (
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-xs text-left">
                <thead className="bg-brand-cream text-brand-muted uppercase font-bold border-b border-border">
                  <tr>
                    <th className="p-3">Product Name</th>
                    <th className="p-3">Standard Shop Rate</th>
                    <th className="p-3">Customer Special Rate</th>
                    <th className="p-3">Customer Tray Rate</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {eggTypes.map((et) => {
                    const custRate = selectedCustomer.rates?.[et.id] ?? et.defaultRate;
                    const hasSpecial = selectedCustomer.rates?.[et.id] !== undefined;

                    return (
                      <tr key={et.id} className="hover:bg-brand-ice/10">
                        <td className="p-3 font-bold text-brand-dark">{et.name}</td>
                        <td className="p-3 text-brand-muted tabular-nums">
                          ₹{et.defaultRate.toFixed(2)}/egg
                        </td>
                        <td className="p-3">
                          <span className={`font-black text-sm tabular-nums ${hasSpecial ? "text-brand-teal" : "text-brand-dark"}`}>
                            ₹{custRate.toFixed(2)}
                          </span>
                          {hasSpecial && (
                            <Badge variant="mint" className="ml-2 text-[10px]">
                              Custom
                            </Badge>
                          )}
                        </td>
                        <td className="p-3 font-bold text-brand-dark tabular-nums">
                          ₹{(custRate * et.eggsPerTray).toFixed(2)}
                        </td>
                        <td className="p-3 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const newRateStr = prompt(
                                `Set special rate for ${selectedCustomer.name} on ${et.name} (Current: ₹${custRate.toFixed(2)}):`,
                                String(custRate)
                              );
                              if (newRateStr !== null) {
                                const newR = parseFloat(newRateStr);
                                if (!isNaN(newR) && newR > 0) {
                                  updateCustomerRate(selectedCustomer.id, et.id, newR);
                                  toast.success(`Updated rate for ${selectedCustomer.name}!`);
                                }
                              }
                            }}
                            className="font-bold text-xs h-7 px-2.5"
                          >
                            Set Rate
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Add / Edit Product Drawer */}
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editingEggType ? "Edit Product & Rates" : "Add New Egg Product"}
        subtitle={
          editingEggType
            ? `Update details for "${editingEggType.name}"`
            : "Naya ande ka product register karein"
        }
        footer={
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setDrawerOpen(false)}
              className="flex-1 font-bold text-sm"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={loading}
              className="flex-1 font-bold text-sm"
            >
              {loading ? "Saving..." : editingEggType ? "Save Changes" : "Create Product"}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <FormField label="Product / Egg Type Name" required error={errors.name}>
            <Input
              placeholder="e.g. Kadaknath Black Egg, Jumbo White"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={errors.name ? "border-red-400 focus:ring-red-400" : ""}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Product Category" required>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value as "HIGH" | "LOW" })}
                className="w-full rounded-xl border border-border bg-white px-3 py-2 text-sm font-semibold text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-teal"
              >
                <option value="LOW">Standard / High Volume</option>
                <option value="HIGH">Premium / Gourmet</option>
              </select>
            </FormField>

            <FormField label="Eggs per Tray" required error={errors.eggsPerTray}>
              <Input
                type="number"
                min={1}
                placeholder="30"
                value={form.eggsPerTray}
                onChange={(e) => setForm({ ...form, eggsPerTray: e.target.value })}
                className={errors.eggsPerTray ? "border-red-400" : ""}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Purchase Cost (₹/Egg)" required error={errors.costPrice}>
              <Input
                type="number"
                step="0.05"
                min={0.1}
                placeholder="e.g. 5.50"
                value={form.costPrice}
                onChange={(e) => setForm({ ...form, costPrice: e.target.value })}
                className={errors.costPrice ? "border-red-400" : ""}
              />
            </FormField>

            <FormField label="Selling Rate (₹/Egg)" required error={errors.defaultRate}>
              <Input
                type="number"
                step="0.05"
                min={0.1}
                placeholder="e.g. 6.50"
                value={form.defaultRate}
                onChange={(e) => setForm({ ...form, defaultRate: e.target.value })}
                className={errors.defaultRate ? "border-red-400" : ""}
              />
            </FormField>
          </div>

          {!editingEggType && (
            <FormField label="Initial Godown Stock (Trays)" hint="Starting inventory in godown">
              <Input
                type="number"
                min={0}
                placeholder="0"
                value={form.initialStockTrays}
                onChange={(e) => setForm({ ...form, initialStockTrays: e.target.value })}
              />
            </FormField>
          )}

          {/* Live Preview Card */}
          {form.defaultRate && form.costPrice && (
            <div className="rounded-2xl bg-brand-cream border border-border p-4 text-xs space-y-2">
              <p className="font-bold text-brand-dark uppercase tracking-wider text-[11px]">
                Calculated Pricing Preview
              </p>
              <div className="grid grid-cols-2 gap-2 text-brand-dark">
                <div>
                  <span className="text-brand-muted">Selling per Tray:</span>
                  <p className="font-black text-sm text-brand-teal">
                    ₹{(parseFloat(form.defaultRate || "0") * parseInt(form.eggsPerTray || "30", 10)).toFixed(2)}
                  </p>
                </div>
                <div>
                  <span className="text-brand-muted">Cost per Tray:</span>
                  <p className="font-bold text-sm">
                    ₹{(parseFloat(form.costPrice || "0") * parseInt(form.eggsPerTray || "30", 10)).toFixed(2)}
                  </p>
                </div>
              </div>
              <div className="pt-1 border-t border-border flex justify-between items-center">
                <span className="text-brand-muted">Net Margin per Egg:</span>
                <span className="font-black text-[#184d28]">
                  +₹{(parseFloat(form.defaultRate || "0") - parseFloat(form.costPrice || "0")).toFixed(2)} / egg
                </span>
              </div>
            </div>
          )}
        </div>
      </Drawer>
    </div>
  );
}
