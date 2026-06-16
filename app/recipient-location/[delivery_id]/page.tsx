"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin, Package, User, Clock, CheckCircle, AlertCircle } from "lucide-react"

interface DeliveryData {
  delivery_id: string
  customer: {
    name: string
    phone_number: string
  }
  package: {
    title: string
    description: string
  }
  recipient: {
    name: string
    phone_number: string
    address: {
      address_line: string
      city: string
      location?: {
        coordinates: [number, number]
      }
    }
  }
  status: string
  preferred_delivery_date: number
}

export default function RecipientLocationPage() {
  const params = useParams()
  const delivery_id = params.delivery_id as string

  const [delivery, setDelivery] = useState<DeliveryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [locationSharing, setLocationSharing] = useState(false)
  const [locationShared, setLocationShared] = useState(false)
  const [hasExistingLocation, setHasExistingLocation] = useState(false)

  useEffect(() => {
    fetchDelivery()
  }, [delivery_id])

  const fetchDelivery = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_SERVER_BASE_URL}/deliveries/${delivery_id}`)

      if (!response.ok) {
        throw new Error("Livraison non trouvée")
      }

      const data = await response.json()
      if (data.success && data.data) {
        setDelivery(data.data)
        // Check if recipient already has location coordinates
        if (
          data.data.recipient?.address?.location?.coordinates &&
          Array.isArray(data.data.recipient.address.location.coordinates) &&
          data.data.recipient.address.location.coordinates.length === 2
        ) {
          setHasExistingLocation(true)
        }
      } else {
        throw new Error("Données de livraison invalides")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors du chargement")
    } finally {
      setLoading(false)
    }
  }

  const shareLocation = async () => {
    if (!navigator.geolocation) {
      setError("La géolocalisation n'est pas supportée par votre navigateur")
      return
    }

    setLocationSharing(true)
    setError(null)

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords

          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_SERVER_BASE_URL}/deliveries/update-recipient-location`,
            {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                delivery_id,
                recipient_latitude: latitude,
                recipient_longitude: longitude,
              }),
            },
          )

          if (!response.ok) {
            throw new Error("Erreur lors de la mise à jour de la position")
          }

          setLocationShared(true)
          setHasExistingLocation(true)
        } catch (err) {
          setError(err instanceof Error ? err.message : "Erreur lors du partage de position")
        } finally {
          setLocationSharing(false)
        }
      },
      (error) => {
        setLocationSharing(false)
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setError("Permission de géolocalisation refusée. Veuillez autoriser l'accès à votre position.")
            break
          case error.POSITION_UNAVAILABLE:
            setError("Position non disponible. Veuillez réessayer.")
            break
          case error.TIMEOUT:
            setError("Délai d'attente dépassé. Veuillez réessayer.")
            break
          default:
            setError("Erreur lors de l'obtention de votre position.")
            break
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      },
    )
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50/30 to-transparent flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            <span className="ml-3">Chargement...</span>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error && !delivery) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50/30 to-transparent flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Erreur</h2>
            <p className="text-gray-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!delivery) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50/30 to-transparent p-4">
      <div className="max-w-md mx-auto space-y-6 pt-8">
        {/* Header */}
        <div className="text-center">
          <Package className="h-12 w-12 text-purple-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Partage de Position</h1>
          <p className="text-gray-600">Aidez votre livreur à vous trouver facilement</p>
        </div>

        {/* Delivery Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Informations de livraison
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-gray-500 mt-0.5" />
              <div>
                <p className="font-medium">Expéditeur</p>
                <p className="text-gray-600">{delivery.customer.name}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Package className="h-5 w-5 text-gray-500 mt-0.5" />
              <div>
                <p className="font-medium">Colis</p>
                <p className="text-gray-600">{delivery.package.title}</p>
                {delivery.package.description && (
                  <p className="text-sm text-gray-500">{delivery.package.description}</p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-gray-500 mt-0.5" />
              <div>
                <p className="font-medium">Livraison prévue</p>
                <p className="text-gray-600">{formatDate(delivery.preferred_delivery_date)}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-gray-500 mt-0.5" />
              <div>
                <p className="font-medium">Adresse de livraison</p>
                <p className="text-gray-600">
                  {delivery.recipient.address.address_line}, {delivery.recipient.address.city}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location Sharing */}
        <Card>
          <CardContent className="pt-6">
            {hasExistingLocation ? (
              <div className="text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-green-700 mb-2">Position déjà partagée</h3>
                <p className="text-gray-600">
                  Vous avez déjà partagé votre position avec le livreur. Il pourra vous trouver facilement !
                </p>
              </div>
            ) : locationShared ? (
              <div className="text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-green-700 mb-2">Position partagée avec succès !</h3>
                <p className="text-gray-600">Votre livreur peut maintenant vous localiser précisément.</p>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <MapPin className="h-12 w-12 text-purple-600 mx-auto" />
                <div>
                  <h3 className="text-lg font-semibold mb-2">Partagez votre position exacte</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Cliquez sur le bouton ci-dessous uniquement si vous êtes actuellement à l'endroit où vous souhaitez
                    recevoir votre colis.
                  </p>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                    <p className="text-amber-800 text-sm">
                      ⚠️ Assurez-vous d'être au bon endroit avant de partager votre position
                    </p>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-red-800 text-sm">{error}</p>
                  </div>
                )}

                <Button
                  onClick={shareLocation}
                  disabled={locationSharing}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  size="lg"
                >
                  {locationSharing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Partage en cours...
                    </>
                  ) : (
                    <>
                      <MapPin className="h-4 w-4 mr-2" />
                      Partager ma position actuelle
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          <p>Cette page est sécurisée et vos données sont protégées</p>
        </div>
      </div>
    </div>
  )
}
