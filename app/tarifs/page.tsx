"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, DollarSign, ArrowRight, Info, Loader2 } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useRef } from "react"
import Footer from "@/components/footer"

// Types
interface Quartier {
  id: number
  name: string
  is_special: boolean
}

interface PriceZone {
  delivery_price_zone_id: string
  name: string
  description: string
  communes_and_quartiers: {
    commune_id: string
    commune_name: string
    quartiers_included: Quartier[]
  }[]
}

interface ZonePair {
  delivery_price_zone_pair_id: string
  delivery_price_zone_id_a: string
  delivery_price_zone_id_b: string
  name: string
  price_value: number
  price_currency: string
}

interface Settings {
  _id: string
  change_rate_usd_cdf: number
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_SERVER_BASE_URL

// API functions
const fetchPriceZones = async (): Promise<PriceZone[]> => {
  const response = await fetch(`${API_BASE_URL}/deliveries/delivery-price-zones`)
  if (!response.ok) {
    throw new Error("Failed to fetch price zones")
  }
  const data = await response.json()
  return data.data || []
}

const fetchZonePairs = async (): Promise<ZonePair[]> => {
  const response = await fetch(`${API_BASE_URL}/deliveries/delivery-price-zone-pairs`)
  if (!response.ok) {
    throw new Error("Failed to fetch zone pairs")
  }
  const data = await response.json()
  return data.data || []
}

const fetchSettings = async (): Promise<Settings> => {
  const response = await fetch(`${API_BASE_URL}/deliveries/settings`)
  if (!response.ok) {
    throw new Error("Failed to fetch settings")
  }
  const data = await response.json()
  return data.data
}

function TarifsPageContent() {
  const [selectedCommuneA, setSelectedCommuneA] = useState<string>("")
  const [selectedQuartierA, setSelectedQuartierA] = useState<string>("")
  const [selectedCommuneB, setSelectedCommuneB] = useState<string>("")
  const [selectedQuartierB, setSelectedQuartierB] = useState<string>("")

  // Helper functions
  const getAllCommunes = () => {
    const communesMap = new Map()
    priceZones.forEach((zone) => {
      zone.communes_and_quartiers.forEach((commune) => {
        if (!communesMap.has(commune.commune_id)) {
          communesMap.set(commune.commune_id, commune)
        }
      })
    })
    return Array.from(communesMap.values()).sort((a, b) => a.commune_name.localeCompare(b.commune_name))
  }

  const getQuartiersForCommune = (communeId: string) => {
    const allQuartiers: Quartier[] = []
    const seenQuartierIds = new Set<number>()

    priceZones.forEach((zone) => {
      const commune = zone.communes_and_quartiers.find((c) => c.commune_id === communeId)
      if (commune) {
        commune.quartiers_included.forEach((quartier) => {
          if (!seenQuartierIds.has(quartier.id)) {
            seenQuartierIds.add(quartier.id)
            allQuartiers.push(quartier)
          }
        })
      }
    })

    return allQuartiers.sort((a, b) => a.name.localeCompare(b.name))
  }

  const getZoneForQuartier = (communeId: string, quartierId: string) => {
    for (const zone of priceZones) {
      const commune = zone.communes_and_quartiers.find((c) => c.commune_id === communeId)
      if (commune) {
        const quartier = commune.quartiers_included.find((q) => q.id.toString() === quartierId)
        if (quartier) {
          return zone
        }
      }
    }
    return null
  }

  // Fetch price zones
  const {
    data: priceZones = [],
    isLoading: priceZonesLoading,
    error: priceZonesError,
  } = useQuery({
    queryKey: ["price-zones"],
    queryFn: fetchPriceZones,
  })

  // Fetch zone pairs
  const {
    data: zonePairs = [],
    isLoading: zonePairsLoading,
    error: zonePairsError,
  } = useQuery({
    queryKey: ["zone-pairs"],
    queryFn: fetchZonePairs,
  })

  const {
    data: settings,
    isLoading: settingsLoading,
    error: settingsError,
  } = useQuery({
    queryKey: ["settings"],
    queryFn: fetchSettings,
  })

  const convertToCDF = (usdPrice: number): number => {
    if (!settings) return usdPrice
    return usdPrice * settings.change_rate_usd_cdf
  }

  const formatCDFPrice = (usdPrice: number): string => {
    const cdfPrice = convertToCDF(usdPrice)
    return new Intl.NumberFormat("fr-CD", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(cdfPrice)
  }

  // Find price for selected quartiers
  const getPriceForQuartiers = () => {
    if (!selectedQuartierA || !selectedQuartierB) return null

    const zoneA = getZoneForQuartier(selectedCommuneA, selectedQuartierA)
    const zoneB = getZoneForQuartier(selectedCommuneB, selectedQuartierB)

    if (!zoneA || !zoneB) return null

    const pair = zonePairs.find(
      (p) =>
        (p.delivery_price_zone_id_a === zoneA.delivery_price_zone_id &&
          p.delivery_price_zone_id_b === zoneB.delivery_price_zone_id) ||
        (p.delivery_price_zone_id_a === zoneB.delivery_price_zone_id &&
          p.delivery_price_zone_id_b === zoneA.delivery_price_zone_id),
    )
    return pair
  }

  const selectedPrice = getPriceForQuartiers()

  if (priceZonesLoading || zonePairsLoading || settingsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#2B015F]" />
        <span className="ml-2 text-gray-600">Chargement des tarifs...</span>
      </div>
    )
  }

  if (priceZonesError || zonePairsError || settingsError) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-red-600 mb-4">
          <span className="font-medium">Erreur de chargement</span>
        </div>
        <p className="text-gray-600 mb-4">Impossible de charger les informations tarifaires.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-[#2B015F] mb-4">Nos Tarifs de Livraison</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Découvrez notre structure tarifaire transparente basée sur les zones de livraison à Kinshasa
          </p>
        </div>

        {/* How it works */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#2B015F]">
              <Info className="h-5 w-5" />
              Comment ça marche ?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <MapPin className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold mb-2">1. Zones de livraison</h3>
                <p className="text-sm text-gray-600">
                  Kinshasa est divisée en zones tarifaires regroupant plusieurs communes et quartiers
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <ArrowRight className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-semibold mb-2">2. Calcul du prix</h3>
                <p className="text-sm text-gray-600">
                  Le tarif dépend de la zone de départ et de la zone d'arrivée de votre colis
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <DollarSign className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="font-semibold mb-2">3. Prix fixe</h3>
                <p className="text-sm text-gray-600">
                  Tarif transparent et fixe, pas de surprises lors de la livraison
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Price Calculator */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-[#2B015F]">Calculateur de Prix</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Lieu de départ</label>
                <div className="space-y-3">
                  <select
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#2B015F] focus:border-transparent"
                    value={selectedCommuneA}
                    onChange={(e) => {
                      setSelectedCommuneA(e.target.value)
                      setSelectedQuartierA("")
                    }}
                  >
                    <option value="">Sélectionner une commune</option>
                    {getAllCommunes().map((commune) => (
                      <option key={commune.commune_id} value={commune.commune_id}>
                        {commune.commune_name}
                      </option>
                    ))}
                  </select>

                  {selectedCommuneA && (
                    <select
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#2B015F] focus:border-transparent"
                      value={selectedQuartierA}
                      onChange={(e) => setSelectedQuartierA(e.target.value)}
                    >
                      <option value="">Sélectionner un quartier</option>
                      {getQuartiersForCommune(selectedCommuneA).map((quartier) => (
                        <option key={quartier.id} value={quartier.id.toString()}>
                          {quartier.name} {quartier.is_special && "⭐"}
                        </option>
                      ))}
                    </select>
                  )}

                  {selectedQuartierA && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                      <p className="text-sm text-blue-800">
                        <span className="font-medium">Zone:</span>{" "}
                        {getZoneForQuartier(selectedCommuneA, selectedQuartierA)?.name}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Lieu d'arrivée</label>
                <div className="space-y-3">
                  <select
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#2B015F] focus:border-transparent"
                    value={selectedCommuneB}
                    onChange={(e) => {
                      setSelectedCommuneB(e.target.value)
                      setSelectedQuartierB("")
                    }}
                  >
                    <option value="">Sélectionner une commune</option>
                    {getAllCommunes().map((commune) => (
                      <option key={commune.commune_id} value={commune.commune_id}>
                        {commune.commune_name}
                      </option>
                    ))}
                  </select>

                  {selectedCommuneB && (
                    <select
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#2B015F] focus:border-transparent"
                      value={selectedQuartierB}
                      onChange={(e) => setSelectedQuartierB(e.target.value)}
                    >
                      <option value="">Sélectionner un quartier</option>
                      {getQuartiersForCommune(selectedCommuneB).map((quartier) => (
                        <option key={quartier.id} value={quartier.id.toString()}>
                          {quartier.name} {quartier.is_special && "⭐"}
                        </option>
                      ))}
                    </select>
                  )}

                  {selectedQuartierB && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                      <p className="text-sm text-blue-800">
                        <span className="font-medium">Zone:</span>{" "}
                        {getZoneForQuartier(selectedCommuneB, selectedQuartierB)?.name}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {selectedPrice && selectedQuartierA && selectedQuartierB && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-green-800">Prix de livraison</h3>
                    <p className="text-sm text-green-600">
                      De {getZoneForQuartier(selectedCommuneA, selectedQuartierA)?.name} vers{" "}
                      {getZoneForQuartier(selectedCommuneB, selectedQuartierB)?.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-3xl font-bold text-green-600">
                      {formatCDFPrice(selectedPrice.price_value)}
                    </span>
                    <p className="text-sm text-green-600">CDF</p>
                  </div>
                </div>
              </div>
            )}

            {selectedQuartierA && selectedQuartierB && !selectedPrice && (
              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-800">
                  Aucun tarif configuré pour cette combinaison de zones. Contactez-nous pour plus d'informations.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Price Zones */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-[#2B015F]">Nos Zones de Livraison</CardTitle>
            </CardHeader>
            <CardContent>
              {priceZones.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Aucune zone configurée pour le moment.</p>
              ) : (
                <div className="space-y-4">
                  {priceZones.map((zone) => (
                    <div key={zone.delivery_price_zone_id} className="border rounded-lg p-4">
                      <h3 className="font-semibold text-gray-800 mb-2">{zone.name}</h3>
                      <p className="text-sm text-gray-600 mb-3">{zone.description}</p>

                      <div className="space-y-2">
                        {zone.communes_and_quartiers.map((commune) => (
                          <div key={commune.commune_id}>
                            <div className="flex items-center gap-2 mb-1">
                              <MapPin className="h-4 w-4 text-[#2B015F]" />
                              <span className="font-medium text-sm">{commune.commune_name}</span>
                            </div>
                            <div className="ml-6 flex flex-wrap gap-1">
                              {commune.quartiers_included.map((quartier) => (
                                <Badge key={quartier.id} variant="secondary" className="text-xs">
                                  {quartier.name}
                                  {quartier.is_special && <span className="ml-1">⭐</span>}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pricing Matrix */}
          <Card>
            <CardHeader>
              <CardTitle className="text-[#2B015F]">Grille Tarifaire</CardTitle>
            </CardHeader>
            <CardContent>
              {zonePairs.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Aucun tarif configuré pour le moment.</p>
              ) : (
                <div className="space-y-3">
                  {zonePairs.map((pair) => {
                    const zoneA = priceZones.find((z) => z.delivery_price_zone_id === pair.delivery_price_zone_id_a)
                    const zoneB = priceZones.find((z) => z.delivery_price_zone_id === pair.delivery_price_zone_id_b)

                    return (
                      <div
                        key={pair.delivery_price_zone_pair_id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="font-medium">{zoneA?.name || "Zone A"}</span>
                            <ArrowRight className="h-4 w-4 text-gray-400" />
                            <span className="font-medium">{zoneB?.name || "Zone B"}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-[#2B015F]">{formatCDFPrice(pair.price_value)}</span>
                          <span className="text-xs text-gray-500 ml-1">CDF</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Call to Action */}
        <Card className="bg-[#2B015F] text-white">
          <CardContent className="text-center py-8">
            <h2 className="text-2xl font-bold mb-4">Prêt à envoyer votre colis ?</h2>
            <p className="text-purple-100 mb-6 max-w-2xl mx-auto">
              Utilisez notre plateforme pour créer votre commande de livraison en quelques clics
            </p>
            <Button
              className="bg-white text-[#2B015F] hover:bg-gray-100"
              onClick={() => (window.location.href = "/dashboard/new-order")}
            >
              Créer une commande
            </Button>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  )
}

export default function TarifsPage() {
  const queryClientRef = useRef<QueryClient>()
  if (!queryClientRef.current) {
    queryClientRef.current = new QueryClient()
  }

  return (
    <QueryClientProvider client={queryClientRef.current}>
      <TarifsPageContent />
    </QueryClientProvider>
  )
}
