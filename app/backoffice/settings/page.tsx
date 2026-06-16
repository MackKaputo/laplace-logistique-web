"use client"
import { useState, useEffect, useRef, useCallback } from "react"
import type React from "react"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  MapPin,
  Code,
  DollarSign,
  Bell,
  Trash2,
  Eye,
  Loader2,
  Edit2,
  X,
  Check,
  Lock,
  AlertTriangle,
} from "lucide-react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useToast } from "@/hooks/use-toast"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { AccessControl } from "@/components/backoffice/access-control" // Import AccessControl

// Types
interface Quartier {
  id: number
  name: string
  is_special: boolean
  reference_latitude?: number | null
  reference_longitude?: number | null
}

interface Commune {
  commune_id?: string
  name: string
  reference_latitude: number | null
  reference_longitude: number | null
  quartiers: Quartier[]
}

interface Zone {
  delivery_zone_id: string
  name: string
  geometry: {
    type: "Polygon"
    coordinates: number[][][]
  }
  price?: {
    currency: "USD"
    value: number
  }
}

interface CreateZoneData {
  name: string
  geometry: {
    type: "Polygon"
    coordinates: number[][][]
  }
}

// Add these interfaces after the existing Zone interface
interface PriceZone {
  delivery_price_zone_id: string
  name: string
  description: string
  communes_and_quartiers: {
    commune_id: string
    commune_name: string
    quartiers_included: Quartier[]
  }[]
  creates_at: string
  updated_at: string
}

interface CreatePriceZoneData {
  name: string
  description: string
}

interface AddCommuneToZoneData {
  delivery_price_zone_id: string
  commune_id: string
  quartiers_included: Quartier[]
}

// Add the new interface for Zone Pairs after the existing interfaces:
interface ZonePair {
  delivery_price_zone_pair_id: string
  delivery_price_zone_id_a: string
  delivery_price_zone_id_b: string
  name: string
  price_value: number
  price_currency: string
  created_at: string
  updated_at: string
}

interface UpdateZonePairPriceData {
  delivery_price_zone_pair_id: string
  price_value: number
}

declare global {
  interface Window {
    //@ts-ignore
    google: any
  }
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_SERVER_BASE_URL

// API functions
const fetchZones = async (): Promise<Zone[]> => {
  const response = await fetch(`${API_BASE_URL}/deliveries/delivery-zones`)
  if (!response.ok) {
    throw new Error("Failed to fetch zones")
  }
  const data = await response.json()
  return data.data || []
}

const createZone = async (zoneData: CreateZoneData): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/deliveries/delivery-zones`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(zoneData),
  })
  if (!response.ok) {
    throw new Error("Failed to create zone")
  }
}

const deleteZone = async (zoneId: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/deliveries/${zoneId}`, {
    method: "DELETE",
  })
  if (!response.ok) {
    throw new Error("Failed to delete zone")
  }
}

const updateZonePrice = async (data: { delivery_zone_id: string; price_value: number }): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/deliveries/update-delivery-zone-price`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    throw new Error("Failed to update zone price")
  }
}

const fetchCommunes = async (): Promise<Commune[]> => {
  const response = await fetch(`${API_BASE_URL}/deliveries/communes`)
  if (!response.ok) {
    throw new Error("Failed to fetch communes")
  }
  const data = await response.json()
  return data.data || []
}

const updateCommuneCoordinates = async (data: {
  commune_id: string
  latitude: number
  longitude: number
}): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/deliveries/communes/reference-coordinates`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    throw new Error("Failed to update commune coordinates")
  }
}

// Add these API functions after the existing ones
const fetchPriceZones = async (): Promise<PriceZone[]> => {
  const response = await fetch(`${API_BASE_URL}/deliveries/delivery-price-zones`)
  if (!response.ok) {
    throw new Error("Failed to fetch price zones")
  }
  const data = await response.json()
  return data.data || []
}

const createPriceZone = async (zoneData: CreatePriceZoneData): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/deliveries/delivery-price-zones`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(zoneData),
  })
  if (!response.ok) {
    throw new Error("Failed to create price zone")
  }
}

const addCommuneToZone = async (data: AddCommuneToZoneData): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/deliveries/delivery-price-zones/add-commune-with-quartiers`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.message || "Failed to add commune to zone")
  }
}

// Add the new API functions after the existing ones:
const fetchZonePairs = async (): Promise<ZonePair[]> => {
  const response = await fetch(`${API_BASE_URL}/deliveries/delivery-price-zone-pairs`)
  if (!response.ok) {
    throw new Error("Failed to fetch zone pairs")
  }
  const data = await response.json()
  return data.data || []
}

const generateZonePairs = async (): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/deliveries/delivery-price-zone-pairs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  })
  if (!response.ok) {
    throw new Error("Failed to generate zone pairs")
  }
}

const updateZonePairPrice = async (data: UpdateZonePairPriceData): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/deliveries/delivery-price-zone-pairs`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    throw new Error("Failed to update zone pair price")
  }
}

export default function SettingsPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState("")
  const [showError, setShowError] = useState(false)
  const { toast } = useToast()

  const [activeTab, setActiveTab] = useState("zones")

  const queryClientRef = useRef<QueryClient>()
  if (!queryClientRef.current) {
    queryClientRef.current = new QueryClient()
  }

  useEffect(() => {
    const isAuth = sessionStorage.getItem("settings_authenticated")
    if (isAuth === "true") {
      setIsAuthenticated(true)
    }
  }, [])

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const correctPassword = "@$@$eng%%"

    if (password === correctPassword) {
      setIsAuthenticated(true)
      sessionStorage.setItem("settings_authenticated", "true")
      toast({
        title: "Accès autorisé",
        description: "Vous avez accès aux paramètres système.",
      })
    } else {
      setShowError(true)
      setPassword("")
      toast({
        title: "Mot de passe incorrect",
        description: "Veuillez réessayer.",
        variant: "destructive",
      })
    }
  }

  return (
    <AccessControl requiredRole="management">
      {!isAuthenticated ? (
        <div className="min-h-[80vh] flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="p-8">
              <div className="flex flex-col items-center text-center space-y-6">
                <div className="bg-red-100 p-4 rounded-full">
                  <Lock className="h-8 w-8 text-red-600" />
                </div>

                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-[#2B015F]">Page Sensible</h2>
                  <p className="text-gray-600">
                    Cette page contient des données sensibles et nécessite une authentification.
                  </p>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 w-full">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-yellow-800 text-left">
                      <p className="font-medium mb-1">Accès Restreint</p>
                      <p>Veuillez entrer le mot de passe pour accéder aux paramètres système.</p>
                    </div>
                  </div>
                </div>

                <form onSubmit={handlePasswordSubmit} className="w-full space-y-4">
                  <div className="space-y-2">
                    <Input
                      type="password"
                      placeholder="Entrez le mot de passe"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value)
                        setShowError(false)
                      }}
                      className={`text-center ${showError ? "border-red-500" : ""}`}
                      autoFocus
                    />
                    {showError && <p className="text-sm text-red-600">Mot de passe incorrect</p>}
                  </div>

                  <Button type="submit" className="w-full bg-[#2B015F] hover:bg-[#1a0138]" disabled={!password}>
                    Accéder aux Paramètres
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <QueryClientProvider client={queryClientRef.current}>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold text-[#2B015F]">Paramètres Système</h1>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  sessionStorage.removeItem("settings_authenticated")
                  setIsAuthenticated(false)
                  toast({
                    title: "Déconnecté",
                    description: "Vous avez été déconnecté des paramètres.",
                  })
                }}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                <Lock className="h-4 w-4 mr-2" />
                Verrouiller
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                {/* Tab Navigation */}
                <div className="flex border-b border-gray-200">
                  <button
                    className={`py-3 px-6 text-lg font-medium transition-colors duration-200 ${
                      activeTab === "zones"
                        ? "bg-[#2B015F] text-white border-b-2 border-[#2B015F]"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                    onClick={() => setActiveTab("zones")}
                  >
                    <MapPin className="h-4 w-4 inline mr-2" />
                    Zones
                  </button>
                  <button
                    className={`py-3 px-6 text-lg font-medium transition-colors duration-200 ${
                      activeTab === "pricing"
                        ? "bg-[#2B015F] text-white border-b-2 border-[#2B015F]"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                    onClick={() => setActiveTab("pricing")}
                  >
                    <DollarSign className="h-4 w-4 inline mr-2" />
                    Tarifs
                  </button>
                  <button
                    className={`py-3 px-6 text-lg font-medium transition-colors duration-200 ${
                      activeTab === "communes"
                        ? "bg-[#2B015F] text-white border-b-2 border-[#2B015F]"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                    onClick={() => setActiveTab("communes")}
                  >
                    <MapPin className="h-4 w-4 inline mr-2" />
                    Communes - Quartiers
                  </button>
                  <button
                    className={`py-3 px-6 text-lg font-medium transition-colors duration-200 ${
                      activeTab === "price-zones"
                        ? "bg-[#2B015F] text-white border-b-2 border-[#2B015F]"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                    onClick={() => setActiveTab("price-zones")}
                  >
                    <DollarSign className="h-4 w-4 inline mr-2" />
                    Zones Tarifaires
                  </button>
                  <button
                    className={`py-3 px-6 text-lg font-medium transition-colors duration-200 ${
                      activeTab === "notifications"
                        ? "bg-[#2B015F] text-white border-b-2 border-[#2B015F]"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                    onClick={() => setActiveTab("notifications")}
                  >
                    <Bell className="h-4 w-4 inline mr-2" />
                    Notifications
                  </button>
                  <button
                    className={`py-3 px-6 text-lg font-medium transition-colors duration-200 ${
                      activeTab === "api"
                        ? "bg-[#2B015F] text-white border-b-2 border-[#2B015F]"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                    onClick={() => setActiveTab("api")}
                  >
                    <Code className="h-4 w-4 inline mr-2" />
                    API
                  </button>
                  {/* Add the new tab button in the tab navigation section: */}
                  <button
                    className={`py-3 px-6 text-lg font-medium transition-colors duration-200 ${
                      activeTab === "zone-pairs"
                        ? "bg-[#2B015F] text-white border-b-2 border-[#2B015F]"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                    onClick={() => setActiveTab("zone-pairs")}
                  >
                    <DollarSign className="h-4 w-4 inline mr-2" />
                    Tarifs par Paires
                  </button>
                </div>

                {/* Tab Content */}
                <div className="p-6">
                  {activeTab === "zones" && <ZonesTab />}

                  {activeTab === "pricing" && <PricingTab />}

                  {activeTab === "communes" && <CommunesTabInline />}

                  {activeTab === "price-zones" && <PriceZonesTab />}

                  {/* Add the new tab content in the Tab Content section: */}
                  {activeTab === "zone-pairs" && <ZonePairsTab />}

                  {activeTab === "notifications" && (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="flex items-center justify-center space-x-2 text-yellow-600 mb-4">
                        <Code className="h-5 w-5" />
                        <span className="font-medium">Développement en cours</span>
                      </div>
                      <p className="text-gray-600 mb-4">Configuration des notifications système.</p>
                      <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-500">
                        <p className="font-medium mb-2">Fonctionnalités à venir :</p>
                        <ul className="text-left space-y-1">
                          <li>• Notifications SMS</li>
                          <li>• Notifications email</li>
                          <li>• Alertes temps réel</li>
                          <li>• Templates personnalisés</li>
                        </ul>
                      </div>
                    </div>
                  )}

                  {activeTab === "api" && (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="flex items-center justify-center space-x-2 text-yellow-600 mb-4">
                        <Code className="h-5 w-5" />
                        <span className="font-medium">Développement en cours</span>
                      </div>
                      <p className="text-gray-600 mb-4">Configuration des paramètres API et intégrations.</p>
                      <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-500">
                        <p className="font-medium mb-2">Fonctionnalités à venir :</p>
                        <ul className="text-left space-y-1">
                          <li>• Clés API</li>
                          <li>• Webhooks</li>
                          <li>• Limites de taux</li>
                          <li>• Logs d'API</li>
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          {process.env.NODE_ENV === "development" && <ReactQueryDevtools initialIsOpen={false} position="bottom" />}
        </QueryClientProvider>
      )}
    </AccessControl>
  )
}

// CommunesTab component for managing communes and quartiers
const CommunesTab = () => {
  const [selectedCommune, setSelectedCommune] = useState<Commune | null>(null)
  const [showCoordinateModal, setShowCoordinateModal] = useState(false)
  const [selectedPosition, setSelectedPosition] = useState<{ lat: number; lng: number } | null>(null)
  const [isSettingCoordinates, setIsSettingCoordinates] = useState(false)
  const [editingQuartier, setEditingQuartier] = useState<{ id: number; name: string } | null>(null)
  const [newQuartierName, setNewQuartierName] = useState("")

  const queryClient = useQueryClient()
  const { toast } = useToast()
  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""

  // Fetch communes query
  const {
    data: communes = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["communes"],
    queryFn: fetchCommunes,
  })

  // Update commune coordinates mutation
  const updateCoordinatesMutation = useMutation({
    mutationFn: updateCommuneCoordinates,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["communes"] })
      toast({
        title: "Coordonnées mises à jour",
        description: "Les coordonnées de la commune ont été mises à jour avec succès.",
      })
      setShowCoordinateModal(false)
      setSelectedCommune(null)
      setSelectedPosition(null)
      setIsSettingCoordinates(false)
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour les coordonnées. Veuillez réessayer.",
        variant: "destructive",
      })
      console.error("Error updating coordinates:", error)
    },
  })

  const updateQuartierMutation = useMutation({
    mutationFn: async ({ id, name }: { id: number; name: string }) => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_SERVER_BASE_URL}/deliveries/quartiers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, name }),
      })

      if (!response.ok) {
        throw new Error("Failed to update quartier")
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["communes"] })
      toast({
        title: "Quartier mis à jour",
        description: "Le nom du quartier a été mis à jour avec succès.",
      })
      setEditingQuartier(null)
      setNewQuartierName("")
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le quartier. Veuillez réessayer.",
        variant: "destructive",
      })
      console.error("Error updating quartier:", error)
    },
  })

  const handleSetCoordinates = (commune: Commune) => {
    console.log("Setting coordinates for commune:", commune.name)
    setSelectedCommune(commune)
    setShowCoordinateModal(true)
    setIsSettingCoordinates(true)
    if (commune.reference_latitude && commune.reference_longitude) {
      setSelectedPosition({
        lat: commune.reference_latitude,
        lng: commune.reference_longitude,
      })
    }
  }

  const handleSaveCoordinates = () => {
    if (!selectedCommune || !selectedPosition) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner une position sur la carte.",
        variant: "destructive",
      })
      return
    }

    updateCoordinatesMutation.mutate({
      commune_id: selectedCommune.commune_id!,
      latitude: selectedPosition.lat,
      longitude: selectedPosition.lng,
    })
  }

  const handleEditQuartier = (quartier: { id: number; name: string }) => {
    setEditingQuartier(quartier)
    setNewQuartierName(quartier.name)
  }

  const handleSaveQuartier = () => {
    if (!editingQuartier || !newQuartierName.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir un nom valide pour le quartier.",
        variant: "destructive",
      })
      return
    }

    updateQuartierMutation.mutate({
      id: editingQuartier.id,
      name: newQuartierName.trim(),
    })
  }

  const handleCancelEdit = () => {
    setEditingQuartier(null)
    setNewQuartierName("")
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#2B015F]" />
        <span className="ml-2 text-gray-600">Chargement des communes...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-red-600 mb-4">
          <span className="font-medium">Erreur de chargement</span>
        </div>
        <p className="text-gray-600 mb-4">Impossible de charger les communes.</p>
        <Button onClick={() => queryClient.invalidateQueries({ queryKey: ["communes"] })}>Réessayer</Button>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold text-[#2B015F] mb-6">Gestion des Communes & Quartiers</h2>

      {/* Debug info - remove in production */}
      {showCoordinateModal && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
          <p>
            <strong>Debug:</strong> Modal ouvert pour: {selectedCommune?.name}
          </p>
          <p>
            <strong>Position sélectionnée:</strong>{" "}
            {selectedPosition ? `${selectedPosition.lat.toFixed(6)}, ${selectedPosition.lng.toFixed(6)}` : "Aucune"}
          </p>
          <p>
            <strong>Instruction:</strong> Cliquez sur la carte ci-dessous pour définir la position
          </p>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left Column - Communes List */}
        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
          <h3 className="text-lg font-medium text-gray-700 mb-4">Communes ({communes.length})</h3>

          {communes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Aucune commune trouvée.</p>
            </div>
          ) : (
            communes.map((commune) => (
              <div
                key={commune.commune_id}
                className={`border rounded-lg p-4 shadow-sm transition-all duration-200 ${
                  selectedCommune?.commune_id === commune.commune_id
                    ? "border-[#2B015F] bg-purple-50"
                    : "border-gray-200 bg-white hover:shadow-md"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-[#2B015F]" />
                    <div>
                      <h4 className="font-medium text-gray-800">{commune.name}</h4>
                      <p className="text-sm text-gray-500">
                        {commune.quartiers.length} quartier{commune.quartiers.length !== 1 ? "s" : ""}
                      </p>
                      {commune.reference_latitude && commune.reference_longitude && (
                        <p className="text-xs text-green-600">
                          Lat: {commune.reference_latitude.toFixed(4)}, Lng: {commune.reference_longitude.toFixed(4)}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-block h-3 w-3 rounded-full ${
                        commune.reference_latitude && commune.reference_longitude ? "bg-green-500" : "bg-gray-300"
                      }`}
                      title={
                        commune.reference_latitude && commune.reference_longitude
                          ? "Coordonnées définies"
                          : "Coordonnées non définies"
                      }
                    />
                    <Button
                      size="sm"
                      onClick={() => {
                        console.log("Setting coordinates for commune:", commune.name)
                        handleSetCoordinates(commune)
                      }}
                      className={`${
                        selectedCommune?.commune_id === commune.commune_id && showCoordinateModal
                          ? "bg-green-600 hover:bg-green-700"
                          : "bg-[#2B015F] hover:bg-[#2B015F]/90"
                      }`}
                      disabled={showCoordinateModal && selectedCommune?.commune_id !== commune.commune_id}
                    >
                      {selectedCommune?.commune_id === commune.commune_id && showCoordinateModal
                        ? "En cours..."
                        : commune.reference_latitude && commune.reference_longitude
                          ? "Modifier"
                          : "Définir"}{" "}
                      Position
                    </Button>
                  </div>
                </div>

                <div className="ml-6 space-y-2">
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Quartiers:</h5>
                  {commune.quartiers.map((quartier) => (
                    <div
                      key={quartier.id}
                      className="flex items-center justify-between gap-2 p-2 bg-gray-50 rounded text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-block h-2 w-2 rounded-full ${
                            quartier.is_special ? "bg-green-500" : "bg-gray-300"
                          }`}
                          title={quartier.is_special ? "Quartier spécial avec coordonnées" : "Quartier standard"}
                        />
                        {editingQuartier?.id === quartier.id ? (
                          <div className="flex items-center gap-2">
                            <Input
                              type="text"
                              value={newQuartierName}
                              onChange={(e) => setNewQuartierName(e.target.value)}
                              className="h-6 text-xs"
                              disabled={updateQuartierMutation.isPending}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  handleSaveQuartier()
                                } else if (e.key === "Escape") {
                                  handleCancelEdit()
                                }
                              }}
                              autoFocus
                            />
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                onClick={handleSaveQuartier}
                                disabled={updateQuartierMutation.isPending}
                                className="h-6 px-2 text-xs bg-green-600 hover:bg-green-700"
                              >
                                {updateQuartierMutation.isPending ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Check className="h-3 w-3" />
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={handleCancelEdit}
                                disabled={updateQuartierMutation.isPending}
                                className="h-6 px-2 text-xs bg-transparent"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-600">{quartier.name}</span>
                        )}
                      </div>
                      {editingQuartier?.id !== quartier.id && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditQuartier(quartier)}
                          className="h-6 px-2 text-xs hover:bg-gray-200"
                          disabled={editingQuartier !== null || updateQuartierMutation.isPending}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right Column - Map */}
        <div className="border rounded-lg overflow-hidden">
          {showCoordinateModal && (
            <div className="bg-yellow-50 border-b border-yellow-200 p-3 text-sm text-yellow-800">
              <p>
                <strong>🎯 Mode sélection activé:</strong> Cliquez sur la carte ci-dessous pour définir la position de "
                {selectedCommune?.name}"
                {selectedPosition && (
                  <div className="mt-1 text-xs">
                    Position: {selectedPosition.lat.toFixed(6)}, {selectedPosition.lng.toFixed(6)}
                  </div>
                )}
              </p>
            </div>
          )}
          <CommuneMapComponentFixed
            googleMapsApiKey={googleMapsApiKey}
            communes={communes}
            selectedPosition={selectedPosition}
            onPositionSelect={(position) => {
              console.log("Position selected from map:", position)
              setSelectedPosition(position)
            }}
            showPositionSelector={isSettingCoordinates}
            selectedCommune={selectedCommune}
          />
        </div>
      </div>
    </div>
  )
}

// CommunesTabInline component - redesigned without modal
const CommunesTabInline = () => {
  const [selectedCommune, setSelectedCommune] = useState<Commune | null>(null)
  const [isSettingCoordinates, setIsSettingCoordinates] = useState(false)
  const [selectedPosition, setSelectedPosition] = useState<{ lat: number; lng: number } | null>(null)
  const [editingQuartier, setEditingQuartier] = useState<{ id: number; name: string } | null>(null)
  const [newQuartierName, setNewQuartierName] = useState("")

  const queryClient = useQueryClient()
  const { toast } = useToast()
  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""

  // Fetch communes query
  const {
    data: communes = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["communes"],
    queryFn: fetchCommunes,
  })

  // Update commune coordinates mutation
  const updateCoordinatesMutation = useMutation({
    mutationFn: updateCommuneCoordinates,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["communes"] })
      toast({
        title: "Coordonnées mises à jour",
        description: "Les coordonnées de la commune ont été mises à jour avec succès.",
      })
      setIsSettingCoordinates(false)
      setSelectedCommune(null)
      setSelectedPosition(null)
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour les coordonnées. Veuillez réessayer.",
        variant: "destructive",
      })
      console.error("Error updating commune coordinates:", error)
    },
  })

  const updateQuartierMutation = useMutation({
    mutationFn: async ({ id, name }: { id: number; name: string }) => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_SERVER_BASE_URL}/deliveries/update-quartier`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, name }),
      })

      if (!response.ok) {
        throw new Error("Failed to update quartier")
      }
      console.log("Quartier update response:", response)
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["communes"] })
      toast({
        title: "Quartier mis à jour",
        description: "Le nom du quartier a été mis à jour avec succès.",
      })
      setEditingQuartier(null)
      setNewQuartierName("")
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le quartier. Veuillez réessayer.",
        variant: "destructive",
      })
      console.error("Error updating quartier:", error)
    },
  })

  const handleSetCoordinates = (commune: Commune) => {
    setSelectedCommune(commune)
    setIsSettingCoordinates(true)
    setSelectedPosition(
      commune.reference_latitude && commune.reference_longitude
        ? { lat: commune.reference_latitude, lng: commune.reference_longitude }
        : null,
    )
  }

  const handleSaveCoordinates = () => {
    if (!selectedCommune || !selectedPosition || !selectedCommune.commune_id) {
      return
    }

    updateCoordinatesMutation.mutate({
      commune_id: selectedCommune.commune_id,
      latitude: selectedPosition.lat,
      longitude: selectedPosition.lng,
    })
  }

  const handleEditQuartier = (quartier: { id: number; name: string }) => {
    setEditingQuartier(quartier)
    setNewQuartierName(quartier.name)
  }

  const handleSaveQuartier = () => {
    if (!editingQuartier || !newQuartierName.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir un nom valide pour le quartier.",
        variant: "destructive",
      })
      return
    }

    updateQuartierMutation.mutate({
      id: editingQuartier.id,
      name: newQuartierName.trim(),
    })
  }

  const handleCancelEdit = () => {
    setEditingQuartier(null)
    setNewQuartierName("")
  }

  const handleCancelCoordinates = () => {
    setIsSettingCoordinates(false)
    setSelectedCommune(null)
    setSelectedPosition(null)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#2B015F]" />
        <span className="ml-2 text-gray-600">Chargement des communes...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-red-600 mb-4">
          <span className="font-medium">Erreur de chargement</span>
        </div>
        <p className="text-gray-600 mb-4">Impossible de charger les communes.</p>
        <Button onClick={() => queryClient.invalidateQueries({ queryKey: ["communes"] })}>Réessayer</Button>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold text-[#2B015F] mb-6">Gestion des Communes & Quartiers</h2>

      {/* Coordinate Setting Instructions */}
      {isSettingCoordinates && selectedCommune && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-blue-900 mb-2">
                📍 Définition de la position pour "{selectedCommune.name}"
              </h3>
              <p className="text-blue-700 mb-2">
                {selectedPosition
                  ? "✅ Position sélectionnée! Vous pouvez cliquer ailleurs sur la carte pour ajuster."
                  : "👆 Cliquez sur la carte ci-dessous pour définir la position de référence."}
              </p>
              {selectedPosition && (
                <div className="text-sm text-blue-600">
                  <strong>Coordonnées:</strong> {selectedPosition.lat.toFixed(6)}, {selectedPosition.lng.toFixed(6)}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleSaveCoordinates}
                className="bg-green-600 hover:bg-green-700"
                disabled={updateCoordinatesMutation.isPending || !selectedPosition}
              >
                {updateCoordinatesMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Sauvegarde...
                  </>
                ) : (
                  "💾 Sauvegarder"
                )}
              </Button>
              <Button
                variant="outline"
                onClick={handleCancelCoordinates}
                disabled={updateCoordinatesMutation.isPending}
              >
                ❌ Annuler
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left Column - Communes List */}
        <div className="space-y-4 max-h-[900px] overflow-y-auto pr-2">
          <h3 className="text-lg font-medium text-gray-700 mb-4">Communes ({communes.length})</h3>

          {communes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Aucune commune trouvée.</p>
            </div>
          ) : (
            communes.map((commune) => (
              <div
                key={commune.commune_id}
                className={`border rounded-lg p-4 shadow-sm transition-all duration-200 ${
                  selectedCommune?.commune_id === commune.commune_id && isSettingCoordinates
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 bg-white hover:shadow-md"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-[#2B015F]" />
                    <div>
                      <h4 className="font-medium text-gray-800">{commune.name}</h4>
                      <p className="text-sm text-gray-500">
                        {commune.quartiers.length} quartier{commune.quartiers.length !== 1 ? "s" : ""}
                      </p>
                      {commune.reference_latitude && commune.reference_longitude && (
                        <p className="text-xs text-green-600">
                          📍 {commune.reference_latitude.toFixed(4)}, {commune.reference_longitude.toFixed(4)}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-block h-3 w-3 rounded-full ${
                        commune.reference_latitude && commune.reference_longitude ? "bg-green-500" : "bg-gray-300"
                      }`}
                      title={
                        commune.reference_latitude && commune.reference_longitude
                          ? "Coordonnées définies"
                          : "Coordonnées non définies"
                      }
                    />
                    <Button
                      size="sm"
                      onClick={() => handleSetCoordinates(commune)}
                      className={`${
                        selectedCommune?.commune_id === commune.commune_id && isSettingCoordinates
                          ? "bg-blue-600 hover:bg-blue-700"
                          : "bg-[#2B015F] hover:bg-[#2B015F]/90"
                      }`}
                      disabled={isSettingCoordinates && selectedCommune?.commune_id !== commune.commune_id}
                    >
                      {selectedCommune?.commune_id === commune.commune_id && isSettingCoordinates
                        ? "🎯 En cours..."
                        : commune.reference_latitude && commune.reference_longitude
                          ? "✏️ Modifier"
                          : "📍 Définir"}{" "}
                      Position
                    </Button>
                  </div>
                </div>

                <div className="ml-6 space-y-2">
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Quartiers:</h5>
                  {commune.quartiers.map((quartier) => (
                    <div
                      key={quartier.id}
                      className="flex items-center justify-between gap-2 p-2 bg-gray-50 rounded text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-block h-2 w-2 rounded-full ${
                            quartier.is_special ? "bg-green-500" : "bg-gray-300"
                          }`}
                          title={quartier.is_special ? "Quartier spécial avec coordonnées" : "Quartier standard"}
                        />
                        {editingQuartier?.id === quartier.id ? (
                          <div className="flex items-center gap-2">
                            <Input
                              type="text"
                              value={newQuartierName}
                              onChange={(e) => setNewQuartierName(e.target.value)}
                              className="h-6 text-xs"
                              disabled={updateQuartierMutation.isPending}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  handleSaveQuartier()
                                } else if (e.key === "Escape") {
                                  handleCancelEdit()
                                }
                              }}
                              autoFocus
                            />
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                onClick={handleSaveQuartier}
                                disabled={updateQuartierMutation.isPending}
                                className="h-6 px-2 text-xs bg-green-600 hover:bg-green-700"
                              >
                                {updateQuartierMutation.isPending ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Check className="h-3 w-3" />
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={handleCancelEdit}
                                disabled={updateQuartierMutation.isPending}
                                className="h-6 px-2 text-xs bg-transparent"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-600">{quartier.name}</span>
                        )}
                      </div>
                      {editingQuartier?.id !== quartier.id && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditQuartier(quartier)}
                          className="h-6 px-2 text-xs hover:bg-gray-200"
                          disabled={editingQuartier !== null || updateQuartierMutation.isPending}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right Column - Map */}
        <div className="border rounded-lg overflow-hidden">
          {isSettingCoordinates && (
            <div className="bg-yellow-50 border-b border-yellow-200 p-3 text-sm text-yellow-800">
              <strong>🎯 Mode sélection activé:</strong> Cliquez sur la carte pour définir la position de "
              {selectedCommune?.name}"
              {selectedPosition && (
                <div className="mt-1 text-xs">
                  Position: {selectedPosition.lat.toFixed(6)}, {selectedPosition.lng.toFixed(6)}
                </div>
              )}
            </div>
          )}
          <CommuneMapComponentFixed
            googleMapsApiKey={googleMapsApiKey}
            communes={communes}
            selectedPosition={selectedPosition}
            onPositionSelect={(position) => {
              console.log("Position selected from map:", position)
              setSelectedPosition(position)
            }}
            showPositionSelector={isSettingCoordinates}
            selectedCommune={selectedCommune}
          />
        </div>
      </div>
    </div>
  )
}

// CommuneMapComponentFixed for displaying communes on map with better click handling
const CommuneMapComponentFixed = ({
  googleMapsApiKey,
  communes,
  selectedPosition,
  onPositionSelect,
  showPositionSelector,
  selectedCommune,
}: {
  googleMapsApiKey: string
  communes: Commune[]
  selectedPosition: { lat: number; lng: number } | null
  onPositionSelect: (position: { lat: number; lng: number }) => void
  showPositionSelector: boolean
  selectedCommune: Commune | null
}) => {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<{ [key: string]: any }>({})
  const tempMarkerRef = useRef<any>(null)
  const clickListenerRef = useRef<any>(null)

  // Load Google Maps script
  useEffect(() => {
    if (!window.google && googleMapsApiKey) {
      const script = document.createElement("script")
      script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=places`
      script.async = true
      script.defer = true
      script.onload = () => {
        initMap()
      }
      script.onerror = () => {
        console.error("Failed to load Google Maps script. Check your API key.")
      }
      document.head.appendChild(script)
    } else if (window.google) {
      initMap()
    }
  }, [googleMapsApiKey])

  // Initialize the map
  const initMap = useCallback(() => {
    if (!mapRef.current || !window.google) return

    if (!mapInstanceRef.current) {
      const defaultCenter = { lat: -4.3276, lng: 15.3136 } // Kinshasa
      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
        center: defaultCenter,
        zoom: 11,
        mapTypeId: window.google.maps.MapTypeId.ROADMAP,
        clickableIcons: false,
      })

      console.log("Map initialized")
    }
  }, [])

  // Handle click listener for position selection
  useEffect(() => {
    if (!mapInstanceRef.current || !window.google) return

    // Remove existing click listener
    if (clickListenerRef.current) {
      window.google.maps.event.removeListener(clickListenerRef.current)
      clickListenerRef.current = null
    }

    // Add click listener only when in selection mode
    if (showPositionSelector) {
      console.log("Adding click listener for position selection")
      clickListenerRef.current = mapInstanceRef.current.addListener("click", (event: any) => {
        console.log("Map clicked!", event.latLng.lat(), event.latLng.lng())
        const position = {
          lat: event.latLng.lat(),
          lng: event.latLng.lng(),
        }
        onPositionSelect(position)
      })
    } else {
      console.log("Position selector disabled, no click listener")
    }

    // Cleanup function
    return () => {
      if (clickListenerRef.current) {
        window.google.maps.event.removeListener(clickListenerRef.current)
        clickListenerRef.current = null
      }
    }
  }, [showPositionSelector, onPositionSelect])

  // Update commune markers on the map
  useEffect(() => {
    if (!mapInstanceRef.current || !window.google) return

    // Clear existing markers
    Object.values(markersRef.current).forEach((marker: any) => marker.setMap(null))
    markersRef.current = {}

    // Add markers for communes with coordinates
    communes.forEach((commune) => {
      if (commune.reference_latitude && commune.reference_longitude && commune.commune_id) {
        const isSelected = selectedCommune?.commune_id === commune.commune_id

        const marker = new window.google.maps.Marker({
          position: {
            lat: commune.reference_latitude,
            lng: commune.reference_longitude,
          },
          map: mapInstanceRef.current,
          title: commune.name,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: isSelected ? 12 : 8,
            fillColor: isSelected ? "#3B82F6" : "#2B015F",
            fillOpacity: 0.8,
            strokeColor: "#ffffff",
            strokeWeight: 2,
          },
        })

        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="padding: 8px;">
              <strong>${commune.name}</strong><br>
              <small>${commune.quartiers.length} quartier${commune.quartiers.length !== 1 ? "s" : ""}</small>
              ${isSelected ? '<br><em style="color: #3B82F6;">En cours de modification</em>' : ""}
            </div>
          `,
        })

        marker.addListener("click", () => {
          infoWindow.open(mapInstanceRef.current, marker)
        })

        markersRef.current[commune.commune_id] = marker
      }
    })
  }, [communes, selectedCommune])

  // Update temporary marker for position selection
  useEffect(() => {
    if (!mapInstanceRef.current || !window.google) return

    // Remove existing temp marker
    if (tempMarkerRef.current) {
      tempMarkerRef.current.setMap(null)
      tempMarkerRef.current = null
    }

    // Add temp marker if position is selected and in selection mode
    if (selectedPosition && showPositionSelector) {
      console.log("Adding temp marker at:", selectedPosition)
      tempMarkerRef.current = new window.google.maps.Marker({
        position: selectedPosition,
        map: mapInstanceRef.current,
        title: `Nouvelle position pour ${selectedCommune?.name}`,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 12,
          fillColor: "#EF4444",
          fillOpacity: 0.9,
          strokeColor: "#ffffff",
          strokeWeight: 3,
        },
        animation: window.google.maps.Animation.BOUNCE,
      })

      // Center map on the selected position
      mapInstanceRef.current.panTo(selectedPosition)
    }
  }, [selectedPosition, showPositionSelector, selectedCommune])

  return (
    <div
      ref={mapRef}
      className="w-full h-[600px]"
      aria-label="Google Map for Commune Management"
      style={{ cursor: showPositionSelector ? "crosshair" : "default" }}
    />
  )
}

// ZonesTab component for managing zones
const ZonesTab = () => {
  const [newZoneName, setNewZoneName] = useState("")
  const [tempPolygonCoords, setTempPolygonCoords] = useState<number[][] | null>(null)
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null)
  const [showNewZoneModal, setShowNewZoneModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)

  const queryClient = useQueryClient()
  const { toast } = useToast()
  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""

  // Fetch zones query
  const {
    data: zones = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["delivery-zones"],
    queryFn: fetchZones,
  })

  // Create zone mutation
  const createZoneMutation = useMutation({
    mutationFn: createZone,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["delivery-zones"] })
      toast({
        title: "Zone créée",
        description: "La zone a été créée avec succès.",
      })
      setNewZoneName("")
      setTempPolygonCoords(null)
      setShowNewZoneModal(false)
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de créer la zone. Veuillez réessayer.",
        variant: "destructive",
      })
      console.error("Error creating zone:", error)
    },
  })

  // Delete zone mutation
  const deleteZoneMutation = useMutation({
    mutationFn: deleteZone,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["delivery-zones"] })
      toast({
        title: "Zone supprimée",
        description: "La zone a été supprimée avec succès.",
      })
      setShowDeleteConfirm(null)
      if (selectedZoneId === showDeleteConfirm) {
        setSelectedZoneId(null)
      }
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la zone. Veuillez réessayer.",
        variant: "destructive",
      })
      console.error("Error deleting zone:", error)
    },
  })

  // Callback for when a polygon is completed on the map
  const handlePolygonComplete = useCallback((polygon: any) => {
    const paths = polygon.getPath().getArray()
    const geoJsonCoords = paths.map((latLng: any) => [latLng.lng(), latLng.lat()])

    if (
      geoJsonCoords.length > 0 &&
      (geoJsonCoords[0][0] !== geoJsonCoords[geoJsonCoords.length - 1][0] ||
        geoJsonCoords[0][1] !== geoJsonCoords[geoJsonCoords.length - 1][1])
    ) {
      geoJsonCoords.push(geoJsonCoords[0])
    }

    setTempPolygonCoords(geoJsonCoords)
    setShowNewZoneModal(true)
    polygon.setMap(null)
  }, [])

  // Function to add a new zone after naming
  const addZone = () => {
    if (newZoneName.trim() === "" || !tempPolygonCoords) {
      return
    }

    const zoneData: CreateZoneData = {
      name: newZoneName.trim(),
      geometry: {
        type: "Polygon",
        coordinates: [tempPolygonCoords],
      },
    }

    createZoneMutation.mutate(zoneData)
  }

  // Function to confirm and delete a zone
  const confirmDeleteZone = (zoneId: string) => {
    setShowDeleteConfirm(zoneId)
  }

  const handleDeleteZone = () => {
    if (showDeleteConfirm) {
      deleteZoneMutation.mutate(showDeleteConfirm)
    }
  }

  // Function to select a zone and highlight it on the map
  const selectZone = (zoneId: string) => {
    setSelectedZoneId(zoneId)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#2B015F]" />
        <span className="ml-2 text-gray-600">Chargement des zones...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-red-600 mb-4">
          <span className="font-medium">Erreur de chargement</span>
        </div>
        <p className="text-gray-600 mb-4">Impossible de charger les zones de livraison.</p>
        <Button onClick={() => queryClient.invalidateQueries({ queryKey: ["delivery-zones"] })}>Réessayer</Button>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold text-[#2B015F] mb-6">Gestion des Zones de Livraison</h2>

      {/* Map Component */}
      <MapComponent
        googleMapsApiKey={googleMapsApiKey}
        onPolygonComplete={handlePolygonComplete}
        zones={zones}
        selectedZoneId={selectedZoneId}
      />

      {/* Zone List */}
      <div className="mt-8">
        <h3 className="text-xl font-semibold text-gray-700 mb-4">Zones Existantes ({zones.length})</h3>
        {zones.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>Aucune zone créée pour le moment.</p>
            <p className="text-sm">Dessinez une nouvelle zone sur la carte!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {zones.map((zone) => (
              <div
                key={zone.delivery_zone_id}
                className={`flex items-center justify-between p-4 border rounded-lg shadow-sm transition-all duration-200 ${
                  selectedZoneId === zone.delivery_zone_id
                    ? "border-[#2B015F] bg-purple-50"
                    : "border-gray-200 bg-white hover:shadow-md"
                }`}
              >
                <div>
                  <span className="text-lg font-medium text-gray-800">{zone.name}</span>
                  <p className="text-sm text-gray-500">{zone.geometry.coordinates[0].length - 1} points</p>
                </div>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => selectZone(zone.delivery_zone_id)}
                    className="p-2"
                    title="Voir sur la carte"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => confirmDeleteZone(zone.delivery_zone_id)}
                    className="p-2"
                    title="Supprimer la zone"
                    disabled={deleteZoneMutation.isPending}
                  >
                    {deleteZoneMutation.isPending && showDeleteConfirm === zone.delivery_zone_id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New Zone Naming Modal */}
      {showNewZoneModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 shadow-xl w-full max-w-md">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Nommer votre nouvelle zone</h3>
            <Input
              type="text"
              className="w-full mb-4"
              placeholder="Ex: Centre-ville, Gombe, etc."
              value={newZoneName}
              onChange={(e) => setNewZoneName(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  addZone()
                }
              }}
              disabled={createZoneMutation.isPending}
            />
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowNewZoneModal(false)
                  setNewZoneName("")
                  setTempPolygonCoords(null)
                }}
                disabled={createZoneMutation.isPending}
              >
                Annuler
              </Button>
              <Button
                onClick={addZone}
                className="bg-[#2B015F] hover:bg-[#2B015F]/90"
                disabled={createZoneMutation.isPending}
              >
                {createZoneMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Création...
                  </>
                ) : (
                  "Ajouter Zone"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 shadow-xl w-full max-w-md">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Confirmer la suppression</h3>
            <p className="text-gray-600 mb-6">
              Êtes-vous sûr de vouloir supprimer cette zone ? Cette action est irréversible.
            </p>
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(null)}
                disabled={deleteZoneMutation.isPending}
              >
                Annuler
              </Button>
              <Button variant="destructive" onClick={handleDeleteZone} disabled={deleteZoneMutation.isPending}>
                {deleteZoneMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Suppression...
                  </>
                ) : (
                  "Supprimer"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// PricingTab component for managing zone prices
const PricingTab = () => {
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null)
  const [priceValue, setPriceValue] = useState("")
  const [showPriceModal, setShowPriceModal] = useState(false)

  const queryClient = useQueryClient()
  const { toast } = useToast()

  // Fetch zones query
  const {
    data: zones = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["delivery-zones"],
    queryFn: fetchZones,
  })

  // Update zone price mutation
  const updatePriceMutation = useMutation({
    mutationFn: updateZonePrice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["delivery-zones"] })
      toast({
        title: "Prix mis à jour",
        description: "Le prix de la zone a été mis à jour avec succès.",
      })
      setShowPriceModal(false)
      setSelectedZone(null)
      setPriceValue("")
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le prix. Veuillez réessayer.",
        variant: "destructive",
      })
      console.error("Error updating zone price:", error)
    },
  })

  const handleUpdatePrice = (zone: Zone) => {
    setSelectedZone(zone)
    setPriceValue(zone.price?.value?.toString() || "")
    setShowPriceModal(true)
  }

  const handleSavePrice = () => {
    if (!selectedZone || !priceValue.trim()) {
      return
    }

    const price = Number.parseFloat(priceValue)
    if (isNaN(price) || price <= 0) {
      toast({
        title: "Erreur",
        description: "Veuillez entrer un prix valide.",
        variant: "destructive",
      })
      return
    }

    updatePriceMutation.mutate({
      delivery_zone_id: selectedZone.delivery_zone_id,
      price_value: price,
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#2B015F]" />
        <span className="ml-2 text-gray-600">Chargement des zones...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-red-600 mb-4">
          <span className="font-medium">Erreur de chargement</span>
        </div>
        <p className="text-gray-600 mb-4">Impossible de charger les zones de livraison.</p>
        <Button onClick={() => queryClient.invalidateQueries({ queryKey: ["delivery-zones"] })}>Réessayer</Button>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold text-[#2B015F] mb-6">Configuration des Tarifs par Zone</h2>

      {zones.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <DollarSign className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>Aucune zone disponible.</p>
          <p className="text-sm">Créez d'abord des zones dans l'onglet Zones.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {zones.map((zone) => (
            <div
              key={zone.delivery_zone_id}
              className="flex items-center justify-between p-4 border rounded-lg shadow-sm bg-white hover:shadow-md transition-all duration-200"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-[#2B015F]" />
                  <div>
                    <h4 className="font-medium text-gray-800">{zone.name}</h4>
                    <p className="text-sm text-gray-500">{zone.geometry.coordinates[0].length - 1} points</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  {zone.price ? (
                    <div>
                      <p className="text-lg font-semibold text-green-600">
                        ${zone.price.value.toFixed(2)} {zone.price.currency}
                      </p>
                      <p className="text-xs text-gray-500">Prix configuré</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm text-gray-400">Aucun prix</p>
                      <p className="text-xs text-gray-400">Non configuré</p>
                    </div>
                  )}
                </div>

                <Button
                  onClick={() => handleUpdatePrice(zone)}
                  className="bg-[#2B015F] hover:bg-[#2B015F]/90"
                  size="sm"
                >
                  {zone.price ? "Modifier" : "Ajouter"} Prix
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Price Update Modal */}
      {showPriceModal && selectedZone && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 shadow-xl w-full max-w-md">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              {selectedZone.price ? "Modifier" : "Ajouter"} le prix pour "{selectedZone.name}"
            </h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Prix en USD</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  className="pl-8"
                  placeholder="0.00"
                  value={priceValue}
                  onChange={(e) => setPriceValue(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      handleSavePrice()
                    }
                  }}
                  disabled={updatePriceMutation.isPending}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowPriceModal(false)
                  setSelectedZone(null)
                  setPriceValue("")
                }}
                disabled={updatePriceMutation.isPending}
              >
                Annuler
              </Button>
              <Button
                onClick={handleSavePrice}
                className="bg-[#2B015F] hover:bg-[#2B015F]/90"
                disabled={updatePriceMutation.isPending}
              >
                {updatePriceMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Sauvegarde...
                  </>
                ) : (
                  "Sauvegarder"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// MapComponent for displaying and interacting with the Google Map
const MapComponent = ({
  googleMapsApiKey,
  onPolygonComplete,
  zones,
  selectedZoneId,
}: {
  googleMapsApiKey: string
  onPolygonComplete: (polygon: any) => void
  zones: Zone[]
  selectedZoneId: string | null
}) => {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const drawingManagerRef = useRef<any>(null)
  const zonePolygonsRef = useRef<{ [key: string]: any }>({})

  // Load Google Maps script
  useEffect(() => {
    if (!window.google && googleMapsApiKey) {
      const script = document.createElement("script")
      script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=drawing`
      script.async = true
      script.defer = true
      script.onload = () => {
        initMap()
      }
      script.onerror = () => {
        console.error("Failed to load Google Maps script. Check your API key.")
      }
      document.head.appendChild(script)
    } else if (window.google) {
      initMap()
    }
  }, [googleMapsApiKey])

  // Initialize the map and drawing manager
  const initMap = useCallback(() => {
    if (!mapRef.current || !window.google) return

    if (!mapInstanceRef.current) {
      const defaultCenter = { lat: -4.3276, lng: 15.3136 } // Kinshasa
      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
        center: defaultCenter,
        zoom: 11,
        mapTypeId: window.google.maps.MapTypeId.ROADMAP,
        disableDefaultUI: false,
        fullscreenControl: false,
        mapTypeControl: false,
        streetViewControl: false,
      })

      drawingManagerRef.current = new window.google.maps.drawing.DrawingManager({
        drawingMode: null,
        drawingControl: true,
        drawingControlOptions: {
          position: window.google.maps.ControlPosition.TOP_CENTER,
          drawingModes: [window.google.maps.drawing.OverlayType.POLYGON],
        },
        polygonOptions: {
          fillColor: "#2B015F",
          fillOpacity: 0.3,
          strokeWeight: 2,
          strokeColor: "#2B015F",
          clickable: true,
          editable: false,
          zIndex: 1,
        },
      })

      drawingManagerRef.current.setMap(mapInstanceRef.current)

      window.google.maps.event.addListener(drawingManagerRef.current, "polygoncomplete", (polygon: any) => {
        onPolygonComplete(polygon)
      })
    }
  }, [onPolygonComplete])

  // Render/Update existing zones on the map
  useEffect(() => {
    if (!mapInstanceRef.current || !window.google) return

    // Clear existing polygons from the map
    Object.values(zonePolygonsRef.current).forEach((polygon: any) => polygon.setMap(null))
    zonePolygonsRef.current = {}

    zones.forEach((zone) => {
      const paths = zone.geometry.coordinates[0].map((coord) => ({ lat: coord[1], lng: coord[0] }))
      const isSelected = selectedZoneId === zone.delivery_zone_id

      const polygon = new window.google.maps.Polygon({
        paths: paths,
        strokeColor: isSelected ? "#2B015F" : "#8A2387",
        strokeOpacity: 0.8,
        strokeWeight: 3,
        fillColor: isSelected ? "#2B015F" : "#8A2387",
        fillOpacity: 0.35,
        clickable: true,
        editable: false,
        zIndex: isSelected ? 2 : 1,
      })

      polygon.setMap(mapInstanceRef.current)
      zonePolygonsRef.current[zone.delivery_zone_id] = polygon

      // Add info window
      const infoWindow = new window.google.maps.InfoWindow({
        content: `<div style="padding: 8px;"><strong>${zone.name}</strong></div>`,
      })

      polygon.addListener("click", () => {
        infoWindow.setPosition(paths[0])
        infoWindow.open(mapInstanceRef.current)
      })
    })

    // If a zone is selected, fit the map to its bounds
    if (selectedZoneId) {
      const selectedZone = zones.find((z) => z.delivery_zone_id === selectedZoneId)
      if (selectedZone) {
        const paths = selectedZone.geometry.coordinates[0].map((coord) => ({ lat: coord[1], lng: coord[0] }))
        const bounds = new window.google.maps.LatLngBounds()
        paths.forEach((path) => bounds.extend(path))
        mapInstanceRef.current.fitBounds(bounds)
      }
    }
  }, [zones, selectedZoneId])

  return (
    <div
      ref={mapRef}
      className="w-full h-[900px] rounded-lg shadow-md border border-gray-200"
      aria-label="Google Map for Zone Management"
    />
  )
}

// CommuneMapComponent for displaying communes on map
const CommuneMapComponent = ({
  googleMapsApiKey,
  communes,
  selectedPosition,
  onPositionSelect,
  showPositionSelector,
}: {
  googleMapsApiKey: string
  communes: Commune[]
  selectedPosition: { lat: number; lng: number } | null
  onPositionSelect: (position: { lat: number; lng: number }) => void
  showPositionSelector: boolean
}) => {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<{ [key: string]: any }>({})
  const tempMarkerRef = useRef<any>(null)

  // Load Google Maps script
  useEffect(() => {
    if (!window.google && googleMapsApiKey) {
      const script = document.createElement("script")
      script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=places`
      script.async = true
      script.defer = true
      script.onload = () => {
        initMap()
      }
      script.onerror = () => {
        console.error("Failed to load Google Maps script. Check your API key.")
      }
      document.head.appendChild(script)
    } else if (window.google) {
      initMap()
    }
  }, [googleMapsApiKey])

  // Initialize the map
  const initMap = useCallback(() => {
    if (!mapRef.current || !window.google) return

    if (!mapInstanceRef.current) {
      const defaultCenter = { lat: -4.3276, lng: 15.3136 } // Kinshasa
      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
        center: defaultCenter,
        zoom: 11,
        mapTypeId: window.google.maps.MapTypeId.ROADMAP,
      })

      // Add click listener for position selection
      mapInstanceRef.current.addListener("click", (event: any) => {
        if (showPositionSelector) {
          const position = {
            lat: event.latLng.lat(),
            lng: event.latLng.lng(),
          }
          onPositionSelect(position)
        }
      })
    }
  }, [onPositionSelect, showPositionSelector])

  // Update commune markers on the map
  useEffect(() => {
    if (!mapInstanceRef.current || !window.google) return

    // Clear existing markers
    Object.values(markersRef.current).forEach((marker: any) => marker.setMap(null))
    markersRef.current = {}

    // Add markers for communes with coordinates
    communes.forEach((commune) => {
      if (commune.reference_latitude && commune.reference_longitude && commune.commune_id) {
        const marker = new window.google.maps.Marker({
          position: {
            lat: commune.reference_latitude,
            lng: commune.reference_longitude,
          },
          map: mapInstanceRef.current,
          title: commune.name,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: "#2B015F",
            fillOpacity: 0.8,
            strokeColor: "#ffffff",
            strokeWeight: 2,
          },
        })

        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="padding: 8px;">
              <strong>${commune.name}</strong><br>
              <small>${commune.quartiers.length} quartier${commune.quartiers.length !== 1 ? "s" : ""}</small>
            </div>
          `,
        })

        marker.addListener("click", () => {
          infoWindow.open(mapInstanceRef.current, marker)
        })

        markersRef.current[commune.commune_id] = marker
      }
    })
  }, [communes])

  // Update temporary marker for position selection
  useEffect(() => {
    if (!mapInstanceRef.current || !window.google) return

    // Remove existing temp marker
    if (tempMarkerRef.current) {
      tempMarkerRef.current.setMap(null)
      tempMarkerRef.current = null
    }

    // Add temp marker if position is selected
    if (selectedPosition && showPositionSelector) {
      tempMarkerRef.current = new window.google.maps.Marker({
        position: selectedPosition,
        map: mapInstanceRef.current,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: "#ff0000",
          fillOpacity: 0.8,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        },
        animation: window.google.maps.Animation.BOUNCE,
      })
    }
  }, [selectedPosition, showPositionSelector])

  return <div ref={mapRef} className="w-full h-[600px]" aria-label="Google Map for Commune Management" />
}

// PriceZonesTab component for managing price zones
const PriceZonesTab = () => {
  const [selectedZone, setSelectedZone] = useState<PriceZone | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showAddCommuneModal, setShowAddCommuneModal] = useState(false)
  const [newZoneName, setNewZoneName] = useState("")
  const [newZoneDescription, setNewZoneDescription] = useState("")
  const [selectedCommune, setSelectedCommune] = useState<Commune | null>(null)
  const [selectedQuartiers, setSelectedQuartiers] = useState<Quartier[]>([])

  const queryClient = useQueryClient()
  const { toast } = useToast()

  // Fetch price zones query
  const {
    data: priceZones = [],
    isLoading: priceZonesLoading,
    error: priceZonesError,
  } = useQuery({
    queryKey: ["price-zones"],
    queryFn: fetchPriceZones,
  })

  // Fetch communes query
  const {
    data: communes = [],
    isLoading: communesLoading,
    error: communesError,
  } = useQuery({
    queryKey: ["communes"],
    queryFn: fetchCommunes,
  })

  // Create price zone mutation
  const createZoneMutation = useMutation({
    mutationFn: createPriceZone,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["price-zones"] })
      toast({
        title: "Zone créée",
        description: "La zone tarifaire a été créée avec succès.",
      })
      setShowCreateModal(false)
      setNewZoneName("")
      setNewZoneDescription("")
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de créer la zone tarifaire. Veuillez réessayer.",
        variant: "destructive",
      })
      console.error("Error creating price zone:", error)
    },
  })

  // Add commune to zone mutation
  const addCommuneMutation = useMutation({
    mutationFn: addCommuneToZone,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["price-zones"] })
      toast({
        title: "Commune ajoutée",
        description: "La commune a été ajoutée à la zone tarifaire avec succès.",
      })
      setShowAddCommuneModal(false)
      setSelectedCommune(null)
      setSelectedQuartiers([])
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'ajouter la commune à la zone.",
        variant: "destructive",
      })
      console.error("Error adding commune to zone:", error)
    },
  })

  const handleCreateZone = () => {
    if (!newZoneName.trim() || !newZoneDescription.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs.",
        variant: "destructive",
      })
      return
    }

    createZoneMutation.mutate({
      name: newZoneName.trim(),
      description: newZoneDescription.trim(),
    })
  }

  const handleAddCommune = () => {
    if (!selectedZone || !selectedCommune || selectedQuartiers.length === 0) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner une commune et au moins un quartier.",
        variant: "destructive",
      })
      return
    }

    addCommuneMutation.mutate({
      delivery_price_zone_id: selectedZone.delivery_price_zone_id,
      commune_id: selectedCommune.commune_id!,
      quartiers_included: selectedQuartiers,
    })
  }

  const handleQuartierToggle = (quartier: Quartier) => {
    setSelectedQuartiers((prev) => {
      const exists = prev.find((q) => q.id === quartier.id)
      if (exists) {
        return prev.filter((q) => q.id !== quartier.id)
      } else {
        return [...prev, quartier]
      }
    })
  }

  if (priceZonesLoading || communesLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#2B015F]" />
        <span className="ml-2 text-gray-600">Chargement des zones tarifaires...</span>
      </div>
    )
  }

  if (priceZonesError || communesError) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-red-600 mb-4">
          <span className="font-medium">Erreur de chargement</span>
        </div>
        <p className="text-gray-600 mb-4">Impossible de charger les zones tarifaires.</p>
        <Button
          onClick={() => {
            queryClient.invalidateQueries({ queryKey: ["price-zones"] })
            queryClient.invalidateQueries({ queryKey: ["communes"] })
          }}
        >
          Réessayer
        </Button>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-[#2B015F]">Gestion des Zones Tarifaires</h2>
        <Button onClick={() => setShowCreateModal(true)} className="bg-green-600 hover:bg-green-700">
          <MapPin className="w-4 h-4 mr-2" />
          Créer une Zone
        </Button>
      </div>

      {/* Price Zones List */}
      <div className="grid gap-6">
        {priceZones.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <DollarSign className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium mb-2">Aucune zone tarifaire</p>
            <p className="text-sm">Créez votre première zone tarifaire pour commencer.</p>
          </div>
        ) : (
          priceZones.map((zone) => (
            <Card key={zone.delivery_price_zone_id} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">{zone.name}</h3>
                    <p className="text-gray-600 mb-3">{zone.description}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>
                        {zone.communes_and_quartiers.length} commune
                        {zone.communes_and_quartiers.length !== 1 ? "s" : ""}
                      </span>
                      <span>Créée le {new Date(zone.creates_at).toLocaleDateString("fr-FR")}</span>
                    </div>
                  </div>
                  <Button
                    onClick={() => {
                      setSelectedZone(zone)
                      setShowAddCommuneModal(true)
                    }}
                    className="bg-blue-600 hover:bg-blue-700"
                    size="sm"
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    Ajouter Commune
                  </Button>
                </div>

                {/* Communes and Quartiers */}
                {zone.communes_and_quartiers.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-700 border-b pb-2">Communes incluses:</h4>
                    {zone.communes_and_quartiers.map((commune) => (
                      <div key={commune.commune_id} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <MapPin className="h-4 w-4 text-[#2B015F]" />
                          <span className="font-medium text-gray-800">{commune.commune_name}</span>
                          <span className="text-sm text-gray-500">
                            ({commune.quartiers_included.length}) quartier
                            {commune.quartiers_included.length !== 1 ? "s" : ""}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {commune.quartiers_included.map((quartier) => (
                            <span
                              key={quartier.id}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {quartier.name}
                              {quartier.is_special && <span className="ml-1 text-yellow-600">⭐</span>}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create Zone Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 shadow-xl w-full max-w-md">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Créer une Zone Tarifaire</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nom de la zone</label>
                <Input
                  type="text"
                  placeholder="Ex: Zone Centre-ville"
                  value={newZoneName}
                  onChange={(e) => setNewZoneName(e.target.value)}
                  disabled={createZoneMutation.isPending}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <Input
                  type="text"
                  placeholder="Description de la zone tarifaire"
                  value={newZoneDescription}
                  onChange={(e) => setNewZoneDescription(e.target.value)}
                  disabled={createZoneMutation.isPending}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateModal(false)
                  setNewZoneName("")
                  setNewZoneDescription("")
                }}
                disabled={createZoneMutation.isPending}
              >
                Annuler
              </Button>
              <Button
                onClick={handleCreateZone}
                className="bg-green-600 hover:bg-green-700"
                disabled={createZoneMutation.isPending}
              >
                {createZoneMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Création...
                  </>
                ) : (
                  "Créer la Zone"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Commune Modal */}
      {showAddCommuneModal && selectedZone && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 shadow-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Ajouter une Commune à "{selectedZone.name}"</h3>

            {/* Commune Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Sélectionner une commune</label>
              <select
                className="w-full p-2 border border-gray-300 rounded-md"
                value={selectedCommune?.commune_id || ""}
                onChange={(e) => {
                  const commune = communes.find((c) => c.commune_id === e.target.value)
                  setSelectedCommune(commune || null)

                  if (commune && selectedZone) {
                    // Find if this commune is already in the zone
                    const existingCommuneInZone = selectedZone.communes_and_quartiers.find(
                      (zoneCommune) => zoneCommune.commune_id === commune.commune_id,
                    )

                    if (existingCommuneInZone) {
                      // Pre-select the quartiers that are already in the zone
                      setSelectedQuartiers(existingCommuneInZone.quartiers_included)
                    } else {
                      // No existing quartiers, start with empty selection
                      setSelectedQuartiers([])
                    }
                  } else {
                    setSelectedQuartiers([])
                  }
                }}
                disabled={addCommuneMutation.isPending}
              >
                <option value="">Choisir une commune...</option>
                {communes.map((commune) => (
                  <option key={commune.commune_id} value={commune.commune_id}>
                    {commune.name} ({commune.quartiers.length} quartiers)
                  </option>
                ))}
              </select>
            </div>

            {/* Quartiers Selection */}
            {selectedCommune && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Sélectionner les quartiers ({selectedQuartiers.length} sélectionné
                  {selectedQuartiers.length !== 1 ? "s" : ""})
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto border border-gray-200 rounded-md p-3">
                  {selectedCommune.quartiers.map((quartier) => {
                    const isSelected = selectedQuartiers.find((q) => q.id === quartier.id)
                    return (
                      <label
                        key={quartier.id}
                        className={`flex items-center p-2 rounded cursor-pointer transition-colors ${
                          isSelected ? "bg-blue-100 border-blue-300" : "bg-gray-50 hover:bg-gray-100"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={!!isSelected}
                          onChange={() => handleQuartierToggle(quartier)}
                          className="mr-2"
                          disabled={addCommuneMutation.isPending}
                        />
                        <span className="text-sm">
                          {quartier.name}
                          {quartier.is_special && <span className="ml-1 text-yellow-600">⭐</span>}
                        </span>
                      </label>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddCommuneModal(false)
                  setSelectedCommune(null)
                  setSelectedQuartiers([])
                }}
                disabled={addCommuneMutation.isPending}
              >
                Annuler
              </Button>
              <Button
                onClick={handleAddCommune}
                className="bg-blue-600 hover:bg-blue-700"
                disabled={addCommuneMutation.isPending || !selectedCommune || selectedQuartiers.length === 0}
              >
                {addCommuneMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Ajout...
                  </>
                ) : (
                  "Ajouter à la Zone"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ZonePairsTab component for managing zone pair pricing
const ZonePairsTab = () => {
  const [selectedPair, setSelectedPair] = useState<ZonePair | null>(null)
  const [priceValue, setPriceValue] = useState("")
  const [showPriceModal, setShowPriceModal] = useState(false)

  const queryClient = useQueryClient()
  const { toast } = useToast()

  // Fetch zone pairs query
  const {
    data: zonePairs = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["zone-pairs"],
    queryFn: fetchZonePairs,
  })

  // Generate zone pairs mutation
  const generatePairsMutation = useMutation({
    mutationFn: generateZonePairs,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["zone-pairs"] })
      toast({
        title: "Paires générées",
        description: "Les paires de zones ont été générées/synchronisées avec succès.",
      })
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de générer les paires de zones. Veuillez réessayer.",
        variant: "destructive",
      })
      console.error("Error generating zone pairs:", error)
    },
  })

  // Update zone pair price mutation
  const updatePriceMutation = useMutation({
    mutationFn: updateZonePairPrice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["zone-pairs"] })
      toast({
        title: "Prix mis à jour",
        description: "Le prix de la paire de zones a été mis à jour avec succès.",
      })
      setShowPriceModal(false)
      setSelectedPair(null)
      setPriceValue("")
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le prix. Veuillez réessayer.",
        variant: "destructive",
      })
      console.error("Error updating zone pair price:", error)
    },
  })

  const handleUpdatePrice = (pair: ZonePair) => {
    setSelectedPair(pair)
    setPriceValue(pair.price_value.toString())
    setShowPriceModal(true)
  }

  const handleSavePrice = () => {
    if (!selectedPair || !priceValue.trim()) {
      return
    }

    const price = Number.parseFloat(priceValue)
    if (isNaN(price) || price <= 0) {
      toast({
        title: "Erreur",
        description: "Veuillez entrer un prix valide.",
        variant: "destructive",
      })
      return
    }

    updatePriceMutation.mutate({
      delivery_price_zone_pair_id: selectedPair.delivery_price_zone_pair_id,
      price_value: price,
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#2B015F]" />
        <span className="ml-2 text-gray-600">Chargement des paires de zones...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-red-600 mb-4">
          <span className="font-medium">Erreur de chargement</span>
        </div>
        <p className="text-gray-600 mb-4">Impossible de charger les paires de zones.</p>
        <Button onClick={() => queryClient.invalidateQueries({ queryKey: ["zone-pairs"] })}>Réessayer</Button>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-[#2B015F]">Tarification par Paires de Zones</h2>
        <Button
          onClick={() => generatePairsMutation.mutate()}
          className="bg-green-600 hover:bg-green-700"
          disabled={generatePairsMutation.isPending}
        >
          {generatePairsMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Génération...
            </>
          ) : (
            <>
              <DollarSign className="w-4 h-4 mr-2" />
              {zonePairs.length > 0 ? "Synchroniser les Paires" : "Générer les Paires"}
            </>
          )}
        </Button>
      </div>

      {zonePairs.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <DollarSign className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium mb-2">Aucune paire de zones</p>
          <p className="text-sm mb-4">Générez les paires de zones pour commencer la tarification.</p>
          <Button
            onClick={() => generatePairsMutation.mutate()}
            className="bg-green-600 hover:bg-green-700"
            disabled={generatePairsMutation.isPending}
          >
            {generatePairsMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Génération...
              </>
            ) : (
              "Générer les Paires"
            )}
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 text-blue-800">
              <DollarSign className="h-5 w-5" />
              <span className="font-medium">
                {zonePairs.length} paire{zonePairs.length !== 1 ? "s" : ""} de zones configurée
                {zonePairs.length !== 1 ? "s" : ""}
              </span>
            </div>
            <p className="text-blue-700 text-sm mt-1">
              Cliquez sur "Synchroniser les Paires" pour ajouter de nouvelles paires si des zones ont été créées.
            </p>
          </div>

          {zonePairs.map((pair) => (
            <div
              key={pair.delivery_price_zone_pair_id}
              className="flex items-center justify-between p-4 border rounded-lg shadow-sm bg-white hover:shadow-md transition-all duration-200"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-gray-600">→</span>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800">{pair.name}</h4>
                    <p className="text-sm text-gray-500">
                      Créée le {new Date(pair.created_at).toLocaleDateString("fr-FR")}
                      {pair.updated_at !== pair.created_at && (
                        <span className="ml-2 text-blue-600">
                          • Modifiée le {new Date(pair.updated_at).toLocaleDateString("fr-FR")}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-lg font-semibold text-green-600">
                    ${pair.price_value.toFixed(2)} {pair.price_currency}
                  </p>
                  <p className="text-xs text-gray-500">Prix configuré</p>
                </div>

                <Button
                  onClick={() => handleUpdatePrice(pair)}
                  className="bg-[#2B015F] hover:bg-[#2B015F]/90"
                  size="sm"
                >
                  Modifier Prix
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Price Update Modal */}
      {showPriceModal && selectedPair && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 shadow-xl w-full max-w-md">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Modifier le prix pour "{selectedPair.name}"</h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Prix en USD</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  className="pl-8"
                  placeholder="0.00"
                  value={priceValue}
                  onChange={(e) => setPriceValue(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      handleSavePrice()
                    }
                  }}
                  disabled={updatePriceMutation.isPending}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Prix actuel: ${selectedPair.price_value.toFixed(2)} {selectedPair.price_currency}
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowPriceModal(false)
                  setSelectedPair(null)
                  setPriceValue("")
                }}
                disabled={updatePriceMutation.isPending}
              >
                Annuler
              </Button>
              <Button
                onClick={handleSavePrice}
                className="bg-[#2B015F] hover:bg-[#2B015F]/90"
                disabled={updatePriceMutation.isPending}
              >
                {updatePriceMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Sauvegarde...
                  </>
                ) : (
                  "Sauvegarder"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
