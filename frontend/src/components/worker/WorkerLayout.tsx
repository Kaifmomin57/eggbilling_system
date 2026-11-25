"use client";

import React from "react";
import { useStore } from "@/lib/store";
import { WorkerBottomNav, WorkerTab } from "./WorkerBottomNav";
import { WorkerHome } from "./WorkerHome";
import { NewBillFlow } from "./NewBillFlow";
import { WorkerBills } from "./WorkerBills";
import { WorkerCount } from "./WorkerCount";
import { WorkerTrips } from "./WorkerTrips";
import { useLanguage } from "@/lib/i18n";
import { Home, PlusCircle, Receipt, Truck, ClipboardCheck } from "lucide-react";

export function WorkerLayout() {
  const { workerTab: activeTab, setWorkerTab: setActiveTab } = useStore();
  const { t } = useLanguage();

  const navItems = [
    { id: "home" as const, label: t("dashboard"), icon: Home },
    { id: "new-bill" as const, label: `+ ${t("newBill")}`, icon: PlusCircle, isPrimary: true },
    { id: "bills" as const, label: t("bills"), icon: Receipt },
    { id: "trips" as const, label: "Meri Trips", icon: Truck },
    { id: "count" as const, label: "Hisaab / Closing", icon: ClipboardCheck },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-brand-cream/50 px-3 sm:px-6 py-4 md:py-6">
      {/* Responsive viewport container */}
      <div className="mx-auto w-full max-w-md md:max-w-4xl lg:max-w-5xl">
        {/* Desktop / Laptop Top Tab Navigation (Hidden on Mobile) */}
        <div className="hidden md:flex items-center justify-between mb-6 bg-white p-2 rounded-2xl border border-border/80 shadow-xs">
          <div className="flex items-center gap-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              if (item.isPrimary) return null; // Rendered as featured button on the right
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? "bg-brand-teal text-white shadow-sm"
                      : "text-brand-muted hover:text-brand-dark hover:bg-brand-cream/70"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Quick Create Bill Action on Desktop */}
          <button
            onClick={() => setActiveTab("new-bill")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold shadow-sm transition-all ${
              activeTab === "new-bill"
                ? "bg-brand-ocean text-white ring-2 ring-brand-ocean/40"
                : "bg-brand-teal text-white hover:bg-brand-teal/90"
            }`}
          >
            <PlusCircle className="h-4 w-4 stroke-[2.5]" />
            <span>+ Naya Bill Banayein</span>
          </button>
        </div>

        {/* Content Views */}
        <main className="w-full">
          {activeTab === "home" && (
            <WorkerHome
              onStartNewBill={() => setActiveTab("new-bill")}
              onViewAllBills={() => setActiveTab("bills")}
            />
          )}
          {activeTab === "new-bill" && (
            <NewBillFlow
              onBillCreated={() => setActiveTab("bills")}
              onCancel={() => setActiveTab("home")}
            />
          )}
          {activeTab === "bills" && <WorkerBills />}
          {activeTab === "trips" && <WorkerTrips />}
          {activeTab === "count" && <WorkerCount />}
        </main>

        {/* Sticky Mobile Bottom Navigation (Hidden on Desktop) */}
        <WorkerBottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
    </div>
  );
}

