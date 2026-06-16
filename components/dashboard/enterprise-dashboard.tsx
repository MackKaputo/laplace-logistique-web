"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DeliveryTable } from "@/components/dashboard/delivery-table"
import { FilterControls } from "@/components/dashboard/filter-controls"
import { StatsCard } from "@/components/dashboard/stats-card"
import { Clock, AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"

interface EnterpriseDashboardProps {
  deliveries: any[]
  filteredDeliveries: any[]
  searchQuery: string
  setSearchQuery: (query: string) => void
  statusFilter: string
  setStatusFilter: (status: string) => void
  date: Date | undefined
  setDate: (date: Date | undefined) => void
  isLoading: boolean
  error: string | null
  refetch: () => void
  isRefreshing?: boolean
}

interface UpdateDeliveryDto {
  delivery_id: string
  package_description?: string
  package_value_currency?: string
  package_value_amount?: string
  pickup_date?: number
  preferred_delivery_date?: number
}

interface CancelDeliveryDto {
  delivery_id: string
  reason?: string
}

export function EnterpriseDashboard({
  deliveries,
  filteredDeliveries,
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  date,
  setDate,
  isLoading,
  error,
  refetch,
  isRefreshing = false,
}: EnterpriseDashboardProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const { toast } = useToast()

  const handleUpdateDelivery = async (updateData: UpdateDeliveryDto) => {
    setIsUpdating(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_SERVER_BASE_URL}/deliveries`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      })

      console.log(updateData)

      if (!response.ok) {
        throw new Error("Failed to update delivery")
      }

      toast({
        title: "Succès",
        description: "La livraison a été mise à jour avec succès",
      })

      refetch() // Refresh the data
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la livraison",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleCancelDelivery = async (cancelData: CancelDeliveryDto) => {
    setIsCancelling(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_SERVER_BASE_URL}/deliveries/cancel-delivery`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(cancelData),
      })

      if (!response.ok) {
        throw new Error("Failed to cancel delivery")
      }

      toast({
        title: "Succès",
        description: "La livraison a été annulée avec succès",
      })

      refetch() // Refresh the data
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'annuler la livraison",
        variant: "destructive",
      })
    } finally {
      setIsCancelling(false)
    }
  }

  const canCancelDelivery = (delivery: any) => {
    return delivery.status === "unassigned" || delivery.status === "assigned"
  }

  // Calculate statistics
  const totalDeliveries = deliveries.length

  // Count deliveries by status
  const inProgressCount = deliveries.filter(
    (delivery) =>
      delivery.status === "assigned" ||
      delivery.status === "delivery_start_to_pickup" ||
      delivery.status === "picked" ||
      delivery.status === "delivery_start_to_recipient" ||
      delivery.status === "arrived_to_recipient" ||
      delivery.status === "unassigned", // Added "unassigned" (en attente) to in progress count
  ).length

  const completedCount = deliveries.filter((delivery) => delivery.status === "delivered").length

  const failedCount = deliveries.filter(
    (delivery) =>
      delivery.status === "failed_pickup" ||
      delivery.status === "unreachable_recipient" ||
      delivery.status === "refused",
  ).length

  // Calculate total cost
  const totalCost = deliveries.reduce((sum, delivery) => sum + (delivery.delivery_fees || 0), 0)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Total des livraisons" value={totalDeliveries} />
        <StatsCard title="En cours" value={inProgressCount} />
        <StatsCard title="Livrées" value={completedCount} />
        <StatsCard title="Échouées" value={failedCount} />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">Livraisons</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={refetch}
              disabled={isRefreshing}
              className="flex items-center gap-2 bg-transparent"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              Actualiser
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <FilterControls
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            date={date}
            setDate={setDate}
          />

          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="flex flex-col items-center gap-2">
                <Clock className="h-8 w-8 animate-spin text-gray-400" />
                <p className="text-gray-500 font-medium">Chargement des livraisons...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex justify-center items-center py-8">
              <div className="flex flex-col items-center gap-2">
                <AlertCircle className="h-8 w-8 text-red-500" />
                <p className="text-red-500 font-medium">{error}</p>
                <p className="text-gray-400 text-sm">Veuillez réessayer plus tard</p>
              </div>
            </div>
          ) : (
            <DeliveryTable
              deliveries={filteredDeliveries}
              expandable={true}
              //@ts-ignore
              onEditDelivery={handleUpdateDelivery}
              //@ts-ignore
              onCancelDelivery={handleCancelDelivery}
              canCancelDelivery={canCancelDelivery}
              isUpdating={isUpdating}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
