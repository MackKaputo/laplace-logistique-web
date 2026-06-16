"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin, Calculator, Loader2 } from "lucide-react"
import Autocomplete from "@/components/autocomplete"
import GoogleMapsProvider from "@/components/google-maps-provider"

export default function PriceTestPage() {
  const [originAddress, setOriginAddress] = useState("")
  const [destinationAddress, setDestinationAddress] = useState("")
  const [deliveryType, setDeliveryType] = useState("")
  const [originCoordinates, setOriginCoordinates] = useState<{ lat: number; lng: number } | null>(null)
  const [destinationCoordinates, setDestinationCoordinates] = useState<{ lat: number; lng: number } | null>(null)
  const [price, setPrice] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [apiBaseUrl, setApiBaseUrl] = useState<string>("")
  const [isGettingLocation, setIsGettingLocation] = useState(false)

  const [destinationCommune, setDestinationCommune] = useState("")
  const [destinationQuartier, setDestinationQuartier] = useState("")
  const [communes, setCommunes] = useState<
    Array<{ id: string; name: string; quartiers: Array<{ id: number; name: string; is_special: boolean }> }>
  >([])

  // Get API base URL on component mount
  useEffect(() => {
    const baseUrl = process.env.NEXT_PUBLIC_API_SERVER_BASE_URL as string
    setApiBaseUrl(baseUrl)
  }, [])

  // Fetch communes on component mount
  useEffect(() => {
    const fetchCommunes = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/communes`)
        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            setCommunes(data.data)
          }
        }
      } catch (error) {
        console.error("Error fetching communes:", error)
      }
    }

    if (apiBaseUrl) {
      fetchCommunes()
    }
  }, [apiBaseUrl])

  // Fetch destination quartiers when destination commune changes
  useEffect(() => {}, [destinationCommune, apiBaseUrl])

  const deliveryTypes = [
    { value: "package", label: "Colis" },
    { value: "courier", label: "Courier" },
    { value: "medical", label: "Médical" },
  ]

  const fetchPrice = async () => {
    if (!originCoordinates || !destinationCoordinates || !deliveryType || !destinationCommune || !destinationQuartier) {
      setError("Veuillez remplir tous les champs")
      return
    }

    setIsLoading(true)
    setError(null)
    setPrice(null)

    try {
      const url = `${apiBaseUrl}/deliveries/price?delivery_type=${deliveryType}&pickup_address_longitude=${originCoordinates.lng}&pickup_address_latitude=${originCoordinates.lat}&recipient_address_longitude=${destinationCoordinates.lng}&recipient_address_latitude=${destinationCoordinates.lat}&commune_id=${destinationCommune}&quartier_id=${destinationQuartier}`

      console.log("Price API URL:", url)

      const response = await fetch(url)
      const responseText = await response.text()
      console.log("Raw API response:", responseText)

      let data
      try {
        data = JSON.parse(responseText)
      } catch (e) {
        console.error("Error parsing JSON:", e)
        throw new Error("Format de réponse invalide")
      }

      console.log("Parsed API response:", data)

      if (data.success) {
        setPrice(data.data.price)
      } else {
        setError(data.message || "Erreur lors du calcul du prix")
      }
    } catch (error) {
      console.error("Error fetching price:", error)
      setError("Impossible de calculer le prix. Veuillez réessayer.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleOriginChange = (address: string, coordinates?: { lat: number; lng: number }) => {
    setOriginAddress(address)
    setOriginCoordinates(coordinates || null)
    // Reset price when addresses change
    setPrice(null)
    setError(null)
  }

  const handleDestinationChange = (address: string, coordinates?: { lat: number; lng: number }) => {
    setDestinationAddress(address)
    setDestinationCoordinates(coordinates || null)
    // Reset price when addresses change
    setPrice(null)
    setError(null)
  }

  const handleDeliveryTypeChange = (type: string) => {
    setDeliveryType(type)
    // Reset price when delivery type changes
    setPrice(null)
    setError(null)
  }

  const canCalculatePrice =
    originCoordinates && destinationCoordinates && deliveryType && destinationCommune && destinationQuartier

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("La géolocalisation n'est pas supportée par ce navigateur")
      return
    }

    setIsGettingLocation(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        setOriginCoordinates({ lat: latitude, lng: longitude })
        setOriginAddress(`Ma position actuelle (${latitude.toFixed(6)}, ${longitude.toFixed(6)})`)
        setIsGettingLocation(false)
        setPrice(null)
        setError(null)
      },
      (error) => {
        console.error("Geolocation error:", error)
        setError("Impossible d'obtenir votre position. Veuillez vérifier les permissions de localisation.")
        setIsGettingLocation(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      },
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50/30 to-transparent p-8">
      <GoogleMapsProvider>
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-[#2B015F] mb-2">Test de Prix</h1>
            <p className="text-gray-600">Testez rapidement le moteur de tarification Daredare</p>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Calculateur de Prix
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Origin Address */}
              <div>
                <Label htmlFor="origin">Adresse d'origine</Label>
                <div className="space-y-2">
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <div className="pl-10">
                      <Autocomplete
                        id="origin"
                        placeholder="Où récupérer?"
                        value={originAddress}
                        onChange={handleOriginChange}
                      />
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={getCurrentLocation}
                    disabled={isGettingLocation}
                    className="w-full bg-transparent"
                  >
                    {isGettingLocation ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Localisation en cours...
                      </>
                    ) : (
                      <>
                        <MapPin className="mr-2 h-4 w-4" />
                        Utiliser ma position actuelle
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Destination Address */}
              <div>
                <Label htmlFor="destination">Adresse de destination</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <div className="pl-10">
                    <Autocomplete
                      id="destination"
                      placeholder="Où livrer?"
                      value={destinationAddress}
                      onChange={handleDestinationChange}
                    />
                  </div>
                </div>
              </div>

              {/* Destination Commune and Quartier */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="destination-commune">Commune</Label>
                  <Select value={destinationCommune} onValueChange={setDestinationCommune}>
                    <SelectTrigger id="destination-commune">
                      <SelectValue placeholder="Sélectionnez la commune" />
                    </SelectTrigger>
                    <SelectContent>
                      {communes.map((commune) => (
                        <SelectItem key={commune.id} value={commune.id}>
                          {commune.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="destination-quartier">Quartier</Label>
                  <Select
                    value={destinationQuartier}
                    onValueChange={setDestinationQuartier}
                    disabled={!destinationCommune}
                  >
                    <SelectTrigger id="destination-quartier">
                      <SelectValue placeholder="Sélectionnez le quartier" />
                    </SelectTrigger>
                    <SelectContent>
                      {communes
                        .find((commune) => commune.id === destinationCommune)
                        ?.quartiers?.map((quartier) => (
                          <SelectItem key={quartier.id} value={quartier.id.toString()}>
                            {quartier.name}
                          </SelectItem>
                        )) || []}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Delivery Type */}
              <div>
                <Label htmlFor="delivery-type">Type de livraison</Label>
                <Select value={deliveryType} onValueChange={handleDeliveryTypeChange}>
                  <SelectTrigger id="delivery-type">
                    <SelectValue placeholder="Sélectionnez le type de livraison" />
                  </SelectTrigger>
                  <SelectContent>
                    {deliveryTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Calculate Button */}
              <Button
                onClick={fetchPrice}
                disabled={!canCalculatePrice || isLoading}
                className="w-full bg-[#2B015F] hover:bg-[#2B015F]/90"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Calcul en cours...
                  </>
                ) : (
                  <>
                    <Calculator className="mr-2 h-4 w-4" />
                    Calculer le prix
                  </>
                )}
              </Button>

              {/* Coordinates Debug Info */}
              {(originCoordinates || destinationCoordinates) && (
                <div className="text-xs text-gray-500 space-y-1">
                  {originCoordinates && (
                    <div>
                      Origine: {originCoordinates.lat.toFixed(6)}, {originCoordinates.lng.toFixed(6)}
                    </div>
                  )}
                  {destinationCoordinates && (
                    <div>
                      Destination: {destinationCoordinates.lat.toFixed(6)}, {destinationCoordinates.lng.toFixed(6)}
                      {destinationCommune && ` - Commune: ${communes.find((c) => c.id === destinationCommune)?.name}`}
                      {destinationQuartier &&
                        ` - Quartier: ${
                          communes
                            .find((c) => c.id === destinationCommune)
                            ?.quartiers?.find((q) => q.id.toString() === destinationQuartier)?.name
                        }`}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Results */}
          {(price !== null || error) && (
            <Card>
              <CardHeader>
                <CardTitle>Résultat</CardTitle>
              </CardHeader>
              <CardContent>
                {error ? (
                  <div className="text-red-500 text-center py-4">
                    <p className="font-medium">Erreur</p>
                    <p className="text-sm">{error}</p>
                  </div>
                ) : price !== null ? (
                  <div className="text-center py-6">
                    <div className="text-4xl font-bold text-[#2B015F] mb-2">
                      {price.toLocaleString("en-US", { maximumFractionDigits: 2 })} USD
                    </div>
                    <div className="text-lg text-gray-600">{(price * 2800).toLocaleString("fr-FR")} CDF</div>
                    <div className="mt-4 text-sm text-gray-500">
                      <p>Type: {deliveryTypes.find((t) => t.value === deliveryType)?.label}</p>
                      <p>De: {originAddress}</p>
                      <p>Vers: {destinationAddress}</p>
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          )}
        </div>
      </GoogleMapsProvider>
    </div>
  )
}
