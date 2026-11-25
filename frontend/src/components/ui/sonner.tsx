"use client";

import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-white group-[.toaster]:text-brand-dark group-[.toaster]:border-brand-ocean/30 group-[.toaster]:shadow-lg group-[.toaster]:rounded-2xl group-[.toaster]:p-4",
          description: "group-[.toast]:text-brand-muted",
          actionButton:
            "group-[.toast]:bg-brand-teal group-[.toast]:text-white group-[.toast]:rounded-xl font-semibold",
          cancelButton:
            "group-[.toast]:bg-brand-ice/40 group-[.toast]:text-brand-dark group-[.toast]:rounded-xl",
          success:
            "group-[.toast]:border-brand-mint group-[.toast]:bg-brand-cream",
          error:
            "group-[.toast]:border-brand-danger/30 group-[.toast]:text-brand-danger",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
