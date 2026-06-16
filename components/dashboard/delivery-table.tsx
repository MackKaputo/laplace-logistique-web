"use client"

import React from "react"

import type { ReactNode } from "react"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
  Edit,
  Trash2,
  Eye,
} from "lucide-react"
import { cn, formatDate, formatDateTime } from "@/lib/utils"
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
  cancelled: { label: "Annulée", color: "bg-gray-200 text-gray-800" },
  postponed: { label: "Reportée", color: "bg-orange-100 text-orange-800" },
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
  delivery_cancelled: {
    label: "Livraison annulée",
    icon: <XCircle className="h-5 w-5 text-red-500" />,
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
    case "cancelled":
      return 3 // Stuck at delivery stage for cancelled orders
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
  if (status === "cancelled") {
    return stageIndex <= currentStage ? "bg-gray-500" : "bg-gray-200"
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

interface DeliveryTableProps {
  deliveries: any[]
  expandable?: boolean
  onEditDelivery?: (deliveryId: string, updates: any) => Promise<void>
  onCancelDelivery?: (deliveryId: string, reason?: string) => Promise<void>
  isUpdating?: boolean
  /** Large-screen table only; stacked cards below `lg` (e.g. /closings mobile). */
  preferStackedMobileCards?: boolean
}

export function DeliveryTable({
  deliveries,
  expandable = false,
  onEditDelivery,
  onCancelDelivery,
  isUpdating = false,
  preferStackedMobileCards = false,
}: DeliveryTableProps) {
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({})
  const [deliveryEvents, setDeliveryEvents] = useState<Record<string, DeliveryEvent[]>>({})
  const [loadingEvents, setLoadingEvents] = useState<Record<string, boolean>>({})
  const [errorEvents, setErrorEvents] = useState<Record<string, string>>({})
  const [mobileDetailOpen, setMobileDetailOpen] = useState<string | null>(null)

  const [editDialogOpen, setEditDialogOpen] = useState<string | null>(null)
  const [cancelDialogOpen, setCancelDialogOpen] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({
    package_description: "",
    package_value_amount: "",
    package_value_currency: "USD",
    pickup_date: "",
    preferred_delivery_date: "",
  })
  const [cancelReason, setCancelReason] = useState("")

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

  const openEditDialog = (delivery: any) => {
    setEditForm({
      package_description: delivery.package?.description || "",
      package_value_amount: delivery.package?.package_value?.value || "",
      package_value_currency: delivery.package?.package_value?.currency || "USD",
      pickup_date: delivery.pickup_date ? new Date(delivery.pickup_date).toISOString().slice(0, 16) : "",
      preferred_delivery_date: delivery.preferred_delivery_date
        ? new Date(delivery.preferred_delivery_date).toISOString().slice(0, 16)
        : "",
    })
    setEditDialogOpen(delivery.delivery_id)
  }

  const handleEditSubmit = async () => {
    if (!editDialogOpen || !onEditDelivery) return

    const updates: any = {
      delivery_id: editDialogOpen,
    }

    if (editForm.package_description) updates.package_description = editForm.package_description
    if (editForm.package_value_amount) updates.package_value_amount = editForm.package_value_amount
    if (editForm.package_value_currency) updates.package_value_currency = editForm.package_value_currency
    if (editForm.pickup_date) updates.pickup_date = new Date(editForm.pickup_date).getTime()
    if (editForm.preferred_delivery_date)
      updates.preferred_delivery_date = new Date(editForm.preferred_delivery_date).getTime()
    console.log(editDialogOpen, updates)
    await onEditDelivery(updates)
    setEditDialogOpen(null)
  }

  const handleCancelSubmit = async () => {
    if (!cancelDialogOpen || !onCancelDelivery) return

    await onCancelDelivery({ delivery_id: cancelDialogOpen, reason: cancelReason || "" })
    setCancelDialogOpen(null)
    setCancelReason("")
  }

  const openMobileDetail = async (deliveryId: string) => {
    setMobileDetailOpen(deliveryId)
    if (!deliveryEvents[deliveryId]) {
      await fetchDeliveryEvents(deliveryId)
    }
  }

  const canCancelDelivery = (status: string) => {
    return status === "unassigned" || status === "assigned"
  }

  const mobileDetailDelivery = deliveries.find((d) => d.delivery_id === mobileDetailOpen)

  return (
    <>
      {preferStackedMobileCards && (
        <div className="lg:hidden space-y-3 pb-2">
          {deliveries.length === 0 ? (
            <div className="rounded-xl border border-dashed bg-muted/20 px-4 py-14 text-center text-sm text-muted-foreground">
              Aucune livraison trouvée
            </div>
          ) : (
            deliveries.map((delivery) => (
              <div
                key={delivery.delivery_id}
                className="rounded-xl border border-border bg-card p-4 shadow-sm space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="font-mono text-sm font-semibold tracking-tight text-[#2B015F]">
                      {delivery.package_code}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatDate(delivery.created_at)}</p>
                  </div>
                  <Badge className={`shrink-0 text-xs ${statusMap[delivery.status]?.color || "bg-gray-100 text-gray-800"}`}>
                    {statusMap[delivery.status]?.label || delivery.status}
                  </Badge>
                </div>
                <div className="space-y-1 text-sm">
                  <p className="font-medium">{delivery.recipient?.name || "Destinataire —"}</p>
                  <p className="text-muted-foreground line-clamp-3 text-xs leading-snug">
                    {delivery.recipient?.address?.address_line || "—"}
                  </p>
                </div>
                {delivery.delivery_fees_cdf != null && (
                  <p className="text-sm">
                    <span className="text-muted-foreground">Frais: </span>
                    <span className="font-medium tabular-nums">{delivery.delivery_fees_cdf} CDF</span>
                  </p>
                )}
                <div className="flex flex-col gap-2 pt-1 sm:flex-row">
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    className="h-10 w-full shrink-0 bg-[#2B015F] text-white hover:bg-[#1A0138]"
                    disabled={isUpdating}
                    onClick={() => openMobileDetail(delivery.delivery_id)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Suivi & détails
                  </Button>
                  <div className="flex gap-2 w-full sm:flex-1 sm:justify-end">
                    {onEditDelivery && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="flex-1 h-10 shadow-none min-w-[3rem]"
                        disabled={isUpdating}
                        aria-label="Modifier la livraison"
                        onClick={() => openEditDialog(delivery)}
                      >
                        <Edit className="h-4 w-4 sm:mr-1 shrink-0" aria-hidden />
                        <span className="hidden sm:inline">Modifier</span>
                      </Button>
                    )}
                    {onCancelDelivery && canCancelDelivery(delivery.status) && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="flex-1 h-10 text-destructive border-destructive/30 hover:bg-destructive/10 shadow-none min-w-[3rem]"
                        disabled={isUpdating}
                        aria-label="Annuler la livraison"
                        onClick={() => setCancelDialogOpen(delivery.delivery_id)}
                      >
                        <Trash2 className="h-4 w-4 shrink-0" aria-hidden />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <div className={cn("rounded-md border", preferStackedMobileCards ? "hidden lg:block overflow-x-auto" : "")}>
        <Table>
          <TableHeader>
            <TableRow>
              {(onEditDelivery || onCancelDelivery) && <TableHead className="hidden md:table-cell">Actions</TableHead>}
              {expandable && <TableHead className="w-10 hidden md:table-cell"></TableHead>}
              <TableHead className="hidden md:table-cell">Code</TableHead>
              <TableHead className="hidden md:table-cell">Client</TableHead>
              <TableHead>Destinataire</TableHead>
              <TableHead className="hidden md:table-cell">Adresse</TableHead>
              <TableHead className="hidden md:table-cell">Date</TableHead>
              <TableHead className="hidden md:table-cell">Date ramassage</TableHead>
              <TableHead className="hidden md:table-cell">Date livraison préférée</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="hidden md:table-cell text-right">Frais</TableHead>
              <TableHead className="md:hidden">Détails</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {deliveries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={expandable ? 11 : 10} className="h-24 text-center">
                  Aucune livraison trouvée
                </TableCell>
              </TableRow>
            ) : (
              deliveries.map((delivery) => (
                <>
                  <TableRow
                    key={delivery.delivery_id}
                    className={`${expandable ? "cursor-pointer hover:bg-gray-50" : ""}`}
                  >
                    {(onEditDelivery || onCancelDelivery) && (
                      <TableCell className="hidden md:table-cell">
                        <div className="flex gap-2">
                          {onEditDelivery && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                openEditDialog(delivery)
                              }}
                              disabled={isUpdating}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          {onCancelDelivery && canCancelDelivery(delivery.status) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                setCancelDialogOpen(delivery.delivery_id)
                              }}
                              disabled={isUpdating}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    )}
                    {expandable && (
                      <TableCell className="py-2 hidden md:table-cell" onClick={() => toggleRow(delivery.delivery_id)}>
                        {expandedRows[delivery.delivery_id] ? (
                          <ChevronDown className="h-4 w-4 text-gray-500" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-gray-500" />
                        )}
                      </TableCell>
                    )}
                    <TableCell
                      className="font-medium hidden md:table-cell"
                      onClick={expandable ? () => toggleRow(delivery.delivery_id) : undefined}
                    >
                      {delivery.package_code}
                    </TableCell>
                    <TableCell
                      className="hidden md:table-cell"
                      onClick={expandable ? () => toggleRow(delivery.delivery_id) : undefined}
                    >
                      {delivery.customer?.name || "N/A"}
                    </TableCell>
                    <TableCell onClick={expandable ? () => toggleRow(delivery.delivery_id) : undefined}>
                      {delivery.recipient?.name || "N/A"}
                    </TableCell>
                    <TableCell
                      className="max-w-[200px] truncate hidden md:table-cell"
                      onClick={expandable ? () => toggleRow(delivery.delivery_id) : undefined}
                    >
                      {delivery.recipient?.address?.address_line || "N/A"}
                    </TableCell>
                    <TableCell
                      className="hidden md:table-cell"
                      onClick={expandable ? () => toggleRow(delivery.delivery_id) : undefined}
                    >
                      {formatDate(delivery.created_at)}
                    </TableCell>
                    <TableCell
                      className="hidden md:table-cell"
                      onClick={expandable ? () => toggleRow(delivery.delivery_id) : undefined}
                    >
                      {delivery.pickup_date ? formatDateWithDay(delivery.pickup_date) : "-"}
                    </TableCell>
                    <TableCell
                      className="hidden md:table-cell"
                      onClick={expandable ? () => toggleRow(delivery.delivery_id) : undefined}
                    >
                      {delivery.preferred_delivery_date ? formatDateWithDay(delivery.preferred_delivery_date) : "-"}
                    </TableCell>
                    <TableCell onClick={expandable ? () => toggleRow(delivery.delivery_id) : undefined}>
                      <Badge className={`${statusMap[delivery.status]?.color || "bg-gray-100 text-gray-800"}`}>
                        {statusMap[delivery.status]?.label || delivery.status}
                      </Badge>
                    </TableCell>
                    <TableCell
                      className="text-right hidden md:table-cell"
                      onClick={expandable ? () => toggleRow(delivery.delivery_id) : undefined}
                    >
                      {/* {delivery.delivery_fees?.toLocaleString()} USD */}
                      <br />
                      {delivery?.delivery_fees_cdf && `${delivery?.delivery_fees_cdf} CDF`}
                    </TableCell>
                    <TableCell className="md:hidden">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openMobileDetail(delivery.delivery_id)}
                        className="h-8 w-8 p-0"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>

                  {expandable && expandedRows[delivery.delivery_id] && (
                    <TableRow key={`${delivery.delivery_id}-expanded`} className="bg-gray-50 hidden md:table-row">
                      <TableCell colSpan={onEditDelivery || onCancelDelivery ? 11 : 10} className="p-4">
                        <div className="mb-6">
                          <h4 className="text-sm font-medium text-gray-500 mb-3">Progression de la livraison</h4>

                          <div className="relative">
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

                                return (
                                  <div key={index} className="flex flex-col items-center">
                                    <div
                                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                        isActive ? "ring-2 ring-offset-2 ring-blue-500" : ""
                                      } ${stageColor} ${isError ? "bg-red-500" : ""}`}
                                    >
                                      {React.cloneElement(stage.icon as React.ReactElement, {
                                        className: `h-4 w-4 ${index <= currentStage ? "text-white" : "text-gray-500"}`,
                                      })}
                                    </div>
                                    <span className={`text-xs mt-1 ${isActive ? "font-medium" : ""}`}>
                                      {stage.label}
                                    </span>
                                  </div>
                                )
                              })}
                            </div>

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
                                    <p className="text-sm font-medium">{delivery?.deliverer?.name || "N/A"}</p>
                                    <p className="text-sm text-gray-600">
                                      {delivery.deliverer.phone_number || "Pas de numéro"}
                                    </p>
                                  </div>
                                ) : (
                                  <p className="text-sm text-gray-600">Pas encore assigné</p>
                                )}
                              </div>
                            </div>

                            {delivery.status === "cancelled" && delivery.cancellation_reason && (
                              <div>
                                <h4 className="text-sm font-medium text-gray-500">Raison d'annulation</h4>
                                <div className="mt-1 bg-red-50 border border-red-200 rounded-md p-3">
                                  <p className="text-sm text-red-800">{delivery.cancellation_reason}</p>
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
                            ) : (
                              <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                                <Clock className="h-8 w-8 mb-2 text-gray-300" />
                                <p>Aucun événement de livraison disponible</p>
                              </div>
                            )}
                          </div>
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

      <Dialog open={!!mobileDetailOpen} onOpenChange={() => setMobileDetailOpen(null)}>
        <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détails de la livraison</DialogTitle>
          </DialogHeader>
          {mobileDetailDelivery && (
            <div className="space-y-6">
              {(onEditDelivery || (onCancelDelivery && canCancelDelivery(mobileDetailDelivery.status))) && (
                <div className="flex gap-2 pt-4 border-t">
                  {onEditDelivery && (
                    <Button
                      variant="outline"
                      className="flex-1 bg-transparent"
                      onClick={() => {
                        setMobileDetailOpen(null)
                        openEditDialog(mobileDetailDelivery)
                      }}
                      disabled={isUpdating}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Modifier
                    </Button>
                  )}
                  {onCancelDelivery && canCancelDelivery(mobileDetailDelivery.status) && (
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={() => {
                        setMobileDetailOpen(null)
                        setCancelDialogOpen(mobileDetailDelivery.delivery_id)
                      }}
                      disabled={isUpdating}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Annuler
                    </Button>
                  )}
                </div>
              )}
              {/* Progress tracking */}
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-3">Progression</h4>
                <div className="space-y-2">
                  {deliveryStages.map((stage, index) => {
                    const currentStage = getDeliveryStage(
                      mobileDetailDelivery.status,
                      deliveryEvents[mobileDetailDelivery.delivery_id],
                    )
                    const isCompleted = index < currentStage
                    const isActive = index === currentStage
                    const isError =
                      ["failed_pickup", "unreachable_recipient", "refused"].includes(mobileDetailDelivery.status) &&
                      index === currentStage

                    return (
                      <div key={index} className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            isCompleted || isActive
                              ? isError
                                ? "bg-red-500"
                                : isActive
                                  ? "bg-blue-500"
                                  : "bg-green-500"
                              : "bg-gray-200"
                          }`}
                        >
                          {React.cloneElement(stage.icon as React.ReactElement, {
                            className: `h-4 w-4 ${isCompleted || isActive ? "text-white" : "text-gray-500"}`,
                          })}
                        </div>
                        <span className={`text-sm ${isActive ? "font-medium" : ""}`}>{stage.label}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Package info */}
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Informations du colis</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Code:</span>
                    <span className="font-medium">{mobileDetailDelivery.package_code}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Type:</span>
                    <span className="font-medium">{mobileDetailDelivery.package?.title || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Statut:</span>
                    <Badge
                      className={`${statusMap[mobileDetailDelivery.status]?.color || "bg-gray-100 text-gray-800"}`}
                    >
                      {statusMap[mobileDetailDelivery.status]?.label || mobileDetailDelivery.status}
                    </Badge>
                  </div>
                  {mobileDetailDelivery.package?.description && (
                    <div>
                      <span className="text-gray-600">Description:</span>
                      <p className="mt-1">{mobileDetailDelivery.package.description}</p>
                    </div>
                  )}
                  {mobileDetailDelivery.package?.package_value && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Valeur:</span>
                      <span className="font-medium">
                        {mobileDetailDelivery.package.package_value.value}{" "}
                        {mobileDetailDelivery.package.package_value.currency}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Frais:</span>
                    <div className="text-right">
                      <div className="text-xs font-medium">
                        {/* In french number type */}
                        {mobileDetailDelivery.delivery_fees_cdf
                          ? `${mobileDetailDelivery.delivery_fees_cdf.toLocaleString()} CDF`
                          : ""}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Addresses */}
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Adresses</h4>
                <div className="space-y-3 text-sm">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">Ramassage</span>
                    </div>
                    <p className="text-gray-600 ml-6">{mobileDetailDelivery.pickup_address?.address_line}</p>
                    {mobileDetailDelivery.pickup_address?.address_second_line && (
                      <p className="text-gray-600 ml-6">{mobileDetailDelivery.pickup_address.address_second_line}</p>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">Livraison</span>
                    </div>
                    <p className="text-gray-600 ml-6">{mobileDetailDelivery.recipient?.address?.address_line}</p>
                    {mobileDetailDelivery.recipient?.address?.address_second_line && (
                      <p className="text-gray-600 ml-6">{mobileDetailDelivery.recipient.address.address_second_line}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Dates</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ramassage:</span>
                    <span className="font-medium">
                      {mobileDetailDelivery.pickup_date ? formatDateWithDay(mobileDetailDelivery.pickup_date) : "-"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Livraison préférée:</span>
                    <span className="font-medium">
                      {mobileDetailDelivery.preferred_delivery_date
                        ? formatDateWithDay(mobileDetailDelivery.preferred_delivery_date)
                        : "-"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Deliverer */}
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Livreur</h4>
                {mobileDetailDelivery.deliverer ? (
                  <div className="space-y-1 text-sm">
                    <p className="font-medium">{mobileDetailDelivery.deliverer.name || "N/A"}</p>
                    <p className="text-gray-600">{mobileDetailDelivery.deliverer.phone_number || "Pas de numéro"}</p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-600">Pas encore assigné</p>
                )}
              </div>

              {mobileDetailDelivery.status === "cancelled" && mobileDetailDelivery.cancellation_reason && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Raison d'annulation</h4>
                  <div className="bg-red-50 border border-red-200 rounded-md p-3">
                    <p className="text-sm text-red-800">{mobileDetailDelivery.cancellation_reason}</p>
                  </div>
                </div>
              )}

              {/* Events */}
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Historique</h4>
                {loadingEvents[mobileDetailDelivery.delivery_id] ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                    <span className="ml-2 text-sm text-gray-500">Chargement...</span>
                  </div>
                ) : errorEvents[mobileDetailDelivery.delivery_id] ? (
                  <div className="flex items-center py-4 text-red-500 text-sm">
                    <AlertCircle className="h-5 w-5 mr-2" />
                    <span>{errorEvents[mobileDetailDelivery.delivery_id]}</span>
                  </div>
                ) : deliveryEvents[mobileDetailDelivery.delivery_id]?.length ? (
                  <div className="space-y-3">
                    {deliveryEvents[mobileDetailDelivery.delivery_id].map((event) => (
                      <div key={event._id} className="flex gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          {eventActionMap[event.action]?.icon || <Clock className="h-5 w-5 text-gray-400" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{eventActionMap[event.action]?.label || event.action}</p>
                          <p className="text-xs text-gray-500">{formatDateTime(event.created_at)}</p>
                          {event.message && <p className="text-sm text-gray-600 mt-1">{event.message}</p>}

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
                ) : (
                  <p className="text-sm text-gray-600">Aucun événement disponible</p>
                )}
              </div>

              {/* Actions */}
              {(onEditDelivery || (onCancelDelivery && canCancelDelivery(mobileDetailDelivery.status))) && (
                <div className="flex gap-2 pt-4 border-t">
                  {onEditDelivery && (
                    <Button
                      variant="outline"
                      className="flex-1 bg-transparent"
                      onClick={() => {
                        setMobileDetailOpen(null)
                        openEditDialog(mobileDetailDelivery)
                      }}
                      disabled={isUpdating}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Modifier
                    </Button>
                  )}
                  {onCancelDelivery && canCancelDelivery(mobileDetailDelivery.status) && (
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={() => {
                        setMobileDetailOpen(null)
                        setCancelDialogOpen(mobileDetailDelivery.delivery_id)
                      }}
                      disabled={isUpdating}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Annuler
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!editDialogOpen} onOpenChange={() => setEditDialogOpen(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier la livraison</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="package_description">Description du colis</Label>
              <Textarea
                id="package_description"
                value={editForm.package_description}
                onChange={(e) => setEditForm((prev) => ({ ...prev, package_description: e.target.value }))}
                placeholder="Description du colis"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="package_value_amount">Valeur</Label>
                <Input
                  id="package_value_amount"
                  type="number"
                  value={editForm.package_value_amount}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, package_value_amount: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="package_value_currency">Devise</Label>
                <select
                  id="package_value_currency"
                  value={editForm.package_value_currency}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, package_value_currency: e.target.value }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="USD">USD</option>
                  <option value="CDF">CDF</option>
                </select>
              </div>
            </div>
            <div>
              <Label htmlFor="pickup_date">Date de ramassage</Label>
              <Input
                id="pickup_date"
                type="datetime-local"
                value={editForm.pickup_date}
                onChange={(e) => setEditForm((prev) => ({ ...prev, pickup_date: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="preferred_delivery_date">Date de livraison préférée</Label>
              <Input
                id="preferred_delivery_date"
                type="datetime-local"
                value={editForm.preferred_delivery_date}
                onChange={(e) => setEditForm((prev) => ({ ...prev, preferred_delivery_date: e.target.value }))}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setEditDialogOpen(null)}>
                Annuler
              </Button>
              <Button onClick={handleEditSubmit} disabled={isUpdating}>
                {isUpdating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Sauvegarder
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!cancelDialogOpen} onOpenChange={() => setCancelDialogOpen(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Annuler la livraison</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Êtes-vous sûr de vouloir annuler cette livraison ? Cette action ne peut pas être annulée.
            </p>
            <div>
              <Label htmlFor="cancel_reason">Raison (optionnel)</Label>
              <Textarea
                id="cancel_reason"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Raison de l'annulation..."
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setCancelDialogOpen(null)}>
                Annuler
              </Button>
              <Button variant="destructive" onClick={handleCancelSubmit} disabled={isUpdating}>
                {isUpdating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Confirmer l'annulation
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
