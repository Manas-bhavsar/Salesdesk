import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getCategoryColor(category: string, categories: string[]): string {
  const CATEGORY_COLORS = [
    '#f0c040', '#4ade80', '#60a5fa', '#f87171',
    '#a78bfa', '#fb923c', '#34d399', '#e879f9'
  ]
  const idx = categories.indexOf(category)
  return CATEGORY_COLORS[idx % CATEGORY_COLORS.length] || '#8b9099'
}
