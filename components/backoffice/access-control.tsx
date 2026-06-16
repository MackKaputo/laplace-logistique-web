"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { ShieldAlert } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface AccessControlProps {
  children: React.ReactNode
  requiredRole?: "management" | "operations" | "both"
}

export function AccessControl({ children, requiredRole = "both" }: AccessControlProps) {
  const [userRole, setUserRole] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const role = sessionStorage.getItem("backoffice_role")
    setUserRole(role)
    setIsLoading(false)
  }, [])

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2B015F]"></div>
      </div>
    )
  }

  // Check access based on required role
  const hasAccess = requiredRole === "both" || userRole === requiredRole || userRole === "management" // Management always has access

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
        <div className="max-w-md w-full">
          <Alert variant="destructive" className="border-red-200 bg-red-50">
            <ShieldAlert className="h-5 w-5" />
            <AlertTitle className="text-lg font-semibold">Accès Refusé</AlertTitle>
            <AlertDescription className="mt-2">
              Vous n'avez pas les permissions nécessaires pour accéder à cette page. Cette section est réservée à
              l'équipe de gestion.
            </AlertDescription>
          </Alert>

          <div className="mt-6 bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold text-gray-900 mb-2">Votre niveau d'accès</h3>
            <p className="text-sm text-gray-600">
              Rôle actuel:{" "}
              <span className="font-medium capitalize">{userRole === "operations" ? "Opérations" : "Inconnu"}</span>
            </p>
            <p className="text-sm text-gray-500 mt-4">
              Si vous pensez que c'est une erreur, veuillez contacter votre administrateur système.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
