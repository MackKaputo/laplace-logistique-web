"use client"

import { Fragment, useState, useEffect, useRef, useCallback, useMemo } from "react"
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { formatPreDeliveryCreatedAtFrench } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Package,
  Phone,
  MapPin,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Clock,
  XCircle,
  HelpCircle,
  MapPinOff,
  PhoneCall,
  Search,
  Building2,
  User,
  RefreshCw,
} from "lucide-react"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type PreDeliveryStatus =
  | "no_response"
  | "unreachable_phone_number"
  | "confirmed"
  | "not_interested"
  | "does_not_remember"
  | "beyond_delivery_zone"
  | "will_call_us_when_ready"

interface PreDelivery {
  pre_delivery_id: string
  recipient_address_line: string
  recipient_name: string
  recipient_phone_number: string
  package_description: string
  package_value_currency: string
  package_value_amount: number
  is_delivery_price_included: boolean
  customer_id: string
  created_at?: string | { $date?: string }
  createdAt?: string | { $date?: string }
  status?: string
  mobile_deliverer_zone?: {
    mobile_deliverer_zone_id?: string
  }
  customer?: {
    organizationName: string
    first_name: string
    last_name: string
  }
}

interface Commune {
  commune_id: string
  name: string
  quartiers: Quartier[]
}

interface Quartier {
  id: number
  name: string
}

// ---------------------------------------------------------------------------
// Status config — single source of truth
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<
  PreDeliveryStatus | "pending",
  { label: string; icon: React.ElementType; color: string; bg: string; ring: string; rowBg: string }
> = {
  pending: {
    label: "En attente",
    icon: Clock,
    color: "text-amber-700",
    bg: "bg-amber-50",
    ring: "ring-amber-200",
    rowBg: "bg-amber-50/40",
  },
  no_response: {
    label: "Pas de réponse",
    icon: Phone,
    color: "text-gray-600",
    bg: "bg-gray-100",
    ring: "ring-gray-300",
    rowBg: "",
  },
  unreachable_phone_number: {
    label: "Numéro injoignable",
    icon: Phone,
    color: "text-rose-700",
    bg: "bg-rose-50",
    ring: "ring-rose-300",
    rowBg: "bg-rose-50/30",
  },
  confirmed: {
    label: "Confirmé",
    icon: CheckCircle2,
    color: "text-green-700",
    bg: "bg-green-50",
    ring: "ring-green-300",
    rowBg: "bg-green-50/40",
  },
  not_interested: {
    label: "Pas intéressé",
    icon: XCircle,
    color: "text-red-700",
    bg: "bg-red-50",
    ring: "ring-red-300",
    rowBg: "bg-red-50/30",
  },
  does_not_remember: {
    label: "Ne se souvient pas",
    icon: HelpCircle,
    color: "text-orange-700",
    bg: "bg-orange-50",
    ring: "ring-orange-300",
    rowBg: "bg-orange-50/30",
  },
  beyond_delivery_zone: {
    label: "Hors zone",
    icon: MapPinOff,
    color: "text-purple-700",
    bg: "bg-purple-50",
    ring: "ring-purple-300",
    rowBg: "bg-purple-50/30",
  },
  will_call_us_when_ready: {
    label: "Rappellera",
    icon: PhoneCall,
    color: "text-blue-700",
    bg: "bg-blue-50",
    ring: "ring-blue-300",
    rowBg: "bg-blue-50/30",
  },
}

const ALL_STATUSES = Object.keys(STATUS_CONFIG) as (PreDeliveryStatus | "pending")[]

function getStatusKey(status?: string | null): PreDeliveryStatus | "pending" {
  if (!status || status === "null" || status === "undefined") return "pending"
  const normalized = status.trim().toLowerCase()
  if (normalized in STATUS_CONFIG) return normalized as PreDeliveryStatus
  // Handle potential snake_case/camelCase mismatches
  const mapped: Record<string, PreDeliveryStatus> = {
    beyonddeliveryzone: "beyond_delivery_zone",
    beyond_delivery_zone: "beyond_delivery_zone",
    willcalluswhenready: "will_call_us_when_ready",
    will_call_us_when_ready: "will_call_us_when_ready",
    noresponse: "no_response",
    no_response: "no_response",
    unreachablephonenumber: "unreachable_phone_number",
    unreachable_phone_number: "unreachable_phone_number",
    notinterested: "not_interested",
    not_interested: "not_interested",
    doesnotremember: "does_not_remember",
    does_not_remember: "does_not_remember",
    confirmed: "confirmed",
  }
  const key = mapped[normalized.replace(/[\s_-]/g, "")]
  if (key) return key
  console.warn("[PreDeliveries] Unknown status value:", JSON.stringify(status))
  return "pending"
}

// ---------------------------------------------------------------------------
// StatusBadge — reusable compact badge
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status?: string }) {
  const key = getStatusKey(status)
  const cfg = STATUS_CONFIG[key]
  const Icon = cfg.icon
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${cfg.bg} ${cfg.color} ${cfg.ring}`}
    >
      <Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Main content
// ---------------------------------------------------------------------------

function PreDeliveriesContent() {
  const { toast } = useToast()
  const [selectedPreDelivery, setSelectedPreDelivery] = useState<PreDelivery | null>(null)
  const [showDialog, setShowDialog] = useState(false)
  const [communes, setCommunes] = useState<Commune[]>([])
  const [selectedCommuneId, setSelectedCommuneId] = useState("")
  const [selectedQuartierId, setSelectedQuartierId] = useState("")
  const [availableQuartiers, setAvailableQuartiers] = useState<Quartier[]>([])
  const [selectedStatus, setSelectedStatus] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [updatingRowId, setUpdatingRowId] = useState<string | null>(null)
  const [expandedPreDeliveryId, setExpandedPreDeliveryId] = useState<string | null>(null)
  const [editPackageValue, setEditPackageValue] = useState("")
  const [editAddress, setEditAddress] = useState("")
  const [editNote, setEditNote] = useState("")
  const [isEditingPreDelivery, setIsEditingPreDelivery] = useState(false)
  const [selectedCustomerKey, setSelectedCustomerKey] = useState<string | null>(null)
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_SERVER_BASE_URL

  // Fetch communes
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
    if (apiBaseUrl) fetchCommunes()
  }, [apiBaseUrl])

  useEffect(() => {
    if (selectedCommuneId) {
      const selectedCommune = communes.find((c) => c.commune_id === selectedCommuneId)
      setAvailableQuartiers(selectedCommune?.quartiers || [])
    } else {
      setAvailableQuartiers([])
      setSelectedQuartierId("")
    }
  }, [selectedCommuneId, communes])

  const {
    data: preDeliveries,
    isLoading,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["backoffice-pre-deliveries"],
    queryFn: async () => {
      const response = await fetch(`${apiBaseUrl}/deliveries/pre-deliveries`)
      if (!response.ok) throw new Error("Erreur lors du chargement des pré-livraisons")
      const result = await response.json()
      const rawData = (result.data || []) as PreDelivery[]
      const data = rawData.filter(
        (pd) => !pd.mobile_deliverer_zone?.mobile_deliverer_zone_id,
      )
      // Debug: log first few items to see actual status values from API
      if (rawData.length > 0) {
        console.log("[PreDeliveries] Sample API data:", rawData.slice(0, 3).map((d) => ({
          id: d.pre_delivery_id,
          status: d.status,
          statusType: typeof d.status,
          hasMobileZone: Boolean(d.mobile_deliverer_zone?.mobile_deliverer_zone_id),
          allKeys: Object.keys(d),
        })))
      }
      return data
    },
  })

  // ------ Inline quick-status update ------
  // For "confirmed" status, open the dialog so commune/quartier can be set.
  // For all other statuses, update inline immediately.
  const handleQuickStatusUpdate = useCallback(
    async (preDelivery: PreDelivery, newStatus: string) => {
      if (newStatus === "confirmed") {
        setSelectedPreDelivery(preDelivery)
        setSelectedCommuneId("")
        setSelectedQuartierId("")
        setSelectedStatus("confirmed")
        setShowDialog(true)
        return
      }

      setUpdatingRowId(preDelivery.pre_delivery_id)
      try {
        const response = await fetch(`${apiBaseUrl}/deliveries/update-pre-delivery-status`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pre_delivery_id: preDelivery.pre_delivery_id,
            status: newStatus,
          }),
        })
        if (response.ok) {
          toast({ title: "Statut mis à jour", description: `→ ${STATUS_CONFIG[newStatus as PreDeliveryStatus]?.label ?? newStatus}` })
          refetch()
        } else {
          const err = await response.json().catch(() => ({}))
          throw new Error(err.message || "Erreur")
        }
      } catch (error) {
        toast({
          title: "Erreur",
          description: error instanceof Error ? error.message : "Impossible de mettre à jour le statut",
          variant: "destructive",
        })
      } finally {
        setUpdatingRowId(null)
      }
    },
    [apiBaseUrl, refetch, toast],
  )

  // ------ Dialog submit (with commune / quartier) ------
  const handleOpenDialog = (preDelivery: PreDelivery) => {
    setSelectedPreDelivery(preDelivery)
    setSelectedCommuneId("")
    setSelectedQuartierId("")
    setSelectedStatus(preDelivery.status || "")
    setEditPackageValue(preDelivery.package_value_amount?.toString() || "")
    setEditAddress(preDelivery.recipient_address_line || "")
    setEditNote("")
    setShowDialog(true)
  }

  const handleSubmit = async () => {
    if (!selectedPreDelivery) return
    if (!selectedStatus) {
      toast({ title: "Erreur", description: "Veuillez sélectionner un statut", variant: "destructive" })
      return
    }
    if (selectedStatus === "confirmed" && (!selectedCommuneId || !selectedQuartierId)) {
      toast({ title: "Erreur", description: "Commune et quartier requis pour confirmer", variant: "destructive" })
      return
    }
    setIsSubmitting(true)
    try {
      // First update editable fields if they changed
      const patchPayload: any = {
        pre_delivery_id: selectedPreDelivery.pre_delivery_id,
      }
      
      if (editPackageValue.trim() && editPackageValue !== selectedPreDelivery.package_value_amount?.toString()) {
        patchPayload.package_value_amount = editPackageValue.trim()
      }
      
      if (editAddress.trim() && editAddress !== selectedPreDelivery.recipient_address_line) {
        patchPayload.recipient_address_line = editAddress.trim()
      }
      
      // Only call PATCH if there are changes to editable fields
      if (patchPayload.package_value_amount || patchPayload.recipient_address_line) {
        const patchResponse = await fetch(`${apiBaseUrl}/deliveries/pre-deliveries`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patchPayload),
        })
        if (!patchResponse.ok) {
          const errorData = await patchResponse.json().catch(() => ({}))
          throw new Error(errorData.message || "Erreur lors de la mise à jour des données")
        }
      }
      
      // Then update status if needed
      const statusPayload: Record<string, string> = {
        pre_delivery_id: selectedPreDelivery.pre_delivery_id,
        status: selectedStatus,
      }
      if (selectedStatus === "confirmed") {
        statusPayload.commune_id = selectedCommuneId
        statusPayload.quartier_id = selectedQuartierId
      }
      if (editNote.trim()) {
        statusPayload.note = editNote.trim()
      }
      
      const statusResponse = await fetch(`${apiBaseUrl}/deliveries/update-pre-delivery-status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(statusPayload),
      })
      
      if (statusResponse.ok) {
        toast({ title: "Succès", description: "Pré-livraison mise à jour" })
        refetch()
        setShowDialog(false)
        setSelectedPreDelivery(null)
      } else {
        const errorData = await statusResponse.json().catch(() => ({}))
        throw new Error(errorData.message || "Erreur lors de la mise à jour du statut")
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur s'est produite",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // ------ Filtering + search ------
  const filteredPreDeliveries = (preDeliveries ?? []).filter((pd: PreDelivery) => {
    // exclude pre-deliveries already assigned to a mobile deliverer zone
    const hasAssignedMobileZone =
      pd.mobile_deliverer_zone &&
      typeof pd.mobile_deliverer_zone === "object" &&
      "mobile_deliverer_zone_id" in pd.mobile_deliverer_zone &&
      Boolean(pd.mobile_deliverer_zone.mobile_deliverer_zone_id)
    if (hasAssignedMobileZone) return false

    // status filter
    if (statusFilter !== "all") {
      if (statusFilter === "pending" && pd.status) return false
      if (statusFilter !== "pending" && pd.status !== statusFilter) return false
    }
    // text search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const rawCreated = pd.created_at || pd.createdAt
      const haystack = [
        pd.recipient_name,
        pd.recipient_phone_number,
        pd.recipient_address_line,
        pd.package_description,
        pd.customer?.organizationName,
        pd.customer?.first_name,
        pd.customer?.last_name,
        rawCreated ?? "",
        formatPreDeliveryCreatedAtFrench(pd),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
      if (!haystack.includes(q)) return false
    }
    return true
  })

  const getOrderTimestamp = (pd: PreDelivery) => {
    const rawValue = pd.created_at ?? pd.createdAt
    const rawDate =
      rawValue && typeof rawValue === "object" && "$date" in rawValue
        ? rawValue.$date
        : rawValue
    const date = typeof rawDate === "string" ? new Date(rawDate) : rawDate instanceof Date ? rawDate : null
    return date && !Number.isNaN(date.getTime()) ? date.getTime() : 0
  }

  // group filtered pre-deliveries by customer for operations follow-ups
  const groupedPreDeliveries = useMemo(() => {
    const map: Record<
      string,
      { key: string; displayName: string; items: PreDelivery[]; latestOrderAt: number }
    > = {}
    ;(filteredPreDeliveries || []).forEach((pd) => {
      const displayName =
        pd.customer?.organizationName ||
        [pd.customer?.first_name, pd.customer?.last_name].filter(Boolean).join(" ") ||
        `Client • ${pd.customer_id ?? pd.pre_delivery_id}`
      const key = pd.customer_id || displayName
      if (!map[key]) map[key] = { key, displayName, items: [], latestOrderAt: 0 }
      map[key].items.push(pd)
      const timestamp = getOrderTimestamp(pd)
      if (timestamp > map[key].latestOrderAt) map[key].latestOrderAt = timestamp
    })
    return Object.values(map)
      .map((group) => ({
        ...group,
        items: group.items.sort((a, b) => getOrderTimestamp(b) - getOrderTimestamp(a)),
      }))
      .sort((a, b) => b.latestOrderAt - a.latestOrderAt)
  }, [filteredPreDeliveries])

  useEffect(() => {
    if (groupedPreDeliveries.length === 0) {
      if (selectedCustomerKey) setSelectedCustomerKey(null)
      return
    }
    if (!selectedCustomerKey || !groupedPreDeliveries.some((group) => group.key === selectedCustomerKey)) {
      setSelectedCustomerKey(groupedPreDeliveries[0].key)
    }
  }, [groupedPreDeliveries, selectedCustomerKey])

  const selectedCustomerGroup =
    groupedPreDeliveries.find((group) => group.key === selectedCustomerKey) || groupedPreDeliveries[0] || null

  // ------ Status counts for KPI bar ------
  const statusCounts = (preDeliveries ?? []).reduce<Record<string, number>>(
    (acc, pd) => {
      const key = getStatusKey(pd.status)
      acc[key] = (acc[key] || 0) + 1
      return acc
    },
    {},
  )

  // ------ Loading ------
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2B015F]" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#2B015F]">Pré-Livraisons</h1>
          <p className="text-sm text-gray-500 mt-1">
            Suivi et mise à jour des commandes en attente de confirmation
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5 self-start sm:self-auto"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
          Actualiser
        </Button>
      </div>

      {/* KPI Status Counts */}
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {ALL_STATUSES.map((key) => {
          const cfg = STATUS_CONFIG[key]
          const count = statusCounts[key] || 0
          const isActive = statusFilter === key || (statusFilter === "all" && key === "pending")
          return (
            <button
              key={key}
              onClick={() => setStatusFilter(statusFilter === key ? "all" : key === "pending" ? "pending" : key)}
              className={`rounded-xl border p-2.5 text-left transition-all hover:shadow-sm ${
                statusFilter === key ? `ring-2 ${cfg.ring} ${cfg.bg}` : "bg-white"
              }`}
            >
              <p className={`text-lg font-bold ${cfg.color}`}>{count}</p>
              <p className="text-[11px] text-gray-500 leading-tight truncate">{cfg.label}</p>
            </button>
          )
        })}
      </div>

      {/* Toolbar — search + filter */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher par nom, téléphone, adresse, client..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="w-full sm:w-56">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="confirmed">Confirmé</SelectItem>
                  <SelectItem value="no_response">Pas de réponse</SelectItem>
                  <SelectItem value="unreachable_phone_number">Numéro injoignable</SelectItem>
                  <SelectItem value="not_interested">Pas intéressé</SelectItem>
                  <SelectItem value="does_not_remember">Ne se souvient pas</SelectItem>
                  <SelectItem value="beyond_delivery_zone">Hors zone</SelectItem>
                  <SelectItem value="will_call_us_when_ready">Rappellera</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-gray-400 whitespace-nowrap">{filteredPreDeliveries.length} résultat(s)</p>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {filteredPreDeliveries.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <Package className="mx-auto h-10 w-10 mb-3 text-gray-300" />
              <p className="font-medium">Aucune pré-livraison trouvée</p>
              <p className="text-sm mt-1">Essayez de modifier vos filtres</p>
            </div>
          ) : (
            <>
              {/* ===== Desktop customer selector + details ===== */}
              <div className="hidden lg:grid lg:grid-cols-[280px_1fr] gap-4">
                <aside className="rounded-2xl border bg-white p-4 shadow-sm">
                  <div className="mb-3">
                    <p className="text-sm font-semibold">Clients</p>
                    <p className="text-xs text-gray-500">Cliquer sur un client pour voir ses commandes récentes</p>
                  </div>
                  <div className="space-y-2">
                    {groupedPreDeliveries.map((group) => {
                      const isActive = group.key === selectedCustomerKey
                      return (
                        <button
                          key={group.key}
                          type="button"
                          onClick={() => setSelectedCustomerKey(group.key)}
                          className={`w-full rounded-2xl border p-3 text-left transition ${
                            isActive ? "border-[#2B015F] bg-[#faf8ff]" : "border-gray-200 bg-white hover:border-gray-300"
                          }`}>
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className={`text-sm font-semibold truncate ${isActive ? "text-[#2B015F]" : "text-gray-900"}`}>
                                {group.displayName}
                              </p>
                              <p className="text-[11px] text-gray-500 truncate">
                                Dernière commande le {group.latestOrderAt ? new Date(group.latestOrderAt).toLocaleDateString("fr-FR") : "-"}
                              </p>
                            </div>
                            <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-700">
                              {group.items.length}
                            </span>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </aside>

                <div className="overflow-x-auto rounded-2xl border bg-white shadow-sm">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50/80">
                        <TableHead className="min-w-[180px]">Créée le</TableHead>
                        <TableHead className="w-[180px]">Destinataire</TableHead>
                        <TableHead className="w-[120px]">Téléphone</TableHead>
                        <TableHead className="min-w-[14rem]">Adresse</TableHead>
                        <TableHead className="w-[100px] text-right">Valeur</TableHead>
                        <TableHead className="w-[140px]">Statut</TableHead>
                        <TableHead className="w-10 p-2" aria-label="Déplier les actions" />
                        <TableHead className="w-[90px]">Détails</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedCustomerGroup ? (
                        selectedCustomerGroup.items.map((pd: PreDelivery) => {
                          const statusKey = getStatusKey(pd.status)
                          const cfg = STATUS_CONFIG[statusKey]
                          const isUpdating = updatingRowId === pd.pre_delivery_id
                          const isExpanded = expandedPreDeliveryId === pd.pre_delivery_id
                          return (
                            <Fragment key={pd.pre_delivery_id}>
                              <TableRow className={`${cfg.rowBg} transition-colors ${isUpdating ? "opacity-60" : ""}`}>
                                <TableCell className="text-xs text-muted-foreground capitalize leading-snug max-w-[220px] whitespace-normal">
                                  {formatPreDeliveryCreatedAtFrench(pd)}
                                </TableCell>

                                {/* Recipient */}
                                <TableCell>
                                  <p className="font-medium text-sm leading-tight">
                                    {pd.recipient_name || "Non spécifié"}
                                  </p>
                                  <p className="text-[11px] text-gray-400 truncate max-w-[160px]">
                                    {pd.package_description}
                                  </p>
                                </TableCell>

                                {/* Phone */}
                                <TableCell>
                                  <a
                                    href={`tel:${pd.recipient_phone_number}`}
                                    className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
                                  >
                                    <Phone className="h-3 w-3" />
                                    {pd.recipient_phone_number}
                                  </a>
                                </TableCell>

                                {/* Address */}
                                <TableCell className="min-w-[14rem] max-w-2xl align-top whitespace-normal py-3">
                                  <span className="flex items-start gap-1 text-sm leading-relaxed">
                                    <MapPin className="h-3.5 w-3.5 text-gray-400 mt-0.5 shrink-0" aria-hidden />
                                    <span className="min-w-0 break-words">{pd.recipient_address_line}</span>
                                  </span>
                                </TableCell>

                                {/* Value */}
                                <TableCell className="text-right tabular-nums text-sm font-medium">
                                  {pd.package_value_amount} {pd.package_value_currency}
                                  {!pd.is_delivery_price_included && (
                                    <span className="block text-[10px] text-orange-500 font-normal">+ frais livr.</span>
                                  )}
                                </TableCell>

                                {/* Status badge */}
                                <TableCell>
                                  <StatusBadge status={pd.status} />
                                </TableCell>

                                <TableCell className="py-2">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    type="button"
                                    className="h-8 w-8 shrink-0"
                                    aria-expanded={isExpanded}
                                    aria-label={isExpanded ? "Masquer les actions" : "Afficher les actions rapides"}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setExpandedPreDeliveryId((cur) =>
                                        cur === pd.pre_delivery_id ? null : pd.pre_delivery_id,
                                      )
                                    }}
                                  >
                                    {isExpanded ? (
                                      <ChevronDown className="h-4 w-4 text-gray-600" />
                                    ) : (
                                      <ChevronRight className="h-4 w-4 text-gray-600" />
                                    )}
                                  </Button>
                                </TableCell>

                                {/* Full dialog action */}
                                <TableCell>
                                  <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => handleOpenDialog(pd)}>
                                    Détails
                                  </Button>
                                </TableCell>
                              </TableRow>

                              {isExpanded && (
                                <TableRow className={cfg.rowBg}>
                                  <TableCell colSpan={9} className="border-t bg-gray-50/80 py-4">
                                    <div className="flex flex-wrap items-center gap-3 px-2">
                                      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                        Action rapide
                                      </span>
                                      <Select
                                        key={`${pd.pre_delivery_id}-${pd.status}-expanded`}
                                        onValueChange={(val) => handleQuickStatusUpdate(pd, val)}
                                        disabled={isUpdating}
                                      >
                                        <SelectTrigger className="h-9 w-full max-w-sm text-xs">
                                          <SelectValue placeholder="Changer le statut" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="confirmed">✅ Confirmé</SelectItem>
                                          <SelectItem value="no_response">📞 Pas de réponse</SelectItem>
                                          <SelectItem value="unreachable_phone_number">📞 Numéro injoignable</SelectItem>
                                          <SelectItem value="not_interested">❌ Pas intéressé</SelectItem>
                                          <SelectItem value="does_not_remember">❓ Ne se souvient pas</SelectItem>
                                          <SelectItem value="beyond_delivery_zone">📍 Hors zone</SelectItem>
                                          <SelectItem value="will_call_us_when_ready">🔔 Rappellera</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              )}
                            </Fragment>
                          )
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center text-sm text-gray-500 py-8">
                            Sélectionnez un client pour voir ses pré-livraisons.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* ===== Mobile cards ===== */}
              <div className="lg:hidden space-y-4">
                <div className="rounded-2xl border bg-white p-4 shadow-sm">
                  <p className="text-sm font-semibold">Clients</p>
                  <p className="text-xs text-gray-500 mt-1">Choisissez un client pour voir ses commandes récentes.</p>
                  <Select value={selectedCustomerKey ?? ""} onValueChange={(value) => setSelectedCustomerKey(value)}>
                    <SelectTrigger className="mt-3">
                      <SelectValue placeholder="Sélectionner un client" />
                    </SelectTrigger>
                    <SelectContent>
                      {groupedPreDeliveries.map((group) => (
                        <SelectItem key={group.key} value={group.key}>
                          {group.displayName} ({group.items.length})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedCustomerGroup ? (
                  selectedCustomerGroup.items.map((pd: PreDelivery) => {
                    const isUpdating = updatingRowId === pd.pre_delivery_id
                    return (
                      <div key={pd.pre_delivery_id} className={`rounded-2xl border bg-white p-4 space-y-3 ${isUpdating ? "opacity-60" : ""}`}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            {selectedCustomerGroup.displayName && (
                              <p className="text-xs font-semibold text-[#2B015F] truncate">{selectedCustomerGroup.displayName}</p>
                            )}
                            <p className="font-medium text-sm truncate">{pd.recipient_name || "Non spécifié"}</p>
                            <p className="text-[11px] text-gray-600 mt-0.5 capitalize leading-snug">
                              {formatPreDeliveryCreatedAtFrench(pd)}
                            </p>
                            <a
                              href={`tel:${pd.recipient_phone_number}`}
                              className="text-xs text-blue-600 flex items-center gap-1 mt-0.5"
                            >
                              <Phone className="h-3 w-3" />
                              {pd.recipient_phone_number}
                            </a>
                          </div>
                          <StatusBadge status={pd.status} />
                        </div>

                        <div className="text-sm text-gray-600 space-y-1">
                          <p className="flex items-start gap-2">
                            <MapPin className="h-3.5 w-3.5 text-gray-400 mt-0.5 shrink-0" aria-hidden />
                            <span className="min-w-0 flex-1 text-sm leading-snug break-words text-gray-700">
                              {pd.recipient_address_line}
                            </span>
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-400">{pd.package_description}</span>
                            <span className="font-semibold text-sm">
                              {pd.package_value_amount} {pd.package_value_currency}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="w-full justify-between h-9 text-xs"
                            onClick={() =>
                              setExpandedPreDeliveryId((cur) =>
                                cur === pd.pre_delivery_id ? null : pd.pre_delivery_id,
                              )
                            }
                          >
                            <span>Actions rapides</span>
                            {expandedPreDeliveryId === pd.pre_delivery_id ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                          {expandedPreDeliveryId === pd.pre_delivery_id && (
                            <div className="flex flex-col gap-2 pt-2 border-t">
                              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground px-1">
                                Changer le statut
                              </p>
                              <Select
                                key={`${pd.pre_delivery_id}-${pd.status}-mobile`}
                                onValueChange={(val) => handleQuickStatusUpdate(pd, val)}
                                disabled={isUpdating}
                              >
                                <SelectTrigger className="h-9 text-xs w-full">
                                  <SelectValue placeholder="Changer statut" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="confirmed">✅ Confirmé</SelectItem>
                                  <SelectItem value="no_response">📞 Pas de réponse</SelectItem>
                                  <SelectItem value="unreachable_phone_number">📞 Numéro injoignable</SelectItem>
                                  <SelectItem value="not_interested">❌ Pas intéressé</SelectItem>
                                  <SelectItem value="does_not_remember">❓ Pas de souvenir</SelectItem>
                                  <SelectItem value="beyond_delivery_zone">📍 Hors zone</SelectItem>
                                  <SelectItem value="will_call_us_when_ready">🔔 Rappellera</SelectItem>
                                </SelectContent>
                              </Select>
                              <Button size="sm" variant="outline" className="h-9 text-xs w-full" onClick={() => handleOpenDialog(pd)}>
                                Détails
                              </Button>
                            </div>
                          )}
                          {expandedPreDeliveryId !== pd.pre_delivery_id && (
                            <Button size="sm" variant="secondary" className="h-9 text-xs w-full" onClick={() => handleOpenDialog(pd)}>
                              Détails
                            </Button>
                          )}
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="rounded-2xl border bg-white p-6 text-center text-sm text-gray-500">
                    Sélectionnez un client pour voir ses pré-livraisons.
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* ===== Detail / Commune+Quartier Dialog ===== */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Détails & mise à jour</DialogTitle>
          </DialogHeader>

          {selectedPreDelivery && (
            <div className="space-y-4">
              {/* Summary card */}
              <div className="rounded-lg border bg-gray-50/60 p-4 space-y-2">
                {selectedPreDelivery.customer?.organizationName && (
                  <p className="text-xs font-semibold text-[#2B015F] flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    {selectedPreDelivery.customer.organizationName}
                  </p>
                )}
                <p className="text-sm">
                  <span className="font-medium">Créée le:</span>{" "}
                  <span className="capitalize">{formatPreDeliveryCreatedAtFrench(selectedPreDelivery)}</span>
                </p>
                <p className="text-sm">
                  <span className="font-medium">Destinataire:</span>{" "}
                  {selectedPreDelivery.recipient_name || "N/A"}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Téléphone:</span>{" "}
                  <a href={`tel:${selectedPreDelivery.recipient_phone_number}`} className="text-blue-600 hover:underline">
                    {selectedPreDelivery.recipient_phone_number}
                  </a>
                </p>
                <p className="text-sm leading-relaxed">
                  <span className="font-medium">Adresse:</span>{" "}
                  <span className="break-words">{selectedPreDelivery.recipient_address_line}</span>
                </p>
                <p className="text-sm">
                  <span className="font-medium">Description:</span> {selectedPreDelivery.package_description}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Valeur:</span> {selectedPreDelivery.package_value_amount}{" "}
                  {selectedPreDelivery.package_value_currency}
                  {!selectedPreDelivery.is_delivery_price_included && (
                    <span className="text-orange-500 text-xs ml-1">(frais livraison non inclus)</span>
                  )}
                </p>
                <div className="pt-1">
                  <StatusBadge status={selectedPreDelivery.status} />
                </div>
              </div>

              {/* Editable fields */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="dialog-address">Adresse de livraison</Label>
                  <Input
                    id="dialog-address"
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                    placeholder="Adresse complète du destinataire"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="dialog-value">Valeur du colis ({selectedPreDelivery?.package_value_currency || 'USD'})</Label>
                  <Input
                    id="dialog-value"
                    type="number"
                    value={editPackageValue}
                    onChange={(e) => setEditPackageValue(e.target.value)}
                    placeholder="Valeur déclarée du colis"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="dialog-note">Note</Label>
                  <Input
                    id="dialog-note"
                    value={editNote}
                    onChange={(e) => setEditNote(e.target.value)}
                    placeholder="Ajouter une note (optionnel)"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="dialog-status">Statut</Label>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger id="dialog-status">
                      <SelectValue placeholder="Sélectionnez le statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="confirmed">✅ Confirmé</SelectItem>
                      <SelectItem value="no_response">📞 Pas de réponse</SelectItem>
                      <SelectItem value="unreachable_phone_number">📞 Numéro injoignable</SelectItem>
                      <SelectItem value="not_interested">❌ Pas intéressé</SelectItem>
                      <SelectItem value="does_not_remember">❓ Ne se souvient pas</SelectItem>
                      <SelectItem value="beyond_delivery_zone">📍 Hors zone</SelectItem>
                      <SelectItem value="will_call_us_when_ready">🔔 Rappellera</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {selectedStatus === "confirmed" && (
                  <>
                    <div>
                      <Label htmlFor="commune">Commune</Label>
                      <Select value={selectedCommuneId} onValueChange={setSelectedCommuneId}>
                        <SelectTrigger id="commune">
                          <SelectValue placeholder="Sélectionnez la commune" />
                        </SelectTrigger>
                        <SelectContent>
                          {communes.length === 0 ? (
                            <SelectItem value="loading" disabled>
                              Chargement...
                            </SelectItem>
                          ) : (
                            communes.map((c) => (
                              <SelectItem key={c.commune_id} value={c.commune_id}>
                                {c.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedCommuneId && (
                      <div>
                        <Label htmlFor="quartier">Quartier</Label>
                        <Select value={selectedQuartierId} onValueChange={setSelectedQuartierId}>
                          <SelectTrigger id="quartier">
                            <SelectValue placeholder="Sélectionnez le quartier" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableQuartiers.length === 0 ? (
                              <SelectItem value="no-quartiers" disabled>
                                Aucun quartier disponible
                              </SelectItem>
                            ) : (
                              availableQuartiers.map((q) => (
                                <SelectItem key={q.id} value={q.id.toString()}>
                                  {q.name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-[#2B015F] hover:bg-[#1A0138]">
              {isSubmitting ? "Mise à jour..." : "Confirmer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function PreDeliveriesPage() {
  const queryClientRef = useRef<QueryClient>()
  if (!queryClientRef.current) {
    queryClientRef.current = new QueryClient()
  }

  return (
    <QueryClientProvider client={queryClientRef.current}>
      <PreDeliveriesContent />
    </QueryClientProvider>
  )
}
