"use client";

import React from "react";
import { useLanguage, Language } from "@/lib/i18n";
import { Globe } from "lucide-react";

export function LanguageSelector() {
  const { language, setLanguage } = useLanguage();

  const options: { id: Language; label: string }[] = [
    { id: "hinglish", label: "Hinglish" },
    { id: "hi", label: "हिंदी" },
    { id: "mr", label: "मराठी" },
    { id: "en", label: "English" },
  ];

  return (
    <div className="flex items-center gap-1 rounded-xl bg-brand-ice/30 p-1 border border-brand-ocean/20">
      <Globe className="h-3.5 w-3.5 text-brand-teal ml-1 hidden sm:block" />
      <div className="flex gap-1">
        {options.map((opt) => (
          <button
            key={opt.id}
            onClick={() => setLanguage(opt.id)}
            className={`rounded-lg px-2 py-1 text-xs font-semibold transition-all ${
              language === opt.id
                ? "bg-brand-teal text-white shadow-xs"
                : "text-brand-dark/70 hover:text-brand-dark hover:bg-brand-ice/50"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
