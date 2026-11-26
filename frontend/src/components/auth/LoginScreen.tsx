/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import { useStore } from "@/lib/store";
import { useLanguage } from "@/lib/i18n";
import { LanguageSelector } from "@/components/LanguageSelector";
import { Egg, Truck, ShieldCheck, ArrowRight, Lock, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

export function LoginScreen() {
  const { loginAsWorker, loginAsAdmin } = useStore();
  const { t } = useLanguage();
  const [role, setRole] = useState<"WORKER" | "ADMIN">("WORKER");
  
  // Worker inputs
  const [workerPhone, setWorkerPhone] = useState("");
  const [workerPin, setWorkerPin] = useState("");
  
  // Admin inputs
  const [adminPhone, setAdminPhone] = useState("9999999999");
  const [adminPassword, setAdminPassword] = useState("");
  
  const [loading, setLoading] = useState(false);

  const handleWorkerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workerPhone.trim() || workerPhone.trim().length !== 10) {
      toast.error(t("errPhone10"));
      return;
    }
    if (!workerPin.trim() || workerPin.trim().length < 4) {
      toast.error(t("errPin4"));
      return;
    }

    setLoading(true);
    try {
      await loginAsWorker(workerPhone.trim(), workerPin.trim());
      toast.success(`${t("loginSuccess")} 🎉`);
    } catch (err: any) {
      toast.error(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminPhone.trim()) {
      toast.error(t("errAdminPhone"));
      return;
    }
    if (!adminPassword.trim()) {
      toast.error(t("errAdminPass"));
      return;
    }

    setLoading(true);
    try {
      await loginAsAdmin(adminPhone.trim(), adminPassword.trim());
      toast.success(`${t("adminLoginSuccess")} 🛡️`);
    } catch (err: any) {
      toast.error(err.message || "Admin login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-cream flex flex-col justify-center items-center px-4 py-8 relative">
      {/* Language Switcher Top-Right */}
      <div className="absolute top-4 right-4">
        <LanguageSelector />
      </div>

      {/* Brand Header */}
      <div className="flex flex-col items-center mb-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-brand-teal text-white shadow-lg mb-3">
          <Egg className="h-10 w-10 fill-brand-mint text-white" />
        </div>
        <h1 className="text-2xl font-black text-brand-dark tracking-tight">
          {t("appName")}
        </h1>
        <p className="text-xs text-brand-muted mt-1">
          {t("loginSubtitle")}
        </p>
      </div>

      <Card className="w-full max-w-sm p-6 bg-white border border-border shadow-xl rounded-3xl space-y-6">
        {/* Role Toggle Selector */}
        <div className="flex p-1 rounded-2xl bg-brand-cream border border-border">
          <button
            type="button"
            onClick={() => setRole("WORKER")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
              role === "WORKER"
                ? "bg-brand-teal text-white shadow-xs"
                : "text-brand-muted hover:text-brand-dark"
            }`}
          >
            <Truck className="h-4 w-4" />
            <span>{t("deliveryWorker")}</span>
          </button>

          <button
            type="button"
            onClick={() => setRole("ADMIN")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
              role === "ADMIN"
                ? "bg-brand-teal text-white shadow-xs"
                : "text-brand-muted hover:text-brand-dark"
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            <span>{t("shopAdmin")}</span>
          </button>
        </div>

        {/* WORKER LOGIN FORM */}
        {role === "WORKER" && (
          <form onSubmit={handleWorkerLogin} className="space-y-4">
            <div>
              <span className="text-[11px] font-bold text-brand-muted uppercase tracking-wider block mb-1">
                {t("registeredMobile")}
              </span>
              <div className="relative">
                <Phone className="absolute left-3.5 top-3.5 h-4 w-4 text-brand-muted" />
                <Input
                  type="tel"
                  placeholder="e.g. 9822114455"
                  value={workerPhone}
                  onChange={(e) => setWorkerPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  className="pl-10 text-sm font-semibold"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <span className="text-[11px] font-bold text-brand-muted uppercase tracking-wider block mb-1">
                {t("secretPin")}
              </span>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-brand-muted" />
                <Input
                  type="password"
                  placeholder="••••"
                  value={workerPin}
                  onChange={(e) => setWorkerPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="pl-10 text-base font-bold tracking-widest"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl text-sm font-bold bg-brand-teal hover:bg-brand-teal/90 text-white shadow-md flex items-center justify-center gap-2"
            >
              <span>{loading ? t("loggingIn") : t("workerLogin")}</span>
              <ArrowRight className="h-4 w-4" />
            </Button>

            {/* Quick Demo Fill */}
            <div className="pt-2 text-center">
              <p className="text-[11px] text-brand-muted mb-1.5">{t("quickDemoLogin")}</p>
              <button
                type="button"
                onClick={() => {
                  setWorkerPhone("9822114455");
                  setWorkerPin("1234");
                }}
                className="text-xs font-bold text-brand-teal hover:underline bg-brand-ice/40 px-3 py-1 rounded-lg"
              >
                Raju Delivery Boy (PIN: 1234)
              </button>
            </div>
          </form>
        )}

        {/* ADMIN LOGIN FORM */}
        {role === "ADMIN" && (
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <span className="text-[11px] font-bold text-brand-muted uppercase tracking-wider block mb-1">
                {t("adminMobileUser")}
              </span>
              <div className="relative">
                <Phone className="absolute left-3.5 top-3.5 h-4 w-4 text-brand-muted" />
                <Input
                  type="text"
                  placeholder="e.g. 9999999999"
                  value={adminPhone}
                  onChange={(e) => setAdminPhone(e.target.value)}
                  className="pl-10 text-sm font-semibold"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <span className="text-[11px] font-bold text-brand-muted uppercase tracking-wider block mb-1">
                {t("adminPasswordPin")}
              </span>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-brand-muted" />
                <Input
                  type="password"
                  placeholder="admin123"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="pl-10 text-sm font-semibold"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl text-sm font-bold bg-brand-teal hover:bg-brand-teal/90 text-white shadow-md flex items-center justify-center gap-2"
            >
              <span>{loading ? t("authenticating") : t("adminLoginBtn")}</span>
              <ArrowRight className="h-4 w-4" />
            </Button>

            {/* Quick Demo Fill */}
            <div className="pt-2 text-center">
              <p className="text-[11px] text-brand-muted mb-1.5">{t("defaultAdminCreds")}</p>
              <button
                type="button"
                onClick={() => {
                  setAdminPhone("9999999999");
                  setAdminPassword("admin123");
                }}
                className="text-xs font-bold text-brand-teal hover:underline bg-brand-ice/40 px-3 py-1 rounded-lg"
              >
                Owner (PIN: admin123)
              </button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}
