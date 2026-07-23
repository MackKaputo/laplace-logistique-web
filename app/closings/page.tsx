"use client"

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query"
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  HelpCircle,
  Loader2,
  LogOut,
  MapPin,
  MapPinOff,
  MessageCircle,
  Package,
  Phone,
  PhoneCall,
  RefreshCw,
  Search,
  Truck,
  User,
  UserCheck,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatPreDeliveryCreatedAtFrench } from "@/lib/utils"

type PreDeliveryStatus =
  | "no_response"
  | "confirmed"
  | "not_interested"
  | "does_not_remember"
  | "beyond_delivery_zone"
  | "will_call_us_when_ready"
  | "unreachable_phone_number"

interface CloserCustomer {
  name: string
  customer_id: string
}

interface CloserProfile {
  _id: string
  user_id: string
  access_code: string
  first_name: string
  last_name: string
  role: string
  email: string
  phone_number: string
  customers: CloserCustomer[]
}

interface MobileDeliverer {
  _id: string
  mobile_deliverer_id: string
  first_name: string
  last_name: string
  phone_number: string
  access_code: string
  mobile_deliverer_zones: string[]
}

interface PreDelivery {
  pre_delivery_id: string
  created_at?: string
  /** Some API responses use camelCase */
  createdAt?: string
  recipient_address_line: string
  recipient_name: string
  recipient_phone_number: string
  package_description: string
  package_value_currency: string
  package_value_amount: number
  is_delivery_price_included: boolean
  customer_id: string
  status?: string
  preferred_delivery_date?: number | string
  mobile_deliverer?: {
    mobile_deliverer_id: string
    name: string
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

const SESSION_KEY = "daredare_closer_session"

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
    icon: AlertCircle,
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
  unreachable_phone_number: {
    label: "Numéro injoignable",
    icon: Phone,
    color: "text-rose-700",
    bg: "bg-rose-50",
    ring: "ring-rose-300",
    rowBg: "bg-rose-50/30",
  },
}

function getStatusKey(status?: string | null): PreDeliveryStatus | "pending" {
  if (!status || status === "null" || status === "undefined") return "pending"
  const normalized = status.trim().toLowerCase()
  if (normalized in STATUS_CONFIG) return normalized as PreDeliveryStatus
  const mapped: Record<string, PreDeliveryStatus> = {
    beyonddeliveryzone: "beyond_delivery_zone",
    willcalluswhenready: "will_call_us_when_ready",
    noresponse: "no_response",
    notinterested: "not_interested",
    doesnotremember: "does_not_remember",
    confirmed: "confirmed",
    unreachablephonenumber: "unreachable_phone_number",
  }
  return mapped[normalized.replace(/[\s_-]/g, "")] || "pending"
}

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

const getPhoneHref = (phoneNumber: string) => {
  const normalizedPhoneNumber = phoneNumber?.replace(/[^\d+]/g, "") || ""
  return normalizedPhoneNumber ? `tel:${normalizedPhoneNumber}` : ""
}

const getWhatsappHref = (phoneNumber: string) => {
  const normalizedPhoneNumber = phoneNumber?.replace(/\D/g, "").replace(/^00/, "") || ""
  return normalizedPhoneNumber ? `https://wa.me/${normalizedPhoneNumber}` : ""
}

export function ClosingsContent({ initialProfile }: { initialProfile?: CloserProfile } = {}) {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_SERVER_BASE_URL
  const { toast } = useToast()

  const [accessCode, setAccessCode] = useState("")
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [profile, setProfile] = useState<CloserProfile | null>(initialProfile ?? null)
  const [selectedCustomerId, setSelectedCustomerId] = useState("")
  const [activeTab, setActiveTab] = useState("pre-deliveries")

  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [updatingRowId, setUpdatingRowId] = useState<string | null>(null)
  const [editingField, setEditingField] = useState<{id: string, field: 'address' | 'value'} | null>(null)
  const [mobileDelivererZones, setMobileDelivererZones] = useState<any[]>([])
  const [selectedZoneId, setSelectedZoneId] = useState("")
  const [selectedPreDeliveryForZone, setSelectedPreDeliveryForZone] = useState<PreDelivery | null>(null)
  const [preferredDeliveryDate, setPreferredDeliveryDate] = useState("")
  const [selectedPreDelivery, setSelectedPreDelivery] = useState<PreDelivery | null>(null)
  const [showDialog, setShowDialog] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState("")
  const [selectedCommuneId, setSelectedCommuneId] = useState("")
  const [selectedQuartierId, setSelectedQuartierId] = useState("")
  const [isSubmittingPreDelivery, setIsSubmittingPreDelivery] = useState(false)
  const [isAssigningZone, setIsAssigningZone] = useState(false)

  const [preDeliveryPage, setPreDeliveryPage] = useState(1)
  const [preDeliveryPageSize] = useState(60)
  const [preDeliveryTotal, setPreDeliveryTotal] = useState(0)

  const [communes, setCommunes] = useState<Commune[]>([])
  const [availableQuartiers, setAvailableQuartiers] = useState<Quartier[]>([])
  const [expandedPreDeliveryId, setExpandedPreDeliveryId] = useState<string | null>(null)

  // Assigner tab state
  const [mobileDeliverers, setMobileDeliverers] = useState<MobileDeliverer[]>([])
  const [loadingDeliverers, setLoadingDeliverers] = useState(false)
  const [assigningPreDeliveryId, setAssigningPreDeliveryId] = useState<string | null>(null)
  const [selectedDelivererId, setSelectedDelivererId] = useState<Record<string, string>>({})
  const [assignerSearchQuery, setAssignerSearchQuery] = useState("")
  const [editPackageValue, setEditPackageValue] = useState("")
  const [editAddress, setEditAddress] = useState("")
  const [editNote, setEditNote] = useState("")
  const [isEditingPreDelivery, setIsEditingPreDelivery] = useState(false)

  useEffect(() => {
    if (initialProfile) {
      setProfile(initialProfile)
      if (initialProfile.customers?.length > 0) {
        setSelectedCustomerId(initialProfile.customers[0].customer_id)
      }
      return
    }

    const stored = localStorage.getItem(SESSION_KEY)
    if (!stored) return
    try {
      const parsed = JSON.parse(stored) as CloserProfile
      setProfile(parsed)
      if (parsed.customers?.length > 0) {
        setSelectedCustomerId(parsed.customers[0].customer_id)
      }
    } catch {
      localStorage.removeItem(SESSION_KEY)
    }
  }, [initialProfile])

  useEffect(() => {
    const fetchCommunes = async () => {
      if (!apiBaseUrl) return
      try {
        const response = await fetch(`${apiBaseUrl}/deliveries/communes`)
        if (!response.ok) return
        const result = await response.json()
        setCommunes(result.data || [])
      } catch {
        setCommunes([])
      }
    }
    fetchCommunes()
  }, [apiBaseUrl])

  useEffect(() => {
    if (!selectedCommuneId) {
      setAvailableQuartiers([])
      setSelectedQuartierId("")
      return
    }
    const commune = communes.find((item) => item.commune_id === selectedCommuneId)
    setAvailableQuartiers(commune?.quartiers || [])
  }, [selectedCommuneId, communes])

  const preDeliveriesQuery = useQuery({
    queryKey: ["closings-pre-deliveries", selectedCustomerId, profile?.user_id, preDeliveryPage, preDeliveryPageSize, initialProfile ? "backoffice" : null],
    queryFn: async () => {
      const sourceParam = initialProfile ? "&source=backoffice" : ""
      const response = await fetch(
        `${apiBaseUrl}/deliveries/pre-deliveries/closer?customer_id=${selectedCustomerId}&user_id=${profile?.user_id}&page=${preDeliveryPage}&limit=${preDeliveryPageSize}${sourceParam}`,
      )
      if (!response.ok) throw new Error("Erreur lors du chargement des pré-livraisons")
      const result = await response.json()
      setPreDeliveryTotal(result.total ?? result.count ?? result.data?.length ?? 0)
      return (result.data || []) as PreDelivery[]
    },
    enabled: !!apiBaseUrl && !!selectedCustomerId && !!profile,
  })

  // Reset to page 1 when the customer changes
  useEffect(() => {
    setPreDeliveryPage(1)
  }, [selectedCustomerId])

  useEffect(() => {
    if (!profile || !selectedCustomerId) return
    if (activeTab === "pre-deliveries") {
      preDeliveriesQuery.refetch()
    }
  }, [activeTab, profile, selectedCustomerId, preDeliveriesQuery.refetch])

  const selectedCustomerName = useMemo(() => {
    return profile?.customers.find((c) => c.customer_id === selectedCustomerId)?.name || ""
  }, [profile?.customers, selectedCustomerId])

  const handleLogin = async () => {
    if (!accessCode.trim()) {
      toast({ title: "Code requis", description: "Veuillez saisir un code d'accès", variant: "destructive" })
      return
    }
    if (!apiBaseUrl) return
    setIsLoggingIn(true)
    try {
      const response = await fetch(`${apiBaseUrl}/users/access-code/${accessCode.trim()}`)
      const result = await response.json()
      if (!response.ok || !result.success || !result.data) {
        throw new Error(result.message || "Code d'accès invalide")
      }
      const nextProfile = result.data as CloserProfile
      setProfile(nextProfile)
      localStorage.setItem(SESSION_KEY, JSON.stringify(nextProfile))
      const firstCustomer = nextProfile.customers?.[0]?.customer_id || ""
      setSelectedCustomerId(firstCustomer)
      toast({ title: "Connexion réussie", description: `Bienvenue ${nextProfile.first_name}` })
    } catch (error) {
      toast({
        title: "Connexion échouée",
        description: error instanceof Error ? error.message : "Impossible de valider ce code",
        variant: "destructive",
      })
    } finally {
      setIsLoggingIn(false)
    }
  }

  const logout = () => {
    setProfile(null)
    setSelectedCustomerId("")
    setAccessCode("")
    localStorage.removeItem(SESSION_KEY)
  }

  // Fetch mobile deliverer zones
  useEffect(() => {
    const fetchMobileDelivererZones = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/deliverers/mobile-deliverer-zones`)
        if (response.ok) {
          const result = await response.json()
          setMobileDelivererZones(result.data || [])
        }
      } catch (error) {
        console.error('Failed to fetch mobile deliverer zones:', error)
      }
    }
    
    if (apiBaseUrl) {
      fetchMobileDelivererZones()
    }
  }, [apiBaseUrl])

  const plannedForTodayQuery = useQuery({
    queryKey: ["planned-for-today"],
    queryFn: async () => {
      const response = await fetch(`${apiBaseUrl}/deliveries/pre-deliveries/planned-for-today`)
      if (!response.ok) throw new Error("Erreur lors du chargement")
      const result = await response.json()
      return (result.data || []) as PreDelivery[]
    },
    enabled: !!apiBaseUrl && !!profile && activeTab === "deliveries",
    refetchInterval: 60000,
  })

  const unassignedConfirmedQuery = useQuery({
    queryKey: ["unassigned-confirmed-today", selectedCustomerId],
    queryFn: async () => {
      const response = await fetch(`${apiBaseUrl}/deliveries/pre-deliveries/unassigned-confirmed-for-today`)
      if (!response.ok) throw new Error("Erreur lors du chargement")
      const result = await response.json()
      return (result.data || []) as PreDelivery[]
    },
    enabled: !!apiBaseUrl && !!profile && activeTab === "assigner",
  })

  // Re-fetch unassigned confirmed when switching to Assigner tab
  useEffect(() => {
    if (activeTab === "assigner") {
      unassignedConfirmedQuery.refetch()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  // Fetch mobile deliverers when Assigner tab is active
  useEffect(() => {
    if (activeTab !== "assigner" || !apiBaseUrl) return
    const fetchDeliverers = async () => {
      setLoadingDeliverers(true)
      try {
        const response = await fetch(`${apiBaseUrl}/deliverers/mobile-deliverers`)
        if (response.ok) {
          const result = await response.json()
          setMobileDeliverers(result.data || [])
        }
      } catch {
        // silently fail
      } finally {
        setLoadingDeliverers(false)
      }
    }
    fetchDeliverers()
  }, [activeTab, apiBaseUrl])

  const handleAssignDeliverer = async (preDelivery: PreDelivery) => {
    const delivererId = selectedDelivererId[preDelivery.pre_delivery_id]
    if (!delivererId || !apiBaseUrl) return
    setAssigningPreDeliveryId(preDelivery.pre_delivery_id)
    try {
      const response = await fetch(`${apiBaseUrl}/deliveries/pre-deliveries/assign-mobile-deliverer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pre_delivery_id: preDelivery.pre_delivery_id,
          mobile_deliverer_id: delivererId,
        }),
      })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || "Erreur lors de l'assignation")
      }
      toast({ title: "Livreur assigné", description: `Commande de ${preDelivery.recipient_name} assignée avec succès` })
      setSelectedDelivererId((prev) => { const next = { ...prev }; delete next[preDelivery.pre_delivery_id]; return next })
      unassignedConfirmedQuery.refetch()
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Échec de l'assignation",
        variant: "destructive",
      })
    } finally {
      setAssigningPreDeliveryId(null)
    }
  }

  const handleQuickStatusUpdate = useCallback(
    async (preDelivery: PreDelivery, newStatus: string) => {
      if (!apiBaseUrl) return
      if (newStatus === "confirmed") {
        setSelectedPreDelivery(preDelivery)
        setSelectedStatus("confirmed")
        setSelectedCommuneId("")
        setSelectedQuartierId("")
        setEditPackageValue(preDelivery.package_value_amount?.toString() || "")
        setEditAddress(preDelivery.recipient_address_line || "")
        setEditNote("")
        setShowDialog(true)
        return
      }
      if (newStatus === "assign_zone") {
        setSelectedPreDeliveryForZone(preDelivery)
        setSelectedZoneId("")
        setPreferredDeliveryDate("")
        setEditAddress(preDelivery.recipient_address_line || "")
        setEditPackageValue(preDelivery.package_value_amount?.toString() || "")
        setEditNote("")
        return
      }

      setUpdatingRowId(preDelivery.pre_delivery_id)
      try {
        const response = await fetch(`${apiBaseUrl}/deliveries/update-pre-delivery-status`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pre_delivery_id: preDelivery.pre_delivery_id, status: newStatus }),
        })
        if (!response.ok) throw new Error("Impossible de mettre à jour le statut")
        toast({ title: "Statut mis à jour" })
        preDeliveriesQuery.refetch()
      } catch (error) {
        toast({
          title: "Erreur",
          description: error instanceof Error ? error.message : "Mise à jour échouée",
          variant: "destructive",
        })
      } finally {
        setUpdatingRowId(null)
      }
    },
    [apiBaseUrl, preDeliveriesQuery, toast],
  )

  const handleSubmitPreDelivery = async () => {
    if (!apiBaseUrl || !selectedPreDelivery) return
    if (!selectedStatus) {
      toast({ title: "Statut requis", variant: "destructive" })
      return
    }
    if (selectedStatus === "confirmed" && (!selectedCommuneId || !selectedQuartierId)) {
      toast({
        title: "Informations manquantes",
        description: "Commune et quartier sont requis pour confirmer",
        variant: "destructive",
      })
      return
    }

    setIsSubmittingPreDelivery(true)
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
      
      const response = await fetch(`${apiBaseUrl}/deliveries/update-pre-delivery-status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(statusPayload),
      })
      if (!response.ok) throw new Error("Impossible de mettre à jour cette pré-livraison")
      toast({ title: "Pré-livraison mise à jour" })
      setShowDialog(false)
      setSelectedPreDelivery(null)
      preDeliveriesQuery.refetch()
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Mise à jour échouée",
        variant: "destructive",
      })
    } finally {
      setIsSubmittingPreDelivery(false)
    }
  }

  const handleAssignZone = async () => {
    console.log("Assigning zone with data:", {
      pre_delivery_id: selectedPreDeliveryForZone?.pre_delivery_id,
      mobile_deliverer_zone_id: selectedZoneId,
      preferred_delivery_date: preferredDeliveryDate,

    })
    if (!apiBaseUrl || !selectedPreDeliveryForZone || !selectedZoneId) return
    if (!preferredDeliveryDate) {
      toast({
        title: "Date requise",
        description: "Veuillez choisir une date de livraison preferee",
        variant: "destructive",
      })
      return
    }
    console.log("Preferred delivery date string:", preferredDeliveryDate)
    const preferredDeliveryDateEpoch = new Date(`${preferredDeliveryDate}`).getTime()
    if (Number.isNaN(preferredDeliveryDateEpoch)) {
      console.error("Invalid preferred delivery date:", preferredDeliveryDateEpoch)
      toast({
        title: "Date invalide",
        description: "Veuillez choisir une date de livraison valide",
        variant: "destructive",
      })
      return
    }
    
    setIsAssigningZone(true)
    try {
      // First update editable fields if they changed
      const patchPayload: any = {
        pre_delivery_id: selectedPreDeliveryForZone.pre_delivery_id,
      }

      if (editAddress.trim() && editAddress !== selectedPreDeliveryForZone.recipient_address_line) {
        patchPayload.recipient_address_line = editAddress.trim()
      }

      if (editPackageValue.trim() && editPackageValue !== selectedPreDeliveryForZone.package_value_amount?.toString()) {
        patchPayload.package_value_amount = editPackageValue.trim()
      }

      if (patchPayload.recipient_address_line || patchPayload.package_value_amount) {
        const patchResponse = await fetch(`${apiBaseUrl}/deliveries/pre-deliveries`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patchPayload),
        })
        if (!patchResponse.ok) {
          const errorData = await patchResponse.json().catch(() => ({}))
          throw new Error(errorData.message || "Erreur lors de la mise à jour de l'adresse")
        }
      }
      console.log("Sending assign zone request with epoch date:", preferredDeliveryDateEpoch)
      const response = await fetch(`${apiBaseUrl}/deliveries/pre-deliveries/assign-zone`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pre_delivery_id: selectedPreDeliveryForZone.pre_delivery_id,
          mobile_deliverer_zone_id: selectedZoneId,
          preferred_delivery_date: preferredDeliveryDateEpoch,
        }),
      })
      
      if (response.ok) {
        toast({ title: "Zone assignée avec succès" })
        setSelectedPreDeliveryForZone(null)
        setSelectedZoneId("")
        setPreferredDeliveryDate("")
        setEditAddress("")
        setEditPackageValue("")
        setEditNote("")
        preDeliveriesQuery.refetch()
        unassignedConfirmedQuery.refetch()
      } else {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || "Erreur lors de l'assignation de zone")
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Échec de l'assignation",
        variant: "destructive",
      })
    } finally {
      setIsAssigningZone(false)
    }
  }

  const handleQuickAssignZone = async (preDelivery: PreDelivery) => {
    if (!apiBaseUrl) return
    
    setSelectedPreDeliveryForZone(preDelivery)
    setSelectedZoneId("")
    setPreferredDeliveryDate("")
    setEditAddress(preDelivery.recipient_address_line || "")
    setEditPackageValue(preDelivery.package_value_amount?.toString() || "")
    setEditNote("")
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleCloseAssignZoneView = () => {
    setSelectedPreDeliveryForZone(null)
    setSelectedZoneId("")
    setPreferredDeliveryDate("")
    setEditAddress("")
    setEditPackageValue("")
    setEditNote("")
  }

  const filteredPreDeliveries = useMemo(() => {
    const list = (preDeliveriesQuery.data || []) as PreDelivery[]
    return list.filter((pd) => {
      if (statusFilter !== "all") {
        if (statusFilter === "pending" && pd.status) return false
        if (statusFilter !== "pending" && pd.status !== statusFilter) return false
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const createdSource = pd.created_at ?? pd.createdAt
        const text = [
          pd.recipient_name,
          pd.recipient_phone_number,
          pd.recipient_address_line,
          pd.package_description,
          selectedCustomerName,
          createdSource ?? "",
          formatPreDeliveryCreatedAtFrench(pd),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
        if (!text.includes(query)) return false
      }
      return true
    })
  }, [preDeliveriesQuery.data, searchQuery, selectedCustomerName, statusFilter])

  const paginatedPreDeliveries = useMemo(() => filteredPreDeliveries, [filteredPreDeliveries])

  const preDeliveryTotalPages = Math.ceil(preDeliveryTotal / preDeliveryPageSize)

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] to-[#f1f5f9] pt-24 flex items-center justify-center">
        <div className="mx-auto w-full max-w-md px-3 py-10 sm:px-4 sm:py-14">
          <div className="bg-white rounded-xl border border-[#B08968]/10 shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-[#1a1009] to-[#2a1809] p-6">
              <h2 className="text-xl font-bold text-white">Accès Closings</h2>
              <p className="text-[#B08968]/80 text-sm mt-1">Saisissez votre code d'accès pour consulter les clients assignés.</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="accessCode" className="text-[#1a1009] font-medium">Code d'accès</Label>
                <Input
                  id="accessCode"
                  placeholder="Ex: 689556"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleLogin()
                  }}
                  className="border-[#B08968]/20 focus:border-[#22D3EE]"
                />
              </div>
              <Button 
                onClick={handleLogin} 
                disabled={isLoggingIn} 
                className="w-full bg-gradient-to-r from-[#22D3EE] to-[#06b6d4] text-white hover:from-[#06b6d4] hover:to-[#22D3EE] font-semibold shadow-lg hover:shadow-xl transition-all duration-300 border-0"
              >
                {isLoggingIn ? "Connexion..." : "Se connecter"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-[#f8fafc] to-[#f1f5f9] ${initialProfile ? "" : "pt-24"}`}>
      <div className="mx-auto w-full max-w-7xl px-3 pb-28 pt-4 sm:px-4 sm:pb-10 lg:px-8 lg:py-8 lg:pb-12 space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-3xl font-bold text-[#1a1009] mb-2">Closings</h1>
          <p className="text-[#B08968]">
            {profile.first_name} {profile.last_name} ({profile.role})
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-[280px] sm:flex-row sm:flex-1 sm:justify-end">
          <Select
            value={selectedCustomerId}
            onValueChange={(value) => {
              setSelectedCustomerId(value)
              handleCloseAssignZoneView()
            }}
          >
            <SelectTrigger className="w-full sm:max-w-[320px]" aria-label="Client">
              <SelectValue placeholder="Sélectionner un client" />
            </SelectTrigger>
            <SelectContent>
              {profile?.customers?.map((customer) => (
                <SelectItem key={customer.customer_id} value={customer.customer_id}>
                  {customer.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!initialProfile && (
            <Button variant="outline" className="w-full shrink-0 sm:w-auto" onClick={logout}>
              <LogOut className="h-4 w-4 mr-2 shrink-0" />
              Déconnexion
            </Button>
          )}
        </div>
      </div>

      {selectedPreDeliveryForZone && (
        <Card className="overflow-hidden border-[#2B015F]/20 bg-[#2B015F]/[0.03] shadow-sm">
          <CardHeader className="space-y-3 px-3 pb-3 pt-4 sm:px-6 sm:pt-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 space-y-1">
                <CardTitle className="text-lg text-[#2B015F]">Assigner une zone</CardTitle>
                <CardDescription>
                  Choisissez la zone et la date de livraison preferee.
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={handleCloseAssignZoneView} className="w-full sm:w-auto">
                Annuler
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 px-3 pb-4 sm:px-6">
            <div className="rounded-xl border bg-background p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 space-y-2">
                  <p className="text-base font-semibold leading-tight">
                    {selectedPreDeliveryForZone.recipient_name || "Non specifie"}
                  </p>
                  <a
                    href={getPhoneHref(selectedPreDeliveryForZone.recipient_phone_number) || undefined}
                    className="inline-flex items-center gap-2 text-sm font-medium text-[#2563eb]"
                  >
                    <Phone className="h-4 w-4 shrink-0" aria-hidden />
                    <span>{selectedPreDeliveryForZone.recipient_phone_number}</span>
                  </a>
                </div>
                <StatusBadge status={selectedPreDeliveryForZone.status} />
              </div>
              <div className="mt-3 flex gap-2 text-muted-foreground">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                <p className="text-xs leading-snug break-words">{selectedPreDeliveryForZone.recipient_address_line}</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="zone-select">Zone de livraison</Label>
                <Select value={selectedZoneId} onValueChange={setSelectedZoneId}>
                  <SelectTrigger id="zone-select" className="h-11">
                    <SelectValue placeholder="Selectionner une zone" />
                  </SelectTrigger>
                  <SelectContent>
                    {mobileDelivererZones.map((zone: any) => (
                      <SelectItem key={zone.mobile_deliverer_zone_id} value={zone.mobile_deliverer_zone_id}>
                        {zone.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="preferred-delivery-date">Date de livraison preferee</Label>
                <Input
                  id="preferred-delivery-date"
                  //we need date and time
                  type="datetime-local"
                  value={preferredDeliveryDate}
                  onChange={(e) => setPreferredDeliveryDate(e.target.value)}
                  className="h-11"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="assign-zone-address">Adresse de livraison</Label>
              <Input
                id="assign-zone-address"
                value={editAddress}
                onChange={(e) => setEditAddress(e.target.value)}
                placeholder="Adresse complete du destinataire"
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="assign-zone-package-value">
                Valeur du colis ({selectedPreDeliveryForZone.package_value_currency || "USD"})
              </Label>
              <Input
                id="assign-zone-package-value"
                value={editPackageValue}
                onChange={(e) => setEditPackageValue(e.target.value)}
                placeholder="Prix du colis"
                className="h-11"
              />
            </div>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={handleCloseAssignZoneView} className="w-full sm:w-auto">
                Annuler
              </Button>
              <Button
                onClick={handleAssignZone}
                disabled={!selectedZoneId || !preferredDeliveryDate || isAssigningZone}
                className="w-full bg-[#2B015F] hover:bg-[#1A0138] sm:w-auto"
              >
                {isAssigningZone ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Assignation...
                  </>
                ) : (
                  "Assigner la zone"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-3 sm:space-y-4">
        <TabsList className="grid h-auto w-full grid-cols-3 gap-1 p-1">
          <TabsTrigger value="pre-deliveries" className="text-xs py-2.5 sm:text-sm shrink-0">
            Pré-livraisons
          </TabsTrigger>
          <TabsTrigger value="assigner" className="text-xs py-2.5 sm:text-sm shrink-0">
            Assigner
          </TabsTrigger>
          <TabsTrigger value="deliveries" className="text-xs py-2.5 sm:text-sm shrink-0">
            Livraisons
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pre-deliveries" className="mt-4 space-y-4 sm:mt-6">
          <Card className="overflow-hidden border-border/80 shadow-sm">
            <CardHeader className="space-y-3 pb-4 px-3 sm:px-6 pt-4 sm:pt-6">
              <div className="flex flex-col gap-3">
                <div className="relative w-full flex-1 min-w-0">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-11"
                    placeholder="Rechercher (nom, tél., adresse...)"
                  />
                </div>
                <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-stretch">
                <div className="relative w-full sm:flex-1 sm:max-w-[14rem]">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Filtrer par statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les statuts</SelectItem>
                      <SelectItem value="pending">En attente</SelectItem>
                      <SelectItem value="confirmed">Confirmé</SelectItem>
                      <SelectItem value="no_response">Pas de réponse</SelectItem>
                      <SelectItem value="not_interested">Pas intéressé</SelectItem>
                      <SelectItem value="does_not_remember">Ne se souvient pas</SelectItem>
                      <SelectItem value="beyond_delivery_zone">Hors zone</SelectItem>
                      <SelectItem value="will_call_us_when_ready">Rappellera</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  variant="outline"
                  className="h-11 w-full shrink-0 gap-2 sm:w-auto sm:min-w-[7.5rem]"
                  onClick={() => preDeliveriesQuery.refetch()}
                  disabled={preDeliveriesQuery.isFetching}
                  type="button"
                >
                  <RefreshCw className={`h-4 w-4 shrink-0 ${preDeliveriesQuery.isFetching ? "animate-spin" : ""}`} />
                  Actualiser
                </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {preDeliveriesQuery.isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2B015F]" />
                </div>
              ) : filteredPreDeliveries.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 px-4 py-16 text-center">
                  <Package className="h-10 w-10 text-muted-foreground/35" aria-hidden />
                  <p className="text-sm font-medium text-muted-foreground">Aucune pré-livraison trouvée</p>
                  <p className="max-w-[280px] text-xs text-muted-foreground">Affinez la recherche ou le filtre statut.</p>
                </div>
              ) : (
                <>
                <div className="hidden lg:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Client</TableHead>
                        <TableHead className="min-w-[180px] max-w-[220px]">Créée le</TableHead>
                        <TableHead>Destinataire</TableHead>
                        <TableHead>Téléphone</TableHead>
                        <TableHead className="min-w-[14rem]">Adresse</TableHead>
                        <TableHead className="text-right">Valeur</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead className="w-10 p-2" aria-label="Déplier les actions" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedPreDeliveries.map((pd) => {
                        const isExpanded = expandedPreDeliveryId === pd.pre_delivery_id
                        return (
                          <Fragment key={pd.pre_delivery_id}>
                            <TableRow
                              className={`${STATUS_CONFIG[getStatusKey(pd.status || "pending")].rowBg} ${updatingRowId === pd.pre_delivery_id ? "opacity-60" : ""}`}
                            >
                              <TableCell>{selectedCustomerName || "—"}</TableCell>
                              <TableCell className="text-xs text-muted-foreground capitalize leading-snug max-w-[220px] whitespace-normal">
                                {formatPreDeliveryCreatedAtFrench(pd)}
                              </TableCell>
                              <TableCell>
                                <div className="space-y-0.5">
                                  <p className="text-sm font-medium">{pd.recipient_name || "Non spécifié"}</p>
                                  <p className="text-xs text-gray-400">{pd.package_description}</p>
                                </div>
                              </TableCell>
                              <TableCell>{pd.recipient_phone_number}</TableCell>
                              <TableCell className="min-w-[14rem] max-w-2xl align-top whitespace-normal break-words py-3 text-sm leading-relaxed">
                                {pd.recipient_address_line}
                              </TableCell>
                              <TableCell className="text-right">
                                {pd.package_value_amount} {pd.package_value_currency}
                              </TableCell>
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
                            </TableRow>
                            {isExpanded && (
                              <TableRow className={STATUS_CONFIG[getStatusKey(pd.status)].rowBg}>
                                <TableCell colSpan={8} className="border-t bg-gray-50/80 py-4">
                                  <div className="flex flex-wrap items-center gap-3 px-2">
                                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                      Action rapide
                                    </span>
                                    <Select
                                      key={`${pd.pre_delivery_id}-${pd.status}-expanded`}
                                      onValueChange={(value) => handleQuickStatusUpdate(pd, value)}
                                      disabled={updatingRowId === pd.pre_delivery_id}
                                    >
                                      <SelectTrigger className="h-9 w-full max-w-sm text-xs">
                                        <SelectValue placeholder="Changer le statut" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="confirmed">Confirmé</SelectItem>
                                        <SelectItem value="no_response">Pas de réponse</SelectItem>
                                        <SelectItem value="unreachable_phone_number">Numéro injoignable</SelectItem>
                                        <SelectItem value="not_interested">Pas intéressé</SelectItem>
                                        <SelectItem value="does_not_remember">Ne se souvient pas</SelectItem>
                                        <SelectItem value="beyond_delivery_zone">Hors zone</SelectItem>
                                        <SelectItem value="will_call_us_when_ready">Rappellera</SelectItem>
                                        <SelectItem value="assign_zone">Confirmer zone</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </Fragment>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination Controls */}
                <div className="flex items-center justify-between px-4 py-3 border-t bg-background/95">
                  <div className="text-sm text-muted-foreground">
                    Page {preDeliveryPage} sur {preDeliveryTotalPages || 1} ({preDeliveryTotal} total)
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPreDeliveryPage(Math.max(1, preDeliveryPage - 1))}
                      disabled={preDeliveryPage <= 1 || preDeliveriesQuery.isFetching}
                    >
                      Précédent
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPreDeliveryPage(preDeliveryPage + 1)}
                      disabled={preDeliveriesQuery.isFetching || preDeliveryPage >= preDeliveryTotalPages}
                    >
                      Suivant
                    </Button>
                  </div>
                </div>

                <div className="lg:hidden space-y-3 px-3 pb-4 pt-2 sm:px-4">
                  {paginatedPreDeliveries.map((pd) => {
                    const rowTone = STATUS_CONFIG[getStatusKey(pd.status)].rowBg
                    const isUpdating = updatingRowId === pd.pre_delivery_id
                    const isExpandedMobile = expandedPreDeliveryId === pd.pre_delivery_id
                    const phoneHref = getPhoneHref(pd.recipient_phone_number)
                    const whatsappHref = getWhatsappHref(pd.recipient_phone_number)
                    return (
                      <div
                        key={pd.pre_delivery_id}
                        className={`rounded-xl border bg-card shadow-sm overflow-hidden transition-opacity ${rowTone || ""} ${isUpdating ? "opacity-70" : ""}`}
                      >
                        <div className="flex items-start justify-between gap-3 p-4 pb-2">
                          <div className="min-w-0 flex-1 space-y-2">
                            {selectedCustomerName ? (
                              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#2B015F]/80">
                                {selectedCustomerName}
                              </p>
                            ) : null}
                            <p className="text-base font-semibold leading-tight">{pd.recipient_name || "Non spécifié"}</p>
                            <p className="text-xs text-muted-foreground capitalize leading-snug">
                              {formatPreDeliveryCreatedAtFrench(pd)}
                            </p>
                          </div>
                          <StatusBadge status={pd.status} />
                        </div>
                        <div className="space-y-2 px-4 text-sm">
                          <div className="flex flex-wrap items-center gap-2">
                            {phoneHref && (
                              <Button asChild size="sm" className="h-9 flex-1 bg-[#2B015F] hover:bg-[#1A0138] sm:flex-none">
                                <a href={phoneHref} aria-label={`Appeler ${pd.recipient_phone_number}`}>
                                  <Phone className="h-4 w-4" />
                                  Appeler
                                </a>
                              </Button>
                            )}
                            {whatsappHref && (
                              <Button asChild size="sm" variant="outline" className="h-9 flex-1 border-green-600 text-green-700 hover:bg-green-50 sm:flex-none">
                                <a
                                  href={whatsappHref}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  aria-label={`Contacter ${pd.recipient_phone_number} sur WhatsApp`}
                                >
                                  <MessageCircle className="h-4 w-4" />
                                  WhatsApp
                                </a>
                              </Button>
                            )}
                          </div>
                          {pd.recipient_phone_number && (
                            <a
                              href={phoneHref || undefined}
                              className="inline-flex items-center gap-2 text-[#2563eb] font-medium underline-offset-2 touch-manipulation"
                            >
                              <Phone className="h-4 w-4 shrink-0" aria-hidden />
                              <span>{pd.recipient_phone_number}</span>
                            </a>
                          )}
                          <div className="flex gap-2 text-muted-foreground">
                            <MapPin className="h-4 w-4 shrink-0 mt-0.5" aria-hidden />
                            <p className="text-xs leading-snug break-words">{pd.recipient_address_line}</p>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">{pd.package_description}</p>
                          <div className="flex flex-wrap items-baseline gap-2 pb-3">
                            <span className="text-xs uppercase text-muted-foreground">Valeur</span>
                            <span className="font-semibold tabular-nums">
                              {pd.package_value_amount} {pd.package_value_currency}
                              {!pd.is_delivery_price_included ? (
                                <span className="ml-2 text-[10px] font-normal text-orange-600">(+ frais livr.)</span>
                              ) : null}
                            </span>
                          </div>
                        </div>
                        <div className="border-t bg-background/95 px-3 py-3 sm:px-4">
                          <div className="grid gap-2">
                            <Select
                              key={`${pd.pre_delivery_id}-${pd.status}-mobile`}
                              onValueChange={(value) => handleQuickStatusUpdate(pd, value)}
                              disabled={isUpdating}
                            >
                              <SelectTrigger className="h-11 w-full text-xs">
                                <SelectValue placeholder="Changer le statut" />
                              </SelectTrigger>
                              <SelectContent className="max-h-[min(70vh,24rem)]">
                                <SelectItem value="confirmed">Confirmé</SelectItem>
                                <SelectItem value="no_response">Pas de réponse</SelectItem>
                                <SelectItem value="unreachable_phone_number">Numéro injoignable</SelectItem>
                                <SelectItem value="not_interested">Pas intéressé</SelectItem>
                                <SelectItem value="does_not_remember">Ne se souvient pas</SelectItem>
                                <SelectItem value="beyond_delivery_zone">Hors zone</SelectItem>
                                <SelectItem value="will_call_us_when_ready">Rappellera</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleQuickStatusUpdate(pd, 'unreachable_phone_number')}
                              disabled={isUpdating}
                              className="w-full"
                            >
                              Numéro injoignable
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleQuickAssignZone(pd)}
                              disabled={isUpdating}
                              className="h-11 w-full bg-[#2B015F] text-white hover:bg-[#1A0138]"
                            >
                              Confirmer zone
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              className="h-10 w-full justify-between font-medium"
                              onClick={() =>
                                setExpandedPreDeliveryId((cur) =>
                                  cur === pd.pre_delivery_id ? null : pd.pre_delivery_id,
                                )
                              }
                              aria-expanded={isExpandedMobile}
                            >
                              Actions rapides
                              {isExpandedMobile ? (
                                <ChevronDown className="h-4 w-4 opacity-70" aria-hidden />
                              ) : (
                                <ChevronRight className="h-4 w-4 opacity-70" aria-hidden />
                              )}
                            </Button>
                          </div>
                          {isExpandedMobile && (
                            <div className="mt-3 space-y-3">
                              <div className="space-y-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleQuickStatusUpdate(pd, 'confirmed')}
                                  disabled={isUpdating}
                                  className="w-full"
                                >
                                  Confirmé
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleQuickStatusUpdate(pd, 'no_response')}
                                  disabled={isUpdating}
                                  className="w-full"
                                >
                                  Pas de réponse
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleQuickStatusUpdate(pd, 'unreachable_phone_number')}
                                  disabled={isUpdating}
                                  className="w-full"
                                >
                                  Numéro injoignable
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleQuickStatusUpdate(pd, 'not_interested')}
                                  disabled={isUpdating}
                                  className="w-full"
                                >
                                  Pas intéressé
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleQuickStatusUpdate(pd, 'does_not_remember')}
                                  disabled={isUpdating}
                                  className="w-full"
                                >
                                  Ne se souvient pas
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleQuickStatusUpdate(pd, 'beyond_delivery_zone')}
                                  disabled={isUpdating}
                                  className="w-full"
                                >
                                  Hors zone
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleQuickStatusUpdate(pd, 'will_call_us_when_ready')}
                                  disabled={isUpdating}
                                  className="w-full"
                                >
                                  Rappellera
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assigner" className="space-y-4 sm:space-y-6">
          <Card className="overflow-hidden border-border/80 shadow-sm">
            <CardHeader className="space-y-3 pb-4 px-3 sm:px-6 pt-4 sm:pt-6">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <UserCheck className="h-5 w-5 text-[#22D3EE]" />
                Assigner un livreur
              </CardTitle>
              <CardDescription>Choisissez un livreur pour chaque commande confirmée.</CardDescription>
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  value={assignerSearchQuery}
                  onChange={(e) => setAssignerSearchQuery(e.target.value)}
                  className="pl-9 h-11"
                  placeholder="Rechercher (nom, tél., adresse...)"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {unassignedConfirmedQuery.isLoading || unassignedConfirmedQuery.isFetching || loadingDeliverers ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#22D3EE]" />
                </div>
              ) : (() => {
                const confirmedOrders = (unassignedConfirmedQuery.data || []).filter((pd) => {
                  const matchesSearch = !assignerSearchQuery.trim() || [
                    pd.recipient_name,
                    pd.recipient_phone_number,
                    pd.recipient_address_line,
                    pd.package_description,
                  ].join(" ").toLowerCase().includes(assignerSearchQuery.toLowerCase())
                  return matchesSearch
                })
                if (confirmedOrders.length === 0) {
                  return (
                    <div className="flex flex-col items-center justify-center gap-3 px-4 py-16 text-center">
                      <Truck className="h-10 w-10 text-muted-foreground/35" aria-hidden />
                      <p className="text-sm font-medium text-muted-foreground">Aucune commande à assigner</p>
                    </div>
                  )
                }
                return (
                  <div className="space-y-3 px-3 pb-4 pt-2 sm:px-4">
                    {confirmedOrders.map((pd) => {
                      const isAssigning = assigningPreDeliveryId === pd.pre_delivery_id
                      const chosenDelivererId = selectedDelivererId[pd.pre_delivery_id] || ""
                      return (
                        <div key={pd.pre_delivery_id} className="rounded-xl border bg-white shadow-sm overflow-hidden">
                          {/* Order info */}
                          <div className="p-4 space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-[#1a1009] leading-tight">{pd.recipient_name || "Non spécifié"}</p>
                                <p className="text-xs text-[#B08968] mt-0.5">{pd.package_description}</p>
                              </div>
                              <span className="shrink-0 text-xs font-semibold tabular-nums text-[#1a1009]">
                                {pd.package_value_amount} {pd.package_value_currency}
                              </span>
                            </div>
                            <div className="flex items-start gap-2 bg-[#22D3EE]/5 rounded-lg p-2 border border-[#22D3EE]/20">
                              <MapPin className="h-3.5 w-3.5 text-[#22D3EE] shrink-0 mt-0.5" />
                              <p className="text-xs text-[#1a1009] leading-snug break-words">{pd.recipient_address_line}</p>
                            </div>
                            {pd.recipient_phone_number && (
                              <a
                                href={getPhoneHref(pd.recipient_phone_number) || undefined}
                                className="inline-flex items-center gap-1.5 text-xs text-[#2563eb] font-medium"
                              >
                                <Phone className="h-3 w-3 shrink-0" />
                                {pd.recipient_phone_number}
                              </a>
                            )}
                          </div>
                          {/* Deliverer selector */}
                          <div className="border-t border-[#B08968]/10 bg-[#f8fafc] px-4 py-3 space-y-2">
                            <p className="text-xs font-semibold text-[#B08968] uppercase tracking-wide">Assigner à</p>
                            <Select
                              value={chosenDelivererId}
                              onValueChange={(value) =>
                                setSelectedDelivererId((prev) => ({ ...prev, [pd.pre_delivery_id]: value }))
                              }
                              disabled={isAssigning}
                            >
                              <SelectTrigger className="h-11 w-full">
                                <SelectValue placeholder="Sélectionner un livreur..." />
                              </SelectTrigger>
                              <SelectContent>
                                {mobileDeliverers.map((deliverer) => (
                                  <SelectItem key={deliverer.mobile_deliverer_id} value={deliverer.mobile_deliverer_id}>
                                    {deliverer.first_name} {deliverer.last_name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button
                              type="button"
                              className="h-10 w-full bg-gradient-to-r from-[#22D3EE] to-[#06b6d4] text-white hover:from-[#06b6d4] hover:to-[#22D3EE] font-semibold border-0"
                              disabled={!chosenDelivererId || isAssigning}
                              onClick={() => handleAssignDeliverer(pd)}
                            >
                              {isAssigning ? (
                                <><Loader2 className="h-4 w-4 animate-spin mr-2" />Assignation...</>
                              ) : (
                                <><UserCheck className="h-4 w-4 mr-2" />Assigner</>
                              )}
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              })()}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deliveries" className="space-y-4 sm:space-y-6">
          <Card className="overflow-hidden border-border/80 shadow-sm">
            <CardHeader className="space-y-3 pb-4 px-3 sm:px-6 pt-4 sm:pt-6">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <Clock className="h-5 w-5 text-[#22D3EE]" />
                  Livraisons planifiées aujourd'hui
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => plannedForTodayQuery.refetch()}
                  disabled={plannedForTodayQuery.isFetching}
                  className="h-9 w-auto shrink-0"
                  type="button"
                >
                  <RefreshCw className={`h-4 w-4 shrink-0 ${plannedForTodayQuery.isFetching ? "animate-spin" : ""}`} />
                </Button>
              </div>
              {(() => {
                const now = Date.now()
                const overdue = (plannedForTodayQuery.data || []).filter((pd) => pd.preferred_delivery_date && Number(pd.preferred_delivery_date) < now)
                const soon = (plannedForTodayQuery.data || []).filter((pd) => {
                  const t = Number(pd.preferred_delivery_date)
                  return pd.preferred_delivery_date && t >= now && t - now <= 60 * 60 * 1000
                })
                if (overdue.length === 0 && soon.length === 0) return null
                return (
                  <div className="flex flex-wrap gap-2">
                    {overdue.length > 0 && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700 ring-1 ring-red-300">
                        <AlertTriangle className="h-3 w-3" />
                        {overdue.length} en retard
                      </span>
                    )}
                    {soon.length > 0 && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700 ring-1 ring-orange-300">
                        <Clock className="h-3 w-3" />
                        {soon.length} dans moins d'1h
                      </span>
                    )}
                  </div>
                )
              })()}
            </CardHeader>
            <CardContent className="p-0">
              {plannedForTodayQuery.isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#22D3EE]" />
                </div>
              ) : (plannedForTodayQuery.data || []).length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 px-4 py-16 text-center">
                  <Clock className="h-10 w-10 text-muted-foreground/35" aria-hidden />
                  <p className="text-sm font-medium text-muted-foreground">Aucune livraison planifiée pour aujourd'hui</p>
                </div>
              ) : (
                <div className="space-y-3 px-3 pb-4 pt-2 sm:px-4">
                  {(plannedForTodayQuery.data || [])
                    .slice()
                    .sort((a, b) => Number(a.preferred_delivery_date || 0) - Number(b.preferred_delivery_date || 0))
                    .map((pd) => {
                      const now = Date.now()
                      const deliveryTime = pd.preferred_delivery_date ? Number(pd.preferred_delivery_date) : null
                      const isOverdue = deliveryTime !== null && deliveryTime < now
                      const isSoon = deliveryTime !== null && !isOverdue && deliveryTime - now <= 60 * 60 * 1000
                      const timeLabel = deliveryTime
                        ? new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" }).format(new Date(deliveryTime))
                        : null
                      const dateLabel = deliveryTime
                        ? new Intl.DateTimeFormat("fr-FR", { weekday: "short", day: "2-digit", month: "short" }).format(new Date(deliveryTime))
                        : null
                      const phoneHref = getPhoneHref(pd.recipient_phone_number)
                      const whatsappHref = getWhatsappHref(pd.recipient_phone_number)

                      return (
                        <div
                          key={pd.pre_delivery_id}
                          className={`rounded-xl border shadow-sm overflow-hidden transition-all ${
                            isOverdue
                              ? "border-red-400 bg-red-50 ring-2 ring-red-300 animate-pulse-slow"
                              : isSoon
                              ? "border-orange-300 bg-orange-50 ring-1 ring-orange-200"
                              : "border-[#B08968]/15 bg-white"
                          }`}
                        >
                          {/* Time banner */}
                          <div className={`flex items-center justify-between gap-3 px-4 py-2 ${
                            isOverdue ? "bg-red-500" : isSoon ? "bg-orange-400" : "bg-[#1a1009]"
                          }`}>
                            <div className="flex items-center gap-2">
                              {isOverdue ? (
                                <AlertTriangle className="h-4 w-4 text-white shrink-0" />
                              ) : (
                                <Clock className="h-4 w-4 text-white shrink-0" />
                              )}
                              {timeLabel ? (
                                <span className="text-white font-bold text-sm tracking-wide">{timeLabel}</span>
                              ) : (
                                <span className="text-white/60 text-xs">Heure non renseignée</span>
                              )}
                              {dateLabel && <span className="text-white/70 text-xs capitalize">{dateLabel}</span>}
                            </div>
                            {isOverdue && (
                              <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wide">En retard</span>
                            )}
                            {isSoon && (
                              <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wide">Bientôt</span>
                            )}
                          </div>

                          {/* Content */}
                          <div className="p-4 space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <p className={`text-sm font-semibold leading-tight ${
                                  isOverdue ? "text-red-900" : "text-[#1a1009]"
                                }`}>{pd.recipient_name || "Non spécifié"}</p>
                                <p className="text-xs text-[#B08968] mt-0.5">{pd.package_description}</p>
                                {pd.mobile_deliverer?.name && (
                                  <p className="text-xs font-medium text-[#22D3EE] mt-0.5 flex items-center gap-1">
                                    <User className="h-3 w-3 shrink-0" />
                                    {pd.mobile_deliverer.name}
                                  </p>
                                )}
                              </div>
                              <span className="shrink-0 text-xs font-semibold tabular-nums text-[#1a1009]">
                                {pd.package_value_amount} {pd.package_value_currency}
                              </span>
                            </div>
                            <div className={`flex items-start gap-2 rounded-lg p-2 border ${
                              isOverdue ? "bg-red-100/60 border-red-200" : "bg-[#22D3EE]/5 border-[#22D3EE]/20"
                            }`}>
                              <MapPin className={`h-3.5 w-3.5 shrink-0 mt-0.5 ${
                                isOverdue ? "text-red-500" : "text-[#22D3EE]"
                              }`} />
                              <p className="text-xs text-[#1a1009] leading-snug break-words">{pd.recipient_address_line}</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {phoneHref && (
                                <Button asChild size="sm" className={`h-8 flex-1 sm:flex-none text-xs font-semibold border-0 ${
                                  isOverdue
                                    ? "bg-red-600 hover:bg-red-700 text-white"
                                    : "bg-gradient-to-r from-[#22D3EE] to-[#06b6d4] text-white hover:from-[#06b6d4] hover:to-[#22D3EE]"
                                }`}>
                                  <a href={phoneHref}>
                                    <Phone className="h-3 w-3 mr-1" />
                                    Appeler
                                  </a>
                                </Button>
                              )}
                              {whatsappHref && (
                                <Button asChild size="sm" variant="outline" className="h-8 flex-1 sm:flex-none border-green-600 text-green-700 hover:bg-green-50 text-xs font-semibold">
                                  <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
                                    <MessageCircle className="h-3 w-3 mr-1" />
                                    WhatsApp
                                  </a>
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-h-[min(92dvh,44rem)] w-[calc(100vw-1.5rem)] max-w-lg gap-5 overflow-y-auto overflow-x-hidden p-5 sm:p-6">
          <DialogHeader>
            <DialogTitle>Détails & mise à jour</DialogTitle>
          </DialogHeader>
          {selectedPreDelivery && (
            <div className="space-y-4">
              <div className="rounded-lg border bg-gray-50/60 p-4 space-y-2">
                <p className="text-sm">
                  <span className="font-medium">Créée le:</span>{" "}
                  <span className="capitalize">{formatPreDeliveryCreatedAtFrench(selectedPreDelivery)}</span>
                </p>
                <p className="text-sm flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  {selectedPreDelivery.recipient_name || "N/A"}
                </p>
                <p className="text-sm flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  {selectedPreDelivery.recipient_phone_number}
                </p>
                <p className="text-sm flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                  <span>{selectedPreDelivery.recipient_address_line}</span>
                </p>
                <StatusBadge status={selectedPreDelivery.status} />
              </div>

              <div className="space-y-4">
                <div>
                  <Label>Adresse de livraison</Label>
                  <Input
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                    placeholder="Adresse complète du destinataire"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label>Valeur du colis ({selectedPreDelivery?.package_value_currency || 'USD'})</Label>
                  <Input
                    value={editPackageValue}
                    onChange={(e) => setEditPackageValue(e.target.value)}
                    placeholder="Prix du colis"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Note</Label>
                  <Input
                    value={editNote}
                    onChange={(e) => setEditNote(e.target.value)}
                    placeholder="Ajouter une note (optionnel)"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Statut</Label>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez le statut" />
                    </SelectTrigger>
                    <SelectContent>
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
                {selectedStatus === "confirmed" && (
                  <>
                    <div>
                      <Label>Commune</Label>
                      <Select value={selectedCommuneId} onValueChange={setSelectedCommuneId}>
                        <SelectTrigger>
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
                    </div>
                    <div>
                      <Label>Quartier</Label>
                      <Select value={selectedQuartierId} onValueChange={setSelectedQuartierId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez le quartier" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableQuartiers.map((quartier) => (
                            <SelectItem key={quartier.id} value={quartier.id.toString()}>
                              {quartier.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 [&>button]:w-full sm:[&>button]:w-auto">
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleSubmitPreDelivery} disabled={isSubmittingPreDelivery} className="bg-[#2B015F] hover:bg-[#1A0138]">
              {isSubmittingPreDelivery ? "Mise à jour..." : "Confirmer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      </div>
    </div>
  )
}

export default function ClosingsPage() {
  const queryClientRef = useRef<QueryClient>()
  if (!queryClientRef.current) {
    queryClientRef.current = new QueryClient()
  }
  return (
    <QueryClientProvider client={queryClientRef.current}>
      <ClosingsContent />
    </QueryClientProvider>
  )
}
