"use client"

import React from "react"

import type { ReactNode } from "react"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  ChevronDown,
  ChevronRight,
  Package,
  MapPin,
  Clock,
  CheckCircle,
  Truck,
  AlertCircle,
  XCircle,
  Loader2,
  ClipboardCheck,
  UserPlus,
  Users,
  Edit,
  Eye,
  CheckCircle2,
  Calendar,
} from "lucide-react"
import { formatDate, formatDateTime } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"

// Function to format date with French day names
const formatDateWithDay = (timestamp: number): string => {
  const date = new Date(timestamp)
  const dayNames = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"]
  const dayName = dayNames[date.getDay()]
  const formattedDateTime = formatDateTime(date.toISOString())
  return `${dayName}, ${formattedDateTime}`
}

// Status mapping for French translations and colors
const statusMap: Record<string, { label: string; color: string }> = {
  unassigned: { label: "En attente", color: "bg-yellow-100 text-yellow-800" },
  assigned: { label: "Assignée", color: "bg-blue-100 text-blue-800" },
  delivery_start_to_pickup: { label: "En route pour ramassage", color: "bg-blue-100 text-blue-800" },
  picked: { label: "Ramassée", color: "bg-indigo-100 text-indigo-800" },
  delivery_start_to_recipient: { label: "En route pour livraison", color: "bg-purple-100 text-purple-800" },
  arrived_to_recipient: { label: "Arrivée chez destinataire", color: "bg-purple-100 text-purple-800" },
  delivered: { label: "Livrée", color: "bg-green-100 text-green-800" },
  failed_pickup: { label: "Échec de ramassage", color: "bg-red-100 text-red-800" },
  unreachable_recipient: { label: "Destinataire injoignable", color: "bg-red-100 text-red-800" },
  refused: { label: "Refusée", color: "bg-red-100 text-red-800" },
  postponed: { label: "Reportée", color: "bg-orange-100 text-orange-800" },
  cancelled: { label: "Annulée", color: "bg-gray-100 text-gray-800" },
}

// Type mapping for French translations
const typeMap: Record<string, string> = {
  express: "Express",
  standard: "Standard",
  economy: "Économique",
}

// Event action mapping for French translations
const eventActionMap: Record<string, { label: string; icon: ReactNode }> = {
  arrived_to_pickup: {
    label: "Arrivé au point de ramassage",
    icon: <MapPin className="h-5 w-5 text-blue-500" />,
  },
  item_pickup: {
    label: "Colis ramassé",
    icon: <Package className="h-5 w-5 text-indigo-500" />,
  },
  failed_pickup: {
    label: "Échec de ramassage",
    icon: <XCircle className="h-5 w-5 text-red-500" />,
  },
  delivery_start_to_pickup: {
    label: "En route pour ramassage",
    icon: <Truck className="h-5 w-5 text-blue-500" />,
  },
  delivery_start_to_recipient: {
    label: "En route pour livraison",
    icon: <Truck className="h-5 w-5 text-purple-500" />,
  },
  refused: {
    label: "Livraison refusée",
    icon: <XCircle className="h-5 w-5 text-red-500" />,
  },
  receiver_unreachable: {
    label: "Destinataire injoignable",
    icon: <AlertCircle className="h-5 w-5 text-red-500" />,
  },
  arrived_to_recipient: {
    label: "Arrivé chez le destinataire",
    icon: <MapPin className="h-5 w-5 text-purple-500" />,
  },
  completed_delivery: {
    label: "Livraison complétée",
    icon: <CheckCircle className="h-5 w-5 text-green-500" />,
  },
}

// Delivery stages for progress tracking
const deliveryStages = [
  { key: "ordered", label: "Commandé", icon: <ClipboardCheck className="h-4 w-4" /> },
  { key: "pickup_in_progress", label: "Ramassage", icon: <Truck className="h-4 w-4" /> },
  { key: "picked_up", label: "Ramassé", icon: <Package className="h-4 w-4" /> },
  { key: "delivery_in_progress", label: "Livraison", icon: <Truck className="h-4 w-4" /> },
  { key: "delivered", label: "Livré", icon: <CheckCircle className="h-4 w-4" /> },
]

// Map delivery status to stage
const getDeliveryStage = (status: string, events: DeliveryEvent[] = []): number => {
  // Check for completed delivery in events first
  const hasCompletedDelivery = events.some((event) => event.action === "completed_delivery")
  if (hasCompletedDelivery) return 4 // Delivered stage

  // Check for delivery issues
  const hasDeliveryIssues = events.some((event) => ["refused", "receiver_unreachable"].includes(event.action))
  if (hasDeliveryIssues) return 3 // Stuck at delivery stage

  // Map status to stage
  switch (status) {
    case "unassigned":
    case "assigned":
      return 0 // Ordered
    case "delivery_start_to_pickup":
    case "arrived_to_pickup":
      return 1 // Pickup in progress
    case "picked":
    case "failed_pickup":
      return 2 // Picked up (or failed)
    case "delivery_start_to_recipient":
    case "arrived_to_recipient":
    case "unreachable_recipient":
      return 3 // Delivery in progress
    case "delivered":
      return 4 // Delivered
    default:
      return 0 // Default to ordered
  }
}

// Get color for stage
const getStageColor = (currentStage: number, stageIndex: number, status: string): string => {
  // Handle error states
  if (["failed_pickup", "unreachable_recipient", "refused"].includes(status)) {
    return stageIndex <= currentStage ? "bg-red-500" : "bg-gray-200"
  }

  // Normal progression
  if (stageIndex < currentStage) return "bg-green-500" // Completed stages
  if (stageIndex === currentStage) {
    // Current stage
    if (currentStage === 4) return "bg-green-500" // Delivered
    return "bg-blue-500" // In progress
  }
  return "bg-gray-200" // Future stages
}

interface DeliveryEvent {
  _id: string
  message: string
  deliverer_id: string
  delivery_id: string
  event_name: string
  action: string
  location_latitude: number
  location_longitude: number
  data: any
  created_at: string
}

interface Deliverer {
  _id: string
  deliverer_id: string
  name: string
  last_name: string
  first_name: string
  phone_number: string
  email: string
  status: boolean
  is_activated: boolean
  delivery_zone: {
    id: string
    name: string
  }
  address: string
  card_id: string
}

interface BackofficeDeliveryTableProps {
  deliveries: any[]
  expandable?: boolean
  onDeliveryUpdate?: () => void
  onCancelDelivery?: (cancelData: { delivery_id: string; reason?: string }) => Promise<void>
  readOnly?: boolean
}

const deliveryStatusOptions = [
  { value: "unassigned", label: "En attente" },
  { value: "assigned", label: "Assignée" },
  { value: "delivery_start_to_pickup", label: "En route pour ramassage" },
  { value: "failed_pickup", label: "Échec de ramassage" },
  { value: "picked", label: "Ramassée" },
  { value: "delivery_start_to_recipient", label: "En route pour livraison" },
  { value: "arrived_to_recipient", label: "Arrivée chez destinataire" },
  { value: "unreachable_recipient", label: "Destinataire injoignable" },
  { value: "refused", label: "Refusée" },
  { value: "delivered", label: "Livrée" },
]

export function BackofficeDeliveryTable({
  deliveries,
  expandable = false,
  onDeliveryUpdate,
  onCancelDelivery,
  readOnly = false,
}: BackofficeDeliveryTableProps) {
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({})
  const [deliveryEvents, setDeliveryEvents] = useState<Record<string, DeliveryEvent[]>>({})
  const [loadingEvents, setLoadingEvents] = useState<Record<string, boolean>>({})
  const [errorEvents, setErrorEvents] = useState<Record<string, string>>({})
  const [deliverers, setDeliverers] = useState<Deliverer[]>([])
  const [loadingDeliverers, setLoadingDeliverers] = useState(false)
  const [assignDialogOpen, setAssignDialogOpen] = useState<string | null>(null)
  const [selectedDeliverer, setSelectedDeliverer] = useState<string>("")
  const [selectedPicker, setSelectedPicker] = useState<string>("")
  const [assigningDelivery, setAssigningDelivery] = useState<string | null>(null)
  const [statusUpdateDialogOpen, setStatusUpdateDialogOpen] = useState<string | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<string>("")
  const [statusReason, setStatusReason] = useState<string>("")
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)
  const [mobileDetailOpen, setMobileDetailOpen] = useState<string | null>(null)
  const [cancelDialogOpen, setCancelDialogOpen] = useState<string | null>(null)
  const [cancelReason, setCancelReason] = useState("")
  const [cancellingDelivery, setCancellingDelivery] = useState<string | null>(null)
  const [confirmingDelivery, setConfirmingDelivery] = useState<string | null>(null)
  const [postponeDialogOpen, setPostponeDialogOpen] = useState<string | null>(null)
  const [postponeDate, setPostponeDate] = useState("")
  const [postponeTime, setPostponeTime] = useState("")
  const [postponeReason, setPostponeReason] = useState("")
  const [postponingDelivery, setPostponingDelivery] = useState<string | null>(null)
  const { toast } = useToast()

  const toggleRow = async (deliveryId: string) => {
    if (!expandable) return

    const newExpandedState = !expandedRows[deliveryId]

    setExpandedRows((prev) => ({
      ...prev,
      [deliveryId]: newExpandedState,
    }))

    // Fetch events when expanding a row
    if (newExpandedState && !deliveryEvents[deliveryId]) {
      fetchDeliveryEvents(deliveryId)
    }
  }

  const fetchDeliveryEvents = async (deliveryId: string) => {
    setLoadingEvents((prev) => ({ ...prev, [deliveryId]: true }))
    setErrorEvents((prev) => ({ ...prev, [deliveryId]: "" }))

    try {
      const apiUrl = `${process.env.NEXT_PUBLIC_API_SERVER_BASE_URL}/deliveries/events?delivery_id=${deliveryId}`
      const response = await fetch(apiUrl)

      if (!response.ok) {
        throw new Error(`Erreur lors de la récupération des événements: ${response.status}`)
      }

      const result = await response.json()

      if (result.success && result.data) {
        setDeliveryEvents((prev) => ({ ...prev, [deliveryId]: result.data }))
      } else {
        throw new Error(result.message || "Erreur lors de la récupération des événements")
      }
    } catch (error) {
      console.error("Error fetching delivery events:", error)
      setErrorEvents((prev) => ({
        ...prev,
        [deliveryId]: error instanceof Error ? error.message : "Erreur inconnue",
      }))
    } finally {
      setLoadingEvents((prev) => ({ ...prev, [deliveryId]: false }))
    }
  }

  const fetchDeliverers = async () => {
    if (deliverers.length > 0) return // Already loaded

    setLoadingDeliverers(true)
    try {
      const apiUrl = `${process.env.NEXT_PUBLIC_API_SERVER_BASE_URL}/auth/deliverers`
      const response = await fetch(apiUrl)

      if (!response.ok) {
        throw new Error(`Erreur lors de la récupération des livreurs: ${response.status}`)
      }

      const result = await response.json()

      if (result.success && result.data) {
        // Filter to only show activated deliverers
        const activeDeliverers = result.data.filter((deliverer: Deliverer) => deliverer.is_activated)
        setDeliverers(activeDeliverers)
      } else {
        throw new Error(result.message || "Erreur lors de la récupération des livreurs")
      }
    } catch (error) {
      console.error("Error fetching deliverers:", error)
      toast({
        title: "Erreur",
        description: "Impossible de charger la liste des livreurs",
        variant: "destructive",
      })
    } finally {
      setLoadingDeliverers(false)
    }
  }

  const handleAssignDelivery = async (deliveryId: string) => {
    const hasDeliverer = selectedDeliverer && selectedDeliverer !== "none"
    const hasPicker = selectedPicker && selectedPicker !== "none"

    if (!hasDeliverer && !hasPicker) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner au moins un livreur ou un ramasseur",
        variant: "destructive",
      })
      return
    }

    setAssigningDelivery(deliveryId)

    try {
      const apiUrl = `${process.env.NEXT_PUBLIC_API_SERVER_BASE_URL || "https://daredare-api.iglobia.com"}/deliveries/assign-delivery-to-deliverer`
      const errors: string[] = []
      let successCount = 0

      // Assign deliverer if selected
      if (hasDeliverer) {
        const delivererResponse = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            deliverer_id: selectedDeliverer,
            delivery_id: deliveryId,
            as: "deliverer",
          }),
        })

        const delivererResult = await delivererResponse.json()
        if (delivererResult.success) {
          successCount++
        } else {
          errors.push(`Livreur: ${delivererResult.message || "Erreur"}`)
        }
      }

      // Assign picker if selected
      if (hasPicker) {
        const pickerResponse = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            deliverer_id: selectedPicker,
            delivery_id: deliveryId,
            as: "picker",
          }),
        })

        const pickerResult = await pickerResponse.json()
        if (pickerResult.success) {
          successCount++
        } else {
          errors.push(`Ramasseur: ${pickerResult.message || "Erreur"}`)
        }
      }

      if (successCount > 0) {
        toast({
          title: "Succès",
          description: errors.length > 0 
            ? `${successCount} assignation(s) réussie(s). Erreurs: ${errors.join(", ")}`
            : `${successCount} assignation(s) réussie(s)`,
        })
        setAssignDialogOpen(null)
        setSelectedDeliverer("")
        setSelectedPicker("")

        // Add a small delay to show the success message before refreshing
        setTimeout(() => {
          onDeliveryUpdate?.() // Refresh the deliveries list
        }, 1000)
      } else {
        throw new Error(errors.join(", "))
      }
    } catch (error) {
      console.error("Error assigning delivery:", error)
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur lors de l'assignation",
        variant: "destructive",
      })
    } finally {
      setAssigningDelivery(null)
    }
  }

  const openAssignDialog = (deliveryId: string) => {
    setAssignDialogOpen(deliveryId)
    setSelectedDeliverer("")
    setSelectedPicker("")
    fetchDeliverers()
  }

  const handleUpdateDeliveryStatus = async (deliveryId: string, status: string, reason?: string) => {
    setUpdatingStatus(deliveryId)

    try {
      const apiUrl = `${process.env.NEXT_PUBLIC_API_SERVER_BASE_URL}/deliveries/admin-update-delivery-status`
      const response = await fetch(apiUrl, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          delivery_id: deliveryId,
          status: status,
          ...(reason && { reason }),
        }),
      })

      if (!response.ok) {
        throw new Error(`Erreur lors de la mise à jour du statut: ${response.status}`)
      }

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Succès",
          description: "Statut de livraison mis à jour avec succès",
        })
        setStatusUpdateDialogOpen(null)
        setSelectedStatus("")
        setStatusReason("")

        // Add a small delay to show the success message before refreshing
        setTimeout(() => {
          onDeliveryUpdate?.() // Refresh the deliveries list
        }, 1000)
      } else {
        throw new Error(result.message || "Erreur lors de la mise à jour du statut")
      }
    } catch (error) {
      console.error("Error updating delivery status:", error)
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur lors de la mise à jour du statut",
        variant: "destructive",
      })
    } finally {
      setUpdatingStatus(null)
    }
  }

  const openStatusUpdateDialog = (deliveryId: string, currentStatus: string) => {
    setStatusUpdateDialogOpen(deliveryId)
    setSelectedStatus(currentStatus)
    setStatusReason("")
  }

  const openMobileDetail = (deliveryId: string) => {
    setMobileDetailOpen(deliveryId)
    // Fetch events if not already loaded
    if (!deliveryEvents[deliveryId]) {
      fetchDeliveryEvents(deliveryId)
    }
  }

  const handleCancelDelivery = async (deliveryId: string, reason?: string) => {
    if (!onCancelDelivery) return

    setCancellingDelivery(deliveryId)

    try {
      await onCancelDelivery({ delivery_id: deliveryId, reason: reason || "" })
      toast({
        title: "Succès",
        description: "Livraison annulée avec succès",
      })
      setCancelDialogOpen(null)
      setCancelReason("")

      // Add a small delay to show the success message before refreshing
      setTimeout(() => {
        onDeliveryUpdate?.()
      }, 1000)
    } catch (error) {
      console.error("Error canceling delivery:", error)
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur lors de l'annulation",
        variant: "destructive",
      })
    } finally {
      setCancellingDelivery(null)
    }
  }

  const canCancelDelivery = (status: string) => {
    return status === "unassigned" || status === "assigned"
  }

  const handleConfirmDelivery = async (deliveryId: string) => {
    setConfirmingDelivery(deliveryId)

    try {
      const apiUrl = `${process.env.NEXT_PUBLIC_API_SERVER_BASE_URL}/deliveries/confirm-deliverer-and-picker-assignment`
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          delivery_id: deliveryId,
        }),
      })

      if (!response.ok) {
        throw new Error(`Erreur lors de la confirmation: ${response.status}`)
      }

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Succès",
          description: "Livraison confirmée avec succès",
        })

        // Call onDeliveryUpdate to invalidate queries instead of reloading all data
        onDeliveryUpdate?.()
      } else {
        throw new Error(result.message || "Erreur lors de la confirmation")
      }
    } catch (error) {
      console.error("Error confirming delivery:", error)
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur lors de la confirmation",
        variant: "destructive",
      })
    } finally {
      setConfirmingDelivery(null)
    }
  }

  const handlePostponeDelivery = async (deliveryId: string) => {
    if (!postponeDate || !postponeTime) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner une date et une heure",
        variant: "destructive",
      })
      return
    }

    setPostponingDelivery(deliveryId)

    try {
      // Convert date and time to epoch time (milliseconds)
      const dateTimeString = `${postponeDate}T${postponeTime}`
      const postponedToEpoch = new Date(dateTimeString).getTime()

      const apiUrl = `${process.env.NEXT_PUBLIC_API_SERVER_BASE_URL}/deliveries/events`
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          event_name: "delivery_state_update",
          delivery_id: deliveryId,
          action: "postponed",
          data: {
            postponed_by_user_role: "admin",
            postponed_by_user_id: "admin",
            postponed_to: postponedToEpoch,
            reason: postponeReason || "",
          },
        }),
      })

      if (!response.ok) {
        throw new Error(`Erreur lors du report: ${response.status}`)
      }

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Succès",
          description: "Livraison reportée avec succès",
        })
        setPostponeDialogOpen(null)
        setPostponeDate("")
        setPostponeTime("")
        setPostponeReason("")

        // Call onDeliveryUpdate to invalidate queries
        onDeliveryUpdate?.()
      } else {
        throw new Error(result.message || "Erreur lors du report")
      }
    } catch (error) {
      console.error("Error postponing delivery:", error)
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur lors du report",
        variant: "destructive",
      })
    } finally {
      setPostponingDelivery(null)
    }
  }

  const openPostponeDialog = (deliveryId: string) => {
    setPostponeDialogOpen(deliveryId)
    setPostponeDate("")
    setPostponeTime("")
    setPostponeReason("")
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {expandable && <TableHead className="w-10 hidden md:table-cell"></TableHead>}
            <TableHead className="hidden md:table-cell">Code</TableHead>
            <TableHead className="hidden md:table-cell">Client</TableHead>
            <TableHead>Destinataire</TableHead>
            <TableHead className="hidden md:table-cell">Adresse</TableHead>
            <TableHead className="hidden md:table-cell">Date</TableHead>
            <TableHead className="hidden md:table-cell">Date ramassage</TableHead>
            <TableHead className="hidden md:table-cell">Date livraison préférée</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead className="hidden md:table-cell">Livreur</TableHead>
            <TableHead className="hidden md:table-cell">Ramasseur</TableHead>
            <TableHead className="text-right hidden md:table-cell">Frais</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {deliveries.length === 0 ? (
            <TableRow>
              <TableCell colSpan={expandable ? 13 : 12} className="h-24 text-center">
                Aucune livraison trouvée
              </TableCell>
            </TableRow>
          ) : (
            deliveries.map((delivery) => (
              <>
                <TableRow
                  key={delivery.delivery_id}
                  className={`${expandable ? "cursor-pointer hover:bg-gray-50" : ""} ${expandable ? "md:hover:bg-gray-50" : ""} ${!delivery.is_admin_confirmed ? "bg-red-50/50 hover:bg-red-50" : ""}`}
                  onClick={(e) => {
                    // Don't expand if clicking on action buttons
                    if ((e.target as HTMLElement).closest("button")) return
                    // Prevent opening mobile detail if clicking on expandable row on desktop
                    if (window.innerWidth < 768 && expandable) {
                      e.stopPropagation()
                      openMobileDetail(delivery.delivery_id)
                    } else {
                      toggleRow(delivery.delivery_id)
                    }
                  }}
                >
                  {expandable && (
                    <TableCell className="py-2 hidden md:table-cell">
                      {expandedRows[delivery.delivery_id] ? (
                        <ChevronDown className="h-4 w-4 text-gray-500" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-gray-500" />
                      )}
                    </TableCell>
                  )}
                  <TableCell className="font-medium hidden md:table-cell">{delivery.package_code}</TableCell>
                  <TableCell className="hidden md:table-cell">{delivery.customer?.name || "N/A"}</TableCell>
                  <TableCell>{delivery.recipient?.name || "N/A"} ({delivery.recipient?.phone_number || "--"})</TableCell>
                  <TableCell className="max-w-[200px] truncate hidden md:table-cell">
                    {delivery.recipient?.address?.address_line || "N/A"}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{formatDate(delivery.created_at)}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    {delivery.pickup_date ? formatDateWithDay(delivery.pickup_date) : "-"}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {delivery.preferred_delivery_date ? formatDateWithDay(delivery.preferred_delivery_date) : "-"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={`${statusMap[delivery.status]?.color || "bg-gray-100 text-gray-800"} cursor-pointer hover:opacity-80 transition-opacity`}
                      onClick={(e) => {
                        e.stopPropagation()
                        openStatusUpdateDialog(delivery.delivery_id, delivery.status)
                      }}
                    >
                      {statusMap[delivery.status]?.label || delivery.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {delivery.deliverer ? (
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-green-600" />
                        <div>
                          <p className="text-sm font-medium">{delivery.deliverer?.name}</p>
                          <p className="text-xs text-gray-500">{delivery.deliverer?.phone_number}</p>
                        </div>
                      </div>
                    ) : (
                      <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                        Non assigné
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {delivery.picker ? (
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-blue-600" />
                        <div>
                          <p className="text-sm font-medium">{delivery.picker?.name}</p>
                          <p className="text-xs text-gray-500">{delivery.picker?.phone_number}</p>
                        </div>
                      </div>
                    ) : (
                      <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                        Non assigné
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right hidden md:table-cell">
                    {delivery.delivery_fees_cdf?.toLocaleString()} CDF
                  </TableCell>
                  {!readOnly && (
                    <TableCell>
                      <div className="flex items-center gap-2 justify-center">
                        {/* Mobile: Show only view details button */}
                        <Button
                          variant="outline"
                          size="sm"
                          className="md:hidden bg-transparent"
                          onClick={(e) => {
                            e.stopPropagation()
                            openMobileDetail(delivery.delivery_id)
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>

                <Dialog
                  open={mobileDetailOpen === delivery.delivery_id}
                  onOpenChange={(open) => !open && setMobileDetailOpen(null)}
                >
                  <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Détails de la livraison</DialogTitle>
                      <DialogDescription>Code: {delivery.package_code}</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                      {!delivery.is_admin_confirmed && (
                        <div className="bg-red-50 border border-red-200 rounded-md p-3">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 text-red-600" />
                            <p className="text-sm font-medium text-red-800">
                              Cette livraison n'est pas encore confirmée
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Status and Progress */}
                      <div>
                        <h4 className="text-sm font-semibold mb-2">Statut</h4>
                        <Badge className={statusMap[delivery.status]?.color || "bg-gray-100 text-gray-800"}>
                          {statusMap[delivery.status]?.label || delivery.status}
                        </Badge>
                      </div>

                      {/* Delivery Progress */}
                      <div>
                        <h4 className="text-sm font-semibold mb-3">Progression</h4>
                        <div className="space-y-2">
                          {deliveryStages.map((stage, index) => {
                            const currentStage = getDeliveryStage(delivery.status, deliveryEvents[delivery.delivery_id])
                            const isActive = index === currentStage
                            const isError =
                              ["failed_pickup", "unreachable_recipient", "refused"].includes(delivery.status) &&
                              index === currentStage
                            const isCompleted = index < currentStage // Determine isCompleted based on currentStage

                            return (
                              <div key={stage.key} className="flex items-center gap-3">
                                <div
                                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                    isCompleted
                                      ? "bg-green-500"
                                      : isActive
                                        ? isError
                                          ? "bg-red-500"
                                          : "bg-blue-500"
                                        : "bg-gray-200"
                                  }`}
                                >
                                  {React.cloneElement(stage.icon as React.ReactElement, {
                                    className: `h-4 w-4 ${isCompleted || isActive ? "text-white" : "text-gray-500"}`,
                                  })}
                                </div>
                                <span className={`text-sm ${isActive ? "font-semibold" : ""}`}>{stage.label}</span>
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      {/* Client and Recipient */}
                      <div>
                        <h4 className="text-sm font-semibold mb-2">Client</h4>
                        <p className="text-sm">{delivery.customer?.name || "N/A"}</p>
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold mb-2">Destinataire</h4>
                        <p className="text-sm font-medium">{delivery.recipient?.name || "N/A"} </p>
                        <p className="text-sm text-gray-600 mt-1">{delivery.recipient?.phone_number || "N/A"}</p>
                      </div>

                      {/* Addresses */}
                      <div>
                        <h4 className="text-sm font-semibold mb-2">Adresse de ramassage</h4>
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <div className="text-sm">
                            <p>{delivery.pickup_address?.address_line}</p>
                            {delivery.pickup_address?.address_second_line && (
                              <p className="text-gray-600">{delivery.pickup_address.address_second_line}</p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold mb-2">Adresse de livraison</h4>
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <div className="text-sm">
                            <p>{delivery.recipient?.address?.address_line}</p>
                            {delivery.recipient?.address?.address_second_line && (
                              <p className="text-gray-600">{delivery.recipient.address.address_second_line}</p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Package Info */}
                      <div>
                        <h4 className="text-sm font-semibold mb-2">Informations du colis</h4>
                        <div className="space-y-1 text-sm">
                          <p>
                            <span className="font-medium">Titre:</span> {delivery.package?.title || "N/A"}
                          </p>
                          {delivery.package?.description && (
                            <p>
                              <span className="font-medium">Description:</span> {delivery.package.description}
                            </p>
                          )}
                          <p>
                            <span className="font-medium">Type:</span>{" "}
                            <Badge variant="outline" className="ml-1">
                              {typeMap[delivery.type] || delivery.type}
                            </Badge>
                          </p>
                          {delivery.package?.package_value && (
                            <p>
                              <span className="font-medium">Valeur:</span> {delivery.package.package_value.value}{" "}
                              {delivery.package.package_value.currency}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Dates */}
                      <div>
                        <h4 className="text-sm font-semibold mb-2">Dates</h4>
                        <div className="space-y-1 text-sm">
                          <p>
                            <span className="font-medium">Date de commande:</span> {formatDate(delivery.created_at)}
                          </p>
                          {delivery.pickup_date && (
                            <p>
                              <span className="font-medium">Date de ramassage:</span>{" "}
                              {formatDateWithDay(delivery.pickup_date)}
                            </p>
                          )}
                          {delivery.preferred_delivery_date && (
                            <p>
                              <span className="font-medium">Date de livraison préférée:</span>{" "}
                              {formatDateWithDay(delivery.preferred_delivery_date)}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Deliverer */}
                      <div>
                        <h4 className="text-sm font-semibold mb-2">Livreur</h4>
                        {delivery.deliverer ? (
                          <div className="space-y-1 text-sm">
                            <p className="font-medium">{delivery.deliverer?.name || "N/A"}</p>
                            <p className="text-gray-600">{delivery.deliverer.phone_number || "Pas de numéro"}</p>
                          </div>
                        ) : (
                          <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                            Non assigné
                          </Badge>
                        )}
                      </div>

                      {/* Cancellation Reason */}
                      {delivery.status === "cancelled" && delivery.cancellation_reason && (
                        <div>
                          <h4 className="text-sm font-semibold mb-2">Raison d'annulation</h4>
                          <div className="bg-red-50 border border-red-200 rounded-md p-3">
                            <p className="text-sm text-red-800">{delivery.cancellation_reason}</p>
                          </div>
                        </div>
                      )}

                      {/* Postponement Information */}
                      {delivery.status === "postponed" && (delivery.postponed_to || delivery.postponement_reason) && (
                        <div>
                          <h4 className="text-sm font-semibold mb-2">Informations de report</h4>
                          <div className="bg-orange-50 border border-orange-200 rounded-md p-3 space-y-2">
                            {delivery.postponed_to && (
                              <div>
                                <p className="text-xs font-medium text-orange-900">Reportée au:</p>
                                <p className="text-sm text-orange-800">{formatDateWithDay(delivery.postponed_to)}</p>
                              </div>
                            )}
                            {delivery.postponement_reason && (
                              <div>
                                <p className="text-xs font-medium text-orange-900">Raison:</p>
                                <p className="text-sm text-orange-800">{delivery.postponement_reason}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Fees */}
                      <div>
                        <h4 className="text-sm font-semibold mb-2">Frais de livraison</h4>
                        <div className="space-y-1 text-sm">
                          <p className="font-medium">{delivery.delivery_fees?.toLocaleString()} USD</p>
                          <p className="text-gray-600">{(delivery.delivery_fees * 2800).toFixed(0)} CDF</p>
                        </div>
                      </div>

                      {/* Events Timeline */}
                      <div>
                        <h4 className="text-sm font-semibold mb-3">Historique</h4>
                        {loadingEvents[delivery.delivery_id] ? (
                          <div className="flex items-center justify-center py-4">
                            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                            <span className="ml-2 text-sm text-gray-500">Chargement...</span>
                          </div>
                        ) : errorEvents[delivery.delivery_id] ? (
                          <div className="flex items-center text-red-500 text-sm">
                            <AlertCircle className="h-4 w-4 mr-2" />
                            <span>{errorEvents[delivery.delivery_id]}</span>
                          </div>
                        ) : deliveryEvents[delivery.delivery_id]?.length ? (
                          <div className="space-y-3">
                            {deliveryEvents[delivery.delivery_id].map((event) => (
                              <div key={event._id} className="flex gap-3 pb-3 border-b last:border-b-0">
                                <div className="flex-shrink-0 mt-0.5">
                                  {eventActionMap[event.action]?.icon || <Clock className="h-5 w-5 text-gray-400" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium">
                                    {eventActionMap[event.action]?.label || event.action}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-0.5">{formatDateTime(event.created_at)}</p>
                                  {event.message && <p className="text-sm text-gray-600 mt-1">{event.message}</p>}

                                  {/* CHANGE> Added delivery photo and signature display */}
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
                                  {/* </CHANGE> */}

                                  {/* Display event data if available */}
                                  {event.data && (
                                    <div className="mt-2 space-y-2">
                                      {/* Display image if available */}
                                      {event.data.image_url && (
                                        <div className="mt-2">
                                          <img
                                            src={event.data.image_url || "/placeholder.svg"}
                                            alt="Événement de livraison"
                                            className="max-w-full rounded-lg border"
                                            onError={(e) => {
                                              e.currentTarget.style.display = "none"
                                            }}
                                          />
                                        </div>
                                      )}

                                      {/* Display additional message from data if different from main message */}
                                      {event.data.message && event.data.message !== event.message && (
                                        <p className="text-sm text-gray-600 italic">{event.data.message}</p>
                                      )}

                                      {/* Display location info if available */}
                                      {event.location_latitude && event.location_longitude && (
                                        <p className="text-xs text-gray-500">
                                          📍 Coordonnées: {event.location_latitude.toFixed(6)},{" "}
                                          {event.location_longitude.toFixed(6)}
                                        </p>
                                      )}

                                      {/* Display any other relevant data */}
                                      {event.data.notes && (
                                        <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                                          <strong>Notes:</strong> {event.data.notes}
                                        </p>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">Aucun événement disponible</p>
                        )}
                      </div>
                    </div>

                    <DialogFooter className="flex-col sm:flex-row gap-2">
                      {!delivery.is_admin_confirmed && (
                        <Button
                          className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleConfirmDelivery(delivery.delivery_id)
                          }}
                          disabled={confirmingDelivery === delivery.delivery_id}
                        >
                          {confirmingDelivery === delivery.delivery_id ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              Confirmation...
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Confirmer la livraison
                            </>
                          )}
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        className="w-full sm:w-auto bg-transparent"
                        onClick={(e) => {
                          e.stopPropagation()
                          setMobileDetailOpen(null)
                          openAssignDialog(delivery.delivery_id)
                        }}
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        {delivery.deliverer ? "Réassigner" : "Assigner"} livreur
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full sm:w-auto bg-transparent"
                        onClick={(e) => {
                          e.stopPropagation()
                          setMobileDetailOpen(null)
                          openStatusUpdateDialog(delivery.delivery_id, delivery.status)
                        }}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Modifier statut
                      </Button>
                      {onCancelDelivery && canCancelDelivery(delivery.status) && (
                        <Button
                          variant="destructive"
                          className="w-full sm:w-auto"
                          onClick={(e) => {
                            e.stopPropagation()
                            setMobileDetailOpen(null)
                            setCancelDialogOpen(delivery.delivery_id)
                          }}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Annuler livraison
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        className="w-full sm:w-auto bg-transparent text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                        onClick={(e) => {
                          e.stopPropagation()
                          setMobileDetailOpen(null)
                          openPostponeDialog(delivery.delivery_id)
                        }}
                      >
                        <Calendar className="h-4 w-4 mr-2" />
                        Reporter livraison
                      </Button>
                      <Button
                        className="w-full sm:w-auto bg-[#2B015F] hover:bg-[#2B015F]/90"
                        onClick={() => setMobileDetailOpen(null)}
                      >
                        Fermer
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {/* Desktop expanded view - hide on mobile */}
                {expandable && expandedRows[delivery.delivery_id] && (
                  <TableRow key={`${delivery.delivery_id}-expanded`} className="bg-gray-50 hidden md:table-row">
                    <TableCell colSpan={13} className="p-4">
                      {delivery.is_delivery_price_included !== undefined && (
                        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                          <div className="flex items-center gap-2">
                            {delivery.is_delivery_price_included ? (
                              <>
                                <CheckCircle2 className="h-4 w-4 text-blue-600" />
                                <span className="text-sm font-medium text-blue-900">
                                  Les frais de livraison sont inclus dans le prix
                                </span>
                              </>
                            ) : (
                              <>
                                <XCircle className="h-4 w-4 text-orange-600" />
                                <span className="text-sm font-medium text-orange-900">
                                  Les frais de livraison ne sont pas inclus
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Delivery Progress Indicator */}
                      <div className="mb-6">
                        <h4 className="text-sm font-medium text-gray-500 mb-3">Progression de la livraison</h4>

                        {/* Progress bar */}
                        <div className="relative">
                          {/* Stage indicators */}
                          <div className="flex justify-between mb-2">
                            {deliveryStages.map((stage, index) => {
                              const currentStage = getDeliveryStage(
                                delivery.status,
                                deliveryEvents[delivery.delivery_id],
                              )
                              const stageColor = getStageColor(currentStage, index, delivery.status)
                              const isActive = index === currentStage
                              const isError =
                                ["failed_pickup", "unreachable_recipient", "refused"].includes(delivery.status) &&
                                index === currentStage
                              const isCompleted = index < currentStage // Determine isCompleted based on currentStage

                              return (
                                <div key={stage.key} className="flex flex-col items-center">
                                  <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                      isActive ? "ring-2 ring-offset-2 ring-blue-500" : ""
                                    } ${stageColor} ${isError ? "bg-red-500" : ""}`}
                                  >
                                    {React.cloneElement(stage.icon as React.ReactElement, {
                                      className: `h-4 w-4 ${isCompleted || isActive ? "text-white" : "text-gray-500"}`,
                                    })}
                                  </div>
                                  <span className={`text-xs mt-1 ${isActive ? "font-medium" : ""}`}>{stage.label}</span>
                                </div>
                              )
                            })}
                          </div>

                          {/* Progress line */}
                          <div className="absolute top-4 left-4 right-4 h-0.5 bg-gray-200">
                            <div
                              className={`h-0.5 ${
                                ["failed_pickup", "unreachable_recipient", "refused"].includes(delivery.status)
                                  ? "bg-red-500"
                                  : "bg-blue-500"
                              }`}
                              style={{
                                width: `${Math.min(100, (getDeliveryStage(delivery.status, deliveryEvents[delivery.delivery_id]) / (deliveryStages.length - 1)) * 100)}%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-sm font-medium text-gray-500">Informations du colis</h4>
                            <div className="mt-1 flex items-center gap-2">
                              <Package className="h-4 w-4 text-gray-400" />
                              <span className="font-medium">{delivery.package?.title || "N/A"}</span>
                            </div>
                            <div className="mt-1 flex items-center gap-2">
                              <Badge variant="outline" className="capitalize">
                                {typeMap[delivery.type] || delivery.type}
                              </Badge>
                              <span className="text-sm text-gray-600">Type de livraison</span>
                            </div>
                            {delivery.package?.description && (
                              <p className="text-sm text-gray-600 mt-1">{delivery.package.description}</p>
                            )}
                            {delivery.package?.package_value && (
                              <div className="flex items-center gap-1 mt-1 text-sm">
                                <span className="text-gray-500">Valeur:</span>
                                <span className="font-medium">
                                  {delivery.package.package_value.value} {delivery.package.package_value.currency}
                                </span>
                              </div>
                            )}
                          </div>

                          <div>
                            <h4 className="text-sm font-medium text-gray-500">Adresses</h4>
                            <div className="mt-1">
                              <div className="flex items-start gap-2">
                                <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                                <div>
                                  <span className="text-sm font-medium">Ramassage:</span>
                                  <p className="text-sm text-gray-600">{delivery.pickup_address?.address_line}</p>
                                  {delivery.pickup_address?.address_second_line && (
                                    <p className="text-sm text-gray-600">
                                      {delivery.pickup_address.address_second_line}
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-start gap-2 mt-2">
                                <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                                <div>
                                  <span className="text-sm font-medium">Livraison:</span>
                                  <p className="text-sm text-gray-600">{delivery.recipient?.address?.address_line}</p>
                                  {delivery.recipient?.address?.address_second_line && (
                                    <p className="text-sm text-gray-600">
                                      {delivery.recipient.address.address_second_line}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div>
                            <h4 className="text-sm font-medium text-gray-500">Livreur</h4>
                            <div className="mt-1">
                              {delivery.deliverer ? (
                                <div className="space-y-1">
                                  <p className="text-sm font-medium">{delivery.deliverer?.name || "N/A"}</p>
                                  <p className="text-sm text-gray-600">
                                    {delivery.deliverer.phone_number || "Pas de numéro"}
                                  </p>
                                </div>
                              ) : (
                                <p className="text-sm text-gray-600">Pas encore assigné</p>
                              )}
                            </div>
                          </div>

                          <div>
                            <h4 className="text-sm font-medium text-gray-500">Ramasseur</h4>
                            <div className="mt-1">
                              {delivery.picker ? (
                                <div className="space-y-1">
                                  <p className="text-sm font-medium">{delivery.picker?.name || "N/A"}</p>
                                  <p className="text-sm text-gray-600">
                                    {delivery.picker.phone_number || "Pas de numéro"}
                                  </p>
                                </div>
                              ) : (
                                <p className="text-sm text-gray-600">Pas encore assigné</p>
                              )}
                            </div>
                          </div>

                          {/* Cancellation Reason */}
                          {delivery.status === "cancelled" && delivery.cancellation_reason && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-500">Raison d'annulation</h4>
                              <div className="mt-1 bg-red-50 border border-red-200 rounded-md p-3">
                                <p className="text-sm text-red-800">{delivery.cancellation_reason}</p>
                              </div>
                            </div>
                          )}

                          {/* Postponement Information */}
                          {delivery.status === "postponed" &&
                            (delivery.postponed_to || delivery.postponement_reason) && (
                              <div>
                                <h4 className="text-sm font-medium text-gray-500">Informations de report</h4>
                                <div className="mt-1 bg-orange-50 border border-orange-200 rounded-md p-3 space-y-2">
                                  {delivery.postponed_to && (
                                    <div>
                                      <p className="text-xs font-medium text-orange-900">Reportée au:</p>
                                      <p className="text-sm text-orange-800">
                                        {formatDateWithDay(delivery.postponed_to)}
                                      </p>
                                    </div>
                                  )}
                                  {delivery.postponement_reason && (
                                    <div>
                                      <p className="text-xs font-medium text-orange-900">Raison:</p>
                                      <p className="text-sm text-orange-800">{delivery.postponement_reason}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                        </div>

                        <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-3">Suivi de livraison</h4>

                          {loadingEvents[delivery.delivery_id] ? (
                            <div className="flex items-center justify-center py-8">
                              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                              <span className="ml-2 text-gray-500">Chargement des événements...</span>
                            </div>
                          ) : errorEvents[delivery.delivery_id] ? (
                            <div className="flex items-center justify-center py-8 text-red-500">
                              <AlertCircle className="h-6 w-6 mr-2" />
                              <span>{errorEvents[delivery.delivery_id]}</span>
                            </div>
                          ) : deliveryEvents[delivery.delivery_id]?.length ? (
                            <div className="relative pl-8 border-l border-gray-200">
                              {deliveryEvents[delivery.delivery_id].map((event, index) => (
                                <div
                                  key={event._id}
                                  className={`relative pb-6 ${
                                    index === deliveryEvents[delivery.delivery_id].length - 1 ? "" : ""
                                  }`}
                                >
                                  <div className="absolute -left-[25px] mt-1.5">
                                    <div className="flex items-center justify-center">
                                      {eventActionMap[event.action]?.icon || (
                                        <Clock className="h-5 w-5 text-gray-400" />
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex flex-col">
                                    <div className="flex items-center">
                                      <h5 className="text-sm font-medium">
                                        {eventActionMap[event.action]?.label || event.action}
                                      </h5>
                                      <span className="ml-2 text-xs text-gray-500">
                                        {formatDateTime(event.created_at)}
                                      </span>
                                    </div>
                                    {event.message && <p className="text-sm text-gray-600 mt-1">{event.message}</p>}

                                    {/* CHANGE> Added delivery photo and signature display */}
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
                                    {/* </CHANGE> */}

                                    {/* Display event data if available */}
                                    {event.data && (
                                      <div className="mt-2 space-y-2">
                                        {/* Display image if available */}
                                        {event.data.image_url && (
                                          <div className="mt-2">
                                            <img
                                              src={event.data.image_url || "/placeholder.svg"}
                                              alt="Événement de livraison"
                                              className="max-w-xs rounded-lg border shadow-sm"
                                              onError={(e) => {
                                                e.currentTarget.style.display = "none"
                                              }}
                                            />
                                          </div>
                                        )}

                                        {/* Display additional message from data if different from main message */}
                                        {event.data.message && event.data.message !== event.message && (
                                          <p className="text-sm text-gray-600 italic">{event.data.message}</p>
                                        )}

                                        {/* Display location info if available */}
                                        {event.location_latitude && event.location_longitude && (
                                          <p className="text-xs text-gray-500">
                                            📍 Coordonnées: {event.location_latitude.toFixed(6)},{" "}
                                            {event.location_longitude.toFixed(6)}
                                          </p>
                                        )}

                                        {/* Display any other relevant data */}
                                        {event.data.notes && (
                                          <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                                            <strong>Notes:</strong> {event.data.notes}
                                          </p>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                              <Clock className="h-8 w-8 mb-2 text-gray-300" />
                              <p>Aucun événement de livraison disponible</p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="col-span-2 pt-4 border-t">
                        {!readOnly && <h4 className="text-sm font-medium text-gray-500 mb-3">Actions</h4>}
                        {!readOnly && (
                          <div className="flex flex-wrap items-center gap-2">
                            {!delivery.is_admin_confirmed && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="bg-green-50 text-green-700 border-green-300 hover:bg-green-100"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleConfirmDelivery(delivery.delivery_id)
                                }}
                                disabled={confirmingDelivery === delivery.delivery_id}
                              >
                                {confirmingDelivery === delivery.delivery_id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <>
                                    <CheckCircle2 className="h-4 w-4 mr-1" />
                                    Confirmer
                                  </>
                                )}
                              </Button>
                            )}

                            <Dialog
                              open={assignDialogOpen === delivery.delivery_id}
                              onOpenChange={(open) => !open && setAssignDialogOpen(null)}
                            >
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="bg-transparent"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    openAssignDialog(delivery.delivery_id)
                                  }}
                                  disabled={assigningDelivery === delivery.delivery_id}
                                >
                                  {assigningDelivery === delivery.delivery_id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <>
                                      <UserPlus className="h-4 w-4 mr-1" />
                                      {delivery.deliverer ? "Réassigner" : "Assigner"}
                                    </>
                                  )}
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-lg">
                                <DialogHeader>
                                  <DialogTitle>{delivery.deliverer || delivery.picker ? "Réassigner" : "Assigner"} livreur et ramasseur</DialogTitle>
                                  <DialogDescription>
                                    Sélectionnez un livreur et/ou un ramasseur pour la livraison {delivery.package_code}
                                    {(delivery.deliverer || delivery.picker) && (
                                      <div className="mt-3 p-3 bg-muted rounded-lg space-y-1">
                                        {delivery.picker && (
                                          <div className="text-sm flex items-center gap-2">
                                            <Package className="h-4 w-4 text-indigo-500" />
                                            <span>Ramasseur actuel: <strong>{delivery.picker?.name}</strong></span>
                                          </div>
                                        )}
                                        {delivery.deliverer && (
                                          <div className="text-sm flex items-center gap-2">
                                            <Truck className="h-4 w-4 text-purple-500" />
                                            <span>Livreur actuel: <strong>{delivery.deliverer?.name}</strong></span>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="py-4 space-y-5">
                                  {/* Picker (Ramasseur) Selection */}
                                  <div className="space-y-2">
                                    <Label className="text-sm font-medium flex items-center gap-2">
                                      <Package className="h-4 w-4 text-indigo-500" />
                                      Ramasseur (Pickup)
                                    </Label>
                                    <Select value={selectedPicker} onValueChange={setSelectedPicker}>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Sélectionner un ramasseur (optionnel)" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="none">
                                          <span className="text-muted-foreground">Ne pas changer</span>
                                        </SelectItem>
                                        {loadingDeliverers ? (
                                          <div className="flex items-center justify-center p-4">
                                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                            Chargement...
                                          </div>
                                        ) : (
                                          deliverers.map((deliverer) => (
                                            <SelectItem key={`picker-${deliverer._id}`} value={deliverer.deliverer_id}>
                                              <div className="flex flex-col">
                                                <span className="font-medium">
                                                  {deliverer?.name} {deliverer?.last_name}
                                                </span>
                                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                                  <span>{deliverer.phone_number}</span>
                                                  <span>•</span>
                                                  <span>{deliverer.delivery_zone?.name}</span>
                                                </div>
                                              </div>
                                            </SelectItem>
                                          ))
                                        )}
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  {/* Deliverer Selection */}
                                  <div className="space-y-2">
                                    <Label className="text-sm font-medium flex items-center gap-2">
                                      <Truck className="h-4 w-4 text-purple-500" />
                                      Livreur (Delivery)
                                    </Label>
                                    <Select value={selectedDeliverer} onValueChange={setSelectedDeliverer}>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Sélectionner un livreur (optionnel)" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="none">
                                          <span className="text-muted-foreground">Ne pas changer</span>
                                        </SelectItem>
                                        {loadingDeliverers ? (
                                          <div className="flex items-center justify-center p-4">
                                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                            Chargement...
                                          </div>
                                        ) : (
                                          deliverers.map((deliverer) => (
                                            <SelectItem key={`deliverer-${deliverer._id}`} value={deliverer.deliverer_id}>
                                              <div className="flex flex-col">
                                                <span className="font-medium">
                                                  {deliverer?.name} {deliverer?.last_name}
                                                </span>
                                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                                  <span>{deliverer.phone_number}</span>
                                                  <span>•</span>
                                                  <span>{deliverer.delivery_zone?.name}</span>
                                                </div>
                                              </div>
                                            </SelectItem>
                                          ))
                                        )}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                                <DialogFooter>
                                  <Button variant="outline" onClick={() => setAssignDialogOpen(null)}>
                                    Annuler
                                  </Button>
                                  <Button
                                    onClick={() => handleAssignDelivery(delivery.delivery_id)}
                                    disabled={(!selectedDeliverer || selectedDeliverer === "none") && (!selectedPicker || selectedPicker === "none") || assigningDelivery === delivery.delivery_id}
                                    className="bg-[#2B015F] hover:bg-[#2B015F]/90"
                                  >
                                    {assigningDelivery === delivery.delivery_id ? (
                                      <>
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        Assignation...
                                      </>
                                    ) : (
                                      "Assigner"
                                    )}
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>

                            <Dialog
                              open={statusUpdateDialogOpen === delivery.delivery_id}
                              onOpenChange={(open) => !open && setStatusUpdateDialogOpen(null)}
                            >
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="bg-transparent"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    openStatusUpdateDialog(delivery.delivery_id, delivery.status)
                                  }}
                                  disabled={updatingStatus === delivery.delivery_id}
                                >
                                  {updatingStatus === delivery.delivery_id ? (
                                    <>
                                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                      Mise à jour...
                                    </>
                                  ) : (
                                    <>
                                      <Edit className="h-4 w-4 mr-1" />
                                      Statut
                                    </>
                                  )}
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Mettre à jour le statut</DialogTitle>
                                  <DialogDescription>
                                    Changez le statut de la livraison {delivery.package_code}
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="py-4 space-y-4">
                                  <div>
                                    <Label className="text-sm font-medium mb-2 block">Nouveau statut</Label>
                                    <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Sélectionner un statut" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="unassigned">Non assigné</SelectItem>
                                        <SelectItem value="assigned">Assigné</SelectItem>
                                        <SelectItem value="delivered">Livré</SelectItem>
                                        <SelectItem value="cancelled">Annulé</SelectItem>
                                        <SelectItem value="failed_pickup">Échec de ramassage</SelectItem>
                                        <SelectItem value="unreachable_recipient">Destinataire injoignable</SelectItem>
                                        <SelectItem value="refused">Refusé</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium mb-2 block">Raison (optionnelle)</Label>
                                    <Textarea
                                      value={statusReason}
                                      onChange={(e) => setStatusReason(e.target.value)}
                                      placeholder="Entrez la raison du changement de statut..."
                                      className="resize-none"
                                      rows={3}
                                    />
                                  </div>
                                </div>
                                <DialogFooter>
                                  <Button variant="outline" onClick={() => setStatusUpdateDialogOpen(null)}>
                                    Annuler
                                  </Button>
                                  <Button
                                    onClick={() =>
                                      handleUpdateDeliveryStatus(delivery.delivery_id, selectedStatus, statusReason)
                                    }
                                    disabled={!selectedStatus || updatingStatus === delivery.delivery_id}
                                    className="bg-[#2B015F] hover:bg-[#2B015F]/90"
                                  >
                                    {updatingStatus === delivery.delivery_id ? (
                                      <>
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        Mise à jour...
                                      </>
                                    ) : (
                                      "Mettre à jour"
                                    )}
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>

                            <Dialog
                              open={postponeDialogOpen === delivery.delivery_id}
                              onOpenChange={(open) => !open && setPostponeDialogOpen(null)}
                            >
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="bg-transparent"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setPostponeDialogOpen(delivery.delivery_id)
                                  }}
                                  disabled={postponingDelivery === delivery.delivery_id}
                                >
                                  {postponingDelivery === delivery.delivery_id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <>
                                      <Clock className="h-4 w-4 mr-1" />
                                      Reporter
                                    </>
                                  )}
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Reporter la livraison</DialogTitle>
                                  <DialogDescription>
                                    Sélectionnez une nouvelle date et heure pour la livraison {delivery.package_code}
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="py-4 space-y-4">
                                  <div>
                                    <Label className="text-sm font-medium mb-2 block">Nouvelle date</Label>
                                    <Input
                                      type="date"
                                      value={postponeDate}
                                      onChange={(e) => setPostponeDate(e.target.value)}
                                      min={new Date().toISOString().split("T")[0]}
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium mb-2 block">Heure</Label>
                                    <Input
                                      type="time"
                                      value={postponeTime}
                                      onChange={(e) => setPostponeTime(e.target.value)}
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium mb-2 block">Raison (optionnelle)</Label>
                                    <Textarea
                                      value={postponeReason}
                                      onChange={(e) => setPostponeReason(e.target.value)}
                                      placeholder="Entrez la raison du report..."
                                      className="resize-none"
                                      rows={3}
                                    />
                                  </div>
                                </div>
                                <DialogFooter>
                                  <Button variant="outline" onClick={() => setPostponeDialogOpen(null)}>
                                    Annuler
                                  </Button>
                                  <Button
                                    onClick={() => handlePostponeDelivery(delivery.delivery_id)}
                                    disabled={
                                      !postponeDate || !postponeTime || postponingDelivery === delivery.delivery_id
                                    }
                                    className="bg-[#2B015F] hover:bg-[#2B015F]/90"
                                  >
                                    {postponingDelivery === delivery.delivery_id ? (
                                      <>
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        Report...
                                      </>
                                    ) : (
                                      "Reporter"
                                    )}
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>

                            {(delivery.status === "unassigned" || delivery.status === "assigned") && (
                              <Dialog
                                open={cancelDialogOpen === delivery.delivery_id}
                                onOpenChange={(open) => !open && setCancelDialogOpen(null)}
                              >
                                <DialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="bg-red-50 text-red-700 border-red-300 hover:bg-red-100"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setCancelDialogOpen(delivery.delivery_id)
                                    }}
                                    disabled={cancellingDelivery === delivery.delivery_id}
                                  >
                                    {cancellingDelivery === delivery.delivery_id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <>
                                        <XCircle className="h-4 w-4 mr-1" />
                                        Annuler
                                      </>
                                    )}
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Annuler la livraison</DialogTitle>
                                    <DialogDescription>
                                      Êtes-vous sûr de vouloir annuler la livraison {delivery.package_code}? Cette
                                      action est irréversible.
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="py-4">
                                    <Label className="text-sm font-medium mb-2 block">Raison (optionnelle)</Label>
                                    <Textarea
                                      value={cancelReason}
                                      onChange={(e) => setCancelReason(e.target.value)}
                                      placeholder="Entrez la raison de l'annulation..."
                                      className="resize-none"
                                      rows={3}
                                    />
                                  </div>
                                  <DialogFooter>
                                    <Button variant="outline" onClick={() => setCancelDialogOpen(null)}>
                                      Non, garder
                                    </Button>
                                    <Button
                                      onClick={() => handleCancelDelivery(delivery.delivery_id, cancelReason)}
                                      disabled={cancellingDelivery === delivery.delivery_id}
                                      variant="destructive"
                                    >
                                      {cancellingDelivery === delivery.delivery_id ? (
                                        <>
                                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                          Annulation...
                                        </>
                                      ) : (
                                        "Oui, annuler"
                                      )}
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            )}
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
