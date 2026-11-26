"use client";

import React, { useState, useMemo } from "react";
import { useStore } from "@/lib/store";
import { formatINR } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Drawer, FormField } from "@/components/ui/drawer";
import {
  Search,
  Phone,
  MapPin,
  Pencil,
  Plus,
  IndianRupee,
  Users,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  Layers,
  CheckCircle2,
  Sparkles,
  Receipt,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { Customer } from "@/lib/mock-data";

type CustomerFormData = {
  name: string;
  phone: string;
  area: string;
  openingDue: string;
  notes: string;
};

const emptyForm: CustomerFormData = {
  name: "",
  phone: "",
  area: "",
  openingDue: "0",
  notes: "",
};

function validate(form: CustomerFormData): Record<string, string> {
  const errs: Record<string, string> = {};
  if (!form.name.trim() || form.name.trim().length < 2)
    errs.name = "Name must be at least 2 characters";
  if (form.phone && !/^\d{10}$/.test(form.phone.trim()))
    errs.phone = "Phone must be 10 digits";
  if (isNaN(Number(form.openingDue)) || Number(form.openingDue) < 0)
    errs.openingDue = "Invalid amount";
  return errs;
}

export function AdminCustomers() {
  const {
    customers,
    eggTypes,
    bills,
    addCustomer,
    updateCustomer,
    updateCustomerRate,
    collectCustomerPayment,
  } = useStore();

  const [search, setSearch] = useState("");
  const [custFilter, setCustFilter] = useState<"ALL" | "DUE" | "TRAYS" | "CLEAR">("ALL");
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});
  const [khataCustId, setKhataCustId] = useState<string | null>(null);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CustomerFormData>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [payTargetCust, setPayTargetCust] = useState<Customer | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payMode, setPayMode] = useState<"CASH" | "ONLINE">("CASH");

  const [editingRate, setEditingRate] = useState<{
    custId: string;
    eggTypeId: string;
    value: string;
  } | null>(null);

  /* ── KPIs ── */
  const totalMarketDue = useMemo(
    () => customers.reduce((acc, c) => acc + (c.dueAmount || 0), 0),
    [customers]
  );
  const totalPendingTrays = useMemo(
    () => customers.reduce((acc, c) => acc + (c.pendingTrays || 0), 0),
    [customers]
  );
  const dueCustCount = useMemo(
    () => customers.filter((c) => c.dueAmount > 0).length,
    [customers]
  );

  /* ── Filtered list ── */
  const filteredCustomers = useMemo(() => {
    return customers
      .filter((c) => {
        const q = search.toLowerCase();
        const matchesSearch =
          c.name.toLowerCase().includes(q) ||
          c.phone.includes(q) ||
          c.area.toLowerCase().includes(q) ||
          (c.notes && c.notes.toLowerCase().includes(q));
        if (!matchesSearch) return false;
        if (custFilter === "DUE") return c.dueAmount > 0;
        if (custFilter === "TRAYS") return c.pendingTrays > 0;
        if (custFilter === "CLEAR") return c.dueAmount === 0;
        return true;
      })
      .sort((a, b) => (b.dueAmount || 0) - (a.dueAmount || 0));
  }, [customers, search, custFilter]);

  /* ── Helpers ── */
  const toggleExpand = (id: string) =>
    setExpandedCards((prev) => ({ ...prev, [id]: !prev[id] }));

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setErrors({});
    setDrawerOpen(true);
  };

  const openEdit = (cust: Customer) => {
    setEditingId(cust.id);
    setForm({
      name: cust.name,
      phone: cust.phone,
      area: cust.area,
      openingDue: String(cust.dueAmount || 0),
      notes: cust.notes || "",
    });
    setErrors({});
    setDrawerOpen(true);
  };

  const handleSave = async () => {
    const errs = validate(form);
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    if (editingId) {
      await updateCustomer(editingId, {
        name: form.name.trim(),
        phone: form.phone.trim(),
        area: form.area.trim(),
        notes: form.notes.trim(),
      });
      toast.success("Customer updated!");
    } else {
      await addCustomer({
        name: form.name.trim(),
        phone: form.phone.trim(),
        area: form.area.trim(),
        openingDue: Number(form.openingDue) || 0,
        notes: form.notes.trim(),
      });
      toast.success("Naya customer add ho gaya!");
    }
    setDrawerOpen(false);
  };

  const openCollect = (cust: Customer) => {
    setPayTargetCust(cust);
    setPayAmount(cust.dueAmount > 0 ? String(cust.dueAmount) : "");
    setPayMode("CASH");
  };

  const handleCollectPayment = () => {
    if (!payTargetCust) return;
    const amt = parseFloat(payAmount);
    if (isNaN(amt) || amt <= 0) {
      toast.error("Valid amount enter karein");
      return;
    }
    collectCustomerPayment(payTargetCust.id, amt);
    toast.success(`${formatINR(amt)} collect kiya from ${payTargetCust.name}`, {
      description: payMode === "CASH" ? "Cash 💵" : "Online / UPI 📲",
    });
    setPayTargetCust(null);
    setPayAmount("");
  };

  const handleSaveRate = () => {
    if (!editingRate) return;
    const rate = parseFloat(editingRate.value);
    if (isNaN(rate) || rate < 0) {
      toast.error("Valid rate enter karein");
      return;
    }
    updateCustomerRate(editingRate.custId, editingRate.eggTypeId, rate);
    toast.success("Rate updated!");
    setEditingRate(null);
  };

  const sendWhatsApp = (cust: Customer) => {
    if (!cust.phone) {
      toast.error("Phone number nahi hai!");
      return;
    }
    const phone = cust.phone.replace(/\D/g, "");
    const msg = `Namaste ${cust.name} ji 🙏\n\nEggFlow Billing ki taraf se aapka baaqi hisaab:\n💰 Due: ${formatINR(cust.dueAmount)}\n📦 Pending Trays: ${cust.pendingTrays}\n\nKripya jaldi payment clear karwayein. Dhanyawad!`;
    window.open(`https://wa.me/91${phone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const field = (key: keyof CustomerFormData, val: string) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const khataCustomer = customers.find((c) => c.id === khataCustId);
  const khataBills = khataCustId
    ? bills.filter((b) => b.customerId === khataCustId)
    : [];

  return (
    <div className="space-y-8 max-w-3xl">

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-brand-dark tracking-tight">
            Customer Accounts
          </h1>
          <p className="text-sm text-brand-muted mt-1">
            Rates, baaqi, trays aur khata — sabhi kuch ek jagah
          </p>
        </div>
        <Button
          variant="primary"
          onClick={openAdd}
          className="font-extrabold text-sm h-11 px-5 shadow-xs shrink-0"
        >
          <Plus className="h-4 w-4 mr-2" />
          Naya Grahak Add Karein
        </Button>
      </div>

      {/* ── KPI Row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-border p-5">
          <p className="text-xs font-bold text-brand-muted uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <IndianRupee className="h-3.5 w-3.5 text-red-500" />
            Market Baaqi (Due)
          </p>
          <p className="text-3xl font-black text-red-600 tabular-nums">
            {formatINR(totalMarketDue)}
          </p>
          <p className="text-xs text-brand-muted mt-1">{dueCustCount} grahak se lena bacha hai</p>
        </div>

        <div className="bg-white rounded-2xl border border-border p-5">
          <p className="text-xs font-bold text-brand-muted uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-brand-teal" />
            Trays Market Mein
          </p>
          <p className="text-3xl font-black text-brand-dark tabular-nums">
            {totalPendingTrays}
            <span className="text-base font-semibold text-brand-muted ml-1">Trays</span>
          </p>
          <p className="text-xs text-brand-muted mt-1">
            ≈ {(totalPendingTrays * 30).toLocaleString()} ande wapas aane baaqi
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-border p-5">
          <p className="text-xs font-bold text-brand-muted uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            Clear Accounts
          </p>
          <p className="text-3xl font-black text-emerald-700 tabular-nums">
            {customers.length - dueCustCount}
            <span className="text-base font-semibold text-brand-muted ml-1">/ {customers.length}</span>
          </p>
          <p className="text-xs text-brand-muted mt-1">Inka koi baaqi nahi hai</p>
        </div>
      </div>

      {/* ── Search + Filter Bar ── */}
      <div className="flex flex-col gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-muted pointer-events-none" />
          <input
            type="text"
            placeholder="Naam, phone, ya area se dhundein…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-12 pl-11 pr-4 rounded-2xl border border-border bg-white text-sm text-brand-dark placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-teal/50 shadow-xs"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-2">
          {[
            { id: "ALL", label: `Sabhi (${customers.length})` },
            {
              id: "DUE",
              label: `Baaqi Wale (${dueCustCount})`,
              activeClass: "bg-red-500 text-white",
            },
            {
              id: "TRAYS",
              label: `Trays Baaqi (${customers.filter((c) => c.pendingTrays > 0).length})`,
            },
            {
              id: "CLEAR",
              label: `Clear (${customers.length - dueCustCount})`,
              activeClass: "bg-emerald-600 text-white",
            },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setCustFilter(f.id as typeof custFilter)}
              className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                custFilter === f.id
                  ? (f.activeClass || "bg-brand-teal text-white")
                  : "bg-white border border-border text-brand-dark/80 hover:bg-brand-cream"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Customer Card List ── */}
      {filteredCustomers.length === 0 ? (
        <div className="py-20 text-center text-brand-muted bg-white rounded-2xl border border-dashed border-border">
          <Users className="h-10 w-10 mx-auto mb-3 text-brand-muted/40" />
          <p className="font-bold text-base">Koi grahak nahi mila</p>
          <p className="text-sm mt-1">Search ya filter badal kar dekhein</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredCustomers.map((cust) => {
            const isExpanded = Boolean(expandedCards[cust.id]);
            const custBills = bills.filter((b) => b.customerId === cust.id);

            return (
              <div
                key={cust.id}
                className={`bg-white rounded-2xl border transition-all ${
                  isExpanded
                    ? "border-brand-teal/60 shadow-md"
                    : "border-border hover:border-brand-teal/30 hover:shadow-sm"
                }`}
              >
                {/* ── Card Top Row ── */}
                <div className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4 justify-between">

                    {/* Left: Identity */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <h3 className="text-lg font-black text-brand-dark leading-snug">
                          {cust.name}
                        </h3>
                        {cust.dueAmount > 0 ? (
                          <span className="text-xs font-black px-2.5 py-1 rounded-full bg-red-50 text-red-700 border border-red-200">
                            Due: {formatINR(cust.dueAmount)}
                          </span>
                        ) : (
                          <span className="text-xs font-black px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            ✓ Clear
                          </span>
                        )}
                        {cust.pendingTrays > 0 && (
                          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                            {cust.pendingTrays} Trays
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-sm text-brand-muted">
                        {cust.area && (
                          <span className="flex items-center gap-1.5 font-medium">
                            <MapPin className="h-3.5 w-3.5 text-brand-teal shrink-0" />
                            {cust.area}
                          </span>
                        )}
                        {cust.phone && (
                          <a
                            href={`tel:${cust.phone}`}
                            className="flex items-center gap-1.5 font-bold text-brand-ocean hover:underline"
                          >
                            <Phone className="h-3.5 w-3.5 shrink-0" />
                            {cust.phone}
                          </a>
                        )}
                        {custBills.length > 0 && (
                          <span className="text-brand-muted/70">
                            {custBills.length} Bills
                          </span>
                        )}
                      </div>

                      {cust.notes && (
                        <p className="text-xs text-brand-muted italic mt-2">
                          📝 {cust.notes}
                        </p>
                      )}
                    </div>

                    {/* Right: Primary Actions */}
                    <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0">
                      {/* WhatsApp Reminder */}
                      {cust.phone && cust.dueAmount > 0 && (
                        <button
                          onClick={() => sendWhatsApp(cust)}
                          title="WhatsApp Reminder Bhejein"
                          className="h-10 w-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center hover:bg-emerald-100 active:scale-95 transition-all"
                        >
                          <MessageCircle className="h-4.5 w-4.5" />
                        </button>
                      )}

                      {/* Edit */}
                      <button
                        onClick={() => openEdit(cust)}
                        className="h-10 w-10 rounded-xl bg-brand-cream border border-border text-brand-muted hover:text-brand-dark hover:bg-brand-ice/50 flex items-center justify-center transition-all"
                        title="Profile edit karein"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>

                      {/* Collect Payment */}
                      {cust.dueAmount > 0 ? (
                        <button
                          onClick={() => openCollect(cust)}
                          className="h-10 px-4 rounded-xl bg-brand-teal text-white text-sm font-extrabold flex items-center gap-1.5 hover:bg-brand-teal/90 active:scale-95 transition-all shadow-xs"
                        >
                          <IndianRupee className="h-4 w-4" />
                          Collect
                        </button>
                      ) : (
                        <span className="h-10 px-4 rounded-xl bg-emerald-50 text-emerald-700 text-sm font-bold flex items-center gap-1.5 border border-emerald-200">
                          <CheckCircle2 className="h-4 w-4" />
                          Clear
                        </span>
                      )}
                    </div>
                  </div>

                  {/* ── Rates Preview Strip (Always Visible) ── */}
                  <div className="mt-4 pt-4 border-t border-border/60 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap gap-2">
                      {eggTypes.map((et) => {
                        const rate = cust.rates?.[et.id] ?? et.defaultRate;
                        const isCustom = cust.rates?.[et.id] !== undefined;
                        return (
                          <span
                            key={et.id}
                            className={`text-xs px-3 py-1.5 rounded-full font-bold tabular-nums ${
                              isCustom
                                ? "bg-brand-ice text-brand-teal border border-brand-teal/30"
                                : "bg-brand-cream text-brand-dark/70 border border-border"
                            }`}
                          >
                            {et.name}: ₹{rate.toFixed(2)}
                          </span>
                        );
                      })}
                    </div>

                    {/* Expand / Collapse Toggle */}
                    <button
                      onClick={() => toggleExpand(cust.id)}
                      className="flex items-center gap-1.5 text-sm font-extrabold text-brand-teal hover:underline ml-auto transition-all"
                    >
                      {isExpanded ? (
                        <>Band Karein <ChevronUp className="h-4 w-4" /></>
                      ) : (
                        <>Details & Khata <ChevronDown className="h-4 w-4" /></>
                      )}
                    </button>
                  </div>
                </div>

                {/* ── Expandable Details Section ── */}
                {isExpanded && (
                  <div className="border-t border-border bg-brand-cream/30 rounded-b-2xl p-5 space-y-6">

                    {/* Rate Cards */}
                    <div>
                      <h4 className="text-sm font-black text-brand-dark mb-3 flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-brand-teal" />
                        Custom Rate Card
                        <span className="text-xs font-normal text-brand-muted ml-1">(Click rate to edit)</span>
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {eggTypes.map((et) => {
                          const currentRate = cust.rates?.[et.id] ?? et.defaultRate;
                          const isCustom = cust.rates?.[et.id] !== undefined;
                          const isEditing =
                            editingRate?.custId === cust.id &&
                            editingRate?.eggTypeId === et.id;

                          return (
                            <div
                              key={et.id}
                              className="bg-white rounded-xl border border-border p-4 flex items-center justify-between gap-4"
                            >
                              <div>
                                <p className="font-extrabold text-sm text-brand-dark">
                                  {et.name}
                                </p>
                                <p className="text-xs text-brand-muted mt-0.5">
                                  Tray = ₹{(currentRate * et.eggsPerTray).toFixed(1)} &nbsp;•&nbsp; {et.eggsPerTray} pcs
                                </p>
                                {isCustom && (
                                  <span className="text-[10px] font-bold text-brand-teal uppercase tracking-wide mt-0.5 block">
                                    Custom Rate
                                  </span>
                                )}
                              </div>

                              {isEditing ? (
                                <div className="flex items-center gap-2">
                                  <input
                                    type="number"
                                    step="0.05"
                                    value={editingRate.value}
                                    onChange={(e) =>
                                      setEditingRate({ ...editingRate, value: e.target.value })
                                    }
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") handleSaveRate();
                                      if (e.key === "Escape") setEditingRate(null);
                                    }}
                                    className="h-9 w-20 rounded-lg border border-brand-teal px-2 text-sm font-black text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-teal/40"
                                    autoFocus
                                  />
                                  <button
                                    onClick={handleSaveRate}
                                    className="text-sm font-black text-emerald-700 hover:underline px-1"
                                  >
                                    ✓ Save
                                  </button>
                                  <button
                                    onClick={() => setEditingRate(null)}
                                    className="text-sm text-brand-muted hover:underline"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() =>
                                    setEditingRate({
                                      custId: cust.id,
                                      eggTypeId: et.id,
                                      value: currentRate.toFixed(2),
                                    })
                                  }
                                  className="flex items-center gap-1.5 font-black text-xl text-brand-teal hover:underline tabular-nums"
                                >
                                  ₹{currentRate.toFixed(2)}
                                  <Pencil className="h-3.5 w-3.5 text-brand-muted" />
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Recent Bills */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-black text-brand-dark flex items-center gap-2">
                          <Receipt className="h-4 w-4 text-brand-ocean" />
                          Recent Bills
                          <span className="text-xs font-normal text-brand-muted">
                            ({custBills.length} total)
                          </span>
                        </h4>
                        {custBills.length > 3 && (
                          <button
                            onClick={() => setKhataCustId(cust.id)}
                            className="text-sm font-bold text-brand-teal hover:underline flex items-center gap-1"
                          >
                            Pura Khata <ExternalLink className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>

                      {custBills.length === 0 ? (
                        <div className="p-6 rounded-xl border border-dashed border-border text-center text-sm text-brand-muted bg-white">
                          Is grahak ka abhi tak koi bill nahi bana.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {custBills.slice(0, 3).map((bill) => (
                            <div
                              key={bill.id}
                              className="flex items-center justify-between bg-white rounded-xl border border-border px-4 py-3"
                            >
                              <div>
                                <p className="font-bold text-sm text-brand-dark">
                                  #{bill.billNo}
                                </p>
                                <p className="text-xs text-brand-muted mt-0.5">
                                  {bill.createdAt ? bill.createdAt.split("T")[0] : "Today"}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-black text-sm text-brand-dark tabular-nums">
                                  {formatINR(bill.totalAmount)}
                                </p>
                                <p
                                  className={`text-xs font-bold mt-0.5 ${
                                    bill.dueAmount > 0 ? "text-red-500" : "text-emerald-600"
                                  }`}
                                >
                                  {bill.dueAmount > 0
                                    ? `Due: ${formatINR(bill.dueAmount)}`
                                    : "✓ Paid"}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Expanded Footer Actions */}
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-border/60">
                      <button
                        onClick={() => openEdit(cust)}
                        className="h-10 px-4 rounded-xl border border-border bg-white text-sm font-bold text-brand-dark hover:bg-brand-cream flex items-center gap-2 transition-all"
                      >
                        <Pencil className="h-4 w-4" /> Profile Edit Karein
                      </button>
                      <button
                        onClick={() => setKhataCustId(cust.id)}
                        className="h-10 px-4 rounded-xl border border-brand-teal/30 bg-brand-ice/40 text-sm font-bold text-brand-teal hover:bg-brand-ice flex items-center gap-2 transition-all"
                      >
                        <Receipt className="h-4 w-4" /> Pura Khata Kholein
                      </button>
                      {cust.dueAmount > 0 && (
                        <button
                          onClick={() => openCollect(cust)}
                          className="h-10 px-5 rounded-xl bg-brand-teal text-white text-sm font-extrabold flex items-center gap-2 hover:bg-brand-teal/90 shadow-xs transition-all ml-auto"
                        >
                          <IndianRupee className="h-4 w-4" /> Payment Collect Karein
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Full Khata Drawer ── */}
      {khataCustomer && (
        <Drawer
          open={Boolean(khataCustId)}
          onClose={() => setKhataCustId(null)}
          title={`Khata: ${khataCustomer.name}`}
          subtitle={`${khataCustomer.phone} · ${khataCustomer.area} · Due: ${formatINR(khataCustomer.dueAmount)}`}
          footer={
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setKhataCustId(null)}
                className="flex-1 font-bold"
              >
                Close
              </Button>
              {khataCustomer.dueAmount > 0 && (
                <Button
                  variant="mint"
                  onClick={() => {
                    openCollect(khataCustomer);
                    setKhataCustId(null);
                  }}
                  className="flex-1 font-black"
                >
                  Collect {formatINR(khataCustomer.dueAmount)}
                </Button>
              )}
            </div>
          }
        >
          <div className="space-y-5">
            {/* Summary */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200">
                <p className="text-xs font-bold text-rose-700 uppercase tracking-wider mb-1">Kul Baaqi</p>
                <p className="text-2xl font-black text-red-600 tabular-nums">
                  {formatINR(khataCustomer.dueAmount)}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                <p className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-1">Trays Market</p>
                <p className="text-2xl font-black text-amber-900 tabular-nums">
                  {khataCustomer.pendingTrays} <span className="text-sm font-semibold">Trays</span>
                </p>
              </div>
            </div>

            {/* Rates */}
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-brand-muted mb-2">Rates</p>
              <div className="grid grid-cols-2 gap-2">
                {eggTypes.map((et) => {
                  const rate = khataCustomer.rates?.[et.id] ?? et.defaultRate;
                  return (
                    <div key={et.id} className="p-3 rounded-xl bg-brand-cream/70 border border-border">
                      <p className="text-xs font-bold text-brand-dark">{et.name}</p>
                      <p className="text-lg font-black text-brand-teal tabular-nums">
                        ₹{rate.toFixed(2)}
                        <span className="text-xs font-normal text-brand-muted ml-1">/ anda</span>
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* All Bills */}
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-brand-muted mb-2">
                Pura Billing History ({khataBills.length} Bills)
              </p>
              {khataBills.length === 0 ? (
                <div className="p-8 rounded-xl border border-dashed border-border text-center text-sm text-brand-muted">
                  Koi bill nahi.
                </div>
              ) : (
                <div className="space-y-2">
                  {khataBills.map((b) => {
                    const totalEggs = b.items.reduce((s, it) => s + it.qtyEggs, 0);
                    return (
                      <div
                        key={b.id}
                        className="p-4 rounded-xl bg-white border border-border"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <span className="font-extrabold text-sm text-brand-dark">
                              #{b.billNo}
                            </span>
                            <span className="text-xs text-brand-muted ml-2">
                              {b.createdAt ? b.createdAt.split("T")[0] : "-"}
                            </span>
                          </div>
                          <span
                            className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                              b.dueAmount > 0
                                ? "bg-rose-50 text-rose-700 border border-rose-200"
                                : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            }`}
                          >
                            {b.dueAmount > 0 ? `Due: ${formatINR(b.dueAmount)}` : "✓ Paid"}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs text-brand-muted">
                          <span>
                            {Math.floor(totalEggs / 30)} Trays · {totalEggs} eggs
                          </span>
                          <span className="font-black text-brand-dark text-sm tabular-nums">
                            {formatINR(b.totalAmount)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </Drawer>
      )}

      {/* ── Collect Payment Drawer ── */}
      {payTargetCust && (
        <Drawer
          open={Boolean(payTargetCust)}
          onClose={() => setPayTargetCust(null)}
          title="Payment Collect Karein"
          subtitle={`${payTargetCust.name} · Baaqi: ${formatINR(payTargetCust.dueAmount)}`}
          footer={
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setPayTargetCust(null)}
                className="flex-1 font-bold"
              >
                Cancel
              </Button>
              <Button
                variant="mint"
                onClick={handleCollectPayment}
                className="flex-1 font-black"
              >
                ✓ Collect {payAmount ? formatINR(parseFloat(payAmount) || 0) : ""}
              </Button>
            </div>
          }
        >
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-brand-dark mb-2">
                Amount (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min={1}
                placeholder="Amount enter karein"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                autoFocus
                className="w-full h-14 px-4 rounded-2xl border border-border text-2xl font-black text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-teal/50"
              />

              {/* Quick presets */}
              {payTargetCust.dueAmount > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  <button
                    type="button"
                    onClick={() => setPayAmount(String(payTargetCust.dueAmount))}
                    className="px-4 py-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-sm font-black hover:bg-emerald-100 transition-colors"
                  >
                    Full Due ({formatINR(payTargetCust.dueAmount)})
                  </button>
                  {[500, 1000, 2000, 5000].map((amt) => {
                    if (amt >= payTargetCust.dueAmount) return null;
                    return (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setPayAmount(String(amt))}
                        className="px-4 py-2 rounded-xl bg-white border border-border text-brand-dark text-sm font-bold hover:bg-brand-cream transition-colors"
                      >
                        ₹{amt}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Payment mode */}
            <div>
              <label className="block text-sm font-bold text-brand-dark mb-2">
                Payment Mode <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                {(["CASH", "ONLINE"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setPayMode(m)}
                    className={`py-4 rounded-xl text-sm font-bold border transition-all ${
                      payMode === m
                        ? "bg-brand-teal text-white border-brand-teal shadow-sm"
                        : "border-border text-brand-dark bg-white hover:bg-brand-cream"
                    }`}
                  >
                    {m === "CASH" ? "💵 Cash" : "📲 Online / UPI"}
                  </button>
                ))}
              </div>
            </div>

            {/* Remaining preview */}
            {payAmount && (
              <div className="p-4 rounded-xl bg-brand-cream border border-border text-sm">
                <p className="font-bold text-brand-dark">Ke baad bacha hua:</p>
                <p className="text-brand-muted mt-0.5">
                  Remaining Due:{" "}
                  <span className="font-black text-red-600 tabular-nums text-base">
                    {formatINR(
                      Math.max(0, payTargetCust.dueAmount - (parseFloat(payAmount) || 0))
                    )}
                  </span>
                </p>
              </div>
            )}
          </div>
        </Drawer>
      )}

      {/* ── Add / Edit Customer Drawer ── */}
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editingId ? "Customer Edit Karein" : "Naya Grahak Register Karein"}
        subtitle={
          editingId ? "Details update karein" : "Naye grahak ka account create karein"
        }
        footer={
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setDrawerOpen(false)}
              className="flex-1 font-bold"
            >
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSave} className="flex-1 font-black">
              {editingId ? "Save Changes" : "Add Customer"}
            </Button>
          </div>
        }
      >
        <div className="space-y-5">
          <FormField label="Customer / Shop Name" required error={errors.name}>
            <Input
              placeholder="e.g. Sharma Bakers & Cafe"
              value={form.name}
              onChange={(e) => field("name", e.target.value)}
              className={`h-11 ${errors.name ? "border-red-400" : ""}`}
            />
          </FormField>

          <FormField
            label="Phone Number"
            error={errors.phone}
            hint="10-digit mobile number"
          >
            <Input
              placeholder="9876543210"
              value={form.phone}
              onChange={(e) =>
                field("phone", e.target.value.replace(/\D/g, "").slice(0, 10))
              }
              className={`h-11 ${errors.phone ? "border-red-400" : ""}`}
            />
          </FormField>

          <FormField label="Area / Address">
            <Input
              placeholder="e.g. Station Road, Near Railway Crossing"
              value={form.area}
              onChange={(e) => field("area", e.target.value)}
              className="h-11"
            />
          </FormField>

          {!editingId && (
            <FormField
              label="Opening Due (₹)"
              error={errors.openingDue}
              hint="Pehle se jo purana baaqi hisaab hai woh daalo"
            >
              <Input
                type="number"
                min={0}
                placeholder="0"
                value={form.openingDue}
                onChange={(e) => field("openingDue", e.target.value)}
                className={`h-11 ${errors.openingDue ? "border-red-400" : ""}`}
              />
            </FormField>
          )}

          <FormField label="Notes (optional)">
            <textarea
              placeholder="Koi special note, landmark ya timing..."
              value={form.notes}
              onChange={(e) => field("notes", e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-brand-dark placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-teal/50 resize-none"
            />
          </FormField>
        </div>
      </Drawer>
    </div>
  );
}
