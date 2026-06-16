"use client"

import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { ShieldAlert, ArrowLeft } from "lucide-react"

export default function UnauthorizedPage() {
  const { user, logout } = useAuth()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 text-center sm:px-6 lg:px-8">
      <ShieldAlert className="h-24 w-24 text-red-500" />
      <h1 className="mt-6 text-3xl font-bold text-gray-900">Accès non autorisé</h1>
      <p className="mt-2 text-lg text-gray-600">
        Vous n'avez pas les permissions nécessaires pour accéder à cette page.
      </p>
      <p className="mt-1 text-gray-500">
        {user
          ? `Vous êtes connecté en tant que ${user.name} (${
              user.account_type === "enterprise" ? "Entreprise" : user.account_type === "hospital" ? "Hôpital" : "Autre"
            })`
          : "Vous n'êtes pas connecté."}
      </p>

      <div className="mt-8 flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
        <Button asChild variant="outline">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour à l'accueil
          </Link>
        </Button>
        <Button asChild className="bg-[#2B015F] hover:bg-[#2B015F]/90">
          <Link href="/dashboard">Aller au tableau de bord</Link>
        </Button>
        {user && (
          <Button variant="ghost" onClick={() => logout()}>
            Se déconnecter
          </Button>
        )}
      </div>
    </div>
  )
}
