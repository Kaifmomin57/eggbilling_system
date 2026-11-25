"use client";

import React from "react";
import { Home, PlusCircle, Receipt, ClipboardCheck, Truck } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

export type WorkerTab = "home" | "new-bill" | "bills" | "trips" | "count";

interface WorkerBottomNavProps {
  activeTab: WorkerTab;
  setActiveTab: (tab: WorkerTab) => void;
}

export function WorkerBottomNav({ activeTab, setActiveTab }: WorkerBottomNavProps) {
  const { t } = useLanguage();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden border-t border-border/80 bg-white/95 px-2 py-1.5 backdrop-blur-lg shadow-xl safe-area-bottom">
      <div className="mx-auto flex max-w-md items-center justify-between">
        {/* 1. Dashboard / Home */}
        <button
          onClick={() => setActiveTab("home")}
          className={`flex flex-1 flex-col items-center justify-center py-1 transition-all ${
            activeTab === "home"
              ? "text-brand-teal font-black"
              : "text-brand-muted hover:text-brand-dark"
          }`}
        >
          <Home className={`h-5 w-5 transition-transform ${activeTab === "home" ? "scale-110" : ""}`} />
          <span className="text-[10px] mt-0.5 tracking-tight font-bold">{t("dashboard")}</span>
        </button>

        {/* 2. Bills */}
        <button
          onClick={() => setActiveTab("bills")}
          className={`flex flex-1 flex-col items-center justify-center py-1 transition-all ${
            activeTab === "bills"
              ? "text-brand-teal font-black"
              : "text-brand-muted hover:text-brand-dark"
          }`}
        >
          <Receipt className={`h-5 w-5 transition-transform ${activeTab === "bills" ? "scale-110" : ""}`} />
          <span className="text-[10px] mt-0.5 tracking-tight font-bold">{t("bills")}</span>
        </button>

        {/* 3. Center Floating Action: + New Bill */}
        <button
          onClick={() => setActiveTab("new-bill")}
          className="flex flex-col items-center -mt-5 px-1 group focus:outline-none shrink-0"
        >
          <div className="flex h-13 w-13 items-center justify-center rounded-full bg-brand-teal text-white shadow-lg transition-transform group-active:scale-95 border-3 border-white ring-2 ring-brand-teal/20">
            <PlusCircle className="h-7 w-7 stroke-[2.4]" />
          </div>
          <span
            className={`text-[10px] mt-0.5 font-extrabold ${
              activeTab === "new-bill" ? "text-brand-teal" : "text-brand-dark"
            }`}
          >
            {t("newBill")}
          </span>
        </button>

        {/* 4. Trips */}
        <button
          onClick={() => setActiveTab("trips")}
          className={`flex flex-1 flex-col items-center justify-center py-1 transition-all ${
            activeTab === "trips"
              ? "text-brand-teal font-black"
              : "text-brand-muted hover:text-brand-dark"
          }`}
        >
          <Truck className={`h-5 w-5 transition-transform ${activeTab === "trips" ? "scale-110" : ""}`} />
          <span className="text-[10px] mt-0.5 tracking-tight font-bold">Trips</span>
        </button>

        {/* 5. Closing Count */}
        <button
          onClick={() => setActiveTab("count")}
          className={`flex flex-1 flex-col items-center justify-center py-1 transition-all ${
            activeTab === "count"
              ? "text-brand-teal font-black"
              : "text-brand-muted hover:text-brand-dark"
          }`}
        >
          <ClipboardCheck className={`h-5 w-5 transition-transform ${activeTab === "count" ? "scale-110" : ""}`} />
          <span className="text-[10px] mt-0.5 tracking-tight font-bold">Hisaab</span>
        </button>
      </div>
    </nav>
  );
}

