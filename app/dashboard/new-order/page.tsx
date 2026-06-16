"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, CheckCircle, ArrowRight, Plus, Trash2, Send } from "lucide-react"
import { OrderForm } from "@/components/dashboard/order-form"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import RoleGuard from "@/components/role-guard"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

// Multi-Step Form Wrapper Component
const MultiStepFormWrapper = ({ formType, ...props }: any) => {
  const [currentStep, setCurrentStep] = useState(1)
  const [slideDirection, setSlideDirection] = useState<"left" | "right" | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const [isOnVehicleStep, setIsOnVehicleStep] = useState(true)
  const [wrapperVehicleType, setWrapperVehicleType] = useState<"motorbike" | "tricycle">("motorbike")
  const [wrapperSizeWeight, setWrapperSizeWeight] = useState<string | null>(null)
  const totalSteps = 3

  const color = "purple"

  const stepTitles = ["Informations d'expédition", "Informations de livraison", "Informations du colis"]

  const canProceedToStep2 = () => {
    return props.pickupAddress && props.selectedSenderCommuneId && props.selectedSenderQuartierId
  }

  const canProceedToStep3 = () => {
    if (formType === "courier") {
      // For courier, check if at least one recipient has all required fields
      return (
        props.recipients &&
        props.recipients.length > 0 &&
        props.recipients.every(
          (recipient: any) =>
            recipient.name && recipient.phone && recipient.address && recipient.communeId && recipient.quartierId,
        )
      )
    }
    return (
      props.dropoffAddress &&
      props.recipientName &&
      props.recipientPhone &&
      props.selectedCommuneId &&
      props.selectedQuartierId
    )
  }

  const handleNext = () => {
    if (currentStep === 1 && canProceedToStep2()) {
      window.scrollTo({ top: -15, behavior: "smooth" })
      setSlideDirection("right")
      setIsAnimating(true)
      setTimeout(() => {
        setCurrentStep(2)
        setIsAnimating(false)
        setSlideDirection(null)
      }, 300)
    } else if (currentStep === 2 && canProceedToStep3()) {
      window.scrollTo({ top: -15, behavior: "smooth" })
      setSlideDirection("right")
      setIsAnimating(true)
      setTimeout(() => {
        setCurrentStep(3)
        setIsAnimating(false)
        setSlideDirection(null)
      }, 300)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      window.scrollTo({ top: -15, behavior: "smooth" })
      setSlideDirection("left")
      setIsAnimating(true)
      setTimeout(() => {
        setCurrentStep(currentStep - 1)
        setIsAnimating(false)
        setSlideDirection(null)
      }, 300)
    }
  }

  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      <div className="flex items-center justify-between mb-8">
        {[1, 2, 3].map((step) => (
          <div key={step} className="flex items-center flex-1">
            <div className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                  step <= currentStep
                    ? "bg-purple-500 text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {step}
              </div>
              <span className="ml-2 text-sm font-medium text-gray-600 hidden sm:block">{stepTitles[step - 1]}</span>
            </div>
            {step < 3 && (
              <div
                className={`flex-1 h-1 mx-4 transition-all duration-300 ${
                  step < currentStep ? "bg-purple-500" : "bg-gray-200"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step Counter */}
      {/* <div className="text-center mb-6">
        <p className="text-sm text-gray-600">
          Étape {currentStep} sur {totalSteps}
        </p>
        <h3 className="text-lg font-semibold text-[#2B015F] mt-1">{stepTitles[currentStep - 1]}</h3>
      </div> */}

      {/* Form Content with Step-based Rendering and Slide Animation */}
      <div className="min-h-[400px] relative overflow-hidden">
        <div
          className={`transition-all duration-300 ease-in-out ${
            isAnimating
              ? slideDirection === "right"
                ? "opacity-0 -translate-x-8"
                : "opacity-0 translate-x-8"
              : "opacity-100 translate-x-0"
          }`}
        >
          <OrderForm {...props} formType={formType} currentStep={currentStep} onVehicleStepChange={setIsOnVehicleStep} onVehicleTypeChange={setWrapperVehicleType} onSizeWeightChange={setWrapperSizeWeight} customerId={props.customerId} />
        </div>
      </div>

      {/* Navigation Buttons - Hidden during vehicle selection step */}
      {!isOnVehicleStep && (
        <div className="flex justify-between pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1 || isAnimating}
            className="flex items-center gap-2 bg-transparent"
          >
            <ArrowLeft className="h-4 w-4" />
            Précédent
          </Button>

          <div className="flex gap-2">
            {currentStep < totalSteps ? (
              <Button
                type="button"
                onClick={handleNext}
                disabled={
                  (currentStep === 1 && !canProceedToStep2()) ||
                  (currentStep === 2 && !canProceedToStep3()) ||
                  isAnimating
                }
                className="flex items-center gap-2 bg-purple-500 hover:bg-purple-600"
              >
                Suivant
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={() => {
                  // Manually trigger form submission only on the final step
                  const form = document.getElementById("order-form") as HTMLFormElement
                  if (form) {
                    form.requestSubmit()
                  }
                }}
                disabled={props.isSubmitting || isAnimating}
                className="flex items-center gap-2 bg-purple-500 hover:bg-purple-600"
              >
                {props.isSubmitting ? "Création..." : "Créer la commande"}
                <CheckCircle className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function NewOrderPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()

  const isPostOffice = user?.parent_client === "post-office"

  const [formType, setFormType] = useState("colis" as const)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formSubmitted, setFormSubmitted] = useState(false)
  const [isOnVehicleStep, setIsOnVehicleStep] = useState(true)
  const [selectedVehicleType, setSelectedVehicleType] = useState<"motorbike" | "tricycle">("motorbike")
  const [selectedSizeWeight, setSelectedSizeWeight] = useState<string | null>(null)

  const [postOfficeRows, setPostOfficeRows] = useState([
    {
      id: crypto.randomUUID(),
      address: "",
      reference: "",
      recipient_name: "",
      recipient_phone_number: "",
    },
  ])
  const [showPreviewDialog, setShowPreviewDialog] = useState(false)
  const [submittedData, setSubmittedData] = useState<any[]>([])

  // Form state
  const [pickupAddress, setPickupAddress] = useState("")
  const [pickupAddressReference, setPickupAddressReference] = useState("")
  const [dropoffAddress, setDropoffAddress] = useState("")
  const [pickupCountryCode, setPickupCountryCode] = useState("+243")
  const [dropoffCountryCode, setDropoffCountryCode] = useState("")
  const [recipientName, setRecipientName] = useState("")
  const [recipientPhone, setRecipientPhone] = useState("") // Add recipient phone state
  const [itemType, setItemType] = useState("")
  const [packageDescription, setPackageDescription] = useState("")
  const [packageValueCurrency, setPackageValueCurrency] = useState("CDF")
  const [packageValueAmount, setPackageValueAmount] = useState("")
  const [packageWeight, setPackageWeight] = useState("")
  const [packageWeightUnit, setPackageWeightUnit] = useState("kg")
  const [pickupCoordinates, setPickupCoordinates] = useState<{ lat: number; lng: number } | undefined>(undefined)
  const [dropoffCoordinates, setDropoffCoordinates] = useState<{ lat: number; lng: number } | undefined>(undefined)
  const [deliveryPriceToken, setDeliveryPriceToken] = useState("")
  const [pickupDate, setPickupDate] = useState<Date | null>(null)
  const [preferredDeliveryDate, setPreferredDeliveryDate] = useState<Date | null>(null)
  const [selectedCommuneId, setSelectedCommuneId] = useState<string>("")
  const [selectedQuartierId, setSelectedQuartierId] = useState<string>("")
  const [selectedSenderCommuneId, setSelectedSenderCommuneId] = useState<string>("")
  const [selectedSenderQuartierId, setSelectedSenderQuartierId] = useState<string>("")
  const [recipients, setRecipients] = useState<any[]>([])

  const [favoritePlaces, setFavoritePlaces] = useState<any[]>([])
  const [loadingFavorites, setLoadingFavorites] = useState(false)
  const [hasUsedFavoritePlace, setHasUsedFavoritePlace] = useState(false)
  const [selectedFavoritePlaceId, setSelectedFavoritePlaceId] = useState<string>("")

  const [hasAdditionalRecipients, setHasAdditionalRecipients] = useState(false)
  const [additionalRecipients, setAdditionalRecipients] = useState<
    Array<{
      id: string
      name: string
      phone_number: string
    }>
  >([])
  const [isDeliveryPriceIncluded, setIsDeliveryPriceIncluded] = useState(false)

  const addAdditionalRecipient = () => {
    const newRecipient = {
      id: Date.now().toString(),
      name: "",
      phone_number: "",
    }
    setAdditionalRecipients([...additionalRecipients, newRecipient])
  }

  const removeAdditionalRecipient = (id: string) => {
    setAdditionalRecipients(additionalRecipients.filter((recipient) => recipient.id !== id))
  }

  const updateAdditionalRecipient = (id: string, field: "name" | "phone_number", value: string) => {
    setAdditionalRecipients(
      additionalRecipients.map((recipient) => (recipient.id === id ? { ...recipient, [field]: value } : recipient)),
    )
  }

  const fetchFavoritePlaces = async () => {
    if (!user?.id || loadingFavorites) return

    setLoadingFavorites(true)
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_SERVER_BASE_URL}/deliveries/favorite-places?user_id=${user.id}&type=origin`,
      )

      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          setFavoritePlaces(result.data)
        }
      }
    } catch (error) {
      console.error("Error fetching favorite places:", error)
    } finally {
      setLoadingFavorites(false)
    }
  }

  const handleFavoritePlaceSelect = (favoritePlace: any) => {
    setPickupAddress(favoritePlace.address_line)
    if (favoritePlace.location && favoritePlace.location.coordinates) {
      setPickupCoordinates({
        lat: favoritePlace.location.coordinates[1], // Note: coordinates are [lng, lat]
        lng: favoritePlace.location.coordinates[0],
      })
    } else {
      // If no coordinates available, set to undefined
      setPickupCoordinates(undefined)
    }
    setSelectedSenderCommuneId(favoritePlace.commune_id)
    setSelectedSenderQuartierId(favoritePlace.quartier_id)
    setHasUsedFavoritePlace(true)
    setSelectedFavoritePlaceId(favoritePlace.favorite_place_id)
  }

  // Handle address changes with coordinates
  const handlePickupAddressChange = (address: string, coordinates?: { lat: number; lng: number }) => {
    console.log("Parent: Pickup address changed", address, coordinates)
    setPickupAddress(address)
    setPickupCoordinates(coordinates)
    if (hasUsedFavoritePlace) {
      setHasUsedFavoritePlace(false)
      setSelectedFavoritePlaceId("")
    }
  }

  const handleDropoffAddressChange = (address: string, coordinates?: { lat: number; lng: number }) => {
    console.log("Parent: Dropoff address changed", address, coordinates)
    setDropoffAddress(address)
    setDropoffCoordinates(coordinates)
  }

  // Get user's current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Géolocalisation non supportée",
        description: "Votre navigateur ne supporte pas la géolocalisation.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          // Use OpenStreetMap's Nominatim for reverse geocoding
          const { latitude, longitude } = position.coords
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
            {
              headers: {
                "Accept-Language": "fr",
              },
            },
          )

          if (!response.ok) {
            throw new Error("Erreur lors de la récupération de l'adresse")
          }

          const data = await response.json()

          // Format the address
          const address = data.display_name

          // Update the pickup address and coordinates
          setPickupAddress(address)
          setPickupCoordinates({ lat: latitude, lng: longitude })
          console.log("Current location set:", { lat: latitude, lng: longitude })

          toast({
            title: "Localisation réussie",
            description: "Votre position actuelle a été détectée.",
          })
        } catch (error) {
          console.error("Error getting address:", error)
          toast({
            title: "Erreur de localisation",
            description: "Impossible de récupérer votre adresse. Veuillez saisir manuellement.",
            variant: "destructive",
          })
        } finally {
          setIsSubmitting(false)
        }
      },
      (error) => {
        setIsSubmitting(false)
        console.error("Geolocation error:", error)

        let errorMessage = "Impossible de récupérer votre position."

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Vous avez refusé l'accès à votre position."
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Votre position est indisponible."
            break
          case error.TIMEOUT:
            errorMessage = "La demande de localisation a expiré."
            break
        }

        toast({
          title: "Erreur de géolocalisation",
          description: errorMessage,
          variant: "destructive",
        })
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    )
  }

  // Get estimated price based on item type
  const getEstimatedPrice = (type: string) => {
    switch (type) {
      case "document":
        return "1500"
      case "envelope":
        return "1200"
      case "large-envelope":
        return "1800"
      case "confidential":
        return "2000"
      case "small-package":
        return "2000"
      case "medium-package":
        return "3000"
      case "large-package":
        return "4500"
      case "fragile":
        return "3500"
      case "blood":
      case "urine":
      case "tissue":
      case "csf":
        return "3000"
      case "food":
        return "2500"
      case "medicine":
        return "2800"
      default:
        return "2000"
    }
  }

  const handlePriceCalculated = (price: number, token: string) => {
    console.log("Price calculated:", price, token)
    setDeliveryPriceToken(token)
  }

  // Form submission handler
  const handleOrderSubmit = async (e: React.FormEvent | any) => {
    // Add type checking for preventDefault
    if (e && typeof e.preventDefault === "function") {
      e.preventDefault()
    }

    setIsSubmitting(true)

    // Default coordinates for Kinshasa if not available
    const defaultCoords = { lat: -4.4419, lng: 15.2663 }

    // Map form type to delivery_type
    const deliveryTypeMap: Record<string, string> = {
      colis: "package",
      courier: "courier",
      labo: "medical",
    }

    try {
      if (formType === "courier") {
        // Handle courier with multiple recipients
        const target = e.target as any
        const recipients = target.recipients || []

        if (recipients.length === 0) {
          toast({
            title: "Erreur",
            description: "Veuillez ajouter au moins un destinataire.",
            variant: "destructive",
          })
          return
        }

        // Add validation before creating the customEvent
        const invalidRecipients = recipients.filter(
          //@ts-ignore
          (recipient) =>
            !recipient.name || !recipient.phone || !recipient.address || !recipient.communeId || !recipient.quartierId,
        )

        if (invalidRecipients.length > 0) {
          toast({
            title: "Erreur de validation",
            description:
              "Veuillez remplir tous les champs obligatoires pour chaque destinataire (nom, téléphone, adresse, commune, quartier).",
            variant: "destructive",
          })
          setIsSubmitting(false)
          return
        }

        // Create DTO with recipients array for courier
        const dto = {
          delivery_type: deliveryTypeMap[formType] || "document",
          zone_id: "zone_123",
          customer_id: user?.id,
          package_title: itemType || getDefaultTitle(formType),
          package_category: getPackageCategory(itemType, formType),
          package_description: packageDescription || "Aucune description fournie",
          package_value_currency: packageValueCurrency,
          package_value_amount: packageValueAmount || "0.00",
          package_weight: packageWeight ? `${packageWeight} ${packageWeightUnit}` : "",
          payment_mode: "cash",
          pickup_date: pickupDate ? pickupDate.getTime() : Date.now(),
          preferred_delivery_date:
            preferredDeliveryDate && preferredDeliveryDate instanceof Date ? preferredDeliveryDate.getTime() : null,
          pickup_address_line: pickupAddress,
          pickup_address_second_line: pickupAddressReference || "",
          pickup_address_city: "Kinshasa",
          pickup_address_longitude: pickupCoordinates?.lng || defaultCoords.lng,
          pickup_address_latitude: pickupCoordinates?.lat || defaultCoords.lat,
          pickup_address_country: "DRC",
          commune_id_sender: selectedSenderCommuneId || "",
          quartier_id_sender: selectedSenderQuartierId || "",
          has_used_favorite_place_origin: hasUsedFavoritePlace,
          favorite_place_origin_id: hasUsedFavoritePlace ? selectedFavoritePlaceId : undefined,
          recipients: recipients.map((recipient: any) => ({
            recipient_name: recipient.name || "",
            recipient_phone: recipient.phone ? `${recipient.phone}` : "",
            recipient_address_line: recipient.address || "",
            recipient_address_second_line: recipient.reference || "",
            recipient_address_city: "Kinshasa",
            recipient_address_longitude: recipient.coordinates?.lng || -4.4419,
            recipient_address_latitude: recipient.coordinates?.lat || 15.2663,
            recipient_address_country: "DRC",
            preferred_delivery_date: recipient.preferredDeliveryDate
              ? recipient.preferredDeliveryDate.getTime()
              : Date.now() + 24 * 60 * 60 * 1000,
            commune_id_recipient: recipient.communeId || "",
            quartier_id_recipient: recipient.quartierId || "",
          })),
          delivery_price_token: deliveryPriceToken,
          vehicle_type: selectedVehicleType,
          size_weight_category: selectedVehicleType === "tricycle" ? selectedSizeWeight : null,
        }

        console.log("Submitting courier order with recipients:", dto)

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_SERVER_BASE_URL}/deliveries`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(dto),
        })

        const result = await response.json()
        console.log("Courier order submission result:", result)

        if (result.success) {
          setFormSubmitted(true)
          toast({
            title: "Commande créée avec succès",
            description: "Votre commande courier a été enregistrée et sera traitée rapidement",
            variant: "default",
          })
        } else {
          toast({
            title: "Erreur",
            description: result.message || "Une erreur s'est produite. Veuillez réessayer.",
            variant: "destructive",
          })
        }
      } else {
        // Handle single recipient for colis and labo
        const idPrefix = formType === "colis" ? "" : `-${formType}`
        const reference = "" // You can add reference state if needed

        // Create the standard DTO for single recipient
        const dto = {
          delivery_type: deliveryTypeMap[formType] || "package",
          zone_id: "zone_123",
          customer_id: user?.id,
          package_title: itemType || getDefaultTitle(formType),
          package_category: getPackageCategory(itemType, formType),
          package_description: packageDescription || "Aucune description fournie",
          package_value_currency: packageValueCurrency,
          package_value_amount: packageValueAmount || "0.00",
          package_weight: packageWeight ? `${packageWeight} ${packageWeightUnit}` : "",
          payment_mode: "cash",
          pickup_date: pickupDate ? pickupDate.getTime() : Date.now(),
          preferred_delivery_date:
            preferredDeliveryDate && preferredDeliveryDate instanceof Date ? preferredDeliveryDate.getTime() : null,
          pickup_address_line: pickupAddress,
          pickup_address_second_line: pickupAddressReference || "",
          pickup_address_city: "Kinshasa",
          pickup_address_longitude: pickupCoordinates?.lng || defaultCoords.lng,
          pickup_address_latitude: pickupCoordinates?.lat || defaultCoords.lat,
          pickup_address_country: "DRC",
          commune_id_sender: selectedSenderCommuneId || "",
          quartier_id_sender: selectedSenderQuartierId || "",
          recipient_name: recipientName,
          recipient_phone: `${recipientPhone}`, // Use state value directly
          recipient_address_line: dropoffAddress,
          recipient_address_second_line: reference,
          recipient_address_city: "Kinshasa",
          recipient_address_longitude: dropoffCoordinates?.lng || defaultCoords.lng,
          recipient_address_latitude: dropoffCoordinates?.lat || defaultCoords.lat,
          recipient_address_country: "DRC",
          commune_id_recipient: selectedCommuneId || "",
          quartier_id_recipient: selectedQuartierId || "",
          additional_recipients: additionalRecipients
            ?.filter((recipient) => recipient.name.trim() && recipient.phone_number.trim())
            ?.map((recipient) => ({
              name: recipient.name.trim(),
              phone_number: recipient.phone_number.trim(),
            })),
          has_used_favorite_place_origin: hasUsedFavoritePlace,
          favorite_place_origin_id: hasUsedFavoritePlace ? selectedFavoritePlaceId : undefined,
          delivery_price_token: deliveryPriceToken,
          is_delivery_price_included: isDeliveryPriceIncluded,
          vehicle_type: selectedVehicleType,
          size_weight_category: selectedVehicleType === "tricycle" ? selectedSizeWeight : null,
        }

        console.log("Submitting single recipient order:", dto)

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_SERVER_BASE_URL}/deliveries`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(dto),
        })

        const result = await response.json()
        console.log("Single recipient order submission result:", result)

        if (result.success) {
          setFormSubmitted(true)
          toast({
            title: "Commande créée avec succès",
            description: "Votre commande a été enregistrée et sera traitée rapidement",
            variant: "default",
          })
          setAdditionalRecipients([])
        } else {
          toast({
            title: "Erreur",
            description: result.message || "Une erreur s'est produite. Veuillez réessayer.",
            variant: "destructive",
          })
        }
      }
    } catch (error) {
      console.error("Error submitting form:", error)
      toast({
        title: "Erreur de connexion",
        description: "Une erreur s'est produite lors de la connexion au serveur. Veuillez réessayer.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Helper function to get default title based on form type
  const getDefaultTitle = (type: string): string => {
    switch (type) {
      case "colis":
        return "Colis"
      case "courier":
        return "Document"
      case "labo":
        return "Produit médical"
      default:
        return "Livraison"
    }
  }

  // Helper function to map item types to package categories
  const getPackageCategory = (type: string, formType: string): string => {
    // If no specific type is selected, use the form type as a fallback
    if (!type) {
      switch (formType) {
        case "colis":
          return "Standard"
        case "courier":
          return "Document"
        case "labo":
          return "Medical"
        default:
          return "Standard"
      }
    }

    const categoryMap: Record<string, string> = {
      // Colis (package) types
      "small-package": "Standard",
      "medium-package": "Standard",
      "large-package": "Standard",
      fragile: "Fragile",

      // Courier (document) types
      document: "Document",
      envelope: "Document",
      "large-envelope": "Document",
      confidential: "Document",

      // Labo (medical) types
      blood: "Medical",
      urine: "Medical",
      tissue: "Medical",
      csf: "Medical",
      other: "Medical",
    }

    return categoryMap[type] || "Standard"
  }

  const handleAddAnother = () => {
    setFormSubmitted(false)
    setPickupAddress("")
    setPickupAddressReference("")
    setDropoffAddress("")
    setRecipientName("")
    setRecipientPhone("") // Reset recipient phone
    setItemType("")
    setPackageDescription("")
    setPackageValueCurrency("CDF")
    setPackageValueAmount("")
    setPackageWeight("")
    setPackageWeightUnit("kg")
    setPickupCoordinates(undefined)
    setDropoffCoordinates(undefined)
    setDeliveryPriceToken("")
    setPickupDate(null)
    setPreferredDeliveryDate(null)
    setSelectedCommuneId("")
    setSelectedQuartierId("")
    setSelectedSenderCommuneId("")
    setSelectedSenderQuartierId("")
    setRecipients([])
    setHasUsedFavoritePlace(false)
    setSelectedFavoritePlaceId("")
    setFavoritePlaces([])
  }

  const addPostOfficeRow = () => {
    setPostOfficeRows([
      ...postOfficeRows,
      {
        id: crypto.randomUUID(),
        address: "",
        reference: "",
        recipient_name: "",
        recipient_phone_number: "",
      },
    ])
  }

  const removeLastPostOfficeRow = () => {
    if (postOfficeRows.length > 1) {
      setPostOfficeRows(postOfficeRows.slice(0, -1))
    }
  }

  const updatePostOfficeRow = (id: string, field: string, value: any) => {
    setPostOfficeRows(postOfficeRows.map((row) => (row.id === id ? { ...row, [field]: value } : row)))
  }

  const handlePostOfficeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate all fields
    const isValid = postOfficeRows.every(
      (row) =>
        row.address.trim() && row.recipient_name.trim() && row.recipient_phone_number.trim() && row.reference.trim(),
    )

    if (!isValid) {
      toast({
        title: "Erreur",
        description:
          "Veuillez remplir tous les champs obligatoires (Adresse, Référence, Nom et Téléphone du destinataire)",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    const dataWithoutLocalId = postOfficeRows.map((row) => {
      const { id, ...rowWithoutId } = row
      return {
        ...rowWithoutId
      }
    })

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_SERVER_BASE_URL}/deliveries/courier-deliveries`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customer_id: user?.id,
          data: dataWithoutLocalId
        }),
      })

      if (!response.ok) {
        throw new Error("Échec de la soumission")
      }

      toast({
        title: "Succès",
        description: `${postOfficeRows.length} commande(s) de courrier soumise(s) avec succès`,
      })

      // Reset form
      setPostOfficeRows([
        {
          id: crypto.randomUUID(),
          address: "",
          reference: "",
          recipient_name: "",
          recipient_phone_number: "",
        },
      ])
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de soumettre les commandes. Veuillez réessayer.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (formSubmitted) {
    return (
      <RoleGuard allowedRoles={["enterprise", "hospital", "admin", "personal"]}>
        <div className="container py-10">
          <Card className="max-w-3xl mx-auto">
            <CardContent className="pt-6">
              <div className="py-8 text-center">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Commande créée avec succès!</h3>
                <p className="text-gray-600 mb-6">Votre commande a été enregistrée et sera traitée rapidement.</p>
                <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-4">
                  <Button variant="outline" onClick={() => router.push("/dashboard")}>
                    Retour au tableau de bord
                  </Button>
                  <Button className="bg-[#FBC140] text-black hover:bg-[#FBC140]/90" onClick={handleAddAnother}>
                    Ajouter une autre commande
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </RoleGuard>
    )
  }

  if (isPostOffice) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => router.push("/dashboard")}
              className="mb-4 text-[#2B015F] hover:text-[#2B015F]/80"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour au tableau de bord
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">Nouvelle commande - Courrier</h1>
            <p className="text-gray-600 mt-2">
              Créez plusieurs commandes de courrier en une seule fois. Remplissez les informations requises pour chaque
              destinataire.
            </p>
          </div>

          <form onSubmit={handlePostOfficeSubmit}>
            <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                        Adresse, Numéro et Référence *
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Référence (lettre) *</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Nom du destinataire *</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Téléphone </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {postOfficeRows.map((row) => (
                      <tr key={row.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <Input
                            placeholder="Ex: Av Lubudi N°123, ref: Immeuble bleu"
                            value={row.address}
                            onChange={(e) => updatePostOfficeRow(row.id, "address", e.target.value)}
                            required
                            className="min-w-[200px]"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <Input
                            placeholder="Ex: CNF234"
                            value={row.reference}
                            onChange={(e) => updatePostOfficeRow(row.id, "reference", e.target.value)}
                            required
                            className="min-w-[150px]"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <Input
                            placeholder="Nom complet"
                            value={row.recipient_name}
                            onChange={(e) => updatePostOfficeRow(row.id, "recipient_name", e.target.value)}
                            required
                            className="min-w-[180px]"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <Input
                            type="tel"
                            placeholder="+243 000 000 000"
                            value={row.recipient_phone_number}
                            onChange={(e) => updatePostOfficeRow(row.id, "recipient_phone_number", e.target.value)}
                            className="min-w-[150px]"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="lg:hidden divide-y">
                {postOfficeRows.map((row, index) => (
                  <div key={row.id} className="border rounded-lg p-4 space-y-3 bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm text-gray-700">Commande {index + 1}</span>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">Adresse *</label>
                      <Input
                        placeholder="Ex: Av. Wagenia N°123"
                        value={row.address}
                        onChange={(e) => updatePostOfficeRow(row.id, "address", e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">Référence *</label>
                      <Input
                        placeholder="Ex: Immeuble bleu"
                        value={row.reference}
                        onChange={(e) => updatePostOfficeRow(row.id, "reference", e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">Nom du destinataire *</label>
                      <Input
                        placeholder="Nom complet"
                        value={row.recipient_name}
                        onChange={(e) => updatePostOfficeRow(row.id, "recipient_name", e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">Téléphone *</label>
                      <Input
                        type="tel"
                        placeholder="+243 000 000 000"
                        value={row.recipient_phone_number}
                        onChange={(e) => updatePostOfficeRow(row.id, "recipient_phone_number", e.target.value)}
                        required
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={addPostOfficeRow}
                className="flex-1 sm:flex-none bg-transparent"
              >
                <Plus className="mr-2 h-4 w-4" />
                Ajouter une ligne
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={removeLastPostOfficeRow}
                disabled={postOfficeRows.length === 1}
                className="flex-1 sm:flex-none text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 bg-transparent"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Supprimer la dernière ligne
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 sm:flex-none bg-[#2B015F] hover:bg-[#2B015F]/90"
              >
                <Send className="mr-2 h-4 w-4" />
                {isSubmitting ? "Envoi..." : "Soumettre la requête"}
              </Button>
            </div>
          </form>

          {/* Preview Dialog */}
          <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Aperçu des commandes</DialogTitle>
                <DialogDescription>Vérifiez les détails avant la soumission finale</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto text-xs">
                  {JSON.stringify(submittedData, null, 2)}
                </pre>
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowPreviewDialog(false)}>
                  Fermer
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    )
  }

  return (
    <RoleGuard allowedRoles={["enterprise", "hospital", "admin", "personal"]}>
      <div className="container mx-auto px-1 py-6 sm:py-10 bg-gradient-to-b from-purple-50/30 to-transparent min-h-screen">
        <div className="flex flex-col sm:flex-row items-start sm:items-center mb-6 sm:mb-8 gap-4">
          <Button variant="ghost" onClick={() => router.push("/dashboard")} className="self-start sm:mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#2B015F]">Nouvelle commande</h1>
        </div>

        <Card className="max-w-4xl mx-auto border-t-4 border-[#FBC140] shadow-lg bg-gradient-to-b from-white to-purple-50/30">
          <CardHeader className="bg-gradient-to-r from-purple-50/50 to-transparent border-b border-purple-100/50 pb-6">
            <CardTitle className="text-[#2B015F] text-xl sm:text-2xl flex flex-col sm:flex-row items-start sm:items-center gap-2">
              <span className="bg-[#FBC140] w-8 h-8 rounded-full flex items-center justify-center text-white font-bold">
                +
              </span>
              <span>Créer une nouvelle commande</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 sm:pt-8 px-4 sm:px-6">
            <div className="space-y-6">
              {/* Single-step form - all sections visible */}
              <OrderForm
                formType={formType}
                pickupAddress={pickupAddress}
                setPickupAddress={handlePickupAddressChange}
                pickupAddressReference={pickupAddressReference}
                setPickupAddressReference={setPickupAddressReference}
                dropoffAddress={dropoffAddress}
                setDropoffAddress={handleDropoffAddressChange}
                pickupCountryCode={pickupCountryCode}
                setPickupCountryCode={setPickupCountryCode}
                dropoffCountryCode={dropoffCountryCode}
                setDropoffCountryCode={setDropoffCountryCode}
                recipientName={recipientName}
                setRecipientName={setRecipientName}
                recipientPhone={recipientPhone}
                setRecipientPhone={setRecipientPhone}
                itemType={itemType}
                setItemType={setItemType}
                packageDescription={packageDescription}
                setPackageDescription={setPackageDescription}
                packageValueCurrency={packageValueCurrency}
                setPackageValueCurrency={setPackageValueCurrency}
                packageValueAmount={packageValueAmount}
                setPackageValueAmount={setPackageValueAmount}
                packageWeight={packageWeight}
                setPackageWeight={setPackageWeight}
                packageWeightUnit={packageWeightUnit}
                setPackageWeightUnit={setPackageWeightUnit}
                isSubmitting={isSubmitting}
                onSubmit={handleOrderSubmit}
                onCancel={() => router.push("/dashboard")}
                getEstimatedPrice={getEstimatedPrice}
                getCurrentLocation={getCurrentLocation}
                onPriceCalculated={handlePriceCalculated}
                pickupCoordinates={pickupCoordinates}
                dropoffCoordinates={dropoffCoordinates}
                pickupDate={pickupDate}
                setPickupDate={setPickupDate}
                preferredDeliveryDate={preferredDeliveryDate}
                setPreferredDeliveryDate={setPreferredDeliveryDate}
                minPickupDate={new Date()}
                minPreferredDeliveryDate={new Date()}
                selectedCommuneId={selectedCommuneId}
                setSelectedCommuneId={setSelectedCommuneId}
                selectedQuartierId={selectedQuartierId}
                setSelectedQuartierId={setSelectedQuartierId}
                selectedSenderCommuneId={selectedSenderCommuneId}
                setSelectedSenderCommuneId={setSelectedSenderCommuneId}
                selectedSenderQuartierId={selectedSenderQuartierId}
                setSelectedSenderQuartierId={setSelectedSenderQuartierId}
                setFormType={setFormType}
                recipients={recipients}
                setRecipients={setRecipients}
                hasAdditionalRecipients={hasAdditionalRecipients}
                setHasAdditionalRecipients={setHasAdditionalRecipients}
                additionalRecipients={additionalRecipients}
                addAdditionalRecipient={addAdditionalRecipient}
                removeAdditionalRecipient={removeAdditionalRecipient}
                updateAdditionalRecipient={updateAdditionalRecipient}
                favoritePlaces={favoritePlaces}
                loadingFavorites={loadingFavorites}
                fetchFavoritePlaces={fetchFavoritePlaces}
                onFavoritePlaceSelect={handleFavoritePlaceSelect}
                isDeliveryPriceIncluded={isDeliveryPriceIncluded}
                setIsDeliveryPriceIncluded={setIsDeliveryPriceIncluded}
                onVehicleStepChange={setIsOnVehicleStep}
                onVehicleTypeChange={setSelectedVehicleType}
                onSizeWeightChange={setSelectedSizeWeight}
                customerId={user?.id}
              />

              {/* Submit Button - Hidden during vehicle selection step */}
              {!isOnVehicleStep && (
                <div className="flex justify-end pt-6 border-t">
                  <Button
                    type="button"
                    onClick={() => {
                      const form = document.getElementById("order-form") as HTMLFormElement
                      if (form) {
                        form.requestSubmit()
                      }
                    }}
                    disabled={isSubmitting}
                    className={`flex items-center gap-2 ${
                      formType === "colis"
                        ? "bg-purple-500 hover:bg-purple-600"
                        : formType === "courier"
                          ? "bg-yellow-500 hover:bg-yellow-600 text-black"
                          : "bg-green-500 hover:bg-green-600"
                    }`}
                  >
                    {isSubmitting ? "Création..." : "Créer la commande"}
                    <CheckCircle className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </RoleGuard>
  )
}
