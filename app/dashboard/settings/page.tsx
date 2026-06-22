"use client"

import { useAuth } from "@/contexts/auth-context"
import { useRouter, useSearchParams } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { User, Mail, Building, Calendar, LogOut, ArrowLeft, Plug } from "lucide-react"
import { GoogleSheetsIntegration } from "@/components/dashboard/google-sheets-integration"

export default function DashboardSettingsPage() {
  const { user, logout, isLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultTab = searchParams.get("tab") === "integrations" ? "integrations" : "profile"

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f8fafc] to-[#f1f5f9]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#22D3EE]"></div>
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
    const roleLabels: Record<string, string> = {
      enterprise: "Entreprise",
      personal: "Personnel",
      hospital: "Hopital",
      admin: "Administrateur",
      driver: "Chauffeur",
    }
    return roleLabels[role] || role
  }

  const getRoleColor = (role: string) => {
    const roleColors: Record<string, string> = {
      enterprise: "bg-[#22D3EE]/20 text-[#22D3EE] border-[#22D3EE]/30",
      personal: "bg-[#22D3EE]/20 text-[#22D3EE] border-[#22D3EE]/30",
      hospital: "bg-[#22D3EE]/20 text-[#22D3EE] border-[#22D3EE]/30",
      admin: "bg-[#22D3EE]/20 text-[#22D3EE] border-[#22D3EE]/30",
      driver: "bg-[#22D3EE]/20 text-[#22D3EE] border-[#22D3EE]/30",
    }
    return roleColors[role] || "bg-[#22D3EE]/20 text-[#22D3EE] border-[#22D3EE]/30"
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
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] to-[#f1f5f9] pt-24">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="ghost"
              size="sm"
              className="text-[#1a1009] hover:bg-[#B08968]/10"
              onClick={() => router.push("/dashboard")}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Retour
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-[#1a1009] mb-2">Paramètres</h1>
              <p className="text-[#B08968]">
                Gérez votre profil et vos intégrations
              </p>
            </div>
          </div>

          <Tabs defaultValue={defaultTab} className="space-y-6">
            <TabsList className="bg-white border border-[#B08968]/20 p-1">
              <TabsTrigger 
                value="profile" 
                className="gap-2 data-[state=active]:bg-[#22D3EE] data-[state=active]:text-white text-[#1a1009] hover:bg-[#B08968]/10"
              >
                <User className="h-4 w-4" />
                Profil
              </TabsTrigger>
              <TabsTrigger 
                value="integrations" 
                className="gap-2 data-[state=active]:bg-[#22D3EE] data-[state=active]:text-white text-[#1a1009] hover:bg-[#B08968]/10"
              >
                <Plug className="h-4 w-4" />
                Intégrations
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Profile Card */}
                <div className="lg:col-span-1">
                  <div className="bg-white rounded-xl border border-[#B08968]/10 shadow-lg overflow-hidden">
                    <div className="bg-gradient-to-r from-[#1a1009] to-[#2a1809] p-6">
                      <div className="flex flex-col items-center text-center">
                        <div className="relative mb-4">
                          <Avatar className="w-20 h-20 border-3 border-white shadow-lg">
                            <AvatarImage
                              src={user.avatar || "/placeholder.svg"}
                              alt={`${user.first_name} ${user.last_name}`}
                            />
                            <AvatarFallback className="bg-gradient-to-br from-[#22D3EE] to-[#06b6d4] text-white text-xl font-bold">
                              {getInitials(user.first_name, user.last_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                        </div>
                        <h2 className="text-xl font-bold text-white mb-2">
                          {user.first_name} {user.last_name}
                        </h2>
                        <Badge className={`bg-[#22D3EE]/20 text-[#22D3EE] border-[#22D3EE]/30 mb-4`}>
                          {getRoleLabel(user.account_type || user.role || "personal")}
                        </Badge>
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-[#f8fafc]">
                          <Mail className="h-4 w-4 text-[#B08968]" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-[#B08968]/60">Email</p>
                            <p className="text-sm text-[#1a1009] truncate">{user.email}</p>
                          </div>
                        </div>
                        {user.organizationName && (
                          <div className="flex items-center gap-3 p-3 rounded-lg bg-[#f8fafc]">
                            <Building className="h-4 w-4 text-[#B08968]" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-[#B08968]/60">Organisation</p>
                              <p className="text-sm text-[#1a1009] truncate">{user.organizationName}</p>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="mt-6">
                        <Button
                          variant="outline"
                          className="w-full border-red-200/50 text-red-600 hover:bg-red-50 hover:border-red-300 transition-all duration-300"
                          onClick={handleLogout}
                        >
                          <LogOut className="w-4 h-4 mr-2" />
                          Se déconnecter
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Information Cards */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Personal Information */}
                  <div className="bg-white rounded-xl border border-[#B08968]/10 shadow-lg overflow-hidden">
                    <div className="bg-gradient-to-r from-[#22D3EE] to-[#06b6d4] p-4">
                      <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <User className="w-5 h-5" />
                        Informations personnelles
                      </h3>
                    </div>
                    <div className="p-6 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-[#B08968]/60">Prénom</label>
                          <p className="text-[#1a1009] font-medium bg-[#f8fafc] px-3 py-2 rounded-lg">{user.first_name}</p>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-[#B08968]/60">Nom</label>
                          <p className="text-[#1a1009] font-medium bg-[#f8fafc] px-3 py-2 rounded-lg">{user.last_name}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-[#B08968]/60 flex items-center gap-1">
                          <Mail className="w-4 h-4" />
                          Adresse e-mail
                        </label>
                        <p className="text-[#1a1009] font-medium bg-[#f8fafc] px-3 py-2 rounded-lg">{user.email}</p>
                      </div>
                    </div>
                  </div>

                  {/* Organization Information */}
                  {user.organizationName && (
                    <div className="bg-white rounded-xl border border-[#B08968]/10 shadow-lg overflow-hidden">
                      <div className="bg-gradient-to-r from-[#B08968] to-[#8b6f47] p-4">
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                          <Building className="w-5 h-5" />
                          Organisation
                        </h3>
                      </div>
                      <div className="p-6 space-y-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-[#B08968]/60">
                            Nom de l'organisation
                          </label>
                          <p className="text-[#1a1009] font-medium bg-[#f8fafc] px-3 py-2 rounded-lg">{user.organizationName}</p>
                        </div>
                        {user.organizationId && (
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-[#B08968]/60">
                              ID Organisation
                            </label>
                            <p className="text-[#1a1009] font-mono text-sm bg-[#f8fafc] px-3 py-2 rounded-lg">
                              {user.organizationId}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Account Information */}
                  <div className="bg-white rounded-xl border border-[#B08968]/10 shadow-lg overflow-hidden">
                    <div className="bg-gradient-to-r from-[#1a1009] to-[#2a1809] p-4">
                      <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Calendar className="w-5 h-5" />
                        Informations du compte
                      </h3>
                    </div>
                    <div className="p-6 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-[#B08968]/60">Type de compte</label>
                          <div className="bg-[#f8fafc] px-3 py-2 rounded-lg">
                            <Badge className={`bg-[#22D3EE]/20 text-[#22D3EE] border-[#22D3EE]/30`}>
                              {getRoleLabel(user.account_type || user.role || "personal")}
                            </Badge>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-[#B08968]/60">Date de création</label>
                          <p className="text-[#1a1009] font-medium bg-[#f8fafc] px-3 py-2 rounded-lg">{formatDate(user.createdAt || "")}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Integrations Tab */}
            <TabsContent value="integrations" className="space-y-6">
              {/* Google Sheets Integration - handles its own header based on state */}
              <GoogleSheetsIntegration />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
