"use client";

import React from "react";
import { useStore } from "@/lib/store";
import { useLanguage } from "@/lib/i18n";
import { AdminDashboard } from "./AdminDashboard";
import { AdminCustomers } from "./AdminCustomers";
import { AdminRates } from "./AdminRates";
import { AdminStock } from "./AdminStock";
import { AdminDamage } from "./AdminDamage";
import { AdminTrips } from "./AdminTrips";
import { AdminWorkers } from "./AdminWorkers";
import {
  LayoutDashboard,
  Truck,
  Users,
  Tag,
  Package,
  ShieldAlert,
  Users2,
  Layers,
} from "lucide-react";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type AdminTab = "dashboard" | "trips" | "customers" | "rates" | "stock" | "damage" | "workers";

export function AdminLayout() {
  const { t } = useLanguage();
  const {
    trips,
    damages,
    customers,
    workers,
    eggTypes,
    adminTab: activeTab,
    setAdminTab: setActiveTab,
    setMobileMenuOpen,
  } = useStore();

  // Dynamic live badges
  const liveTripsCount = trips.filter((t) => t.status === "OUT").length;
  const pendingDamageCount = damages.filter((d) => d.status === "PENDING").length;
  const lowStockCount = eggTypes.filter((e) => e.currentStockTrays < 100).length;
  const activeWorkersCount = workers.filter((w) => w.isActive && !w.isDeleted).length;
  const totalGodownTrays = eggTypes.reduce((acc, e) => acc + e.currentStockTrays, 0);

  const navItems = [
    {
      id: "dashboard" as const,
      label: t("dashboard"),
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: "trips" as const,
      label: t("trips"),
      icon: Truck,
      badge: liveTripsCount > 0 ? `${liveTripsCount} Live` : null,
      badgeVariant: "mint" as const,
    },
    {
      id: "customers" as const,
      label: t("customers"),
      icon: Users,
      badge: customers.length > 0 ? `${customers.length}` : null,
      badgeVariant: "secondary" as const,
    },
    {
      id: "rates" as const,
      label: "Rates & Products",
      icon: Tag,
      badge: eggTypes.length > 0 ? `${eggTypes.length}` : null,
      badgeVariant: "secondary" as const,
    },
    {
      id: "stock" as const,
      label: t("stock"),
      icon: Package,
      badge: lowStockCount > 0 ? "Low!" : null,
      badgeVariant: "warning" as const,
    },
    {
      id: "damage" as const,
      label: t("damage"),
      icon: ShieldAlert,
      badge: pendingDamageCount > 0 ? `${pendingDamageCount} New` : null,
      badgeVariant: "danger" as const,
    },
    {
      id: "workers" as const,
      label: t("workers"),
      icon: Users2,
      badge: activeWorkersCount > 0 ? `${activeWorkersCount}` : null,
      badgeVariant: "secondary" as const,
    },
  ];

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-4rem)] max-w-7xl mx-auto px-3 sm:px-6 py-4 md:py-6 gap-4 md:gap-6">
      {/* ── Desktop Sidebar / Mobile Nav Strip ── */}
      <aside className="w-full md:w-64 shrink-0">
        {/* Desktop Sidebar Card */}
        <div className="hidden md:flex flex-col justify-between sticky top-20 p-3 rounded-2xl bg-white border border-border shadow-xs min-h-[calc(100vh-7rem)]">
          <div>
            {/* Sidebar Branding / Title */}
            <div className="px-3 py-2 mb-3 border-b border-border/80 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold text-brand-teal uppercase tracking-widest block">
                  {t("shopControl")}
                </span>
                <h2 className="text-sm font-black text-brand-dark">{t("adminConsole")}</h2>
              </div>
              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {t("live")}
              </span>
            </div>

            {/* Nav list */}
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? "bg-brand-teal text-white shadow-sm"
                        : "text-brand-dark/80 hover:text-brand-dark hover:bg-brand-cream/80"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-white" : "text-brand-muted"}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-md font-extrabold ${
                          isActive
                            ? "bg-white/20 text-white"
                            : item.badgeVariant === "mint"
                            ? "bg-emerald-100 text-emerald-800"
                            : item.badgeVariant === "danger"
                            ? "bg-rose-100 text-rose-800 animate-pulse"
                            : item.badgeVariant === "warning"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-brand-ice/60 text-brand-teal"
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Sidebar Bottom Shortcuts */}
          <div className="pt-3 mt-3 border-t border-border space-y-2">
            {/* Quick Godown Stock Snapshot */}
            <div className="bg-brand-cream/70 rounded-xl p-2.5 border border-border/80 text-xs">
              <div className="flex items-center justify-between text-brand-muted mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                  <Layers className="h-3 w-3 text-brand-teal" /> {t("godownStock")}
                </span>
                <span className="text-[10px] text-emerald-700 font-bold">{t("active")}</span>
              </div>
              <p className="font-black text-brand-dark text-sm tabular-nums">
                {totalGodownTrays} {t("traysUnit")} <span className="text-[11px] font-normal text-brand-muted">({(totalGodownTrays * 30).toLocaleString()} {t("eggs").toLowerCase()})</span>
              </p>
            </div>
          </div>
        </div>

        {/* Mobile Header Bar - Spacious & Uncongested (Replaced cramped horizontal strip) */}
        <div className="md:hidden flex items-center justify-between p-3 rounded-2xl bg-white border border-border shadow-xs mb-3">
          <div className="flex items-center gap-2.5">
            {(() => {
              const current = navItems.find((i) => i.id === activeTab) || navItems[0];
              const Icon = current.icon;
              return (
                <>
                  <div className="h-8 w-8 rounded-xl bg-brand-teal/15 text-brand-teal flex items-center justify-center">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-brand-muted uppercase tracking-wider block">
                      {t("adminSection")}
                    </span>
                    <h2 className="text-sm font-black text-brand-dark flex items-center gap-2">
                      {current.label}
                      {current.badge && (
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                            current.badgeVariant === "danger"
                              ? "bg-rose-100 text-rose-800"
                              : current.badgeVariant === "mint"
                              ? "bg-emerald-100 text-emerald-800"
                              : current.badgeVariant === "warning"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-brand-ice text-brand-teal"
                          }`}
                        >
                          {current.badge}
                        </span>
                      )}
                    </h2>
                  </div>
                </>
              );
            })()}
          </div>

          <button
            onClick={() => setMobileMenuOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-cream border border-border text-xs font-black text-brand-dark active:scale-95 transition-transform"
          >
            <span>{t("sections")}</span>
            <span className="text-[10px] bg-brand-teal text-white px-1.5 py-0.5 rounded-md font-bold">☰</span>
          </button>
        </div>
      </aside>

      {/* ── Main Content Area ── */}
      <main className="flex-1 min-w-0">
        {activeTab === "dashboard" && <AdminDashboard />}
        {activeTab === "trips" && <AdminTrips />}
        {activeTab === "customers" && <AdminCustomers />}
        {activeTab === "rates" && <AdminRates />}
        {activeTab === "stock" && <AdminStock />}
        {activeTab === "damage" && <AdminDamage />}
        {activeTab === "workers" && <AdminWorkers />}
      </main>
    </div>
  );
}

