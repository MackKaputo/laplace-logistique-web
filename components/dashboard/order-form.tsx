"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Package, FileText, DollarSign, MapPin, Edit2, Plus } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useState, useEffect } from "react"
import DatePicker from "react-datepicker"
//@ts-ignore
import "react-datepicker/dist/react-datepicker.css"

// Add mobile detection hook
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkDevice = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkDevice()
    window.addEventListener("resize", checkDevice)

    return () => window.removeEventListener("resize", checkDevice)
  }, [])

  return isMobile
}

interface OrderFormProps {
  formType: "colis" | "courier" | "labo"
  pickupAddress: string
  setPickupAddress: (address: string, coordinates?: { lat: number; lng: number }) => void
  pickupAddressReference: string
  setPickupAddressReference: (reference: string) => void
  dropoffAddress: string
  setDropoffAddress: (address: string, coordinates?: { lat: number; lng: number }) => void
  dropoffCountryCode: string
  setDropoffCountryCode: (code: string) => void
  recipientName: string
  setRecipientName: (name: string) => void
  recipientPhone: string // Add recipient phone prop
  setRecipientPhone: (phone: string) => void // Add recipient phone setter prop
  itemType: string
  setItemType: (type: string) => void
  packageDescription: string
  setPackageDescription: (description: string) => void
  packageValueCurrency: string
  setPackageValueCurrency: (currency: string) => void
  packageValueAmount: string
  setPackageValueAmount: (amount: string) => void
  packageWeight: string
  setPackageWeight: (weight: string) => void
  packageWeightUnit: string
  setPackageWeightUnit: (unit: string) => void
  isSubmitting: boolean
  onSubmit: (e: React.FormEvent) => void
  onCancel: () => void
  getEstimatedPrice: (type: string) => string
  getCurrentLocation: () => void
  onPriceCalculated: (price: number, token: string) => void
  pickupCoordinates?: { lat: number; lng: number }
  dropoffCoordinates?: { lat: number; lng: number }
  pickupDate: Date | null
  setPickupDate: (date: Date | null) => void
  preferredDeliveryDate: Date | null
  setPreferredDeliveryDate: (date: Date | null) => void
  minPickupDate: Date
  minPreferredDeliveryDate: Date
  selectedCommuneId: string
  setSelectedCommuneId: (id: string) => void
  selectedQuartierId: string
  setSelectedQuartierId: (id: string) => void
  selectedSenderCommuneId: string
  setSelectedSenderCommuneId: (id: string) => void
  selectedSenderQuartierId: string
  setSelectedSenderQuartierId: (id: string) => void
  recipients: any[]
  setRecipients: (recipients: any[]) => void
  hasAdditionalRecipients: boolean
  setHasAdditionalRecipients: (has: boolean) => void
  additionalRecipients: Array<{
    id: string
    name: string
    phone_number: string
  }>
  addAdditionalRecipient: () => void
  removeAdditionalRecipient: (id: string) => void
  updateAdditionalRecipient: (id: string, field: "name" | "phone_number", value: string) => void
  currentStep?: number
  favoritePlaces: any[]
  loadingFavorites: boolean
  fetchFavoritePlaces: () => void
  onFavoritePlaceSelect: (favoritePlace: any) => void
  isDeliveryPriceIncluded: boolean
  setIsDeliveryPriceIncluded: (included: boolean) => void
  onVehicleStepChange?: (isOnVehicleStep: boolean) => void
  onVehicleTypeChange?: (vehicleType: "motorbike" | "tricycle") => void
  onSizeWeightChange?: (sizeWeight: string | null) => void
  customerId?: string
}

export function OrderForm({
  formType,
  pickupAddress,
  setPickupAddress,
  pickupAddressReference,
  setPickupAddressReference,
  dropoffAddress,
  setDropoffAddress,
  dropoffCountryCode,
  setDropoffCountryCode,
  recipientName,
  setRecipientName,
  recipientPhone,
  setRecipientPhone,
  itemType,
  setItemType,
  packageDescription,
  setPackageDescription,
  packageValueCurrency,
  setPackageValueCurrency,
  packageValueAmount,
  setPackageValueAmount,
  packageWeight,
  setPackageWeight,
  packageWeightUnit,
  setPackageWeightUnit,
  isSubmitting,
  onSubmit,
  onCancel,
  getEstimatedPrice,
  getCurrentLocation,
  onPriceCalculated,
  pickupCoordinates,
  dropoffCoordinates,
  pickupDate,
  setPickupDate,
  preferredDeliveryDate,
  setPreferredDeliveryDate,
  minPickupDate,
  minPreferredDeliveryDate,
  selectedCommuneId,
  setSelectedCommuneId,
  selectedQuartierId,
  setSelectedQuartierId,
  selectedSenderCommuneId,
  setSelectedSenderCommuneId,
  selectedSenderQuartierId,
  setSelectedSenderQuartierId,
  recipients,
  setRecipients,
  hasAdditionalRecipients,
  setHasAdditionalRecipients,
  isDeliveryPriceIncluded,
  setIsDeliveryPriceIncluded,
  additionalRecipients,
  addAdditionalRecipient,
  removeAdditionalRecipient,
  updateAdditionalRecipient,
  currentStep = 1,
  favoritePlaces,
  loadingFavorites,
  fetchFavoritePlaces,
  onFavoritePlaceSelect,
  onVehicleStepChange,
  onVehicleTypeChange,
  onSizeWeightChange,
  customerId,
}: OrderFormProps) {
  const [communes, setCommunes] = useState<any[]>([])
  const [quartiers, setQuartiers] = useState<any[]>([])
  const [hasSetCoordinates, setHasSetCoordinates] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [showFavoritesDropdown, setShowFavoritesDropdown] = useState(false)

  const [showPickupLocationModal, setShowPickupLocationModal] = useState(false)
  const [selectedFavoritePlace, setSelectedFavoritePlace] = useState<any>(null)
  const [hasAutoSelected, setHasAutoSelected] = useState(false)

  const [modalTab, setModalTab] = useState<"select" | "new">("select")
  const [newAddressForm, setNewAddressForm] = useState({
    address: "",
    reference: "",
    communeId: "",
    quartierId: "",
  })
  const [newAddressQuartiers, setNewAddressQuartiers] = useState<any[]>([])

  const [communeError, setCommuneError] = useState<string>("")
  const [recipientCommuneErrors, setRecipientCommuneErrors] = useState<Record<number, string>>({})
  const [descriptionError, setDescriptionError] = useState<string>("")

  // Helper functions for datetime-local conversion
  const dateToDatetimeLocal = (date: Date | null): string => {
    if (!date) return ""
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    const hours = String(date.getHours()).padStart(2, "0")
    const minutes = String(date.getMinutes()).padStart(2, "0")
    return `${year}-${month}-${day}T${hours}:${minutes}`
  }

  const datetimeLocalToDate = (value: string): Date | null => {
    if (!value) return null
    return new Date(value)
  }

  // Add these state variables
  const [estimatedPrice, setEstimatedPrice] = useState<number | null>(null)
  const [deliveryPriceToken, setDeliveryPriceToken] = useState<string>("")
  const [isPriceFetching, setIsPriceFetching] = useState(false)
  const [selectedVehicleType, setSelectedVehicleType] = useState<"motorbike" | "tricycle">("motorbike")
  const [selectedSizeWeight, setSelectedSizeWeight] = useState<string | null>(null)
  const [priceError, setPriceError] = useState<string | null>(null)
  const [apiBaseUrl, setApiBaseUrl] = useState<string>("")
  const [availableSenderQuartiers, setAvailableSenderQuartiers] = useState<any[]>([])

  // Add state for dropoff reference (separate from pickup reference)
  const [dropoffAddressReference, setDropoffAddressReference] = useState<string>("")

  const communeId = selectedCommuneId
  const quartierId = selectedQuartierId

  // Determine form-specific labels and options
  const formConfig = {
    colis: {
      pickupLabel: "Où récupérer votre colis?",
      dropoffLabel: "Où livrer votre colis?",
      referenceLabel: "Numéro de l'adresse et Référence",
      typeLabel: "Type de colis",
      typeOptions: [
        { value: "small-package", label: "Petit colis" },
        { value: "medium-package", label: "Colis moyen" },
        { value: "large-package", label: "Grand colis" },
        { value: "fragile", label: "Article fragile" },
      ],
    },
    courier: {
      pickupLabel: "Où récupérer votre courier?",
      dropoffLabel: "Où livrer votre courier?",
      referenceLabel: "Numéro de l'adresse et Référence",
      typeLabel: "Type de document",
      typeOptions: [
        { value: "document", label: "Document standard" },
        { value: "envelope", label: "Enveloppe" },
        { value: "large-envelope", label: "Grande enveloppe" },
        { value: "confidential", label: "Document confidentiel" },
      ],
    },
    labo: {
      pickupLabel: "Où récupérer votre produit médical?",
      dropoffLabel: "Où livrer votre produit médical?",
      referenceLabel: "Référence médicale",
      typeLabel: "Type de produit médical",
      typeOptions: [
        { value: "blood", label: "Sang" },
        { value: "urine", label: "Urine" },
        { value: "tissue", label: "Tissu" },
        { value: "csf", label: "Liquide céphalo-rachidien" },
        { value: "medicine", label: "Médicament" },
        { value: "equipment", label: "Équipement médical" },
        { value: "other", label: "Autre" },
      ],
    },
  }

  const config = formConfig[formType]
  const idPrefix = formType === "colis" ? "" : `-${formType}`

  // Get API base URL on component mount
  useEffect(() => {
    const baseUrl = process.env.NEXT_PUBLIC_API_SERVER_BASE_URL as string
    setApiBaseUrl(baseUrl)
    console.log("API Base URL:", baseUrl)
  }, [])

  // Fetch communes data
  useEffect(() => {
    const fetchCommunes = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/deliveries/communes`)
        if (response.ok) {
          const data = await response.json()
          setCommunes(data.data || [])
        }
      } catch (error) {
        console.error("Error fetching communes:", error)
      }
    }

    if (apiBaseUrl) {
      fetchCommunes()
    }
  }, [apiBaseUrl])

  // Update available quartiers when commune changes
  useEffect(() => {
    if (communeId) {
      const selectedCommune = communes.find((c) => c.commune_id === communeId)
      setQuartiers(selectedCommune?.quartiers || [])
    } else {
      setQuartiers([])
    }
  }, [communeId, communes])

  useEffect(() => {
    if (newAddressForm.communeId) {
      const selectedCommune = communes.find((c) => c.commune_id === newAddressForm.communeId)
      setNewAddressQuartiers(selectedCommune?.quartiers || [])
    } else {
      setNewAddressQuartiers([])
    }
  }, [newAddressForm.communeId, communes])

  useEffect(() => {
    if (!hasAutoSelected && favoritePlaces.length > 0 && !pickupAddress) {
      const firstFavorite = favoritePlaces[0]
      setSelectedFavoritePlace(firstFavorite)
      onFavoritePlaceSelect(firstFavorite)
      setHasAutoSelected(true)
    }
  }, [favoritePlaces, hasAutoSelected, pickupAddress])

  useEffect(() => {
    fetchFavoritePlaces()
  }, [])

  // Debug function to verify state updates
  const handleAddressChange = (
    type: "pickup" | "dropoff",
    address: string,
    coordinates?: { lat: number; lng: number },
  ) => {
    console.log(`${type} address changed:`, address, coordinates)
    if (type === "pickup") {
      setPickupAddress(address, coordinates)
    } else {
      setDropoffAddress(address, coordinates)
    }
  }

  // Functions to manage multiple recipients
  const addRecipient = () => {
    const newRecipient = {
      id: Date.now(),
      name: "",
      address: "",
      reference: "",
      phone: "",
      coordinates: undefined,
      preferredDeliveryDate: null,
      communeId: "",
      quartierId: "",
    }
    setRecipients([...recipients, newRecipient])
  }

  const removeRecipient = (id: number) => {
    if (recipients.length > 1) {
      setRecipients(recipients.filter((recipient) => recipient.id !== id))
    }
  }

  const updateRecipient = (id: number, field: string, value: any) => {
    setRecipients(recipients.map((recipient) => (recipient.id === id ? { ...recipient, [field]: value } : recipient)))
  }

  // Function to fetch price from API
  const fetchPrice = async () => {
    const currentCommuneId = selectedCommuneId
    const currentQuartierId = selectedQuartierId
    const currentSenderCommuneId = selectedSenderCommuneId
    const currentSenderQuartierId = selectedSenderQuartierId

    if (!currentSenderCommuneId || !currentSenderQuartierId || !currentCommuneId || !currentQuartierId) {
      console.error("Missing commune/quartier for price calculation")
      setPriceError("Commune et quartier manquants pour le calcul du prix")
      return
    }

    setIsPriceFetching(true)
    setPriceError(null)

    // Map form type to delivery_type
    const deliveryTypeMap: Record<string, string> = {
      colis: "package",
      courier: "courier",
      labo: "medical",
    }

    const deliveryType = deliveryTypeMap[formType] || "package"
    const baseUrl = apiBaseUrl

    try {
      console.log("Fetching price with commune/quartier:", {
        senderCommuneId: currentSenderCommuneId,
        senderQuartierId: currentSenderQuartierId,
        recipientCommuneId: currentCommuneId,
        recipientQuartierId: currentQuartierId,
        deliveryType,
        baseUrl,
      })

      // Build URL with vehicle_type and size_weight_category
      let url = `${baseUrl}/deliveries/price?delivery_type=${deliveryType}&commune_id_sender=${currentSenderCommuneId}&quartier_id_sender=${currentSenderQuartierId}&commune_id_recipient=${currentCommuneId}&quartier_id_recipient=${currentQuartierId}&vehicle_type=${selectedVehicleType}`
      
      if (selectedVehicleType === "tricycle" && selectedSizeWeight) {
        url += `&size_weight_category=${selectedSizeWeight}`
      }

      if (customerId) {
        url += `&customer_id=${customerId}`
      }

      console.log("Price API URL:", url)

      const response = await fetch(url)
      const responseText = await response.text()
      console.log("Raw API response:", responseText)

      let data
      try {
        data = JSON.parse(responseText)
      } catch (e) {
        console.error("Error parsing JSON:", e)
        throw new Error("Invalid response format")
      }

      console.log("Parsed API response:", data)

      if (data.success) {
        setEstimatedPrice(data.data.price_cdf)
        setDeliveryPriceToken(data.data.delivery_price_token)

        // Notify parent component
        if (onPriceCalculated) {
          onPriceCalculated(data.data.price, data.data.delivery_price_token)
        }
      } else {
        setPriceError(data.message || "Erreur lors du calcul du prix")
      }
    } catch (error) {
      console.error("Error fetching price:", error)
      setPriceError("Impossible de calculer le prix. Veuillez réessayer.")
    } finally {
      setIsPriceFetching(false)
    }
  }

  // Test with hardcoded coordinates
  const testPriceCalculation = async () => {
    setIsPriceFetching(true)
    setPriceError(null)

    const testPickup = { lat: -4.305155, lng: 15.292899 }
    const testDropoff = { lat: -4.323904, lng: 15.30634 }

    // Map form type to delivery_type
    const deliveryTypeMap: Record<string, string> = {
      colis: "package",
      courier: "courier",
      labo: "medical",
    }

    const deliveryType = deliveryTypeMap[formType] || "package"
    const baseUrl = apiBaseUrl

    try {
      console.log("TEST: Fetching price with hardcoded coordinates")

      const url = `${baseUrl}/deliveries/price?delivery_type=${deliveryType}&pickup_address_longitude=${testPickup.lng}&pickup_address_latitude=${testPickup.lat}&recipient_address_longitude=${testDropoff.lng}&recipient_address_latitude=${testDropoff.lat}`

      console.log("TEST: Price API URL:", url)

      const response = await fetch(url)
      const responseText = await response.text()
      console.log("TEST: Raw API response:", responseText)

      let data
      try {
        data = JSON.parse(responseText)
      } catch (e) {
        console.error("TEST: Error parsing JSON:", e)
        throw new Error("Invalid response format")
      }

      console.log("TEST: Parsed API response:", data)

      if (data.success) {
        setEstimatedPrice(data.data.price)
        setDeliveryPriceToken(data.data.delivery_price_token)

        // Notify parent component
        if (onPriceCalculated) {
          onPriceCalculated(data.data.price, data.data.delivery_price_token)
        }
      } else {
        setPriceError(data.message || "Erreur lors du calcul du prix")
      }
    } catch (error) {
      console.error("TEST: Error fetching price:", error)
      setPriceError("Impossible de calculer le prix. Veuillez réessayer.")
    } finally {
      setIsPriceFetching(false)
    }
  }

  // Vehicle is fully selected when motorbike is chosen OR tricycle + size is chosen
  const isVehicleSelected = selectedVehicleType === "motorbike" || (selectedVehicleType === "tricycle" && selectedSizeWeight !== null)

  // Notify parent: hide submit button until vehicle is fully selected
  useEffect(() => {
    onVehicleStepChange?.(!isVehicleSelected)
  }, [isVehicleSelected, onVehicleStepChange])

  // Notify parent of vehicle type and size weight changes for DTO
  useEffect(() => {
    onVehicleTypeChange?.(selectedVehicleType)
  }, [selectedVehicleType, onVehicleTypeChange])

  useEffect(() => {
    onSizeWeightChange?.(selectedSizeWeight)
  }, [selectedSizeWeight, onSizeWeightChange])

  // Check for coordinates/commune/quartier changes and fetch price if available
  useEffect(() => {
    const currentCommuneId = selectedCommuneId
    const currentQuartierId = selectedQuartierId
    const currentSenderCommuneId = selectedSenderCommuneId
    const currentSenderQuartierId = selectedSenderQuartierId

    console.log("Commune/quartier updated:", {
      senderCommuneId: currentSenderCommuneId,
      senderQuartierId: currentSenderQuartierId,
      recipientCommuneId: currentCommuneId,
      recipientQuartierId: currentQuartierId,
    })

    if (currentSenderCommuneId && currentSenderQuartierId && currentCommuneId && currentQuartierId) {
      console.log("Required data available, fetching price...")
      fetchPrice()
    }
  }, [selectedCommuneId, selectedQuartierId, selectedSenderCommuneId, selectedSenderQuartierId, selectedVehicleType, selectedSizeWeight])

  // Custom submit handler to build the correct DTO structure
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Form submitted")

    let hasError = false

    if (formType === "courier") {
      // Validate each recipient has a commune selected
      const errors: Record<number, string> = {}
      recipients.forEach((recipient) => {
        if (!recipient.communeId) {
          errors[recipient.id] = "Veuillez sélectionner une commune"
          hasError = true
        }
      })
      setRecipientCommuneErrors(errors)
    } else {
      // Validate single recipient commune
      if (!selectedCommuneId) {
        setCommuneError("Veuillez sélectionner une commune avant de soumettre")
        hasError = true
      }
    }

    // Validate package description is filled
    if (!packageDescription.trim()) {
      setDescriptionError("La description du colis est obligatoire")
      hasError = true
    } else {
      setDescriptionError("")
    }

    // If there are validation errors, don't submit
    if (hasError) {
      return
    }

    if (formType === "courier") {
      const customEvent = {
        ...e,
        preventDefault: () => {},
        target: {
          ...e.target,
          recipients: recipients.map((recipient) => ({
            recipient_name: recipient.name,
            recipient_phone: `${dropoffCountryCode}${recipient.phone}`,
            recipient_address_line: recipient.address,
            recipient_address_second_line: recipient.reference,
            recipient_address_city: "Kinshasa",
            recipient_address_longitude: recipient.coordinates?.lng || -4.4419,
            recipient_address_latitude: recipient.coordinates?.lat || 15.2663,
            recipient_address_country: "DRC",
            preferred_delivery_date: recipient.preferredDeliveryDate ? recipient.preferredDeliveryDate.getTime() : null,
            commune_id: recipient.communeId || "",
            quartier_id: recipient.quartierId || "",
          })),
        },
      }

      onSubmit(customEvent as React.FormEvent)
    } else {
      onSubmit(e)
    }
  }

  // Update available sender quartiers when sender commune changes
  useEffect(() => {
    if (selectedSenderCommuneId) {
      const selectedCommune = communes.find((c) => c.commune_id === selectedSenderCommuneId)
      setAvailableSenderQuartiers(selectedCommune?.quartiers || [])
    } else {
      setAvailableSenderQuartiers([])
    }
  }, [selectedSenderCommuneId, communes])

  const senderCommuneId = selectedSenderCommuneId
  const senderQuartierId = selectedSenderQuartierId

  const [showDeliveryCalendar, setShowDeliveryCalendar] = useState(false)

  // Size/weight category options for tricycle
  const sizeWeightOptions = [
    { value: "small", label: "Petit", description: "0-15 kg", icon: "S" },
    { value: "medium_light", label: "Moyen léger", description: "15-25 kg", icon: "M" },
    { value: "medium_heavy", label: "Moyen lourd", description: "25-35 kg", icon: "M+" },
    { value: "large_light", label: "Grand léger", description: "40-75 kg", icon: "L" },
    { value: "large_heavy", label: "Grand lourd", description: "75-100 kg", icon: "XL" },
  ]

  const handleFavoritePlaceSelection = (place: any) => {
    setSelectedFavoritePlace(place)
    onFavoritePlaceSelect(place)
    setShowPickupLocationModal(false)
  }

  const handleNewAddressSubmit = () => {
    if (!newAddressForm.address || !newAddressForm.communeId || !newAddressForm.quartierId) {
      return
    }

    const newPlace = {
      favorite_place_id: `temp-${Date.now()}`,
      name: "Nouvelle adresse",
      address_line: newAddressForm.address,
      address_second_line: newAddressForm.reference,
      commune_id: newAddressForm.communeId,
      quartier_id: newAddressForm.quartierId,
      // Don't include location/coordinates since we don't have them for manually entered addresses
    }

    setSelectedFavoritePlace(newPlace)
    onFavoritePlaceSelect(newPlace)
    setShowPickupLocationModal(false)

    // Reset form
    setNewAddressForm({
      address: "",
      reference: "",
      communeId: "",
      quartierId: "",
    })
    setModalTab("select")
  }

  const handleVehicleSelect = (type: "motorbike" | "tricycle") => {
    setSelectedVehicleType(type)
    if (type === "motorbike") {
      setSelectedSizeWeight(null)
    } else {
      setSelectedSizeWeight("small")
    }
  }

  const handleSizeWeightSelect = (size: string) => {
    setSelectedSizeWeight(size)
  }

  return (
    <form id="order-form" onSubmit={handleFormSubmit} className="space-y-6" noValidate>
      {/* Step 1: Pickup (Sender) Section */}
      <div className="bg-purple-50/30 p-4 rounded-lg border border-purple-100">
        <h3 className="text-lg font-medium text-[#2B015F] mb-4 flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          Informations de Ramassage
        </h3>
        <div className="space-y-4">
          {selectedFavoritePlace ? (
            <div>
              <Label>Adresse de ramassage</Label>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-white border border-gray-200 rounded-md p-3 flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-purple-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900">{selectedFavoritePlace.name}</p>

                    {selectedFavoritePlace.address_second_line && (
                      <p className="text-xs text-gray-500 mt-1">{selectedFavoritePlace.address_second_line}</p>
                    )}
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                        {communes.find((c) => c.commune_id === selectedFavoritePlace.commune_id)?.name || "Commune"}
                      </span>
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                        {communes
                          .find((c) => c.commune_id === selectedFavoritePlace.commune_id)
                          ?.quartiers.find((q: any) => q.id.toString() === selectedFavoritePlace.quartier_id)?.name ||
                          "Quartier"}
                      </span>
                    </div>
                  </div>
                </div>
                <Dialog open={showPickupLocationModal} onOpenChange={setShowPickupLocationModal}>
                  <DialogTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="flex-shrink-0 border-purple-200 hover:bg-purple-50 bg-transparent"
                    >
                      <Edit2 className="h-4 w-4 text-purple-600" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Adresse de ramassage</DialogTitle>
                    </DialogHeader>

                    <div className="flex gap-2 border-b mb-4">
                      <button
                        type="button"
                        onClick={() => setModalTab("select")}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                          modalTab === "select"
                            ? "border-purple-600 text-purple-600"
                            : "border-transparent text-gray-600 hover:text-gray-900"
                        }`}
                      >
                        Sélectionner une adresse
                      </button>
                      <button
                        type="button"
                        onClick={() => setModalTab("new")}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                          modalTab === "new"
                            ? "border-purple-600 text-purple-600"
                            : "border-transparent text-gray-600 hover:text-gray-900"
                        }`}
                      >
                        Nouvelle adresse
                      </button>
                    </div>

                    {modalTab === "select" ? (
                      <div className="space-y-3">
                        {loadingFavorites ? (
                          <div className="text-center py-8">
                            <div className="animate-spin h-8 w-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-3"></div>
                            <p className="text-gray-600">Chargement des adresses...</p>
                          </div>
                        ) : favoritePlaces.length > 0 ? (
                          favoritePlaces.map((place) => (
                            <button
                              key={place.favorite_place_id}
                              type="button"
                              onClick={() => handleFavoritePlaceSelection(place)}
                              className={`w-full text-left p-4 rounded-lg border-2 transition-all hover:border-purple-300 hover:bg-purple-50 ${
                                selectedFavoritePlace?.favorite_place_id === place.favorite_place_id
                                  ? "border-purple-500 bg-purple-50"
                                  : "border-gray-200"
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <MapPin
                                  className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
                                    selectedFavoritePlace?.favorite_place_id === place.favorite_place_id
                                      ? "text-purple-600"
                                      : "text-gray-400"
                                  }`}
                                />
                                <div className="flex-1">
                                  <p className="font-medium text-gray-900">{place.name}</p>
                                  <p className="text-sm text-gray-600 mt-1">{place.address_line}</p>
                                  {place.address_second_line && (
                                    <p className="text-xs text-gray-500 mt-1">{place.address_second_line}</p>
                                  )}
                                  <div className="flex flex-wrap gap-2 mt-2">
                                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                      {communes.find((c) => c.commune_id === place.commune_id)?.name || "Commune"}
                                    </span>
                                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                      {communes
                                        .find((c) => c.commune_id === place.commune_id)
                                        ?.quartiers.find((q: any) => q.id.toString() === place.quartier_id)?.name ||
                                        "Quartier"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </button>
                          ))
                        ) : (
                          <div className="text-center py-8">
                            <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-600 mb-4">Aucune adresse de ramassage enregistrée</p>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setModalTab("new")}
                              className="border-purple-200 text-purple-600 hover:bg-purple-50 bg-transparent"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Ajouter une adresse
                            </Button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="new-address-combined">
                            Adresse de ramassage, Numéro de l'adresse et Référence
                          </Label>
                          <Input
                            id="new-address-combined"
                            placeholder="Ex: Avenue de la Paix, numéro 25, à côté de l'école Saint Joseph"
                            value={`${newAddressForm.address}${newAddressForm.reference ? `, ${newAddressForm.reference}` : ""}`}
                            onChange={(e) => {
                              const value = e.target.value
                              setNewAddressForm((prev) => ({ ...prev, address: value, reference: "" }))
                            }}
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="new-commune">Commune d'expédition</Label>
                            <Select
                              value={newAddressForm.communeId}
                              onValueChange={(value) =>
                                setNewAddressForm((prev) => ({ ...prev, communeId: value, quartierId: "" }))
                              }
                            >
                              <SelectTrigger id="new-commune">
                                <SelectValue placeholder="Sélectionnez la commune" />
                              </SelectTrigger>
                              <SelectContent>
                                {communes.length === 0 ? (
                                  <SelectItem value="loading" disabled>
                                    Chargement des communes...
                                  </SelectItem>
                                ) : (
                                  communes.map((commune) => (
                                    <SelectItem key={commune.commune_id} value={commune.commune_id}>
                                      {commune.name}
                                    </SelectItem>
                                  ))
                                )}
                              </SelectContent>
                            </Select>
                          </div>

                          {newAddressForm.communeId && (
                            <div className="transition-all duration-300 ease-in-out">
                              <Label htmlFor="new-quartier">Quartier d'expédition</Label>
                              <Select
                                value={newAddressForm.quartierId}
                                onValueChange={(value) => setNewAddressForm((prev) => ({ ...prev, quartierId: value }))}
                              >
                                <SelectTrigger id="new-quartier">
                                  <SelectValue placeholder="Sélectionnez le quartier" />
                                </SelectTrigger>
                                <SelectContent>
                                  {newAddressQuartiers.length === 0 ? (
                                    <SelectItem value="no-quartiers" disabled>
                                      Aucun quartier disponible pour cette commune
                                    </SelectItem>
                                  ) : (
                                    newAddressQuartiers.map((quartier) => (
                                      <SelectItem key={quartier.id} value={quartier.id.toString()}>
                                        {quartier.name}
                                      </SelectItem>
                                    ))
                                  )}
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2 pt-4">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setModalTab("select")}
                            className="flex-1"
                          >
                            Annuler
                          </Button>
                          <Button
                            type="button"
                            onClick={handleNewAddressSubmit}
                            disabled={
                              !newAddressForm.address || !newAddressForm.communeId || !newAddressForm.quartierId
                            }
                            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                          >
                            Utiliser cette adresse
                          </Button>
                        </div>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label htmlFor="pickup-address-combined">Adresse de ramassage, Numéro de l'adresse et Référence</Label>
                <Input
                  id="pickup-address-combined"
                  placeholder="Ex: Avenue de la Paix, numéro 25, à côté de l'école Saint Joseph"
                  value={pickupAddress}
                  onChange={(e) => setPickupAddress(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`sender-commune${idPrefix}`}>Commune d'expédition</Label>
                  <Select value={selectedSenderCommuneId} onValueChange={setSelectedSenderCommuneId}>
                    <SelectTrigger id={`sender-commune${idPrefix}`}>
                      <SelectValue placeholder="Sélectionnez la commune" />
                    </SelectTrigger>
                    <SelectContent>
                      {communes.length === 0 ? (
                        <SelectItem value="loading" disabled>
                          Chargement des communes...
                        </SelectItem>
                      ) : (
                        communes.map((commune) => (
                          <SelectItem key={commune.commune_id} value={commune.commune_id}>
                            {commune.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                {selectedSenderCommuneId && (
                  <div className="transition-all duration-300 ease-in-out">
                    <Label htmlFor={`sender-quartier${idPrefix}`}>Quartier d'expédition</Label>
                    <Select value={selectedSenderQuartierId} onValueChange={setSelectedSenderQuartierId}>
                      <SelectTrigger id={`sender-quartier${idPrefix}`}>
                        <SelectValue placeholder="Sélectionnez le quartier" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableSenderQuartiers.length === 0 ? (
                          <SelectItem value="no-quartiers" disabled>
                            Aucun quartier disponible pour cette commune
                          </SelectItem>
                        ) : (
                          availableSenderQuartiers.map((quartier) => (
                            <SelectItem key={quartier.id} value={quartier.id.toString()}>
                              {quartier.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {favoritePlaces.length > 0 && (
                <div className="pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowPickupLocationModal(true)}
                    className="w-full border-purple-200 text-purple-600 hover:bg-purple-50 bg-transparent"
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    Choisir une adresse enregistrée
                  </Button>
                </div>
              )}
            </div>
          )}

          <div>
            <Label htmlFor={`pickup-date${idPrefix}`}>Date et heure de ramassage</Label>
            <div className="relative">
              {isMobile ? (
                <input
                  type="datetime-local"
                  id={`pickup-date${idPrefix}`}
                  value={dateToDatetimeLocal(pickupDate)}
                  onChange={(e) => {
                    const newDate = datetimeLocalToDate(e.target.value)
                    setPickupDate(newDate)
                    if (newDate && preferredDeliveryDate && newDate > preferredDeliveryDate) {
                      setPreferredDeliveryDate(null)
                    }
                  }}
                  min={dateToDatetimeLocal(new Date())}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              ) : (
                <DatePicker
                  selected={pickupDate}
                  onChange={(date) => {
                    setPickupDate(date)
                    if (date && preferredDeliveryDate && date > preferredDeliveryDate) {
                      setPreferredDeliveryDate(null)
                    }
                  }}
                  showTimeSelect
                  timeFormat="HH:mm"
                  timeIntervals={15}
                  dateFormat="dd/MM/yyyy HH:mm"
                  placeholderText="Sélectionnez la date et l'heure"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  wrapperClassName="w-full"
                  minDate={minPickupDate}
                  filterTime={(time) => {
                    const hours = time.getHours()
                    return hours >= 8 && hours <= 15
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Step 2: Dropoff (Receiver) Section */}
      <div className="bg-yellow-50/30 p-4 rounded-lg border border-yellow-100">
        <h3 className="text-lg font-medium text-[#2B015F] mb-4 flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          Informations de livraison
        </h3>

        {formType === "courier" ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-[#2B015F]">Destinataires multiples</h4>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addRecipient}
                className="bg-purple-50 hover:bg-purple-100 border-purple-200"
              >
                Ajouter destinataire
              </Button>
            </div>

            {recipients.map((recipient, index) => {
              const selectedCommune = communes.find((c) => c.commune_id === recipient.communeId)
              const availableQuartiersForRecipient = selectedCommune?.quartiers || []

              return (
                <div key={recipient.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50/30">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-medium text-[#2B015F]">Destinataire {index + 1}</h4>
                    {recipients.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeRecipient(recipient.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Supprimer
                      </Button>
                    )}
                  </div>

                  <div>
                    <Label htmlFor={`dropoff-${recipient.id}`}>
                      Adresse de livraison, Numéro de l'adresse et Référence
                    </Label>
                    <Input
                      id={`dropoff-${recipient.id}`}
                      placeholder="Ex: Avenue de la Paix, numéro 25, à côté de l'école Saint Joseph"
                      value={recipient.address}
                      onChange={(e) => updateRecipient(recipient.id, "address", e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <Label htmlFor={`commune-${recipient.id}`}>Commune</Label>
                      <Select
                        value={recipient.communeId}
                        onValueChange={(value) => {
                          console.log("Commune selected:", value, "for recipient:", recipient.id)
                          const updatedRecipients = recipients.map((r) => {
                            if (r.id === recipient.id) {
                              return { ...r, communeId: value, quartierId: "" }
                            }
                            return r
                          })
                          setRecipients(updatedRecipients)
                          setRecipientCommuneErrors((prev) => {
                            const newErrors = { ...prev }
                            delete newErrors[recipient.id]
                            return newErrors
                          })
                        }}
                      >
                        <SelectTrigger
                          id={`commune-${recipient.id}`}
                          className={recipientCommuneErrors[recipient.id] ? "border-red-500" : ""}
                        >
                          <SelectValue placeholder="Sélectionnez la commune" />
                        </SelectTrigger>
                        <SelectContent>
                          {communes.length === 0 ? (
                            <SelectItem value="loading" disabled>
                              Chargement des communes...
                            </SelectItem>
                          ) : (
                            communes.map((commune) => (
                              <SelectItem
                                key={`commune-${recipient.id}-${commune.commune_id}`}
                                value={commune.commune_id}
                              >
                                {commune.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      {recipientCommuneErrors[recipient.id] && (
                        <p className="text-red-500 text-sm mt-1">{recipientCommuneErrors[recipient.id]}</p>
                      )}
                    </div>
                    {recipient.communeId && (
                      <div className="transition-all duration-300 ease-in-out">
                        <Label htmlFor={`quartier-${recipient.id}`}>Quartier</Label>
                        <Select
                          value={recipient.quartierId}
                          onValueChange={(value) => {
                            console.log("Quartier selected:", value, "for recipient:", recipient.id)
                            const updatedRecipients = recipients.map((r) => {
                              if (r.id === recipient.id) {
                                return { ...r, quartierId: value }
                              }
                              return r
                            })
                            setRecipients(updatedRecipients)
                          }}
                        >
                          <SelectTrigger id={`quartier-${recipient.id}`}>
                            <SelectValue placeholder="Sélectionnez le quartier" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableQuartiersForRecipient.length === 0 ? (
                              <SelectItem value="no-quartiers" disabled>
                                Aucun quartier disponible pour cette commune
                              </SelectItem>
                            ) : (
                              availableQuartiersForRecipient.map((quartier: { id: number; name: string }) => (
                                <SelectItem key={quartier.id} value={quartier.id.toString()}>
                                  {quartier.name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <Label htmlFor={`recipient-name-${recipient.id}`}>Nom du destinataire</Label>
                      <Input
                        id={`recipient-name-${recipient.id}`}
                        placeholder="Nom complet du destinataire"
                        value={recipient.name}
                        onChange={(e) => updateRecipient(recipient.id, "name", e.target.value)}
                        required
                      />
                    </div>
                    <div className="flex">
                      <Select
                        value={recipient.countryCode}
                        onValueChange={(value) => updateRecipient(recipient.id, "countryCode", value)}
                      >
                        <SelectTrigger className="w-24 rounded-r-none">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="+243">+243</SelectItem>
                          <SelectItem value="+1">+1</SelectItem>
                          <SelectItem value="+33">+33</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        id={`dropoff-contact-${recipient.id}`}
                        placeholder="Numéro de téléphone"
                        className="rounded-l-none"
                        value={recipient.phone}
                        onChange={(e) => updateRecipient(recipient.id, "phone", e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <Label htmlFor={`dropoff${idPrefix}`}>Adresse de livraison, Numéro de l'adresse et Référence</Label>
              <Input
                id={`dropoff${idPrefix}`}
                placeholder="Ex: Avenue de la Paix, numéro 25, à côté de l'école Saint Joseph"
                value={dropoffAddress}
                onChange={(e) => setDropoffAddress(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor={`commune${idPrefix}`}>Commune</Label>
                <Select
                  value={communeId}
                  onValueChange={(value) => {
                    setSelectedCommuneId(value)
                    setCommuneError("")
                  }}
                >
                  <SelectTrigger id={`commune${idPrefix}`} className={communeError ? "border-red-500" : ""}>
                    <SelectValue placeholder="Sélectionnez la commune" />
                  </SelectTrigger>
                  <SelectContent>
                    {communes.map((commune) => (
                      <SelectItem key={commune.commune_id} value={commune.commune_id}>
                        {commune.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {communeError && <p className="text-red-500 text-sm mt-1">{communeError}</p>}
              </div>
              {communeId && (
                <div className="transition-all duration-300 ease-in-out">
                  <Label htmlFor={`quartier${idPrefix}`}>Quartier</Label>
                  <Select value={quartierId} onValueChange={setSelectedQuartierId}>
                    <SelectTrigger id={`quartier${idPrefix}`}>
                      <SelectValue placeholder="Sélectionnez le quartier" />
                    </SelectTrigger>
                    <SelectContent>
                      {quartiers.length === 0 ? (
                        <SelectItem value="no-quartiers" disabled>
                          Aucun quartier disponible pour cette commune
                        </SelectItem>
                      ) : (
                        quartiers.map((quartier) => (
                          <SelectItem key={quartier.id} value={quartier.id.toString()}>
                            {quartier.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor={`recipient-name${idPrefix}`}>Nom du destinataire</Label>
                <Input
                  id={`recipient-name${idPrefix}`}
                  placeholder="Nom complet du destinataire"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  required
                />
              </div>
              <div>
                <div className="flex flex-col mt-3">
                  <Label> Contact destinataire</Label>
                  <div className="flex">
                    <Input
                      id={`dropoff-contact${idPrefix}`}
                      placeholder="+243855180000"
                      className="rounded-l-none"
                      value={recipientPhone}
                      onChange={(e) => setRecipientPhone(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t pt-4 mt-4">
              <div className="flex items-center gap-2 mb-4">
                <input
                  type="checkbox"
                  id="toggle-recipients"
                  checked={hasAdditionalRecipients}
                  onChange={(e) => setHasAdditionalRecipients(e.target.checked)}
                  className="w-4 h-4"
                />
                <Label htmlFor="toggle-recipients" className="text-sm font-medium">
                  Il y a plusieurs personnes à cette adresse
                </Label>
              </div>

              {hasAdditionalRecipients && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-[#2B015F]">Destinataires supplémentaires</h4>
                  {additionalRecipients.map((recipient) => (
                    <div
                      key={recipient.id}
                      className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3 p-3 bg-gray-50 rounded-lg"
                    >
                      <Input
                        placeholder="Nom du destinataire"
                        value={recipient.name}
                        onChange={(e) => updateAdditionalRecipient(recipient.id, "name", e.target.value)}
                        className="flex-1"
                      />
                      <Input
                        type="tel"
                        placeholder="Numéro de téléphone"
                        value={recipient.phone_number}
                        onChange={(e) => updateAdditionalRecipient(recipient.id, "phone_number", e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeAdditionalRecipient(recipient.id)}
                        className="text-red-600 hover:text-red-700 px-2"
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addAdditionalRecipient}
                    className="w-full border-dashed border-purple-300 text-purple-600 hover:bg-purple-50 bg-transparent"
                  >
                    + Ajouter un destinataire
                  </Button>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor={`preferred-delivery-date${idPrefix}`}>Date et heure de livraison préférées</Label>
              <div className="relative">
                {isMobile ? (
                  <input
                    type="datetime-local"
                    id={`preferred-delivery-date${idPrefix}`}
                    value={dateToDatetimeLocal(preferredDeliveryDate)}
                    onChange={(e) => setPreferredDeliveryDate(datetimeLocalToDate(e.target.value))}
                    min={dateToDatetimeLocal(pickupDate || new Date())}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    required
                  />
                ) : (
                  <DatePicker
                    selected={preferredDeliveryDate}
                    onChange={(date) => setPreferredDeliveryDate(date)}
                    showTimeSelect
                    timeFormat="HH:mm"
                    timeIntervals={15}
                    dateFormat="dd/MM/yyyy HH:mm"
                    placeholderText="Sélectionnez la date et l'heure"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    wrapperClassName="w-full"
                    minDate={pickupDate || minPreferredDeliveryDate}
                    filterTime={(time) => {
                      const hours = time.getHours()
                      if (hours < 8 || hours > 18) return false
                      if (pickupDate) {
                        const selectedDate = preferredDeliveryDate || new Date()
                        if (
                          selectedDate.getFullYear() === pickupDate.getFullYear() &&
                          selectedDate.getMonth() === pickupDate.getMonth() &&
                          selectedDate.getDate() === pickupDate.getDate()
                        ) {
                          return time.getTime() >= pickupDate.getTime()
                        }
                      }
                      return true
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Step 3: Package Information Section */}
      <div className="bg-white p-4 rounded-lg border">
        <h3 className="text-lg font-medium text-[#2B015F] mb-4">
          {formType === "labo" ? "Informations médicales" : "Informations du colis"}
        </h3>

        {formType === "labo" ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sample-type">{config?.typeLabel}</Label>
                <Select value={itemType} onValueChange={setItemType}>
                  <SelectTrigger id="sample-type">
                    <SelectValue placeholder={`Sélectionnez le ${config?.typeLabel.toLowerCase()}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {config.typeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="reference-labo">Référence médicale</Label>
                <div className="relative">
                  <Package className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input id="reference-labo" placeholder="Ex: MED-12345" className="pl-10" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <Label htmlFor="temperature">Température requise</Label>
                <Select defaultValue="2-8" onValueChange={(value) => console.log("Temperature selected:", value)}>
                  <SelectTrigger id="temperature">
                    <SelectValue placeholder="Sélectionnez la température" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ambient">Température ambiante</SelectItem>
                    <SelectItem value="2-8">Réfrigéré (2-8°C)</SelectItem>
                    <SelectItem value="frozen">Congelé (-20°C)</SelectItem>
                    <SelectItem value="ultra-frozen">Ultra-congelé (-80°C)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="priority">Priorité</Label>
                <Select defaultValue="normal" onValueChange={(value) => console.log("Priority selected:", value)}>
                  <SelectTrigger id="priority">
                    <SelectValue placeholder="Sélectionnez la priorité" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="critical">Critique</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Package Weight Field */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <Label htmlFor={`package-description-labo`}>
                  Description du produit médical <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <FileText className={`absolute left-3 top-3 h-4 w-4 ${descriptionError ? "text-red-400" : "text-gray-400"}`} />
                  <Input
                    id={`package-description-labo`}
                    placeholder="Décrivez le produit médical"
                    className={`pl-10 ${descriptionError ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                    value={packageDescription}
                    onChange={(e) => {
                      setPackageDescription(e.target.value)
                      if (e.target.value.trim()) setDescriptionError("")
                    }}
                    required
                  />
                </div>
                {descriptionError && (
                  <p className="text-red-500 text-sm mt-1">{descriptionError}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <Label htmlFor={`package-value-currency-labo`}>Devise</Label>
                <Select value={packageValueCurrency} onValueChange={setPackageValueCurrency} defaultValue="CDF">
                  <SelectTrigger id={`package-value-currency-labo`}>
                    <SelectValue placeholder="Sélectionnez la devise" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CDF">CDF</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor={`package-value-amount-labo`}>Valeur du produit</Label>
                <div className="relative">
                  {packageValueCurrency === "USD" ? (
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  ) : (
                    <span className="absolute left-3 top-3 h-4 w-4 text-gray-400 font-bold text-sm">FC</span>
                  )}
                  <Input
                    id={`package-value-amount-labo`}
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Valeur"
                    className="pl-10"
                    value={packageValueAmount}
                    onChange={(e) => setPackageValueAmount(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Removed item type select for non-labo forms */}

            {/* New package description and value fields */}
            <div className="mt-4">
              <Label htmlFor={`package-description${idPrefix}`}>
                Description du colis <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <FileText className={`absolute left-3 top-3 h-4 w-4 ${descriptionError ? "text-red-400" : "text-gray-400"}`} />
                <Input
                  id={`package-description${idPrefix}`}
                  placeholder="Décrivez le contenu du colis"
                  className={`pl-10 ${descriptionError ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                  value={packageDescription}
                  onChange={(e) => {
                    setPackageDescription(e.target.value)
                    if (e.target.value.trim()) setDescriptionError("")
                  }}
                  required
                />
              </div>
              {descriptionError && (
                <p className="text-red-500 text-sm mt-1">{descriptionError}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <Label htmlFor={`package-value-currency${idPrefix}`}>Devise</Label>
                <Select value={packageValueCurrency} onValueChange={setPackageValueCurrency} defaultValue="CDF">
                  <SelectTrigger id={`package-value-currency${idPrefix}`}>
                    <SelectValue placeholder="Sélectionnez la devise" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CDF">CDF</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor={`package-value-amount${idPrefix}`}>Valeur du colis</Label>
                <div className="relative">
                  {packageValueCurrency === "USD" ? (
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  ) : (
                    <span className="absolute left-3 top-3 h-4 w-4 text-gray-400 font-bold text-sm">FC</span>
                  )}
                  <Input
                    id={`package-value-amount${idPrefix}`}
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Valeur"
                    className="pl-10"
                    value={packageValueAmount}
                    onChange={(e) => setPackageValueAmount(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 px-2 mb-4">
                <input
                  type="checkbox"
                  id="toggle-recipients"
                  checked={isDeliveryPriceIncluded}
                  onChange={(e) => setIsDeliveryPriceIncluded(e.target.checked)}
                  className="w-4 h-4"
                />
                <Label htmlFor="toggle-recipients" className="text-sm font-medium">
                  {/* delivery cost included? */}
                  Le coût de la livraison est inclus dans le prix du colis
                </Label>
              </div>
            </div>
          </>
        )}

      </div>

      {/* Vehicle Selection Section */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-[#2B015F] mb-2 text-center">Choisissez votre type de véhicule</h3>
        <p className="text-gray-500 text-sm text-center mb-6">Sélectionnez le véhicule adapté à votre livraison</p>
        
        <div className="grid grid-cols-2 gap-3 sm:gap-4 max-w-lg mx-auto">
          {/* Motorbike Option */}
          <button
            type="button"
            onClick={() => handleVehicleSelect("motorbike")}
            className={`relative p-3 sm:p-6 rounded-xl border-2 transition-all duration-200 text-center group ${
              selectedVehicleType === "motorbike"
                ? "border-[#2B015F] bg-purple-50 shadow-md"
                : "border-gray-200 bg-white hover:border-[#2B015F] hover:shadow-lg"
            }`}
          >
            {selectedVehicleType === "motorbike" && (
              <div className="absolute top-2 right-2 sm:top-3 sm:right-3 w-5 h-5 sm:w-6 sm:h-6 bg-[#2B015F] rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
            <div className="flex flex-col items-center gap-2 sm:gap-3">
              <div className={`p-3 sm:p-4 rounded-full transition-colors duration-200 ${
                selectedVehicleType === "motorbike" ? "bg-[#2B015F]" : "bg-purple-50 group-hover:bg-[#2B015F]"
              }`}>
                <svg
                  className={`w-7 h-7 sm:w-10 sm:h-10 transition-colors duration-200 ${
                    selectedVehicleType === "motorbike" ? "text-white" : "text-[#2B015F] group-hover:text-white"
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M8 16a3 3 0 100-6 3 3 0 000 6zm8 0a3 3 0 100-6 3 3 0 000 6zM5 13h1l2-4h4l1 2h2l2-2h2"
                  />
                </svg>
              </div>
              <div>
                <h4 className={`font-bold text-base sm:text-lg ${
                  selectedVehicleType === "motorbike" ? "text-[#2B015F]" : "text-gray-800 group-hover:text-[#2B015F]"
                }`}>Moto</h4>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">Rapide et agile</p>
                <p className="text-[11px] sm:text-xs text-gray-400 mt-0.5 sm:mt-1">Idéal pour petits colis</p>
              </div>
            </div>
          </button>

          {/* Tricycle Option */}
          <button
            type="button"
            onClick={() => handleVehicleSelect("tricycle")}
            className={`relative p-3 sm:p-6 rounded-xl border-2 transition-all duration-200 text-center group ${
              selectedVehicleType === "tricycle"
                ? "border-[#2B015F] bg-purple-50 shadow-md"
                : "border-gray-200 bg-white hover:border-[#2B015F] hover:shadow-lg"
            }`}
          >
            {selectedVehicleType === "tricycle" && (
              <div className="absolute top-2 right-2 sm:top-3 sm:right-3 w-5 h-5 sm:w-6 sm:h-6 bg-[#2B015F] rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
            <div className="flex flex-col items-center gap-2 sm:gap-3">
              <div className={`p-3 sm:p-4 rounded-full transition-colors duration-200 ${
                selectedVehicleType === "tricycle" ? "bg-[#2B015F]" : "bg-purple-50 group-hover:bg-[#2B015F]"
              }`}>
                <svg
                  className={`w-7 h-7 sm:w-10 sm:h-10 transition-colors duration-200 ${
                    selectedVehicleType === "tricycle" ? "text-white" : "text-[#2B015F] group-hover:text-white"
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M5 17a2 2 0 104 0 2 2 0 00-4 0zm10 0a2 2 0 104 0 2 2 0 00-4 0zM5 17h10M3 9h4l2 4H5m6-4h6l2 4h-6m-4 0v4"
                  />
                </svg>
              </div>
              <div>
                <h4 className={`font-bold text-base sm:text-lg ${
                  selectedVehicleType === "tricycle" ? "text-[#2B015F]" : "text-gray-800 group-hover:text-[#2B015F]"
                }`}>Tricycle fermé</h4>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">Protection maximale</p>
                <p className="text-[11px] sm:text-xs text-gray-400 mt-0.5 sm:mt-1">Idéal pour gros colis</p>
              </div>
            </div>
          </button>
        </div>

        {/* Size/Weight Selection for Tricycle */}
        {selectedVehicleType === "tricycle" && (
          <div className="mt-6">
            <h4 className="text-base font-medium text-[#2B015F] mb-2 text-center">Quelle est la taille de votre colis?</h4>
            <p className="text-gray-500 text-xs text-center mb-4">Sélectionnez la catégorie de poids correspondante</p>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {sizeWeightOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSizeWeightSelect(option.value)}
                  className={`relative p-3 rounded-xl border-2 transition-all duration-200 text-center group ${
                    selectedSizeWeight === option.value
                      ? "border-[#2B015F] bg-purple-50 shadow-md"
                      : "border-gray-200 bg-white hover:border-[#2B015F] hover:shadow-lg"
                  }`}
                >
                  {selectedSizeWeight === option.value && (
                    <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-[#2B015F] rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                  <div className="flex flex-col items-center gap-2">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-200 ${
                      selectedSizeWeight === option.value ? "bg-[#2B015F]" : "bg-purple-50 group-hover:bg-[#2B015F]"
                    }`}>
                      <span className={`text-sm font-bold transition-colors duration-200 ${
                        selectedSizeWeight === option.value ? "text-white" : "text-[#2B015F] group-hover:text-white"
                      }`}>
                        {option.icon}
                      </span>
                    </div>
                    <div>
                      <h4 className={`font-semibold text-sm ${
                        selectedSizeWeight === option.value ? "text-[#2B015F]" : "text-gray-800 group-hover:text-[#2B015F]"
                      }`}>{option.label}</h4>
                      <p className="text-xs text-gray-500 mt-0.5">{option.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Price Display - shown after vehicle selection */}
        {deliveryPriceToken && (
          <div className="bg-gray-50 p-4 rounded-md border mt-6">
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Prix estimé:</span>
              {isPriceFetching ? (
                <div className="flex items-center">
                  <span className="animate-spin mr-2 h-4 w-4 border-2 border-purple-700 border-t-transparent rounded-full"></span>
                  <span className="text-gray-600">Calcul en cours...</span>
                </div>
              ) : priceError ? (
                <div className="text-red-500 text-sm">{priceError}</div>
              ) : estimatedPrice !== null ? (
                <div>
                  <span className="font-bold text-[#2B015F] text-xl">
                    {Number(estimatedPrice).toLocaleString("fr-FR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    CDF
                  </span>
                </div>
              ) : (
                <div className="text-gray-500 text-sm">
                  Sélectionnez les communes et quartiers pour calculer le prix
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </form>
  )
}
