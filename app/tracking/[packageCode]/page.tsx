"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Package, MapPin, Phone, User, Clock, CheckCircle, Truck, AlertCircle } from "lucide-react"
import Image from "next/image"

interface TrackingData {
  delivery: {
    delivery_id: string
    delivery_type: string
    status: string
    type: string
    package_code: string
    payment_mode: string
    pickup_date: number
    delivery_fees: number
    customer: {
      customer_id: string
      name: string
      phone_number: string | null
    }
    package: {
      title: string
      category: string
      description: string
      package_value: {
        currency: string
        value: string
      }
    }
    pickup_address: {
      address_line: string
      address_second_line: string
      city: string
      country: string
    }
    recipient: {
      name: string
      phone_number: string
      address: {
        address_line: string
        address_second_line: string
        city: string
        country: string
      }
    }
    deliverer: {
      deliverer_id: string
      name: string
      phone_number: string
    } | null
    picker: any
    service_fees: {
      currency: string
      value: number
    }
    created_at: string
    updated_at: string
  }
  events: Array<{
    _id: string
    message: string
    deliverer_id: string
    delivery_id: string
    event_name: string
    action: string
    location_latitude: number
    location_longitude: number
    data: {
      photo?: string
      signature?: string
      barcode?: string
    } | null
    created_at: string
  }>
}

export default function TrackingPage() {
  const params = useParams()
  const router = useRouter()
  const packageCode = params.packageCode as string

  const [trackingData, setTrackingData] = useState<TrackingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTrackingData = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_SERVER_BASE_URL}/deliveries/tracking/package/${packageCode}`,
        )
        const data = await response.json()

        if (data.success) {
          setTrackingData(data.data)
        } else {
          setError("Code de suivi introuvable")
        }
      } catch (err) {
        setError("Erreur lors du chargement des données")
      } finally {
        setLoading(false)
      }
    }

    if (packageCode) {
      fetchTrackingData()
    }
  }, [packageCode])

  const formatDateTime = (timestamp: number) => {
    const date = new Date(timestamp)
    const days = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"]
    const dayName = days[date.getDay()]
    return `${dayName}, ${date.toLocaleDateString("fr-FR")} ${date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      unassigned: { label: "Non assigné", variant: "secondary" as const },
      assigned: { label: "Assigné", variant: "default" as const },
      delivery_start_to_pickup: { label: "En route vers ramassage", variant: "default" as const },
      failed_pickup: { label: "Échec ramassage", variant: "destructive" as const },
      picked: { label: "Ramassé", variant: "default" as const },
      delivery_start_to_recipient: { label: "En route vers destinataire", variant: "default" as const },
      arrived_to_recipient: { label: "Arrivé chez destinataire", variant: "default" as const },
      unreachable_recipient: { label: "Destinataire injoignable", variant: "destructive" as const },
      refused: { label: "Refusé", variant: "destructive" as const },
      delivered: { label: "Livré", variant: "default" as const },
      back_to_sender_post_delivery: { label: "Retour expéditeur", variant: "secondary" as const },
      // Legacy status mappings for backward compatibility
      pending: { label: "En attente", variant: "secondary" as const },
      confirmed: { label: "Confirmé", variant: "default" as const },
      picked_up: { label: "Ramassé", variant: "default" as const },
      in_transit: { label: "En transit", variant: "default" as const },
      cancelled: { label: "Annulé", variant: "destructive" as const },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || {
      label: "Statut inconnu",
      variant: "secondary" as const,
    }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getEventIcon = (action: string) => {
    switch (action) {
      case "item_pickup":
        return <Package className="h-4 w-4" />
      case "delivery_start_to_recipient":
        return <Truck className="h-4 w-4" />
      case "arrived_to_recipient":
        return <MapPin className="h-4 w-4" />
      case "completed_delivery":
        return <CheckCircle className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2B015F] mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des informations de suivi...</p>
        </div>
      </div>
    )
  }

  if (error || !trackingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Code de suivi introuvable</h1>
          <p className="text-gray-600 mb-6">{error || "Le code de suivi que vous avez saisi n'existe pas."}</p>
          <Button onClick={() => router.push("/")} className="bg-[#2B015F] hover:bg-[#2B015F]/90">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour à l'accueil
          </Button>
        </div>
      </div>
    )
  }

  const { delivery, events } = trackingData

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container py-8">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => router.push("/")} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour à l'accueil
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#2B015F]">Suivi de livraison</h1>
              <p className="text-gray-600">Code: {delivery.package_code}</p>
            </div>
            {getStatusBadge(delivery.status)}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Delivery Information */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Informations du colis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="font-medium">{delivery.package.title}</p>
                  <p className="text-sm text-gray-600">{delivery.package.description}</p>
                  <p className="text-sm text-gray-600">Catégorie: {delivery.package.category}</p>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium">Valeur déclarée</p>
                    <p>
                      {delivery.package.package_value.value} {delivery.package.package_value.currency}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">Frais de livraison</p>
                    <p>
                      {delivery.delivery_fees} {delivery.service_fees.currency}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Expéditeur
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">{delivery.customer.name}</p>
                {delivery.customer.phone_number && (
                  <p className="text-sm text-gray-600 flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {delivery.customer.phone_number}
                  </p>
                )}
                <p className="text-sm text-gray-600 mt-2">
                  <MapPin className="h-3 w-3 inline mr-1" />
                  {delivery.pickup_address.address_line}, {delivery.pickup_address.city}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Destinataire
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">{delivery.recipient.name}</p>
                <p className="text-sm text-gray-600 flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {delivery.recipient.phone_number}
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  <MapPin className="h-3 w-3 inline mr-1" />
                  {delivery.recipient.address.address_line}, {delivery.recipient.address.city}
                </p>
              </CardContent>
            </Card>

            {delivery.deliverer && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    Livreur
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-medium">{delivery.deliverer.name}</p>
                  <p className="text-sm text-gray-600 flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {delivery.deliverer.phone_number}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Events Timeline */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Historique de livraison
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {events.map((event, index) => (
                    <div key={event._id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="bg-[#2B015F] text-white rounded-full p-2">{getEventIcon(event.action)}</div>
                        {index < events.length - 1 && <div className="w-px h-8 bg-gray-300 mt-2"></div>}
                      </div>
                      <div className="flex-1 pb-4">
                        <p className="font-medium">{event.message}</p>
                        <p className="text-sm text-gray-600">{formatDateTime(new Date(event.created_at).getTime())}</p>
                        {event.data?.photo && (
                          <div className="mt-2">
                            <p className="text-xs text-gray-500 mb-1">Photo de livraison:</p>
                            <Image
                              src={event.data.photo || "/placeholder.svg"}
                              alt="Photo de livraison"
                              width={200}
                              height={150}
                              className="rounded-lg border"
                            />
                          </div>
                        )}
                        {event.data?.signature && (
                          <div className="mt-2">
                            <p className="text-xs text-gray-500 mb-1">Signature:</p>
                            <Image
                              src={event.data.signature || "/placeholder.svg"}
                              alt="Signature"
                              width={200}
                              height={100}
                              className="rounded-lg border"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
