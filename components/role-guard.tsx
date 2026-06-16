"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import type { UserRole } from "@/types/auth"
import { Loader2 } from "lucide-react"

interface RoleGuardProps {
  children: React.ReactNode
  allowedRoles: UserRole[]
  fallbackUrl?: string
}

export default function RoleGuard({ children, allowedRoles, fallbackUrl = "/login" }: RoleGuardProps) {
  const { user, isLoading, checkUserRole } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        // No user is logged in, redirect to login page
        router.push(fallbackUrl)
      } else if (!checkUserRole(allowedRoles)) {
        // User doesn't have the required role, redirect to unauthorized page
        router.push("/unauthorized")
      }
    }
  }, [user, isLoading, router, allowedRoles, fallbackUrl, checkUserRole])

  if (isLoading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#2B015F]" />
      </div>
    )
  }

  if (!user || !checkUserRole(allowedRoles)) {
    return null
  }

  return <>{children}</>
}
