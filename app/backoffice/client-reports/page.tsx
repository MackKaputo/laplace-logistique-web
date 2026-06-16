"use client"

import { useSearchParams } from "next/navigation"

import { useState } from "react"
import { useQuery, QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Search,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Phone,
  Mail,
  Building2,
  Package,
} from "lucide-react"

interface Delivery {
  delivery_id: string
  package_code: string
  recipient_name: string
  collected_package_value: {
    currency: string
    value: number | null
  }
  expected_delivery_fee_cdf: number
  received_delivery_fee_cdf: number
  unpaid_delivery_fee_cdf: number
}

interface CurrencyData {
  currency: string
  total_collected_package_value: number
  total_expected_delivery_fee_cdf: number
  total_received_delivery_fee_cdf: number
  total_unpaid_delivery_fee_cdf: number
  final_amount_to_pay_customer: number
  customer_debt_cdf: number
  deliveries: Delivery[]
}

interface CustomerReport {
  _id: string
  customer: {
    customer_id: string
    phone_number: string
    organizationName: string
    email: string
    first_name: string
    last_name: string
  }
  data: CurrencyData[]
}

const queryClient = new QueryClient()

function ClientReportsContent() {
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedCustomers, setExpandedCustomers] = useState<Set<string>>(new Set())

  const {
    data: reports,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["client-reports", searchQuery],
    queryFn: async () => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_SERVER_BASE_URL}/deliveries/payment-reports/aggregated-by-customer?query=${searchQuery}`
      )
      const result = await response.json()
      if (result.success) {
        return result.data as CustomerReport[]
      }
      throw new Error(result.message || "Failed to fetch client reports")
    },
  })

  const filteredReports = reports?.filter((report) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      report.customer.first_name?.toLowerCase().includes(query) ||
      report.customer.last_name?.toLowerCase().includes(query) ||
      report.customer.organizationName?.toLowerCase().includes(query) ||
      report.customer.phone_number?.includes(query)
    )
  })

  const toggleExpanded = (customerId: string) => {
    setExpandedCustomers((prev) => {
      const next = new Set(prev)
      if (next.has(customerId)) {
        next.delete(customerId)
      } else {
        next.add(customerId)
      }
      return next
    })
  }

  // Calculate totals across all customers
  const totals = reports?.reduce(
    (acc, report) => {
      report.data.forEach((currencyData) => {
        if (currencyData.currency === "USD") {
          acc.toPayCustomerUSD += currencyData.final_amount_to_pay_customer > 0 ? currencyData.final_amount_to_pay_customer : 0
        } else if (currencyData.currency === "CDF") {
          acc.toPayCustomerCDF += currencyData.final_amount_to_pay_customer > 0 ? currencyData.final_amount_to_pay_customer : 0
        }
        acc.customerDebtCDF += currencyData.customer_debt_cdf || 0
      })
      return acc
    },
    { toPayCustomerUSD: 0, toPayCustomerCDF: 0, customerDebtCDF: 0 }
  ) || { toPayCustomerUSD: 0, toPayCustomerCDF: 0, customerDebtCDF: 0 }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <p className="text-red-600">Erreur lors du chargement des rapports</p>
        <Button onClick={() => refetch()} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Reessayer
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#2B015F]">Rapports Clients</h1>
          <p className="text-gray-600 text-sm mt-1">
            Vue d'ensemble des paiements et soldes clients
          </p>
        </div>
        <Button
          onClick={() => refetch()}
          disabled={isFetching}
          variant="outline"
          className="shrink-0"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
          Actualiser
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <ArrowUpRight className="h-4 w-4 text-green-500" />
              A payer aux clients (USD)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {totals.toPayCustomerUSD.toLocaleString()} USD
            </p>
            <p className="text-xs text-gray-500 mt-1">Montant total a reverser</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <ArrowUpRight className="h-4 w-4 text-blue-500" />
              A payer aux clients (CDF)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">
              {totals.toPayCustomerCDF.toLocaleString()} CDF
            </p>
            <p className="text-xs text-gray-500 mt-1">Montant total a reverser</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <ArrowDownRight className="h-4 w-4 text-orange-500" />
              Dus par les clients (CDF)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-orange-600">
              {totals.customerDebtCDF.toLocaleString()} CDF
            </p>
            <p className="text-xs text-gray-500 mt-1">Frais de livraison impayes</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher par nom, prenom ou organisation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Badge variant="secondary" className="shrink-0">
          <Users className="h-3 w-3 mr-1" />
          {filteredReports?.length || 0} client(s)
        </Badge>
      </div>

      {/* Customer List */}
      <div className="space-y-4">
        {filteredReports?.map((report) => {
          const isExpanded = expandedCustomers.has(report._id)
          const usdData = report.data.find((d) => d.currency === "USD")
          const cdfData = report.data.find((d) => d.currency === "CDF")

          // Calculate what we owe them and what they owe us
          const weOweUSD = usdData && usdData.final_amount_to_pay_customer > 0 ? usdData.final_amount_to_pay_customer : 0
          const weOweCDF = cdfData && cdfData.final_amount_to_pay_customer > 0 ? cdfData.final_amount_to_pay_customer : 0
          const theyOweUs = (usdData?.customer_debt_cdf || 0) + (cdfData?.customer_debt_cdf || 0)
          
          // Get unique deliveries (combine from both currencies to avoid duplicates)
          const allDeliveries = new Map<string, Delivery>()
          report.data.forEach((currencyData) => {
            currencyData.deliveries.forEach((delivery) => {
              if (!allDeliveries.has(delivery.delivery_id)) {
                allDeliveries.set(delivery.delivery_id, delivery)
              }
            })
          })
          const uniqueDeliveries = Array.from(allDeliveries.values())

          return (
            <Card key={report._id} className="overflow-hidden">
              <div
                className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleExpanded(report._id)}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Customer Info */}
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-[#2B015F]/10 flex items-center justify-center shrink-0">
                      <Building2 className="h-6 w-6 text-[#2B015F]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#2B015F]">
                        {report.customer.organizationName || `${report.customer.first_name} ${report.customer.last_name}`}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {report.customer.first_name} {report.customer.last_name}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {report.customer.phone_number}
                        </span>
                        {report.customer.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {report.customer.email}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Financial Summary */}
                  <div className="flex flex-wrap items-center gap-3 lg:gap-6">
                    {/* We owe them */}
                    {(weOweUSD > 0 || weOweCDF > 0) && (
                      <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                        <p className="text-xs text-green-700 font-medium">A payer au client</p>
                        <div className="flex flex-col">
                          {weOweUSD > 0 && (
                            <span className="text-sm font-bold text-green-600">{weOweUSD.toLocaleString()} USD</span>
                          )}
                          {weOweCDF > 0 && (
                            <span className="text-sm font-bold text-green-600">{weOweCDF.toLocaleString()} CDF</span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* They owe us */}
                    {theyOweUs > 0 && (
                      <div className="bg-orange-50 border border-orange-200 rounded-lg px-3 py-2">
                        <p className="text-xs text-orange-700 font-medium">Du par le client</p>
                        <span className="text-sm font-bold text-orange-600">{theyOweUs.toLocaleString()} CDF</span>
                      </div>
                    )}

                    {/* No balance */}
                    {weOweUSD === 0 && weOweCDF === 0 && theyOweUs === 0 && (
                      <Badge variant="secondary">Solde equilibre</Badge>
                    )}

                    {/* Delivery count */}
                    <Badge variant="outline" className="shrink-0">
                      <Package className="h-3 w-3 mr-1" />
                      {uniqueDeliveries.length} livraison(s)
                    </Badge>

                    {/* Expand icon */}
                    <div className="text-gray-400">
                      {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </div>
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="border-t bg-gray-50 p-4">
                  {/* Detailed Financial Breakdown */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {/* USD Summary */}
                    {usdData && (usdData.total_collected_package_value > 0 || usdData.deliveries.some(d => d.collected_package_value?.value)) && (
                      <div className="bg-white rounded-lg p-4 border">
                        <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-green-100 text-green-700 text-xs flex items-center justify-center font-bold">$</span>
                          Transactions en USD
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Valeur colis collectee:</span>
                            <span className="font-medium">{usdData.total_collected_package_value?.toLocaleString()} USD</span>
                          </div>
                          <div className="border-t pt-2 mt-2">
                            <div className="flex justify-between font-semibold">
                              <span className="text-gray-700">A payer au client:</span>
                              <span className={usdData.final_amount_to_pay_customer >= 0 ? "text-green-600" : "text-orange-600"}>
                                {usdData.final_amount_to_pay_customer?.toLocaleString()} USD
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* CDF Summary */}
                    {cdfData && (cdfData.total_collected_package_value > 0 || cdfData.deliveries.some(d => d.collected_package_value?.value)) && (
                      <div className="bg-white rounded-lg p-4 border">
                        <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-bold">FC</span>
                          Transactions en CDF
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Valeur colis collectee:</span>
                            <span className="font-medium">{cdfData.total_collected_package_value?.toLocaleString()} CDF</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Frais livraison attendus:</span>
                            <span className="font-medium">{cdfData.total_expected_delivery_fee_cdf?.toLocaleString()} CDF</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Frais livraison recus:</span>
                            <span className="font-medium">{cdfData.total_received_delivery_fee_cdf?.toLocaleString()} CDF</span>
                          </div>
                          {cdfData.total_unpaid_delivery_fee_cdf > 0 && (
                            <div className="flex justify-between text-orange-600">
                              <span>Frais impayes:</span>
                              <span className="font-medium">{cdfData.total_unpaid_delivery_fee_cdf?.toLocaleString()} CDF</span>
                            </div>
                          )}
                          <div className="border-t pt-2 mt-2">
                            <div className="flex justify-between font-semibold">
                              <span className="text-gray-700">A payer au client:</span>
                              <span className={cdfData.final_amount_to_pay_customer >= 0 ? "text-green-600" : "text-orange-600"}>
                                {cdfData.final_amount_to_pay_customer?.toLocaleString()} CDF
                              </span>
                            </div>
                            {cdfData.customer_debt_cdf > 0 && (
                              <div className="flex justify-between font-semibold text-orange-600 mt-1">
                                <span>Dette du client:</span>
                                <span>{cdfData.customer_debt_cdf?.toLocaleString()} CDF</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Deliveries Table */}
                  <div className="bg-white rounded-lg border overflow-hidden">
                    <div className="px-4 py-3 bg-gray-100 border-b">
                      <h4 className="font-semibold text-gray-700">Detail des livraisons</h4>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-gray-600 font-medium">Code</th>
                            <th className="px-4 py-2 text-left text-gray-600 font-medium">Destinataire</th>
                            <th className="px-4 py-2 text-right text-gray-600 font-medium">Valeur Colis</th>
                            <th className="px-4 py-2 text-right text-gray-600 font-medium">Frais Attendus</th>
                            <th className="px-4 py-2 text-right text-gray-600 font-medium">Frais Recus</th>
                            <th className="px-4 py-2 text-right text-gray-600 font-medium">Impaye</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {uniqueDeliveries.map((delivery, idx) => {
                            // Find both USD and CDF data for this delivery
                            const usdDelivery = usdData?.deliveries.find(d => d.delivery_id === delivery.delivery_id)
                            const cdfDelivery = cdfData?.deliveries.find(d => d.delivery_id === delivery.delivery_id)
                            
                            return (
                              <tr key={`${delivery.delivery_id}-${idx}`} className="hover:bg-gray-50">
                                <td className="px-4 py-3">
                                  <Badge variant="outline" className="font-mono text-xs">
                                    {delivery.package_code}
                                  </Badge>
                                </td>
                                <td className="px-4 py-3 text-gray-700">
                                  {delivery.recipient_name || "-"}
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <div className="flex flex-col items-end gap-1">
                                    {usdDelivery?.collected_package_value?.value ? (
                                      <span className="text-green-600 font-medium">
                                        {usdDelivery.collected_package_value.value.toLocaleString()} USD
                                      </span>
                                    ) : null}
                                    {cdfDelivery?.collected_package_value?.value ? (
                                      <span className="text-blue-600 font-medium">
                                        {cdfDelivery.collected_package_value.value.toLocaleString()} CDF
                                      </span>
                                    ) : null}
                                    {!usdDelivery?.collected_package_value?.value && !cdfDelivery?.collected_package_value?.value && (
                                      <span className="text-gray-400">-</span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-right text-gray-700">
                                  {delivery.expected_delivery_fee_cdf?.toLocaleString()} CDF
                                </td>
                                <td className="px-4 py-3 text-right text-gray-700">
                                  {delivery.received_delivery_fee_cdf?.toLocaleString()} CDF
                                </td>
                                <td className="px-4 py-3 text-right">
                                  {delivery.unpaid_delivery_fee_cdf > 0 ? (
                                    <span className="text-orange-600 font-medium">
                                      {delivery.unpaid_delivery_fee_cdf?.toLocaleString()} CDF
                                    </span>
                                  ) : (
                                    <span className="text-green-600">-</span>
                                  )}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          )
        })}

        {filteredReports?.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg border">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Aucun client trouve</p>
            {searchQuery && (
              <p className="text-sm text-gray-400 mt-1">
                Essayez de modifier votre recherche
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function ClientReportsPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <ClientReportsContent />
    </QueryClientProvider>
  )
}
