"use client"

import { useState } from "react"
import { AccessControl } from "@/components/backoffice/access-control"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useQuery, QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Search, Users, Phone, Building2, Calendar, AlertCircle, CheckCircle } from "lucide-react"
import { useRef } from "react"

interface Customer {
  _id: string
  user_id: string
  first_name: string
  last_name: string
  phone_number: string
  account_type: "enterprise" | "individual"
  organizationName?: string
  last_delivery_date: string | null
  last_delivered_date: string | null
}

function UsersContent() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedFilter, setSelectedFilter] = useState<"all" | "active" | "contact" | "inactive">("all")

  const {
    data: customers,
    isLoading,
    error,
  } = useQuery<Customer[]>({
    queryKey: ["active-customers"],
    queryFn: async () => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_SERVER_BASE_URL}/customers/actifs`)
      if (!response.ok) throw new Error("Failed to fetch customers")
      const result = await response.json()
      return result.data
    },
  })

  const filteredCustomers = customers?.filter(
    (customer) =>
      customer.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone_number.includes(searchTerm) ||
      customer.organizationName?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getCustomerStatus = (customer: Customer) => {
    const twoMonthsAgo = new Date()
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2)

    if (customer.last_delivery_date && !customer.last_delivered_date) {
      return {
        type: "pending",
        label: "Livraison en attente",
        color: "bg-orange-100 text-orange-800 border-orange-300",
        icon: AlertCircle,
      }
    }

    if (!customer.last_delivery_date && !customer.last_delivered_date) {
      return {
        type: "inactive",
        label: "Aucune activité",
        color: "bg-gray-100 text-gray-600 border-gray-300",
        icon: AlertCircle,
      }
    }

    if (customer.last_delivery_date && new Date(customer.last_delivery_date) < twoMonthsAgo) {
      return {
        type: "old",
        label: "Inactif +2 mois",
        color: "bg-red-100 text-red-800 border-red-300",
        icon: AlertCircle,
      }
    }

    return {
      type: "active",
      label: "Actif",
      color: "bg-green-100 text-green-800 border-green-300",
      icon: CheckCircle,
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Jamais"
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  }

  const categoryFilteredCustomers = filteredCustomers?.filter((customer) => {
    if (selectedFilter === "all") return true
    const status = getCustomerStatus(customer)
    if (selectedFilter === "active") return status.type === "active"
    if (selectedFilter === "contact") return ["old", "pending"].includes(status.type)
    if (selectedFilter === "inactive") return status.type === "inactive"
    return true
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6F00C7] mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des clients...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <p className="text-red-600 text-center">Erreur lors du chargement des clients</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <AccessControl requiredRole="both">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-[#2B015F]">Clients Actifs</h1>
          <p className="text-gray-600 mt-2">
            Gérez et suivez vos clients actifs. Les indicateurs visuels vous aident à identifier les clients nécessitant
            un suivi.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedFilter === "all" ? "ring-2 ring-[#6F00C7]" : ""
            }`}
            onClick={() => setSelectedFilter("all")}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Clients</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#6F00C7]">{customers?.length || 0}</div>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedFilter === "active" ? "ring-2 ring-green-600" : ""
            }`}
            onClick={() => setSelectedFilter("active")}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Actifs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {customers?.filter((c) => getCustomerStatus(c).type === "active").length || 0}
              </div>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedFilter === "contact" ? "ring-2 ring-red-600" : ""
            }`}
            onClick={() => setSelectedFilter("contact")}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">À Contacter</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {customers?.filter((c) => ["old", "pending"].includes(getCustomerStatus(c).type)).length || 0}
              </div>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedFilter === "inactive" ? "ring-2 ring-gray-600" : ""
            }`}
            onClick={() => setSelectedFilter("inactive")}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Sans Activité</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">
                {customers?.filter((c) => getCustomerStatus(c).type === "inactive").length || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher par nom, téléphone ou organisation..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {categoryFilteredCustomers?.map((customer) => {
            const status = getCustomerStatus(customer)
            const StatusIcon = status.icon

            return (
              <Card
                key={customer._id}
                className={`border-l-4 transition-shadow hover:shadow-md ${
                  status.type === "old" || status.type === "pending"
                    ? "border-l-red-500"
                    : status.type === "inactive"
                      ? "border-l-gray-400"
                      : "border-l-green-500"
                }`}
              >
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-gray-900">
                          {customer.first_name} {customer.last_name}
                        </h3>
                        {customer.organizationName && (
                          <div className="flex items-center gap-2 mt-1 text-gray-600">
                            <Building2 className="h-4 w-4" />
                            <span className="text-sm">{customer.organizationName}</span>
                          </div>
                        )}
                      </div>
                      <Badge variant="outline" className={`${status.color} flex items-center gap-1`}>
                        <StatusIcon className="h-3 w-3" />
                        {status.label}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2 text-gray-700">
                      <Phone className="h-4 w-4" />
                      <span className="text-sm">{customer.phone_number}</span>
                    </div>

                    <div>
                      <Badge variant="secondary">
                        {customer.account_type === "enterprise" ? "Entreprise" : "Particulier"}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-3 border-t">
                      <div>
                        <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                          <Calendar className="h-3 w-3" />
                          Dernière commande
                        </div>
                        <p
                          className={`text-sm font-medium ${
                            customer.last_delivery_date ? "text-gray-900" : "text-gray-400 italic"
                          }`}
                        >
                          {formatDate(customer.last_delivery_date)}
                        </p>
                      </div>
                      <div>
                        <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                          <Calendar className="h-3 w-3" />
                          Dernière livraison
                        </div>
                        <p
                          className={`text-sm font-medium ${
                            customer.last_delivered_date ? "text-gray-900" : "text-gray-400 italic"
                          }`}
                        >
                          {formatDate(customer.last_delivered_date)}
                        </p>
                      </div>
                    </div>

                    {(status.type === "old" || status.type === "pending") && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-xs text-red-800 font-medium">
                          {status.type === "old"
                            ? "⚠️ Client inactif depuis plus de 2 mois - Contacter pour suivi"
                            : "⚠️ Commande en attente de livraison - Vérifier le statut"}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {categoryFilteredCustomers?.length === 0 && (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Aucun client trouvé</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AccessControl>
  )
}

export default function UsersPage() {
  const queryClientRef = useRef<QueryClient>()
  if (!queryClientRef.current) {
    queryClientRef.current = new QueryClient()
  }

  return (
    <QueryClientProvider client={queryClientRef.current}>
      <UsersContent />
    </QueryClientProvider>
  )
}
