"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus, LogOut, User, Package, FileText, Settings } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import RoleGuard from "@/components/role-guard"
import { EnterpriseDashboard } from "@/components/dashboard/enterprise-dashboard"
import { HospitalDashboard } from "@/components/dashboard/hospital-dashboard"
import { useDeliveries } from "@/hooks/use-deliveries"
import { format } from "date-fns"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"

// Replace the dummy lab samples data with an empty array
const labSamplesData: any[] = []

// Status mapping for display
const statusMapping: Record<string, string> = {
  unassigned: "en attente",
  assigned: "assigné",
  delivery_start_to_pickup: "en route pour ramassage",
  failed_pickup: "échec de ramassage",
  picked: "ramassé",
  delivery_start_to_recipient: "en route pour livraison",
  arrived_to_recipient: "arrivé à destination",
  unreachable_recipient: "destinataire injoignable",
  refused: "refusé",
  delivered: "livré",
}

export default function Dashboard() {
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [statusFilter, setStatusFilter] = useState<string>("tous")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const { user, logout } = useAuth()
  const { deliveries, isLoading: isLoadingDeliveries, error: deliveriesError, refetch } = useDeliveries()
  const [labSamples, setLabSamples] = useState(labSamplesData)
  const [pickupAddress, setPickupAddress] = useState("")
  const [dropoffAddress, setDropoffAddress] = useState("")
  const [pickupCountryCode, setPickupCountryCode] = useState("+243")
  const [dropoffCountryCode, setDropoffCountryCode] = useState("+243")
  const [recipientName, setRecipientName] = useState("")
  const [itemType, setItemType] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formType, setFormType] = useState<"colis" | "courier" | "labo">("colis")
  // Add state for coordinates
  const [pickupCoordinates, setPickupCoordinates] = useState<{ lat: number; lng: number } | undefined>(undefined)
  const [dropoffCoordinates, setDropoffCoordinates] = useState<{ lat: number; lng: number } | undefined>(undefined)
  const router = useRouter()

  // Update the setPickupAddress and setDropoffAddress functions
  const handlePickupAddressChange = (address: string, coordinates?: { lat: number; lng: number }) => {
    setPickupAddress(address)
    setPickupCoordinates(coordinates)
  }

  const handleDropoffAddressChange = (address: string, coordinates?: { lat: number; lng: number }) => {
    setDropoffAddress(address)
    setDropoffCoordinates(coordinates)
  }

  const navigateToNewOrder = () => {
    router.push("/dashboard/new-order")
  }

  const navigateToCatalogue = () => {
    router.push("/dashboard/catalogue")
  }

  const navigateToPreDelivery = () => {
    router.push("/dashboard/pre-delivery")
  }

  // Update the handleOrderSubmit function to use the coordinates and handle all form types
  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Get form values
    const form = e.target as HTMLFormElement
    const idPrefix = formType === "colis" ? "" : `-${formType}`
    const pickupContactInput = (form.querySelector(`#pickup-contact${idPrefix}`) as HTMLInputElement)?.value || ""
    const dropoffContactInput = (form.querySelector(`#dropoff-contact${idPrefix}`) as HTMLInputElement)?.value || ""
    const reference = (form.querySelector(`#reference${idPrefix}`) as HTMLInputElement)?.value || ""
    const itemTypeValue = itemType || (form.querySelector(`#item-type${idPrefix}`) as HTMLSelectElement)?.value || ""

    // Default coordinates for Kinshasa if not available
    const defaultCoords = { lat: -4.4419, lng: 15.2663 }

    // Map form type to delivery_type
    const deliveryTypeMap: Record<string, string> = {
      colis: "package",
      courier: "courier",
      labo: "medical",
    }

    // Create the data object to send to the API with the exact structure required
    const dto = {
      delivery_type: deliveryTypeMap[formType] || "package",
      zone_id: "zone_123", // Default zone ID
      customer_id: user?.id,
      package_title: itemTypeValue || getDefaultTitle(formType),
      package_category: getPackageCategory(itemTypeValue, formType),
      package_description: reference || "No description provided",
      package_value_currency: "CDF",
      package_value_amount: "0.00", // Default value
      payment_mode: "cash", // Default payment mode
      pickup_date: Date.now(), // Current timestamp in milliseconds
      pickup_address_line: pickupAddress,
      pickup_address_second_line: "",
      pickup_address_city: "Kinshasa", // Default city
      pickup_address_longitude: pickupCoordinates?.lng || defaultCoords.lng,
      pickup_address_latitude: pickupCoordinates?.lat || defaultCoords.lat,
      pickup_address_country: "DRC",
      recipient_name: recipientName, // Use the recipient name from the form
      recipient_phone: `${dropoffCountryCode}${dropoffContactInput}`,
      recipient_address_line: dropoffAddress,
      recipient_address_second_line: "",
      recipient_address_city: "Kinshasa", // Default city
      recipient_address_longitude: dropoffCoordinates?.lng || defaultCoords.lng,
      recipient_address_latitude: dropoffCoordinates?.lat || defaultCoords.lat,
      recipient_address_country: "DRC",
      delivery_price_token:
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwcmljZSI6MTQyMC4wNCwiaWF0IjoxNzQ3MjczOTU0LCJleHAiOjE3NDcyNzc1NTR9.7B-a62xAeWjHdAaJlalEh1pQS706HBKQBST2uImk_iQ",
    }

    try {
      // Send the data to the API
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_SERVER_BASE_URL}/deliveries`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dto),
      })

      const result = await response.json()

      // Handle the response
      if (result.success) {
        // Show success message
        // setFormSubmitted(true)

        // Refetch the list of deliveries instead of manually adding a new one
        await refetch()
      } else {
        // Show error message
        alert(result.message || "Une erreur s'est produite. Veuillez réessayer.")
      }
    } catch (error) {
      console.error("Error submitting form:", error)
      alert("Une erreur s'est produite lors de la connexion au serveur. Veuillez réessayer.")
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
        return "Échantillon médical"
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

  const handleAddAnotherOrder = () => {
    // Réinitialiser le formulaire
    // setFormSubmitted(false)
    setPickupAddress("")
    setDropoffAddress("")
    setRecipientName("")
    setItemType("")
  }

  // Déterminer automatiquement le type de tableau de bord en fonction du type de compte de l'utilisateur
  const dashboardType = user?.account_type === "hospital" ? "hopital" : "entreprise"

  // Filtrer les livraisons pour les entreprises
  const filteredDeliveries = deliveries.filter((delivery) => {
    // Filtre par statut
    const mappedStatus = statusMapping[delivery.status] || delivery.status
    if (statusFilter !== "tous" && mappedStatus !== statusFilter) {
      return false
    }

    // Filtre par date
    if (date) {
      const deliveryDate = delivery.pickup_date ? new Date(delivery.pickup_date) : null
      if (!deliveryDate || format(deliveryDate, "yyyy-MM-dd") !== format(date, "yyyy-MM-dd")) {
        return false
      }
    }

    // Filtre par recherche
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase()
      const packageCode = delivery.package_code?.toLowerCase() || ""
      const deliveryId = delivery.delivery_id?.toLowerCase() || ""
      const pickupAddress = delivery.pickup_address?.address_line?.toLowerCase() || ""
      const dropoffAddress = delivery.recipient?.address?.address_line?.toLowerCase() || ""
      const packageTitle = delivery.package?.title?.toLowerCase() || ""

      if (
        !packageCode.includes(searchLower) &&
        !deliveryId.includes(searchLower) &&
        !pickupAddress.includes(searchLower) &&
        !dropoffAddress.includes(searchLower) &&
        !packageTitle.includes(searchLower)
      ) {
        return false
      }
    }

    return true
  })

  // Filtrer les échantillons pour les hôpitaux
  const filteredSamples = labSamples.filter((sample) => {
    // Filtre par statut
    if (statusFilter !== "tous" && sample.status !== statusFilter) {
      return false
    }

    // Filtre par date
    if (date && format(date, "yyyy-MM-dd") !== sample.date) {
      return false
    }

    // Filtre par recherche
    if (
      searchQuery &&
      !sample.id.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !sample.patientId.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !sample.sampleType.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !sample.origin.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !sample.destination.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false
    }

    return true
  })

  return (
    <RoleGuard allowedRoles={["enterprise", "hospital", "admin", "personal"]}>
      <div className="container px-2 py-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#2B015F]">Tableau de bord</h1>
            <p className="text-gray-600">
              {user?.role === "hospital" ? "Gérez et suivez vos échantillons" : "Gérez et suivez vos livraisons"}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex items-center gap-2">
              <div className="bg-gray-100 p-2 rounded-full">
                <User className="h-5 w-5 text-gray-600" />
              </div>
              <div className="text-sm">
                <div className="font-medium">{user?.name || `${user?.first_name} ${user?.last_name}`}</div>
                <div className="text-gray-500 text-xs">{user?.organizationName}</div>
              </div>
            </div>
            <Button
              variant="outline"
              className="relative border-[#2B015F] text-[#2B015F] hover:bg-purple-50 bg-transparent"
              onClick={navigateToCatalogue}
            >
              <Package className="mr-2 h-4 w-4" />
              Catalogue
              <Badge className="ml-2 bg-[#FBC140] text-black hover:bg-[#FBC140]/90 text-xs">Bientôt</Badge>
            </Button>
            <Button
              variant="outline"
              className="border-[#2B015F] text-[#2B015F] hover:bg-purple-50 bg-transparent"
              onClick={navigateToPreDelivery}
            >
              <FileText className="mr-2 h-4 w-4" />
              Pré-livraisons
            </Button>
            <Button className="bg-[#FBC140] text-black hover:bg-[#FBC140]/90" onClick={navigateToNewOrder}>
              <Plus className="mr-2 h-4 w-4" /> Nouvelle commande
            </Button>
            <Button
              variant="outline"
              className="border-[#2B015F] text-[#2B015F] hover:bg-purple-50 bg-transparent"
              onClick={() => router.push("/dashboard/settings")}
            >
              <Settings className="mr-2 h-4 w-4" /> Parametres
            </Button>
            <Button variant="outline" onClick={() => logout()}>
              <LogOut className="mr-2 h-4 w-4" /> Déconnexion
            </Button>
          </div>
        </div>

        {user?.account_type === "enterprise" ? (
          <EnterpriseDashboard
            deliveries={deliveries}
            filteredDeliveries={filteredDeliveries}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            date={date}
            setDate={setDate}
            isLoading={isLoadingDeliveries}
            error={deliveriesError}
            refetch={refetch}
          />
        ) : user?.account_type === "personal" ? (
          <EnterpriseDashboard
            deliveries={deliveries}
            filteredDeliveries={filteredDeliveries}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            date={date}
            setDate={setDate}
            isLoading={isLoadingDeliveries}
            error={deliveriesError}
            refetch={refetch}
          />
        ) : (
          <HospitalDashboard
            labSamples={labSamples}
            filteredSamples={filteredSamples}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            date={date}
            setDate={setDate}
          />
        )}
      </div>
    </RoleGuard>
  )
}
