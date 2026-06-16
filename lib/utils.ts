import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function formatDate(date: number | string): string {
  if (!date) return "-"
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${day}/${month}/${year}`
}

export function formatDateTime(dateString: string): string {
  if (!dateString) return "-"
  const date = new Date(dateString)

  const day = String(date.getDate()).padStart(2, "0")
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const year = date.getFullYear()

  const hours = String(date.getHours()).padStart(2, "0")
  const minutes = String(date.getMinutes()).padStart(2, "0")

  return `${day}/${month}/${year} ${hours}:${minutes}`
}

/** Day name + calendar date + time (fr-FR), for pre-delivery `created_at` / `createdAt`. */
export function formatPreDeliveryCreatedAtFrench(pre: { created_at?: string | { $date?: string }; createdAt?: string | { $date?: string } }): string {
  const rawValue = pre.created_at ?? pre.createdAt
  const raw = rawValue && typeof rawValue === "object" && "$date" in rawValue ? rawValue.$date : rawValue
  if (!raw) return "—"
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return "—"
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d)
  } catch {
    return "—"
  }
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
//comment
