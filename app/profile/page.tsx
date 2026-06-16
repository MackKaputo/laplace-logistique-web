"use client"

import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User, Mail, Building, Calendar, Settings, LogOut, Plug } from "lucide-react"
import { useRouter } from "next/navigation"

export default function ProfilePage() {
  const { user, logout, isLoading } = useAuth()
  const router = useRouter()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#2B015F]"></div>
      </div>
    )
  }

  if (!user) {
    router.push("/login")
    return null
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  const getRoleLabel = (role: string) => {
    const roleLabels = {
      enterprise: "Entreprise",
      personal: "Personnel",
      hospital: "Hôpital",
      admin: "Administrateur",
      driver: "Chauffeur",
    }
    return roleLabels[role as keyof typeof roleLabels] || role
  }

  const getRoleColor = (role: string) => {
    const roleColors = {
      enterprise: "bg-blue-100 text-blue-800",
      personal: "bg-green-100 text-green-800",
      hospital: "bg-red-100 text-red-800",
      admin: "bg-purple-100 text-purple-800",
      driver: "bg-orange-100 text-orange-800",
    }
    return roleColors[role as keyof typeof roleColors] || "bg-gray-100 text-gray-800"
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "Non disponible"
    return new Date(dateString).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const handleLogout = async () => {
    await logout()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[#2B015F] mb-2">Mon Profil</h1>
            <p className="text-gray-600">Gérez vos informations personnelles</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Card */}
            <div className="lg:col-span-1">
              <Card className="border-t-4 border-[#FBC140]">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center">
                    <Avatar className="w-24 h-24 mb-4">
                      <AvatarImage
                        src={user.avatar || "/placeholder.svg"}
                        alt={`${user.first_name} ${user.last_name}`}
                      />
                      <AvatarFallback className="bg-[#2B015F] text-white text-xl">
                        {getInitials(user.first_name, user.last_name)}
                      </AvatarFallback>
                    </Avatar>

                    <h2 className="text-xl font-semibold text-[#2B015F] mb-1">
                      {user.first_name} {user.last_name}
                    </h2>

                    <Badge className={`mb-4 ${getRoleColor(user.account_type || user.role || "personal")}`}>
                      {getRoleLabel(user.account_type || user.role || "personal")}
                    </Badge>

                    <div className="w-full space-y-2">
                      <Button variant="outline" className="w-full" onClick={() => router.push("/dashboard")}>
                        <Settings className="w-4 h-4 mr-2" />
                        Tableau de bord
                      </Button>

                      <Button variant="outline" className="w-full" onClick={() => router.push("/dashboard/settings?tab=integrations")}>
                        <Plug className="w-4 h-4 mr-2" />
                        Integrations
                      </Button>

                      <Button
                        variant="outline"
                        className="w-full text-red-600 hover:text-red-700"
                        onClick={handleLogout}
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Se déconnecter
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Information Cards */}
            <div className="lg:col-span-2 space-y-6">
              {/* Personal Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-[#2B015F]">
                    <User className="w-5 h-5" />
                    Informations personnelles
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Prénom</label>
                      <p className="text-gray-900 font-medium">{user.first_name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Nom</label>
                      <p className="text-gray-900 font-medium">{user.last_name}</p>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                      <Mail className="w-4 h-4" />
                      Adresse e-mail
                    </label>
                    <p className="text-gray-900 font-medium">{user.email}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Organization Information */}
              {user.organizationName && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-[#2B015F]">
                      <Building className="w-5 h-5" />
                      Organisation
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Nom de l'organisation</label>
                      <p className="text-gray-900 font-medium">{user.organizationName}</p>
                    </div>

                    {user.organizationId && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">ID Organisation</label>
                        <p className="text-gray-900 font-medium font-mono text-sm">{user.organizationId}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Account Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-[#2B015F]">
                    <Calendar className="w-5 h-5" />
                    Informations du compte
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Type de compte</label>
                    <p className="text-gray-900 font-medium">
                      {getRoleLabel(user.account_type || user.role || "personal")}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500">Date de création</label>
                    <p className="text-gray-900 font-medium">{formatDate(user.createdAt || "")}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
