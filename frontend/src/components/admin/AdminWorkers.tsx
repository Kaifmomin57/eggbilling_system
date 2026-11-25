"use client";

import React, { useState } from "react";
import { useStore } from "@/lib/store";
import { Worker } from "@/lib/mock-data";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Drawer, ConfirmModal, FormField } from "@/components/ui/drawer";
import { Plus, Phone, Pencil, Trash2, Users2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

type WorkerFormData = {
  name: string;
  phone: string;
  pin: string;
  role: "DELIVERY" | "MANAGER";
  isActive: boolean;
};

const emptyForm: WorkerFormData = {
  name: "",
  phone: "",
  pin: "",
  role: "DELIVERY",
  isActive: true,
};

function validate(form: WorkerFormData, isEdit: boolean): Record<string, string> {
  const errs: Record<string, string> = {};
  if (!form.name.trim() || form.name.trim().length < 2) errs.name = "Name must be at least 2 characters";
  if (!/^\d{10}$/.test(form.phone.trim())) errs.phone = "Phone must be exactly 10 digits";
  if (!isEdit && (form.pin.length < 4 || form.pin.length > 6)) errs.pin = "PIN must be 4–6 digits";
  if (isEdit && form.pin && (form.pin.length < 4 || form.pin.length > 6)) errs.pin = "PIN must be 4–6 digits";
  return errs;
}

export function AdminWorkers() {
  const { workers, addWorker, updateWorker, deleteWorker } = useStore();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<WorkerFormData>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const visibleWorkers = workers.filter((w) => !w.isDeleted);

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setErrors({});
    setDrawerOpen(true);
  };

  const openEdit = (w: Worker) => {
    setEditingId(w.id);
    setForm({ name: w.name, phone: w.phone, pin: "", role: w.role, isActive: w.isActive });
    setErrors({});
    setDrawerOpen(true);
  };

  const handleSave = () => {
    const errs = validate(form, !!editingId);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    if (editingId) {
      updateWorker(editingId, {
        name: form.name.trim(),
        phone: form.phone.trim(),
        role: form.role,
        isActive: form.isActive,
        ...(form.pin ? { pin: form.pin } : {}),
      });
      toast.success("Worker updated!");
    } else {
      addWorker({
        name: form.name.trim(),
        phone: form.phone.trim(),
        pin: form.pin,
        role: form.role,
        isActive: true,
        joinedDate: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
      });
      toast.success("Worker added successfully!");
    }
    setDrawerOpen(false);
  };

  const handleDelete = (id: string) => {
    deleteWorker(id);
    setConfirmDeleteId(null);
    toast.success("Worker removed. All their bills & trips are preserved.");
  };

  const field = (key: keyof WorkerFormData, val: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-brand-dark tracking-tight">
            Delivery Workers
          </h1>
          <p className="text-xs text-brand-muted">
            Manage workers, roles, PINs and status — {visibleWorkers.filter((w) => w.isActive).length} active
          </p>
        </div>
        <Button variant="primary" onClick={openAdd} className="font-bold text-xs h-10">
          <Plus className="h-4 w-4 mr-1.5" />
          <span>+ Add Worker</span>
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
        {[
          { label: "Total Workers", value: visibleWorkers.length, color: "text-brand-dark" },
          { label: "Active Today", value: visibleWorkers.filter((w) => w.isActive).length, color: "text-[#184d28]" },
          { label: "Managers", value: visibleWorkers.filter((w) => w.role === "MANAGER").length, color: "text-brand-teal" },
        ].map((s) => (
          <Card key={s.label} className="p-3 sm:p-4 bg-white border border-border text-center shadow-xs">
            <p className={`text-xl sm:text-2xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-[10px] sm:text-xs text-brand-muted mt-0.5">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* Mobile Workers Cards View (Hidden on Desktop) */}
      <div className="md:hidden space-y-2.5">
        {visibleWorkers.map((w) => (
          <Card key={w.id} className="p-3.5 bg-white border border-border shadow-xs">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-brand-ice/60 flex items-center justify-center text-brand-teal font-black text-sm shrink-0">
                  {w.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-brand-dark text-sm">{w.name}</h3>
                  <a
                    href={`tel:${w.phone}`}
                    className="flex items-center gap-1 text-xs text-brand-teal font-semibold mt-0.5 hover:underline"
                  >
                    <Phone className="h-3 w-3" />
                    {w.phone}
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <Badge variant={w.isActive ? "mint" : "outline"} className="text-[10px] font-bold">
                  {w.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-border flex items-center justify-between text-xs">
              <Badge variant={w.role === "MANAGER" ? "secondary" : "ice"} className="font-bold text-[10px]">
                {w.role === "MANAGER" ? (
                  <><ShieldCheck className="h-3 w-3 mr-1" />Manager</>
                ) : (
                  <><Users2 className="h-3 w-3 mr-1" />Delivery</>
                )}
              </Badge>

              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openEdit(w)}
                  className="h-8 px-2.5 text-xs font-bold"
                >
                  <Pencil className="h-3.5 w-3.5 mr-1" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setConfirmDeleteId(w.id)}
                  className="h-8 px-2 text-xs text-red-500 hover:bg-red-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </Card>
        ))}

        {visibleWorkers.length === 0 && (
          <div className="p-8 text-center text-xs text-brand-muted bg-white rounded-2xl border border-dashed border-border">
            No workers added yet. Click &quot;+ Add Worker&quot; to get started.
          </div>
        )}
      </div>

      {/* Desktop Workers Table (Hidden on Mobile) */}
      <Card className="hidden md:block bg-white border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-brand-cream text-brand-muted text-xs uppercase font-bold border-b border-border">
              <tr>
                <th className="p-4">Worker</th>
                <th className="p-4">Phone</th>
                <th className="p-4">Role</th>
                <th className="p-4">Status</th>
                <th className="p-4">Joined</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {visibleWorkers.map((w) => (
                <tr key={w.id} className="hover:bg-brand-cream/40 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-brand-ice/60 flex items-center justify-center text-brand-teal font-black text-sm shrink-0">
                        {w.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-brand-dark text-sm">{w.name}</p>
                        <p className="text-[11px] text-brand-muted">PIN: ••••</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="flex items-center gap-1.5 text-xs text-brand-muted">
                      <Phone className="h-3.5 w-3.5" />
                      {w.phone}
                    </span>
                  </td>
                  <td className="p-4">
                    <Badge variant={w.role === "MANAGER" ? "secondary" : "ice"} className="font-bold text-[11px]">
                      {w.role === "MANAGER" ? (
                        <><ShieldCheck className="h-3 w-3 mr-1" />Manager</>
                      ) : (
                        <><Users2 className="h-3 w-3 mr-1" />Delivery</>
                      )}
                    </Badge>
                  </td>
                  <td className="p-4">
                    <Badge variant={w.isActive ? "mint" : "outline"} className="font-bold text-[11px]">
                      {w.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="p-4 text-xs text-brand-muted">{w.joinedDate}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => openEdit(w)}
                        className="p-2 rounded-lg hover:bg-brand-ice/40 text-brand-muted hover:text-brand-teal transition-colors"
                        title="Edit Worker"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(w.id)}
                        className="p-2 rounded-lg hover:bg-red-50 text-brand-muted hover:text-red-500 transition-colors"
                        title="Remove Worker"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {visibleWorkers.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-sm text-brand-muted">
                    No workers added yet. Click &quot;+ Add Worker&quot; to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add/Edit Drawer */}
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editingId ? "Edit Worker" : "Add New Worker"}
        subtitle={editingId ? "Update worker details below" : "Fill in details to register a new delivery worker"}
        footer={
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setDrawerOpen(false)} className="flex-1 font-bold text-sm">
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSave} className="flex-1 font-bold text-sm">
              {editingId ? "Save Changes" : "Add Worker"}
            </Button>
          </div>
        }
      >
        <FormField label="Full Name" required error={errors.name}>
          <Input
            placeholder="e.g. Raju Kumar"
            value={form.name}
            onChange={(e) => field("name", e.target.value)}
            className={errors.name ? "border-red-400 focus:ring-red-400" : ""}
          />
        </FormField>

        <FormField label="Phone Number" required error={errors.phone} hint="10-digit mobile number">
          <Input
            placeholder="9876543210"
            value={form.phone}
            onChange={(e) => field("phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
            className={errors.phone ? "border-red-400 focus:ring-red-400" : ""}
          />
        </FormField>

        <FormField
          label={editingId ? "New PIN (optional)" : "PIN"}
          required={!editingId}
          error={errors.pin}
          hint={editingId ? "Leave blank to keep existing PIN" : "4–6 digit PIN for worker login"}
        >
          <Input
            type="password"
            placeholder="••••"
            value={form.pin}
            onChange={(e) => field("pin", e.target.value.replace(/\D/g, "").slice(0, 6))}
            className={errors.pin ? "border-red-400 focus:ring-red-400" : ""}
          />
        </FormField>

        <FormField label="Role" required>
          <div className="flex gap-2">
            {(["DELIVERY", "MANAGER"] as const).map((r) => (
              <button
                key={r}
                onClick={() => field("role", r)}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                  form.role === r
                    ? "bg-brand-teal text-white border-brand-teal"
                    : "border-border text-brand-muted hover:border-brand-ocean hover:text-brand-dark bg-white"
                }`}
              >
                {r === "DELIVERY" ? "🚛 Delivery" : "🛡️ Manager"}
              </button>
            ))}
          </div>
        </FormField>

        {editingId && (
          <FormField label="Status">
            <div className="flex gap-2">
              {[
                { val: true, label: "✅ Active" },
                { val: false, label: "⛔ Inactive" },
              ].map((opt) => (
                <button
                  key={String(opt.val)}
                  onClick={() => field("isActive", opt.val)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                    form.isActive === opt.val
                      ? opt.val
                        ? "bg-brand-mint/40 text-[#184d28] border-brand-mint"
                        : "bg-red-50 text-red-600 border-red-200"
                      : "border-border text-brand-muted bg-white hover:bg-brand-cream"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </FormField>
        )}
      </Drawer>

      {/* Confirm Delete */}
      <ConfirmModal
        open={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={() => confirmDeleteId && handleDelete(confirmDeleteId)}
        title="Remove Worker?"
        description="Is worker ki saari purani trips aur bills safe rahengi. Worker sirf inactive ho jayega — permanently delete nahi hoga."
        confirmLabel="Haan, Remove Karo"
        confirmVariant="danger"
      />
    </div>
  );
}
