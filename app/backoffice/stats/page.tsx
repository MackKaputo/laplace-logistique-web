"use client"

import { useRef } from "react"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Package,
  Truck,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Calendar,
  TrendingUp,
  DollarSign,
} from "lucide-react"
import { useQuery, QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { AccessControl } from "@/components/backoffice/access-control"

function StatsContent() {
  const [showTodayStats, setShowTodayStats] = useState(false)

  const { data: allTimeStats, isLoading: allTimeLoading } = useQuery({
    queryKey: ["statistics", "all-time"],
    queryFn: async () => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_SERVER_BASE_URL}/deliveries/admin-statistics`,
      )
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          return result.data
        }
      }
      return null
    },
  })

  const { data: todayStats, isLoading: todayLoading } = useQuery({
    queryKey: ["statistics", "today"],
    queryFn: async () => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_SERVER_BASE_URL}/deliveries/admin-statistics/today`,
      )
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          return result.data
        }
      }
      return null
    },
  })

  const backofficeRole = typeof window !== "undefined" ? sessionStorage.getItem("backoffice_role") || "operations" : "operations"
  const currentStats = showTodayStats ? todayStats : backofficeRole === "management" ? allTimeStats : todayStats
  const stats = currentStats
    ? {
        total: currentStats.total_deliveries,
        delivered: currentStats.total_completed_deliveries,
        inProgress: currentStats.total_active_deliveries,
        failed: currentStats.total_failed_deliveries,
        revenue: currentStats.total_revenue,
        averagePrice: currentStats.average_delivery_price,
        statusCounts: currentStats.deliveries_per_status_count,
      }
    : null

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      delivered: "Livrées",
      assigned: "Assignées",
      refused: "Refusées",
      unreachable_recipient: "Destinataire injoignable",
      failed_pickup: "Échec de ramassage",
      arrived_to_recipient: "Arrivées chez destinataire",
      unassigned: "En attente",
      delivery_start_to_pickup: "En route pour ramassage",
      picked: "Ramassées",
      delivery_start_to_recipient: "En route pour livraison",
      cancelled: "Annulées",
      postponed: "Reportées",
    }
    return statusMap[status] || status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, " ")
  }

  const isLoading = allTimeLoading || todayLoading

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Statistiques</h1>
          <p className="text-gray-600">Vue d'ensemble des performances de livraison</p>
        </div>
        <div className="flex gap-2">
          <div className="flex bg-gray-100 rounded-lg p-1">
            {backofficeRole === "management" && (
              <Button
                variant={!showTodayStats ? "default" : "ghost"}
                size="sm"
                onClick={() => setShowTodayStats(false)}
                className={!showTodayStats ? "bg-[#2B015F] hover:bg-[#2B015F]/90" : ""}
              >
                Tout
              </Button>
            )}
            <Button
              variant={showTodayStats ? "default" : "ghost"}
              size="sm"
              onClick={() => setShowTodayStats(true)}
              className={showTodayStats ? "bg-[#2B015F] hover:bg-[#2B015F]/90" : ""}
            >
              <Calendar className="h-4 w-4 mr-1" />
              {"Aujourd'hui"}
            </Button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      {!stats || isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="animate-pulse">
                  <div className="h-8 w-8 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded mb-1"></div>
                  <div className="h-6 bg-gray-200 rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          {/* Main Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <Package className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total</p>
                    <p className="text-2xl font-bold">{stats.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Livrées</p>
                    <p className="text-2xl font-bold">{stats.delivered}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <Truck className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">En cours</p>
                    <p className="text-2xl font-bold">{stats.inProgress}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <AlertCircle className="h-8 w-8 text-red-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Échecs</p>
                    <p className="text-2xl font-bold">{stats.failed}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <DollarSign className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Revenus</p>
                    <p className="text-2xl font-bold">{stats.revenue}$</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Status Breakdown */}
          {stats.statusCounts && Object.keys(stats.statusCounts).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  {"Répartition par statut"} {showTodayStats ? "(Aujourd'hui)" : "(Tout)"}
                </CardTitle>
                <CardDescription>{"Détail des livraisons par statut"} {"•"} {"Prix moyen:"} {stats.averagePrice}$</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {Object.entries(stats.statusCounts).map(([status, count]) => (
                    <div key={status} className="bg-gray-50 rounded-lg p-3">
                      <p className="text-sm font-medium text-gray-600">{getStatusLabel(status)}</p>
                      <p className="text-xl font-bold text-gray-900">{count as number}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}

export default function StatsPage() {
  const queryClientRef = useRef<QueryClient | null>(null)
  if (!queryClientRef.current) {
    queryClientRef.current = new QueryClient()
  }

  return (
    <QueryClientProvider client={queryClientRef.current}>
      <AccessControl requiredRole="management">
        <StatsContent />
      </AccessControl>
    </QueryClientProvider>
  )
}
