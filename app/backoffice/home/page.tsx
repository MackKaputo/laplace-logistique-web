"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Home, Truck, Clock, Sparkles, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AccessControl } from "@/components/backoffice/access-control"

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return "Bonjour"
  if (hour < 18) return "Bon après-midi"
  return "Bonsoir"
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date)
}

export default function BackofficeHomePage() {
  const router = useRouter()
  const [role, setRole] = useState<string | null>(null)

  useEffect(() => {
    setRole(sessionStorage.getItem("backoffice_role"))
  }, [])

  const greeting = getGreeting()
  const today = formatDate(new Date())

  return (
    <AccessControl requiredRole="both">
      <div className="mx-auto max-w-5xl space-y-8">
        {/* Hero welcome */}
        <Card className="relative overflow-hidden border-[#B08968]/10 shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-[#1a1009] via-[#2D1F16] to-[#1a1009]" />
          {/* Decorative cyan glow */}
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#22D3EE]/10 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-[#B08968]/10 blur-3xl" />

          <CardContent className="relative p-8 sm:p-10">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#22D3EE]/20 to-[#3B82F6]/10 border border-[#22D3EE]/30 text-[#22D3EE]">
                    <Home className="h-6 w-6" />
                  </div>
                  <Badge className="bg-[#22D3EE]/10 text-[#22D3EE] border border-[#22D3EE]/20">
                    {role === "management" ? "Gestion" : role === "operations" ? "Opérations" : "Backoffice"}
                  </Badge>
                </div>

                <div>
                  <h1 className="text-3xl font-bold text-white sm:text-4xl">
                    {greeting},
                    <span className="block text-[#22D3EE]">Bienvenue dans Backoffice Laplace</span>
                  </h1>
                  <p className="mt-2 text-[#B08968]">
                    <Clock className="inline h-4 w-4 mr-1.5" />
                    {today}
                  </p>
                </div>
              </div>

              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#22D3EE]/10 to-transparent border border-[#22D3EE]/20">
                <span className="text-4xl font-black text-[#22D3EE]">L</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick action */}
        <div>
          <h2 className="text-lg font-semibold text-[#1a1009] mb-4 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#B08968]" />
            Actions rapides
          </h2>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="border-[#B08968]/10 hover:border-[#B08968]/30 transition-colors group cursor-pointer"
              onClick={() => router.push("/backoffice/deliverers")}>
              <CardHeader className="pb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[#1a1009] to-[#2D1F16] text-[#22D3EE] mb-3">
                  <Truck className="h-5 w-5" />
                </div>
                <CardTitle className="text-[#1a1009]">Livreurs & stocks</CardTitle>
                <CardDescription className="text-[#B08968]">
                  Consulter les livreurs et leurs produits disponibles.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full bg-[#22D3EE] text-[#111827] hover:bg-[#22D3EE]/90 font-semibold group-hover:shadow-lg transition-all">
                  Accéder
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            <Card className="border-[#B08968]/10 opacity-75">
              <CardHeader className="pb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#f8f6f4] text-[#B08968] mb-3">
                  <Sparkles className="h-5 w-5" />
                </div>
                <CardTitle className="text-[#1a1009]">À venir</CardTitle>
                <CardDescription className="text-[#B08968]">
                  D&apos;autres outils arriveront bientôt dans le backoffice.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-[#2D1F16]/70 italic">Bientôt disponible</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AccessControl>
  )
}
