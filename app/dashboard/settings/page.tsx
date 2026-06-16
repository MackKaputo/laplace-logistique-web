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
      enterprise: "bg-blue-100 text-blue-800",
      personal: "bg-green-100 text-green-800",
      hospital: "bg-red-100 text-red-800",
      admin: "bg-purple-100 text-purple-800",
      driver: "bg-orange-100 text-orange-800",
    }
    return roleColors[role] || "bg-muted text-muted-foreground"
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
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="ghost"
              size="sm"
              className="text-[#2B015F]"
              onClick={() => router.push("/dashboard")}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Retour
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-[#2B015F]">Parametres</h1>
              <p className="text-muted-foreground">Gerez votre profil et vos integrations</p>
            </div>
          </div>

          <Tabs defaultValue={defaultTab} className="space-y-6">
            <TabsList className="bg-muted">
              <TabsTrigger value="profile" className="gap-2 data-[state=active]:bg-background">
                <User className="h-4 w-4" />
                Profil
              </TabsTrigger>
              <TabsTrigger value="integrations" className="gap-2 data-[state=active]:bg-background">
                <Plug className="h-4 w-4" />
                Integrations
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-6">
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
                        <div className="w-full">
                          <Button
                            variant="outline"
                            className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={handleLogout}
                          >
                            <LogOut className="w-4 h-4 mr-2" />
                            Se deconnecter
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
                          <label className="text-sm font-medium text-muted-foreground">Prenom</label>
                          <p className="text-foreground font-medium">{user.first_name}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Nom</label>
                          <p className="text-foreground font-medium">{user.last_name}</p>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                          <Mail className="w-4 h-4" />
                          Adresse e-mail
                        </label>
                        <p className="text-foreground font-medium">{user.email}</p>
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
                          <label className="text-sm font-medium text-muted-foreground">
                            Nom de l'organisation
                          </label>
                          <p className="text-foreground font-medium">{user.organizationName}</p>
                        </div>
                        {user.organizationId && (
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">
                              ID Organisation
                            </label>
                            <p className="text-foreground font-medium font-mono text-sm">
                              {user.organizationId}
                            </p>
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
                        <label className="text-sm font-medium text-muted-foreground">Type de compte</label>
                        <p className="text-foreground font-medium">
                          {getRoleLabel(user.account_type || user.role || "personal")}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Date de creation</label>
                        <p className="text-foreground font-medium">{formatDate(user.createdAt || "")}</p>
                      </div>
                    </CardContent>
                  </Card>
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
