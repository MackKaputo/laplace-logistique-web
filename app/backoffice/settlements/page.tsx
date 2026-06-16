"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, DollarSign, Package, User, Phone, MapPin, ChevronDown, ChevronUp, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface Recipient {
  name: string
  phone_number: string
  address: {
    address_line: string
    city: string
    country: string
  }
}

interface Delivery {
  recipient: Recipient
  package_value: {
    currency: string
    value: number
  }
}

interface CustomerSettlement {
  customer_name: string
  customer_phone: string
  total_deliveries: number
  total_fees: number
  delivery_fees_cdf: number
  total_fees_cdf: number
  package_value_total_usd: number
  package_value_total_cdf: number
  deliveries: Delivery[]
  customer_id: string
}

interface ApiResponse {
  success: boolean
  message: string
  data: CustomerSettlement[]
}

export default function SettlementsPage() {
  const [settlements, setSettlements] = useState<CustomerSettlement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedCustomers, setExpandedCustomers] = useState<Set<string>>(new Set())
  const [startDate, setStartDate] = useState<string>("")
  const [endDate, setEndDate] = useState<string>("")
  const { toast } = useToast()

  useEffect(() => {
    fetchSettlements()
  }, [])

  const fetchSettlements = async () => {
    try {
      setIsLoading(true)
      setError(null)
      let url = `${process.env.NEXT_PUBLIC_API_SERVER_BASE_URL}/deliveries/admin-statistics/today-delivered-deliveries-by-customer`
      const params = new URLSearchParams()
      if (startDate) params.append("start_date", startDate)
      if (endDate) params.append("end_date", endDate)
      if (params.toString()) {
        url += `?${params.toString()}`
      }
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error("Failed to fetch settlements data")
      }
      const result: ApiResponse = await response.json()
      setSettlements(result.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
      toast({
        title: "Erreur",
        description: "Impossible de charger les données de règlement",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const toggleCustomer = (customerId: string) => {
    const newExpanded = new Set(expandedCustomers)
    if (newExpanded.has(customerId)) {
      newExpanded.delete(customerId)
    } else {
      newExpanded.add(customerId)
    }
    setExpandedCustomers(newExpanded)
  }

  const handleApplyDateFilter = () => {
    fetchSettlements()
  }

  const handleClearDateFilter = () => {
    setStartDate("")
    setEndDate("")
    setTimeout(() => fetchSettlements(), 0)
  }

  const totalCustomers = settlements.length
  const totalDeliveries = settlements.reduce((sum, s) => sum + s.total_deliveries, 0)
  const totalFeesCollected = settlements.reduce((sum, s) => sum + s.total_fees, 0)
  const totalFeesCollectedCDF = settlements.reduce((sum, s) => sum + (s.total_fees_cdf || 0), 0)
  const totalPackageValueUSD = settlements.reduce((sum, s) => sum + s.package_value_total_usd, 0)
  const totalPackageValueCDF = settlements.reduce((sum, s) => sum + s.package_value_total_cdf, 0)

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2B015F]"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Erreur</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={fetchSettlements}>Réessayer</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#2B015F]">Règlements Clients</h1>
          <p className="text-muted-foreground mt-1">
            {startDate || endDate
              ? `Livraisons livrées ${startDate && endDate ? `du ${startDate} au ${endDate}` : startDate ? `depuis ${startDate}` : `jusqu'au ${endDate}`}`
              : "Livraisons livrées aujourd'hui - Paiements à effectuer"}
          </p>
        </div>
        <Button onClick={fetchSettlements} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {/* Date Range Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filtrer par période</CardTitle>
          <CardDescription>Par défaut, affiche les données d'aujourd'hui</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3 items-end">
            <div className="space-y-2">
              <Label htmlFor="start-date">Date de début</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                placeholder="YYYY-MM-DD"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date">Date de fin</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                placeholder="YYYY-MM-DD"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleApplyDateFilter} className="flex-1">
                Appliquer
              </Button>
              {(startDate || endDate) && (
                <Button onClick={handleClearDateFilter} variant="outline">
                  Réinitialiser
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-[#2B015F]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clients</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#2B015F]">{totalCustomers}</div>
            <p className="text-xs text-muted-foreground">Clients avec livraisons</p>
          </CardContent>
        </Card>

        <Card className="border-[#2B015F]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Livraisons</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#2B015F]">{totalDeliveries}</div>
            <p className="text-xs text-muted-foreground">Total livrées aujourd'hui</p>
          </CardContent>
        </Card>

        <Card className="border-green-600">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Frais Collectés</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${totalFeesCollected.toFixed(2)}</div>
            {totalFeesCollectedCDF > 0 && (
              <p className="text-xs text-muted-foreground">{totalFeesCollectedCDF.toLocaleString()} CDF</p>
            )}
            <p className="text-xs text-muted-foreground">Revenus de livraison</p>
          </CardContent>
        </Card>

        <Card className="border-orange-600">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">À Reverser</CardTitle>
            <DollarSign className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">${totalPackageValueUSD.toFixed(2)}</div>
            {totalPackageValueCDF > 0 && (
              <p className="text-xs text-muted-foreground">{totalPackageValueCDF.toLocaleString()} CDF</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Customer Settlements */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-[#2B015F]">Détails par Client</h2>

        {settlements.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-muted-foreground">Aucune livraison aujourd'hui</p>
              <p className="text-sm text-muted-foreground">Les règlements apparaîtront ici</p>
            </CardContent>
          </Card>
        ) : (
          settlements.map((settlement) => {
            const isExpanded = expandedCustomers.has(settlement.customer_id)

            return (
              <Card key={settlement.customer_id} className="overflow-hidden">
                <CardHeader
                  className="cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => toggleCustomer(settlement.customer_id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-lg">{settlement.customer_name}</CardTitle>
                        <Badge variant="outline" className="bg-[#2B015F] text-white">
                          {settlement.total_deliveries} livraison{settlement.total_deliveries > 1 ? "s" : ""}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        {settlement.customer_phone}
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Frais collectés</p>
                        <p className="text-lg font-bold text-green-600">${settlement.total_fees.toFixed(2)}</p>
                        {settlement.total_fees_cdf > 0 && (
                          <p className="text-xs text-muted-foreground">
                            {settlement.total_fees_cdf.toLocaleString()} CDF
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">À reverser</p>
                        <p className="text-lg font-bold text-orange-600">
                          ${settlement.package_value_total_usd.toFixed(2)}
                        </p>
                        {settlement.package_value_total_cdf > 0 && (
                          <p className="text-xs text-muted-foreground">
                            {settlement.package_value_total_cdf.toLocaleString()} CDF
                          </p>
                        )}
                      </div>
                      <Button variant="ghost" size="sm">
                        {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="border-t bg-gray-50/50">
                    <div className="space-y-3 pt-4">
                      <h4 className="font-medium text-sm text-[#2B015F] mb-3">Détails des livraisons</h4>
                      {settlement.deliveries.map((delivery, index) => (
                        <div key={index} className="bg-white p-4 rounded-lg border">
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm font-medium text-[#2B015F] mb-2">Destinataire</p>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 text-sm">
                                  <User className="h-3 w-3 text-muted-foreground" />
                                  {delivery.recipient.name}
                                </div>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Phone className="h-3 w-3" />
                                  {delivery.recipient.phone_number}
                                </div>
                                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                                  <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                  <span>{delivery.recipient.address.address_line}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center justify-end">
                              <div className="text-right">
                                <p className="text-sm text-muted-foreground mb-1">Valeur du colis</p>
                                <p className="text-xl font-bold text-[#2B015F]">
                                  {delivery.package_value.value} {delivery.package_value.currency}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
