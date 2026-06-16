"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { BackofficeDeliveryTable } from "@/components/dashboard/backoffice-delivery-table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Search,
  RefreshCw,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import {
  useQuery,
  useMutation,
  useQueryClient,
  QueryClient,
  QueryClientProvider,
  keepPreviousData,
} from "@tanstack/react-query"

function BackofficeDeliveriesContent() {
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [limit] = useState(60)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
      setCurrentPage(1)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchTerm])

  const {
    data: deliveriesData,
    isLoading: deliveriesLoading,
    isFetching: deliveriesFetching,
    error: deliveriesError,
  } = useQuery({
    queryKey: ["deliveries", currentPage, limit, debouncedSearchTerm],
    queryFn: async () => {
      const baseUrl = process.env.NEXT_PUBLIC_API_SERVER_BASE_URL

      const apiUrl = debouncedSearchTerm
        ? `${baseUrl}/deliveries/search?search_text=${encodeURIComponent(debouncedSearchTerm)}&limit=${limit}&page=${currentPage}`
        : `${baseUrl}/deliveries?page=${currentPage}&limit=${limit}`

      const response = await fetch(apiUrl)

      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status}`)
      }

      const result = await response.json()

      if (result.success && result.data) {
        return {
          deliveries: result.data,
          pagination: result.pagination || {
            currentPage: currentPage,
            total: result.data.length,
          },
        }
      } else {
        throw new Error(result.message || "Erreur lors de la récupération des données")
      }
    },
    placeholderData: keepPreviousData,
  })

  const cancelDeliveryMutation = useMutation({
    mutationFn: async (cancelData: { delivery_id: string; reason?: string }) => {
      const apiUrl = `${process.env.NEXT_PUBLIC_API_SERVER_BASE_URL}/deliveries/cancel-delivery`
      const response = await fetch(apiUrl, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(cancelData),
      })

      if (!response.ok) {
        throw new Error(`Erreur lors de l'annulation: ${response.status}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.message || "Erreur lors de l'annulation")
      }

      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deliveries"] })
    },
  })

  const handleCancelDelivery = async (cancelData: { delivery_id: string; reason?: string }) => {
    await cancelDeliveryMutation.mutateAsync(cancelData)
  }

  const handleDeliveryUpdate = () => {
    queryClient.invalidateQueries({ queryKey: ["deliveries"] })
  }

  const deliveries = deliveriesData?.deliveries || []
  const totalDeliveries = deliveriesData?.pagination?.total || 0

  const filteredDeliveries = deliveries.filter((delivery: any) => {
    if (statusFilter !== "all" && delivery.status !== statusFilter) {
      return false
    }

    return true
  })

  const statusOptions = [
    { value: "all", label: "Tous les statuts" },
    { value: "unassigned", label: "En attente" },
    { value: "assigned", label: "Assignée" },
    { value: "delivery_start_to_pickup", label: "En route pour ramassage" },
    { value: "picked", label: "Ramassée" },
    { value: "delivery_start_to_recipient", label: "En route pour livraison" },
    { value: "arrived_to_recipient", label: "Arrivée chez destinataire" },
    { value: "delivered", label: "Livrée" },
    { value: "failed_pickup", label: "Échec de ramassage" },
    { value: "unreachable_recipient", label: "Destinataire injoignable" },
    { value: "refused", label: "Refusée" },
    { value: "postponed", label: "Reportée" },
    { value: "cancelled", label: "Annulée" },
  ]

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const handleNextPage = () => {
    setCurrentPage(currentPage + 1)
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  if (deliveriesLoading && !deliveriesData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2B015F] mx-auto"></div>
          <p className="mt-2 text-gray-600">Chargement des livraisons...</p>
        </div>
      </div>
    )
  }

  if (deliveriesError) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Erreur de chargement</h3>
        <p className="text-gray-600 mb-4">{deliveriesError.message}</p>
        <Button
          onClick={() => queryClient.invalidateQueries({ queryKey: ["deliveries"] })}
          className="bg-[#2B015F] hover:bg-[#2B015F]/90"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Réessayer
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Toutes les livraisons</h1>
          <p className="text-gray-600">Gestion et suivi de toutes les livraisons</p>
        </div>
        <Button
          onClick={() => {
            setCurrentPage(1)
            queryClient.invalidateQueries({ queryKey: ["deliveries"] })
          }}
          variant="outline"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
          <CardDescription>Rechercher et filtrer les livraisons</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Rechercher par code, client, destinataire ou adresse..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="pl-10"
              />
              {searchTerm !== debouncedSearchTerm && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#2B015F]"></div>
                </div>
              )}
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2B015F] focus:border-transparent"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          {filteredDeliveries.length} livraison{filteredDeliveries.length !== 1 ? "s" : ""} sur cette page
          {searchTerm || statusFilter !== "all" ? ` (${totalDeliveries} au total)` : ` sur ${totalDeliveries} au total`}
        </p>
      </div>

      {/* Deliveries Table */}
      <Card>
        <CardContent className="p-0 relative">
          {deliveriesFetching && deliveriesData && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2B015F] mx-auto"></div>
                <p className="mt-2 text-sm text-gray-600">Recherche en cours...</p>
              </div>
            </div>
          )}
          <BackofficeDeliveryTable
            deliveries={filteredDeliveries}
            expandable={true}
            onDeliveryUpdate={handleDeliveryUpdate}
            onCancelDelivery={handleCancelDelivery}
          />
        </CardContent>
      </Card>

      {/* Pagination Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviousPage}
                disabled={currentPage === 1 || deliveriesLoading}
                className="flex items-center gap-1 bg-transparent"
              >
                <ChevronLeft className="h-4 w-4" />
                Précédent
              </Button>

              <div className="flex items-center gap-2 mx-4">
                <span className="text-sm text-gray-600">Page</span>
                <span className="font-medium text-[#2B015F]">{currentPage}</span>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={deliveriesLoading}
                className="flex items-center gap-1 bg-transparent"
              >
                Suivant
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="text-sm text-gray-600">
              <span className="font-medium">{totalDeliveries}</span> livraison{totalDeliveries !== 1 ? "s" : ""} au
              total
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function BackofficeDeliveriesPage() {
  const queryClientRef = useRef<QueryClient>()
  if (!queryClientRef.current) {
    queryClientRef.current = new QueryClient()
  }

  return (
    <QueryClientProvider client={queryClientRef.current}>
      <BackofficeDeliveriesContent />
    </QueryClientProvider>
  )
}
