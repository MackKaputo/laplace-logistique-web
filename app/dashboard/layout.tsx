"use client"

import type React from "react"
import RoleGuard from "@/components/role-guard"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <RoleGuard allowedRoles={["enterprise", "hospital", "admin", "personal"]}>{children}</RoleGuard>
}
