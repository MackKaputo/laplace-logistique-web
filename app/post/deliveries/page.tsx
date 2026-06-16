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
  Building2,
  Phone,
  Users,
  DollarSign,
  Receipt,
  Calendar,
  FileText,
} from "lucide-react"
import {
  useQuery,
  useMutation,
  useQueryClient,
  QueryClient,
  QueryClientProvider,
  keepPreviousData,
} from "@tanstack/react-query"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

type Invoice = {
  id: string
  invoice_number: string
  date: string
  amount: number
  status: "paid" | "pending"
  client_id: string
  client_name: string
  deliveries_count: number
  period_start: string
  period_end: string
  payment_method?: string
}

const dummyInvoices: Invoice[] = [
  {
    id: "1",
    invoice_number: "INV-2024-101",
    date: "2024-12-28",
    amount: 850000,
    status: "pending",
    client_id: "d4b2c600-59b8-4b13-a825-2feeb6073d7b",
    client_name: "Daredare Courier Service",
    deliveries_count: 221,
    period_start: "2024-12-01",
    period_end: "2024-12-31",
  },
  {
    id: "2",
    invoice_number: "INV-2024-102",
    date: "2024-12-15",
    amount: 1500000,
    status: "pending",
    client_id: "mymy2c34-5my9b8-4b13-a825-2feeb6073dmymy",
    client_name: "Mama Yemo",
    deliveries_count: 380,
    period_start: "2024-12-01",
    period_end: "2024-12-31",
  },
  {
    id: "3",
    invoice_number: "INV-2024-098",
    date: "2024-11-30",
    amount: 1200000,
    status: "paid",
    client_id: "d4b2c600-59b8-4b13-a825-2feeb6073d7b",
    client_name: "Daredare Courier Service",
    deliveries_count: 305,
    period_start: "2024-11-01",
    period_end: "2024-11-30",
    payment_method: "Virement bancaire",
  },
  {
    id: "4",
    invoice_number: "INV-2024-099",
    date: "2024-11-30",
    amount: 800000,
    status: "paid",
    client_id: "mymy2c34-5my9b8-4b13-a825-2feeb6073dmymy",
    client_name: "Mama Yemo",
    deliveries_count: 198,
    period_start: "2024-11-01",
    period_end: "2024-11-30",
    payment_method: "Mobile Money",
  },
  {
    id: "5",
    invoice_number: "INV-2024-095",
    date: "2024-10-31",
    amount: 500000,
    status: "paid",
    client_id: "d4b2c600-59b8-4b13-a825-2feeb6073d7b",
    client_name: "Daredare Courier Service",
    deliveries_count: 128,
    period_start: "2024-10-01",
    period_end: "2024-10-31",
    payment_method: "Espèces",
  },
]

function PostOfficeDeliveriesContent() {
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [limit] = useState(60)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
      setCurrentPage(1)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchTerm])

  const {
    data: clientsData,
    isLoading: clientsLoading,
    error: clientsError,
  } = useQuery({
    queryKey: ["postoffice-clients"],
    queryFn: async () => {
      const baseUrl = process.env.NEXT_PUBLIC_API_SERVER_BASE_URL
      const response = await fetch(`${baseUrl}/customers/postoffice-clients`)

      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status}`)
      }

      const result = await response.json()

      if (result.success && result.data) {
        return result.data
      } else {
        throw new Error(result.message || "Erreur lors de la récupération des clients")
      }
    },
  })

  const {
    data: deliveriesData,
    isLoading: deliveriesLoading,
    isFetching: deliveriesFetching,
    error: deliveriesError,
  } = useQuery({
    queryKey: ["post-deliveries", currentPage, limit, debouncedSearchTerm],
    queryFn: async () => {
      const baseUrl = process.env.NEXT_PUBLIC_API_SERVER_BASE_URL

      const apiUrl = debouncedSearchTerm
        ? `${baseUrl}/deliveries/search?search_text=${encodeURIComponent(debouncedSearchTerm)}&limit=${limit}&page=${currentPage}&parent_client=post-office`
        : `${baseUrl}/deliveries?page=${currentPage}&limit=${limit}&parent_client=post-office`

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
      queryClient.invalidateQueries({ queryKey: ["post-deliveries"] })
    },
  })

  const handleCancelDelivery = async (cancelData: { delivery_id: string; reason?: string }) => {
    await cancelDeliveryMutation.mutateAsync(cancelData)
  }

  const handleDeliveryUpdate = () => {
    queryClient.invalidateQueries({ queryKey: ["post-deliveries"] })
  }

  const deliveries = deliveriesData?.deliveries || []
  const totalDeliveries = deliveriesData?.pagination?.total || 0
  const clients = clientsData || []

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

  const totalBalance = 4850000 // Dummy data for now - Total amount due to Daredare in CDF
  const pendingInvoicesTotal = dummyInvoices
    .filter((inv) => inv.status === "pending")
    .reduce((sum, inv) => sum + inv.amount, 0)

  const handleViewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice)
    setShowInvoiceDialog(true)
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
          onClick={() => queryClient.invalidateQueries({ queryKey: ["post-deliveries"] })}
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
          <h1 className="text-3xl font-bold text-gray-900">Livraisons de la Poste</h1>
          <p className="text-gray-600">Gestion et suivi des livraisons de la poste</p>
        </div>
        <Button
          onClick={() => {
            setCurrentPage(1)
            queryClient.invalidateQueries({ queryKey: ["post-deliveries"] })
            queryClient.invalidateQueries({ queryKey: ["postoffice-clients"] })
          }}
          variant="outline"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
      </div>

      <Card className="border-[#2B015F]/20 bg-gradient-to-br from-[#2B015F]/5 to-transparent">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="h-5 w-5 text-[#2B015F]" />
                <p className="text-sm font-medium text-gray-600">Solde Total (En attente)</p>
              </div>
              <p className="text-3xl font-bold text-[#2B015F]">{pendingInvoicesTotal.toLocaleString("fr-CD")} CDF</p>
              <p className="text-xs text-gray-500 mt-1">
                {dummyInvoices.filter((inv) => inv.status === "pending").length} facture(s) en attente de paiement
              </p>
            </div>
            <div className="p-3 bg-[#2B015F] rounded-full">
              <DollarSign className="h-8 w-8 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-[#2B015F]" />
              <CardTitle>Factures</CardTitle>
            </div>
            <span className="text-sm text-gray-500 font-medium">
              {dummyInvoices.length} facture{dummyInvoices.length !== 1 ? "s" : ""}
            </span>
          </div>
          <CardDescription>Factures émises pour tous les clients de la poste</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {dummyInvoices.map((invoice) => (
              <div
                key={invoice.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer gap-3"
                onClick={() => handleViewInvoice(invoice)}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`flex items-center justify-center w-12 h-12 rounded-lg ${
                      invoice.status === "paid" ? "bg-green-600" : "bg-[#2B015F]"
                    }`}
                  >
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{invoice.invoice_number}</p>
                    <p className="text-sm font-medium text-[#2B015F]">{invoice.client_name}</p>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                      <Calendar className="h-3 w-3" />
                      <span>{new Date(invoice.date).toLocaleDateString("fr-FR")}</span>
                      <span className="mx-1">•</span>
                      <span>{invoice.deliveries_count} livraisons</span>
                    </div>
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-2xl font-bold text-[#2B015F]">{invoice.amount.toLocaleString("fr-CD")} CDF</p>
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      invoice.status === "paid" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {invoice.status === "paid" ? "Payée" : "En attente"}
                  </span>
                  {invoice.payment_method && <p className="text-xs text-gray-500 mt-1">{invoice.payment_method}</p>}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-[#2B015F]" />
              <CardTitle>Clients de la Poste</CardTitle>
            </div>
            <span className="text-sm text-gray-500 font-medium">
              {clients.length} client{clients.length !== 1 ? "s" : ""}
            </span>
          </div>
          <CardDescription>Liste des organisations utilisant les services de la poste</CardDescription>
        </CardHeader>
        <CardContent>
          {clientsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#2B015F] mx-auto"></div>
                <p className="mt-2 text-sm text-gray-600">Chargement des clients...</p>
              </div>
            </div>
          ) : clientsError ? (
            <div className="text-center py-8">
              <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Erreur lors du chargement des clients</p>
            </div>
          ) : clients.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Aucun client enregistré</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {clients.map((client: any) => (
                <a
                  key={client.user_id}
                  href={`/post/deliveries/${client.user_id}`}
                  className="block border border-gray-200 rounded-lg p-4 hover:border-[#2B015F] hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-[#2B015F]/10 rounded-lg group-hover:bg-[#2B015F]/20 transition-colors">
                      <Building2 className="h-5 w-5 text-[#2B015F]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate group-hover:text-[#2B015F] transition-colors">
                        {client.organizationName}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-2 text-sm text-gray-600">
                        <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="truncate">{client.phone_number}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1 truncate" title={client.user_id}>
                        ID: {client.user_id.slice(0, 8)}...
                      </p>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

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
            readOnly={true}
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

      {/* Invoice Dialog */}
      <Dialog open={showInvoiceDialog} onOpenChange={setShowInvoiceDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Facture {selectedInvoice?.invoice_number}</DialogTitle>
          </DialogHeader>

          {selectedInvoice && (
            <div className="space-y-6">
              {/* Invoice Header */}
              <div className="border-b pb-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Date d'émission</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(selectedInvoice.date).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Statut</p>
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        selectedInvoice.status === "paid"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {selectedInvoice.status === "paid" ? "Payée" : "En attente"}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <div>
                    <p className="text-sm text-gray-600">Période de facturation</p>
                    <p className="font-medium text-gray-900">
                      {new Date(selectedInvoice.period_start).toLocaleDateString("fr-FR")} -{" "}
                      {new Date(selectedInvoice.period_end).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  {selectedInvoice.payment_method && (
                    <div>
                      <p className="text-sm text-gray-600">Mode de paiement</p>
                      <p className="font-medium text-gray-900">{selectedInvoice.payment_method}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Invoice Details */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Détails de facturation</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Nombre de livraisons</span>
                    <span className="font-medium text-gray-900">{selectedInvoice.deliveries_count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tarif moyen par livraison</span>
                    <span className="font-medium text-gray-900">
                      {Math.round(selectedInvoice.amount / selectedInvoice.deliveries_count).toLocaleString("fr-CD")}{" "}
                      CDF
                    </span>
                  </div>
                  <div className="border-t pt-3 flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900">Montant total</span>
                    <span className="text-2xl font-bold text-[#2B015F]">
                      {selectedInvoice.amount.toLocaleString("fr-CD")} CDF
                    </span>
                  </div>
                </div>
              </div>

              {/* Client Info */}
              <div className="bg-[#2B015F]/5 rounded-lg p-4 border border-[#2B015F]/10">
                <h3 className="font-semibold text-gray-900 mb-2">Client</h3>
                <div className="space-y-1 text-sm">
                  <p className="text-gray-600">
                    <span className="font-medium text-gray-900">{selectedInvoice.client_name}</span>
                  </p>
                  <p className="text-gray-600 text-xs break-all">ID: {selectedInvoice.client_id}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function PostOfficeDeliveriesPage() {
  const queryClientRef = useRef<QueryClient>()
  if (!queryClientRef.current) {
    queryClientRef.current = new QueryClient()
  }

  return (
    <QueryClientProvider client={queryClientRef.current}>
      <PostOfficeDeliveriesContent />
    </QueryClientProvider>
  )
}
