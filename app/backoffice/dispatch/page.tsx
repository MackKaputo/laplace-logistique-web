"use client"

import React from "react"

import { useState, useRef } from "react"
import { useQuery, useQueryClient, QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Loader2, MapPin, Phone, Users, Package, RefreshCw, User, ChevronDown, ChevronUp, Clock,
  Navigation, CheckCircle, XCircle, Truck, PackageCheck, AlertTriangle, Timer, MapPinned,
  ExternalLink, Activity
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Deliverer {
  _id: string
  deliverer_id: string
  name: string
  last_name: string
  phone_number: string
  delivery_zone?: {
    id: string
    name: string
  }
  is_activated: boolean
}

interface Delivery {
  _id: string
  delivery_id: string
  delivery_type: string
  status: string
  package_code: string
  pickup_date: number
  preferred_delivery_date?: number
  delivery_fees: number
  delivery_fees_cdf: number
  customer: {
    customer_id: string
    phone_number: string
    name: string
  }
  recipient: {
    name: string
    phone_number: string
    address: {
      address_line: string
      commune_id: string
      quartier_id: string
    }
  }
  pickup_address: {
    address_line: string
    commune_id: string
    quartier_id: number
  }
  deliverer?: {
    deliverer_id: string
    phone_number: string
    name: string
  }
  picker?: {
    deliverer_id: string
    phone_number: string
    name: string
  }
  package: {
    title: string
    description: string
    package_value: {
      currency: string
      value: number
    }
  }
}

interface DeliveryEvent {
  message: string
  deliverer_id: string
  event_name: string
  action: string
  location_latitude?: number
  location_longitude?: number
  created_at: string
  delivery: {
    delivery_id: string
    package_code: string
    recipient_name: string
    recipient_phone_number: string
    recipient_address: string
    customer_name: string
    customer_phone_number: string
    customer_address: string
  }
}

const ACTION_CONFIG: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; color: string; bgColor: string }> = {
  confirmed: { label: "Confirmé", icon: CheckCircle, color: "text-blue-600", bgColor: "bg-blue-100" },
  delivery_start_to_pickup: { label: "En route ramassage", icon: Truck, color: "text-orange-600", bgColor: "bg-orange-100" },
  arrived_to_pickup: { label: "Arrivé au ramassage", icon: MapPinned, color: "text-orange-600", bgColor: "bg-orange-100" },
  item_pickup: { label: "Colis ramassé", icon: PackageCheck, color: "text-emerald-600", bgColor: "bg-emerald-100" },
  failed_pickup: { label: "Échec ramassage", icon: XCircle, color: "text-red-600", bgColor: "bg-red-100" },
  delivery_start_to_recipient: { label: "En route livraison", icon: Navigation, color: "text-purple-600", bgColor: "bg-purple-100" },
  arrived_to_recipient: { label: "Arrivé destination", icon: MapPinned, color: "text-purple-600", bgColor: "bg-purple-100" },
  completed_delivery: { label: "Livraison terminée", icon: CheckCircle, color: "text-green-600", bgColor: "bg-green-100" },
  semi_delivered: { label: "Partiellement livré", icon: AlertTriangle, color: "text-yellow-600", bgColor: "bg-yellow-100" },
  refused: { label: "Refusé", icon: XCircle, color: "text-red-600", bgColor: "bg-red-100" },
  receiver_unreachable: { label: "Destinataire injoignable", icon: AlertTriangle, color: "text-red-600", bgColor: "bg-red-100" },
  postponed: { label: "Reporté", icon: Timer, color: "text-amber-600", bgColor: "bg-amber-100" },
}

function DispatchContent() {
  const [selectedDeliverer, setSelectedDeliverer] = useState<Deliverer | null>(null)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
  const [activeTab, setActiveTab] = useState("deliveries")
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: deliverers = [], isLoading: loadingDeliverers } = useQuery({
    queryKey: ["deliverers"],
    queryFn: async () => {
      const apiUrl = `${process.env.NEXT_PUBLIC_API_SERVER_BASE_URL}/auth/deliverers`
      const response = await fetch(apiUrl)

      if (!response.ok) {
        throw new Error(`Erreur lors de la récupération des livreurs: ${response.status}`)
      }

      const result = await response.json()

      if (result.success && result.data) {
        return result.data.filter((deliverer: Deliverer) => deliverer.is_activated)
      }
      return []
    },
  })

  const { data: pickupDeliveries = [], isLoading: loadingPickups } = useQuery({
    queryKey: ["deliverer-pickups", selectedDeliverer?.deliverer_id],
    queryFn: async () => {
      if (!selectedDeliverer) return []

      const apiUrl = `${process.env.NEXT_PUBLIC_API_SERVER_BASE_URL}/deliveries/user-deliveries?deliverer_id=${selectedDeliverer.deliverer_id}&state=active&as=picker`
      const response = await fetch(apiUrl)

      if (!response.ok) {
        throw new Error(`Erreur: ${response.status}`)
      }

      const result = await response.json()
      return result.success && result.data ? result.data : []
    },
    enabled: !!selectedDeliverer,
  })

  const { data: deliveryDeliveries = [], isLoading: loadingDeliveries } = useQuery({
    queryKey: ["deliverer-deliveries", selectedDeliverer?.deliverer_id],
    queryFn: async () => {
      if (!selectedDeliverer) return []

      const apiUrl = `${process.env.NEXT_PUBLIC_API_SERVER_BASE_URL}/deliveries/user-deliveries?deliverer_id=${selectedDeliverer.deliverer_id}&state=active&as=deliverer`
      const response = await fetch(apiUrl)

      if (!response.ok) {
        throw new Error(`Erreur: ${response.status}`)
      }

      const result = await response.json()
      return result.success && result.data ? result.data : []
    },
    enabled: !!selectedDeliverer,
  })

  const { data: delivererEvents = [], isLoading: loadingEvents } = useQuery({
    queryKey: ["deliverer-events", selectedDeliverer?.deliverer_id],
    queryFn: async () => {
      if (!selectedDeliverer) return []

      const apiUrl = `${process.env.NEXT_PUBLIC_API_SERVER_BASE_URL}/deliveries/deliverer-events?deliverer_id=${selectedDeliverer.deliverer_id}&time_period=today`
      const response = await fetch(apiUrl)

      if (!response.ok) {
        throw new Error(`Erreur: ${response.status}`)
      }

      const result = await response.json()
      return result.success && result.data ? result.data : []
    },
    enabled: !!selectedDeliverer,
  })

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["deliverers"] })
    if (selectedDeliverer) {
      queryClient.invalidateQueries({ queryKey: ["deliverer-pickups"] })
      queryClient.invalidateQueries({ queryKey: ["deliverer-deliveries"] })
      queryClient.invalidateQueries({ queryKey: ["deliverer-events"] })
    }
    toast({
      title: "Actualisation",
      description: "Les données ont été actualisées",
    })
  }

  const openGoogleMaps = (lat: number, lng: number) => {
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, "_blank")
  }

  const formatEventTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)

    if (diffMins < 1) return "À l'instant"
    if (diffMins < 60) return `Il y a ${diffMins} min`
    if (diffHours < 24) return `Il y a ${diffHours}h${diffMins % 60 > 0 ? ` ${diffMins % 60}min` : ""}`

    return date.toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatExactTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }

  const getLastActivityTime = () => {
    if (delivererEvents.length === 0) return null
    return delivererEvents[0]?.created_at
  }

  const getInitials = (name: string, lastName: string) => {
    return `${name.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<
      string,
      { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
    > = {
      unassigned: { label: "En attente", variant: "secondary" },
      assigned: { label: "Assignée", variant: "default" },
      delivery_start_to_pickup: { label: "En route ramassage", variant: "default" },
      picked: { label: "Ramassée", variant: "default" },
      delivery_start_to_recipient: { label: "En route livraison", variant: "default" },
      arrived_to_recipient: { label: "Arrivée", variant: "default" },
      delivered: { label: "Livrée", variant: "outline" },
      failed_pickup: { label: "Échec ramassage", variant: "destructive" },
      unreachable_recipient: { label: "Injoignable", variant: "destructive" },
      refused: { label: "Refusée", variant: "destructive" },
      cancelled: { label: "Annulée", variant: "destructive" },
      postponed: { label: "Reportée", variant: "secondary" },
    }

    const config = statusConfig[status] || { label: status, variant: "default" }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(section)) {
        newSet.delete(section)
      } else {
        newSet.add(section)
      }
      return newSet
    })
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (loadingDeliverers) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[#2B015F]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dispatch</h1>
          <p className="text-gray-500 mt-2">Suivez les livraisons actives de chaque livreur</p>
        </div>
        <Button onClick={handleRefresh} variant="outline" className="gap-2 bg-transparent">
          <RefreshCw className="h-4 w-4" />
          Actualiser
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[400px,1fr]">
        {/* Deliverers List */}
        <Card className="h-fit lg:sticky lg:top-6">
          <CardHeader>
            <CardTitle>Livreurs Actifs</CardTitle>
            <CardDescription>
              {deliverers.length} livreur{deliverers.length !== 1 ? "s" : ""} actif{deliverers.length !== 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto">
            {deliverers.map((deliverer: Deliverer) => (
              <Card
                key={deliverer._id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedDeliverer?._id === deliverer._id ? "border-[#2B015F] bg-purple-50" : "hover:border-gray-300"
                }`}
                onClick={() => setSelectedDeliverer(deliverer)}
              >
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-[#2B015F] text-white text-sm">
                        {getInitials(deliverer.name, deliverer.last_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm truncate">
                        {deliverer.name} {deliverer.last_name}
                      </h3>
                      <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                        <Phone className="h-3 w-3" />
                        <span className="truncate">{deliverer.phone_number}</span>
                      </div>
                      {deliverer.delivery_zone && (
                        <div className="flex items-center gap-1 text-xs mt-1">
                          <MapPin className="h-3 w-3 text-[#2B015F]" />
                          <span className="font-medium truncate">{deliverer.delivery_zone.name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {deliverers.length === 0 && (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-sm font-medium text-gray-900 mb-2">Aucun livreur actif</h3>
                <p className="text-xs text-gray-500">Il n'y a aucun livreur actif dans le système.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Selected Deliverer Details */}
        <div className="space-y-6">
          {!selectedDeliverer ? (
            <Card className="h-[400px] flex items-center justify-center">
              <CardContent className="text-center">
                <User className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Sélectionnez un livreur</h3>
                <p className="text-gray-500">Cliquez sur un livreur pour voir ses livraisons actives</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Deliverer Header with Activity Status */}
              <Card className="border-l-4 border-l-[#2B015F]">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5 text-[#2B015F]" />
                        {selectedDeliverer.name} {selectedDeliverer.last_name}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {getLastActivityTime() ? (
                          <span className="flex items-center gap-1">
                            <Activity className="h-3 w-3 text-green-500" />
                            Dernière activité: {formatEventTime(getLastActivityTime()!)}
                          </span>
                        ) : (
                          <span className="text-gray-400">Aucune activité aujourd'hui</span>
                        )}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                        {pickupDeliveries.length} ramassage{pickupDeliveries.length !== 1 ? "s" : ""}
                      </Badge>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        {deliveryDeliveries.length} livraison{deliveryDeliveries.length !== 1 ? "s" : ""}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="deliveries" className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Livraisons
                  </TabsTrigger>
                  <TabsTrigger value="events" className="flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Journal d'activité
                    {delivererEvents.length > 0 && (
                      <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                        {delivererEvents.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                </TabsList>

                {/* Deliveries Tab */}
                <TabsContent value="deliveries" className="space-y-4 mt-4">
                  {loadingPickups || loadingDeliveries ? (
                    <Card className="h-[300px] flex items-center justify-center">
                      <CardContent>
                        <Loader2 className="h-8 w-8 animate-spin text-[#2B015F] mx-auto" />
                        <p className="text-center text-gray-500 mt-4">Chargement des livraisons...</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <>
                      <Card>
                        <CardHeader className="cursor-pointer" onClick={() => toggleSection("pickups")}>
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-lg flex items-center gap-2">
                                <MapPin className="h-5 w-5 text-orange-600" />
                                Ramassages ({pickupDeliveries.length})
                              </CardTitle>
                              <CardDescription>Livraisons à ramasser chez le client</CardDescription>
                            </div>
                            <Button variant="ghost" size="sm">
                              {expandedSections.has("pickups") ? (
                                <ChevronUp className="h-5 w-5" />
                              ) : (
                                <ChevronDown className="h-5 w-5" />
                              )}
                            </Button>
                          </div>
                        </CardHeader>
                        {expandedSections.has("pickups") && (
                          <CardContent className="space-y-3">
                            {pickupDeliveries.length === 0 ? (
                              <div className="text-center py-8 text-gray-500">
                                <Package className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                                <p>Aucun ramassage en cours</p>
                              </div>
                            ) : (
                              pickupDeliveries.map((delivery: Delivery) => (
                                <Card key={delivery._id} className="border-l-4 border-l-orange-500">
                                  <CardContent className="pt-4">
                                    <div className="space-y-3">
                                      <div className="flex items-start justify-between">
                                        <div className="flex-1 space-y-2">
                                          <div className="flex items-center gap-2">
                                            <span className="font-mono font-semibold text-[#2B015F]">
                                              {delivery.package_code}
                                            </span>
                                            {getStatusBadge(delivery.status)}
                                          </div>

                                          <div className="text-sm space-y-1">
                                            <div>
                                              <span className="font-medium text-gray-700">Client: </span>
                                              <span className="text-gray-900">{delivery.customer.name}</span>
                                            </div>
                                            <div>
                                              <span className="font-medium text-gray-700">Téléphone: </span>
                                              <span className="text-gray-600">{delivery.customer.phone_number}</span>
                                            </div>
                                            <div>
                                              <span className="font-medium text-gray-700">Adresse ramassage: </span>
                                              <span className="text-gray-600">{delivery.pickup_address.address_line}</span>
                                            </div>
                                            {delivery.pickup_date && (
                                              <div className="flex items-center gap-1 text-gray-500">
                                                <Clock className="h-3 w-3" />
                                                <span>{formatDate(delivery.pickup_date)}</span>
                                              </div>
                                            )}
                                          </div>

                                          <div className="pt-2 border-t">
                                            <div className="text-sm">
                                              <span className="font-medium text-gray-700">À livrer à: </span>
                                              <span className="text-gray-900">{delivery.recipient.name}</span>
                                              <span className="text-gray-600 ml-2">({delivery.recipient.phone_number})</span>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))
                            )}
                          </CardContent>
                        )}
                      </Card>

                      <Card>
                        <CardHeader className="cursor-pointer" onClick={() => toggleSection("deliveries")}>
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-lg flex items-center gap-2">
                                <Package className="h-5 w-5 text-green-600" />
                                Livraisons ({deliveryDeliveries.length})
                              </CardTitle>
                              <CardDescription>Livraisons à remettre au destinataire</CardDescription>
                            </div>
                            <Button variant="ghost" size="sm">
                              {expandedSections.has("deliveries") ? (
                                <ChevronUp className="h-5 w-5" />
                              ) : (
                                <ChevronDown className="h-5 w-5" />
                              )}
                            </Button>
                          </div>
                        </CardHeader>
                        {expandedSections.has("deliveries") && (
                          <CardContent className="space-y-3">
                            {deliveryDeliveries.length === 0 ? (
                              <div className="text-center py-8 text-gray-500">
                                <Package className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                                <p>Aucune livraison en cours</p>
                              </div>
                            ) : (
                              deliveryDeliveries.map((delivery: Delivery) => (
                                <Card key={delivery._id} className="border-l-4 border-l-green-500">
                                  <CardContent className="pt-4">
                                    <div className="space-y-3">
                                      <div className="flex items-start justify-between">
                                        <div className="flex-1 space-y-2">
                                          <div className="flex items-center gap-2">
                                            <span className="font-mono font-semibold text-[#2B015F]">
                                              {delivery.package_code}
                                            </span>
                                            {getStatusBadge(delivery.status)}
                                          </div>

                                          <div className="text-sm space-y-1">
                                            <div>
                                              <span className="font-medium text-gray-700">Destinataire: </span>
                                              <span className="text-gray-900">{delivery.recipient.name}</span>
                                            </div>
                                            <div>
                                              <span className="font-medium text-gray-700">Téléphone: </span>
                                              <span className="text-gray-600">{delivery.recipient.phone_number}</span>
                                            </div>
                                            <div>
                                              <span className="font-medium text-gray-700">Adresse livraison: </span>
                                              <span className="text-gray-600">{delivery.recipient.address.address_line}</span>
                                            </div>
                                            {delivery.preferred_delivery_date && (
                                              <div className="flex items-center gap-1 text-gray-500">
                                                <Clock className="h-3 w-3" />
                                                <span>{formatDate(delivery.preferred_delivery_date)}</span>
                                              </div>
                                            )}
                                          </div>

                                          <div className="pt-2 border-t">
                                            <div className="text-sm">
                                              <span className="font-medium text-gray-700">Ramassé chez: </span>
                                              <span className="text-gray-900">{delivery.customer.name}</span>
                                              <span className="text-gray-600 ml-2">({delivery.customer.phone_number})</span>
                                            </div>
                                          </div>

                                          <div className="pt-2 border-t">
                                            <div className="text-sm font-medium text-gray-700">
                                              Frais de livraison:{" "}
                                              <span className="text-[#2B015F]">
                                                {delivery.delivery_fees_cdf.toLocaleString()} CDF
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))
                            )}
                          </CardContent>
                        )}
                      </Card>
                    </>
                  )}
                </TabsContent>

                {/* Events Tab */}
                <TabsContent value="events" className="mt-4">
                  {loadingEvents ? (
                    <Card className="h-[300px] flex items-center justify-center">
                      <CardContent>
                        <Loader2 className="h-8 w-8 animate-spin text-[#2B015F] mx-auto" />
                        <p className="text-center text-gray-500 mt-4">Chargement du journal d'activité...</p>
                      </CardContent>
                    </Card>
                  ) : delivererEvents.length === 0 ? (
                    <Card>
                      <CardContent className="py-12">
                        <div className="text-center text-gray-500">
                          <Activity className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                          <h3 className="font-medium text-gray-900 mb-2">Aucune activité aujourd'hui</h3>
                          <p className="text-sm">Ce livreur n'a pas encore d'événements enregistrés pour aujourd'hui.</p>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <Activity className="h-5 w-5 text-[#2B015F]" />
                          Journal d'activité - Aujourd'hui
                        </CardTitle>
                        <CardDescription>
                          {delivererEvents.length} événement{delivererEvents.length !== 1 ? "s" : ""} enregistré{delivererEvents.length !== 1 ? "s" : ""}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {/* Timeline */}
                        <div className="relative">
                          {/* Timeline line */}
                          <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#2B015F] via-purple-400 to-gray-200" />
                          
                          <div className="space-y-4">
                            {delivererEvents.map((event: DeliveryEvent, index: number) => {
                              const config = ACTION_CONFIG[event.action] || { 
                                label: event.action, 
                                icon: Activity, 
                                color: "text-gray-600", 
                                bgColor: "bg-gray-100" 
                              }
                              const IconComponent = config.icon

                              return (
                                <div key={`${event.created_at}-${index}`} className="relative flex gap-4 pl-2">
                                  {/* Timeline dot */}
                                  <div className={`relative z-10 flex-shrink-0 w-8 h-8 rounded-full ${config.bgColor} flex items-center justify-center ring-4 ring-white`}>
                                    <IconComponent className={`h-4 w-4 ${config.color}`} />
                                  </div>

                                  {/* Event Card */}
                                  <div className="flex-1 pb-4">
                                    <div className={`rounded-lg border p-4 bg-white shadow-sm hover:shadow-md transition-shadow`}>
                                      {/* Header */}
                                      <div className="flex items-start justify-between gap-2 mb-3">
                                        <div>
                                          <Badge className={`${config.bgColor} ${config.color} border-0 mb-2`}>
                                            {config.label}
                                          </Badge>
                                          <p className="text-sm text-gray-700 font-medium">{event.message}</p>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                          <p className="text-xs font-semibold text-[#2B015F]">{formatExactTime(event.created_at)}</p>
                                          <p className="text-xs text-gray-500">{formatEventTime(event.created_at)}</p>
                                        </div>
                                      </div>

                                      {/* Delivery Info */}
                                      <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                                        <div className="flex items-center justify-between">
                                          <span className="text-xs font-mono font-bold text-[#2B015F]">
                                            #{event.delivery.package_code}
                                          </span>
                                          {(event.location_latitude && event.location_longitude) && (
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              className="h-7 px-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                              onClick={() => openGoogleMaps(event.location_latitude!, event.location_longitude!)}
                                            >
                                              <MapPin className="h-3 w-3 mr-1" />
                                              Voir position
                                              <ExternalLink className="h-3 w-3 ml-1" />
                                            </Button>
                                          )}
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                          <div>
                                            <p className="text-gray-500">Client</p>
                                            <p className="font-medium text-gray-900 truncate">{event.delivery.customer_name}</p>
                                          </div>
                                          <div>
                                            <p className="text-gray-500">Destinataire</p>
                                            <p className="font-medium text-gray-900 truncate">{event.delivery.recipient_name}</p>
                                          </div>
                                        </div>
                                        <div className="text-xs">
                                          <p className="text-gray-500">Adresse de livraison</p>
                                          <p className="text-gray-700 line-clamp-2">{event.delivery.recipient_address}</p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              </Tabs>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function DispatchPage() {
  const queryClientRef = useRef<QueryClient>()
  if (!queryClientRef.current) {
    queryClientRef.current = new QueryClient()
  }

  return (
    <QueryClientProvider client={queryClientRef.current}>
      <DispatchContent />
    </QueryClientProvider>
  )
}
