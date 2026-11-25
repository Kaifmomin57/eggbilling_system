"use client";

import React from "react";
import { useStore } from "@/lib/store";
import { WorkerLayout } from "@/components/worker/WorkerLayout";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { TopNav } from "@/components/TopNav";
import { LoginScreen } from "@/components/auth/LoginScreen";

export default function Home() {
  const { currentUser, activeRole } = useStore();

  // If not authenticated, show role-based Login Screen
  if (!currentUser) {
    return <LoginScreen />;
  }

  return (
    <div className="min-h-screen bg-brand-cream">
      {/* Top Application Bar */}
      <TopNav />

      {/* Dynamic View based on Active Role */}
      {activeRole === "WORKER" ? <WorkerLayout /> : <AdminLayout />}
    </div>
  );
}
