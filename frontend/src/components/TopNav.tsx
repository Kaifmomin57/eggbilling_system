"use client";

import React, { useEffect } from "react";
import { useStore } from "@/lib/store";
import { useLanguage, Language } from "@/lib/i18n";
import { LanguageSelector } from "./LanguageSelector";
import {
  Egg,
  Truck,
  LogOut,
  ShieldCheck,
  User,
  Menu,
  X,
  LayoutDashboard,
  Users,
  Tag,
  Package,
  ShieldAlert,
  Users2,
  Receipt,
  ClipboardCheck,
  PlusCircle,
  ArrowRight,
  Globe,
  Layers,
  ChevronRight,
} from "lucide-react";

export function TopNav() {
  const {
    currentUser,
    logout,
    trip,
    trips,
    damages,
    customers,
    workers,
    eggTypes,
    activeRole,
    setActiveRole,
    adminTab,
    setAdminTab,
    workerTab,
    setWorkerTab,
    mobileMenuOpen,
    setMobileMenuOpen,
  } = useStore();
  const { t, language, setLanguage } = useLanguage();

  // Prevent background scroll when mobile drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [mobileMenuOpen]);

  // Live dynamic counters for admin badges
  const liveTripsCount = trips.filter((t) => t.status === "OUT").length;
  const pendingDamageCount = damages.filter((d) => d.status === "PENDING").length;
  const lowStockCount = eggTypes.filter((e) => e.currentStockTrays < 100).length;
  const activeWorkersCount = workers.filter((w) => w.isActive && !w.isDeleted).length;
  const totalGodownTrays = eggTypes.reduce((acc, e) => acc + e.currentStockTrays, 0);

  const adminNavItems = [
    { id: "dashboard" as const, label: t("dashboard"), icon: LayoutDashboard, badge: null },
    {
      id: "trips" as const,
      label: t("trips"),
      icon: Truck,
      badge: liveTripsCount > 0 ? `${liveTripsCount} Live` : null,
      badgeColor: "bg-emerald-100 text-emerald-800",
    },
    {
      id: "customers" as const,
      label: t("customers"),
      icon: Users,
      badge: customers.length > 0 ? `${customers.length}` : null,
      badgeColor: "bg-brand-ice text-brand-teal",
    },
    {
      id: "rates" as const,
      label: "Rates & Products",
      icon: Tag,
      badge: eggTypes.length > 0 ? `${eggTypes.length}` : null,
      badgeColor: "bg-brand-ice text-brand-teal",
    },
    {
      id: "stock" as const,
      label: t("stock"),
      icon: Package,
      badge: lowStockCount > 0 ? "Low!" : null,
      badgeColor: "bg-amber-100 text-amber-800",
    },
    {
      id: "damage" as const,
      label: t("damage"),
      icon: ShieldAlert,
      badge: pendingDamageCount > 0 ? `${pendingDamageCount} New` : null,
      badgeColor: "bg-rose-100 text-rose-800 animate-pulse",
    },
    {
      id: "workers" as const,
      label: "Workers",
      icon: Users2,
      badge: activeWorkersCount > 0 ? `${activeWorkersCount}` : null,
      badgeColor: "bg-brand-ice text-brand-teal",
    },
  ];

  const workerNavItems = [
    { id: "home" as const, label: t("dashboard"), icon: LayoutDashboard },
    { id: "new-bill" as const, label: `+ ${t("newBill")}`, icon: PlusCircle, isPrimary: true },
    { id: "bills" as const, label: t("bills"), icon: Receipt },
    {
      id: "trips" as const,
      label: "Meri Trips",
      icon: Truck,
      badge: trip.status === "OUT" ? "Live" : null,
      badgeColor: "bg-emerald-100 text-emerald-800",
    },
    { id: "count" as const, label: "Hisaab / Closing", icon: ClipboardCheck },
  ];

  const languages: { id: Language; label: string }[] = [
    { id: "hinglish", label: "Hinglish" },
    { id: "hi", label: "हिंदी" },
    { id: "mr", label: "मराठी" },
    { id: "en", label: "English" },
  ];

  const handleAdminNav = (tab: typeof adminTab) => {
    setAdminTab(tab);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleWorkerNav = (tab: typeof workerTab) => {
    setWorkerTab(tab);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-3 sm:px-6">
          {/* ── Left Section: Logo + Brand ── */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Brand Logo */}
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-teal text-white shadow-xs shrink-0">
              <Egg className="h-6 w-6 fill-brand-mint text-white" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight text-brand-dark">
                  {t("appName")}
                </span>
                <span className="hidden sm:inline-block rounded-md bg-brand-ice/70 px-2 py-0.5 text-[10px] font-bold text-brand-teal uppercase tracking-wider">
                  PRO v1.0
                </span>
              </div>
              <p className="text-[11px] text-brand-muted hidden sm:block">
                {t("tagline")}
              </p>
            </div>
          </div>

          {/* ── Mobile Right Section: Live indicator + Hamburger ── */}
          <div className="flex md:hidden items-center gap-2">
            {trip.status === "OUT" && (
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-bold text-emerald-800">
                <Truck className="h-3 w-3 text-emerald-600 animate-pulse" />
                <span>Live</span>
              </div>
            )}

            {/* Mobile Hamburger Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open Navigation Menu"
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-cream/80 border border-border text-brand-dark hover:bg-brand-ice/60 active:scale-95 transition-all focus:outline-none"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>

          {/* ── Desktop Right Section (Full Controls) ── */}
          <div className="hidden md:flex items-center gap-3">
            {trip.status === "OUT" && (
              <div className="flex items-center gap-1.5 rounded-full bg-brand-mint/60 px-3 py-1 text-xs font-semibold text-[#184d28]">
                <Truck className="h-3.5 w-3.5 text-brand-teal animate-pulse" />
                <span>Trip #{trip.tripNo} (Live)</span>
              </div>
            )}

            {/* User Role Badge */}
            {currentUser && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-brand-cream border border-border">
                <div className="h-6 w-6 rounded-lg bg-brand-teal text-white flex items-center justify-center text-xs font-black">
                  {currentUser.role === "ADMIN" ? (
                    <ShieldCheck className="h-3.5 w-3.5" />
                  ) : (
                    <User className="h-3.5 w-3.5" />
                  )}
                </div>
                <div className="text-left">
                  <p className="text-xs font-black text-brand-dark leading-none">
                    {currentUser.name}
                  </p>
                  <p className="text-[10px] text-brand-muted font-bold mt-0.5 uppercase tracking-wider">
                    {currentUser.role === "ADMIN" ? "Shop Admin" : "Delivery Worker"}
                  </p>
                </div>
              </div>
            )}

            {/* Quick Admin/Worker View Switch for Shop Admin */}
            {currentUser?.role === "ADMIN" && (
              <button
                onClick={() => setActiveRole(activeRole === "ADMIN" ? "WORKER" : "ADMIN")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-brand-teal/30 bg-brand-ice/40 text-xs font-bold text-brand-teal hover:bg-brand-ice transition-colors"
              >
                <span>
                  {activeRole === "ADMIN" ? "Switch to Worker View" : "Back to Admin Dashboard"}
                </span>
              </button>
            )}

            <LanguageSelector />

            {/* Logout Button */}
            {currentUser && (
              <button
                onClick={logout}
                title="Logout"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border text-xs font-bold text-brand-muted hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Logout</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── Mobile Sliding Drawer & Backdrop ── */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex justify-end">
          {/* Dark Backdrop */}
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-brand-dark/60 backdrop-blur-xs transition-opacity animate-fade-in"
          />

          {/* Sliding Drawer Container */}
          <div className="relative z-50 w-[84vw] max-w-[320px] bg-white h-full shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-300">
            {/* 1. Drawer Header & User Profile */}
            <div>
              {/* Header Bar */}
              <div className="p-4 border-b border-border flex items-center justify-between bg-brand-cream/60">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-teal text-white shadow-xs">
                    <Egg className="h-5 w-5 fill-brand-mint text-white" />
                  </div>
                  <div>
                    <h3 className="font-black text-base text-brand-dark leading-tight">
                      {t("appName")}
                    </h3>
                    <span className="text-[10px] font-bold text-brand-teal uppercase tracking-widest">
                      Egg Billing System
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="h-8 w-8 flex items-center justify-center rounded-xl bg-white border border-border text-brand-dark hover:bg-brand-ice transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* User Profile Card */}
              {currentUser && (
                <div className="p-4 border-b border-border/80 bg-linear-to-b from-brand-ice/20 to-transparent">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-2xl bg-brand-teal text-white flex items-center justify-center text-sm font-black shadow-xs shrink-0">
                      {currentUser.role === "ADMIN" ? (
                        <ShieldCheck className="h-6 w-6" />
                      ) : (
                        <User className="h-6 w-6" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-black text-sm text-brand-dark truncate">
                        {currentUser.name}
                      </p>
                      <p className="text-[11px] text-brand-muted font-medium">
                        {currentUser.phone}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="inline-block text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-brand-teal/10 text-brand-teal">
                          {currentUser.role === "ADMIN" ? "Shop Admin" : "Delivery Worker"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Role Switcher Button for Admin */}
                  {currentUser.role === "ADMIN" && (
                    <button
                      onClick={() => {
                        setActiveRole(activeRole === "ADMIN" ? "WORKER" : "ADMIN");
                        setMobileMenuOpen(false);
                      }}
                      className="mt-3 w-full flex items-center justify-between px-3 py-2 rounded-xl bg-brand-ice/50 hover:bg-brand-ice border border-brand-teal/30 text-brand-teal font-extrabold text-xs transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4" />
                        <span>
                          {activeRole === "ADMIN" ? "Switch to Worker View" : "Back to Admin Dashboard"}
                        </span>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              )}

              {/* 2. Navigation Menu */}
              <div className="p-3">
                <p className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-widest text-brand-muted">
                  {activeRole === "ADMIN" ? "Admin Sections" : "Worker Menu"}
                </p>

                {/* Admin Navigation Links */}
                {activeRole === "ADMIN" && (
                  <nav className="space-y-1 mt-1">
                    {adminNavItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = adminTab === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleAdminNav(item.id)}
                          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                            isActive
                              ? "bg-brand-teal text-white shadow-xs"
                              : "text-brand-dark hover:bg-brand-cream/80"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-white" : "text-brand-muted"}`} />
                            <span>{item.label}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {item.badge && (
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded-md font-extrabold ${
                                  isActive ? "bg-white/20 text-white" : item.badgeColor
                                }`}
                              >
                                {item.badge}
                              </span>
                            )}
                            <ChevronRight className={`h-3.5 w-3.5 ${isActive ? "text-white" : "text-brand-muted/60"}`} />
                          </div>
                        </button>
                      );
                    })}
                  </nav>
                )}

                {/* Worker Navigation Links */}
                {activeRole === "WORKER" && (
                  <nav className="space-y-1 mt-1">
                    {workerNavItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = workerTab === item.id;
                      const isPrimary = item.isPrimary;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleWorkerNav(item.id)}
                          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                            isPrimary
                              ? "bg-brand-teal text-white shadow-xs"
                              : isActive
                              ? "bg-brand-teal/15 text-brand-teal font-black"
                              : "text-brand-dark hover:bg-brand-cream/80"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Icon
                              className={`h-4 w-4 shrink-0 ${
                                isPrimary ? "text-white" : isActive ? "text-brand-teal" : "text-brand-muted"
                              }`}
                            />
                            <span>{item.label}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {item.badge && (
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded-md font-extrabold ${item.badgeColor}`}
                              >
                                {item.badge}
                              </span>
                            )}
                            <ChevronRight
                              className={`h-3.5 w-3.5 ${
                                isPrimary ? "text-white" : isActive ? "text-brand-teal" : "text-brand-muted/60"
                              }`}
                            />
                          </div>
                        </button>
                      );
                    })}
                  </nav>
                )}

                {/* Stock snapshot in drawer for Admin */}
                {activeRole === "ADMIN" && (
                  <div className="mt-4 p-3 rounded-xl bg-brand-cream/70 border border-border/80">
                    <div className="flex items-center justify-between text-brand-muted mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                        <Layers className="h-3 w-3 text-brand-teal" /> Godown Stock
                      </span>
                      <span className="text-[10px] text-emerald-700 font-bold">Active</span>
                    </div>
                    <p className="font-black text-brand-dark text-sm">
                      {totalGodownTrays} Trays{" "}
                      <span className="text-[11px] font-normal text-brand-muted">
                        ({(totalGodownTrays * 30).toLocaleString()} eggs)
                      </span>
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* 3. Drawer Bottom: Language Selector & Logout */}
            <div className="p-4 border-t border-border bg-brand-cream/30 space-y-3">
              {/* Language selection pills */}
              <div>
                <p className="text-[10px] font-bold text-brand-muted uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Globe className="h-3 w-3 text-brand-teal" /> Bhasha / Language
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  {languages.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setLanguage(opt.id)}
                      className={`px-2 py-1.5 rounded-lg text-xs font-bold transition-all text-center ${
                        language === opt.id
                          ? "bg-brand-teal text-white shadow-2xs"
                          : "bg-white border border-border text-brand-dark/80 hover:bg-brand-ice/40"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Logout Button */}
              {currentUser && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-red-200 bg-red-50 text-red-700 font-bold text-xs hover:bg-red-100 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout Karein</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
