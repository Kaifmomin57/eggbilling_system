import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatINR(paiseOrRupees: number, isPaise: boolean = false): string {
  const rupees = isPaise ? paiseOrRupees / 100 : paiseOrRupees;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
    minimumFractionDigits: rupees % 1 === 0 ? 0 : 2,
  }).format(rupees);
}

export function formatEggsAndTrays(totalEggs: number, eggsPerTray: number = 30): { trays: number; eggs: number; formatted: string } {
  const trays = Math.floor(totalEggs / eggsPerTray);
  const remainingEggs = totalEggs % eggsPerTray;
  let formatted = `${trays} Tray`;
  if (remainingEggs > 0) {
    formatted += ` + ${remainingEggs} Egg`;
  }
  return { trays, eggs: remainingEggs, formatted };
}
