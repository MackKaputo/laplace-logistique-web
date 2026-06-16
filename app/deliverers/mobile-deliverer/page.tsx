"use client"

import { useState, useEffect, useRef } from "react"
import { useQuery, QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, CalendarDays, CheckCircle2, Loader2, LogOut, MapPin, MessageCircle, Package, Phone, RefreshCw } from "lucide-react"

interface MobileDelivererProfile {
  _id: string
  mobile_deliverer_id: string
  access_code: string
  first_name: string
  last_name: string
  phone_number: string
  created_at: string
  mobile_deliverer_zones: string[]
  updatedAt: string
}

interface PreDelivery {
  _id: string
  identifier_column: string
  recipient_address_line: string
  recipient_name: string
  recipient_phone_number: string
  package_description: string
  package_value_amount: string
  package_value_currency: string
  is_delivery_price_included: boolean
  customer_id: string
  pre_delivery_id: string
  created_at: string
  createdAt?: string
  updatedAt?: string
  status?: string
  customer: {
    organizationName?: string
    first_name: string
    last_name: string
  },
  preferred_delivery_date?: number | string
}

const SESSION_KEY = "mobile_deliverer_session"

const formatDetailValue = (value: string | number | boolean | null | undefined) => {
  if (typeof value === "boolean") return value ? "Oui" : "Non"
  return value || "Non renseigne"
}

const formatDate = (value?: string) => {
  if (!value) return "Non renseigne"
  return new Date(value).toLocaleDateString("fr-FR")
}

const formatPreferredDeliveryDate = (value?: string | number) => {
  if (value === undefined || value === null) return "Non renseigne"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Non renseigne"
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

const getCustomerDisplayName = (customer?: PreDelivery["customer"]) => {
  if (!customer) return "Non renseigne"
  return customer.organizationName || `${customer.first_name || ""} ${customer.last_name || ""}`.trim() || "Non renseigne"
}

const getPhoneHref = (phoneNumber: string) => {
  const normalizedPhoneNumber = phoneNumber?.replace(/[^\d+]/g, "") || ""
  return normalizedPhoneNumber ? `tel:${normalizedPhoneNumber}` : ""
}

const getWhatsappHref = (phoneNumber: string) => {
  const normalizedPhoneNumber = phoneNumber?.replace(/\D/g, "").replace(/^00/, "") || ""
  return normalizedPhoneNumber ? `https://wa.me/${normalizedPhoneNumber}` : ""
}

const getStatusBadgeLabel = (status?: string) => {
  return status ? status.replace(/_/g, " ") : "Assignee"
}

function MobileDelivererPage() {
  const { toast } = useToast()
  const [accessCode, setAccessCode] = useState("")
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [profile, setProfile] = useState<MobileDelivererProfile | null>(null)
  const [activeTab, setActiveTab] = useState("commandes")
  const [assignedTab, setAssignedTab] = useState("en-cours")
  const [deliveringPreDeliveryId, setDeliveringPreDeliveryId] = useState<string | null>(null)
  const [failingPreDeliveryId, setFailingPreDeliveryId] = useState<string | null>(null)
  const [failureNotes, setFailureNotes] = useState<Record<string, string>>({})
  const [deliveryToConfirm, setDeliveryToConfirm] = useState<PreDelivery | null>(null)

  const handleTakePreDelivery = async (preDelivery: PreDelivery) => {
    if (!profile?.mobile_deliverer_id) return
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_SERVER_BASE_URL}/deliveries/pre-deliveries/assign-mobile-deliverer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pre_delivery_id: preDelivery.pre_delivery_id,
          mobile_deliverer_id: profile.mobile_deliverer_id,
        }),
      })
      
      if (response.ok) {
        toast({ title: "Commande acceptée", description: `La commande de ${preDelivery.recipient_name} a été acceptée` })
        preDeliveriesQuery.refetch()
        assignedPreDeliveriesQuery.refetch()
      } else {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || "Erreur lors de l'acceptation de la commande")
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Échec de l'acceptation",
        variant: "destructive",
      })
    }
  }

  const handleSignalDelivered = async (preDelivery: PreDelivery) => {
    setDeliveringPreDeliveryId(preDelivery.pre_delivery_id)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_SERVER_BASE_URL}/deliveries/update-pre-delivery-status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pre_delivery_id: preDelivery.pre_delivery_id,
          status: "delivered",
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || "Erreur lors du signalement de livraison")
      }

      toast({
        title: "Commande livrée",
        description: `${preDelivery.recipient_name || preDelivery.pre_delivery_id} a été marqué comme livré`,
      })
      assignedPreDeliveriesQuery.refetch()
      preDeliveriesQuery.refetch()
      setFailingPreDeliveryId(null)
      return true
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Échec du signalement",
        variant: "destructive",
      })
    } finally {
      setDeliveringPreDeliveryId(null)
    }
  }

  const handleSignalDeliveryFailed = async (preDelivery: PreDelivery) => {
    const note = failureNotes[preDelivery.pre_delivery_id]?.trim() || ""
    if (!note) {
      toast({
        title: "Note requise",
        description: "Veuillez expliquer pourquoi la livraison a échoué",
        variant: "destructive",
      })
      return
    }

    setDeliveringPreDeliveryId(preDelivery.pre_delivery_id)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_SERVER_BASE_URL}/deliveries/update-pre-delivery-status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pre_delivery_id: preDelivery.pre_delivery_id,
          status: "delivery_failed",
          note,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || "Erreur lors du signalement de l'échec de livraison")
      }

      toast({
        title: "Échec signalé",
        description: `${preDelivery.recipient_name || preDelivery.pre_delivery_id} a été marqué comme échec de livraison`,
      })
      assignedPreDeliveriesQuery.refetch()
      preDeliveriesQuery.refetch()
      setFailingPreDeliveryId(null)
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Échec du signalement",
        variant: "destructive",
      })
    } finally {
      setDeliveringPreDeliveryId(null)
    }
    return false
  }

  const confirmSignalDelivered = async () => {
    if (!deliveryToConfirm) return
    const success = await handleSignalDelivered(deliveryToConfirm)
    if (success) {
      setDeliveryToConfirm(null)
    }
  }

  const preDeliveriesQuery = useQuery<PreDelivery[]>({
    queryKey: ["mobile-deliverer-pre-deliveries", profile?.mobile_deliverer_id],
    queryFn: async () => {
      if (!profile?.mobile_deliverer_id) return []
      console.log("Fetching pre-deliveries for:", profile.mobile_deliverer_id)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_SERVER_BASE_URL}/deliveries/pre-deliveries/mobile-deliverer?mobile_deliverer_id=${profile.mobile_deliverer_id}`)
      console.log("Response status:", response.status)
      if (!response.ok) throw new Error("Failed to fetch pre-deliveries")
      const result = await response.json()
      console.log("Fetched result:", result)
      return result.data || []
    },
    enabled: !!profile?.mobile_deliverer_id,
    refetchInterval: 15000, // Auto-refresh every 15 seconds
  })

  const assignedPreDeliveriesQuery = useQuery<PreDelivery[]>({
    queryKey: ["mobile-deliverer-assigned-pre-deliveries", profile?.mobile_deliverer_id],
    queryFn: async () => {
      if (!profile?.mobile_deliverer_id) return []
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_SERVER_BASE_URL}/deliveries/pre-deliveries/get-assigned-pre-deliveries?mobile_deliverer_id=${profile.mobile_deliverer_id}`,
      )
      if (!response.ok) throw new Error("Failed to fetch assigned pre-deliveries")
      const result = await response.json()
      return result.data || []
    },
    enabled: !!profile?.mobile_deliverer_id,
    refetchInterval: 15000,
  })

  const refetchPreDeliveries = () => {
    preDeliveriesQuery.refetch()
    assignedPreDeliveriesQuery.refetch()
  }

  const assignedPreDeliveries = assignedPreDeliveriesQuery.data || []
  const activeAssignedPreDeliveries = assignedPreDeliveries.filter((preDelivery) => preDelivery.status !== "delivered")
  const deliveredAssignedPreDeliveries = assignedPreDeliveries.filter((preDelivery) => preDelivery.status === "delivered")

  const renderAssignedPreDeliveries = (items: PreDelivery[], emptyMessage: string) => {
    if (items.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center gap-3 px-4 py-16 text-center">
          <Package className="h-10 w-10 text-muted-foreground/35" aria-hidden />
          <p className="text-sm font-medium text-muted-foreground">{emptyMessage}</p>
        </div>
      )
    }

    return (
      <div className="space-y-3 px-3 pb-4 pt-2 sm:px-4 sm:pb-6">
        {items.map((preDelivery) => {
          const phoneHref = getPhoneHref(preDelivery.recipient_phone_number)
          const whatsappHref = getWhatsappHref(preDelivery.recipient_phone_number)
          const createdDate = formatDate(preDelivery.created_at || preDelivery.createdAt)
          const customerName = getCustomerDisplayName(preDelivery.customer)
          const packageValue = `${formatDetailValue(preDelivery.package_value_amount)} ${formatDetailValue(preDelivery.package_value_currency)}`
          const isDelivered = preDelivery.status === "delivered"
          const isDelivering = deliveringPreDeliveryId === preDelivery.pre_delivery_id

          return (
            <div
              key={preDelivery.pre_delivery_id}
              className="overflow-hidden rounded-xl border bg-card shadow-sm"
            >
              <div className="flex items-start justify-between gap-3 p-4 pb-2">
                <div className="min-w-0 flex-1 space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[#2B015F]/80">
                    {customerName}
                  </p>
                  <h3 className="text-base font-semibold leading-tight">
                    {formatDetailValue(preDelivery.recipient_name)}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <CalendarDays className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    <span>{createdDate}</span>
                  </div>
                </div>
                <span className="max-w-[45%] rounded-full bg-[#2B015F]/10 px-2.5 py-1 text-right text-[11px] font-semibold capitalize leading-tight text-[#2B015F]">
                  {getStatusBadgeLabel(preDelivery.status)}
                </span>
              </div>

              <div className="space-y-3 px-4 pb-4 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  {phoneHref && (
                    <Button asChild size="sm" className="h-9 flex-1 bg-[#2B015F] hover:bg-[#1A0138] sm:flex-none">
                      <a href={phoneHref} aria-label={`Appeler ${preDelivery.recipient_phone_number}`}>
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
                        aria-label={`Contacter ${preDelivery.recipient_phone_number} sur WhatsApp`}
                      >
                        <MessageCircle className="h-4 w-4" />
                        WhatsApp
                      </a>
                    </Button>
                  )}
                </div>

                {preDelivery.recipient_phone_number && (
                  <a
                    href={phoneHref || undefined}
                    className="inline-flex items-center gap-2 text-[#2563eb] font-medium underline-offset-2 touch-manipulation"
                  >
                    <Phone className="h-4 w-4 shrink-0" aria-hidden />
                    <span>{preDelivery.recipient_phone_number}</span>
                  </a>
                )}

                <div className="flex gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4 shrink-0 mt-0.5" aria-hidden />
                  <p className="text-xs leading-snug break-words">{formatDetailValue(preDelivery.recipient_address_line)}</p>
                </div>

                <p className="text-xs leading-snug text-muted-foreground line-clamp-2">
                  {formatDetailValue(preDelivery.package_description)}
                </p>

                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="text-xs uppercase text-muted-foreground">Valeur</span>
                  <span className="font-semibold tabular-nums">
                    {packageValue}
                    {!preDelivery.is_delivery_price_included ? (
                      <span className="ml-2 text-[10px] font-normal text-orange-600">(+ frais livr.)</span>
                    ) : null}
                  </span>
                </div>

                {/* Also display the preferred_delivery_date  */}
                {preDelivery.preferred_delivery_date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 shrink-0" aria-hidden />
                      <span className="text-xs">
                        Date/Heure: {formatPreferredDeliveryDate(preDelivery.preferred_delivery_date)}
                      </span>
                  </div>
                )}
              </div>

              {!isDelivered && (
                <div className="border-t bg-background/95 px-3 py-3 sm:px-4">
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Button
                      type="button"
                      className="h-11 w-full bg-green-700 font-medium text-white hover:bg-green-800"
                      onClick={() => setDeliveryToConfirm(preDelivery)}
                      disabled={isDelivering}
                    >
                      {isDelivering ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4" />
                      )}
                      {isDelivering ? "Signalement..." : "Signaler comme livrée"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-11 w-full text-orange-700 border-orange-300 hover:bg-orange-50"
                      onClick={() => setFailingPreDeliveryId(preDelivery.pre_delivery_id)}
                      disabled={isDelivering}
                    >
                      Échec de livraison
                    </Button>
                  </div>

                  {failingPreDeliveryId === preDelivery.pre_delivery_id && (
                    <div className="mt-3 space-y-3 rounded-2xl border border-orange-200 bg-orange-50/80 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <Label htmlFor={`failure-note-${preDelivery.pre_delivery_id}`}>Motif d'échec</Label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setFailingPreDeliveryId(null)}
                        >
                          Annuler
                        </Button>
                      </div>
                      <Textarea
                        id={`failure-note-${preDelivery.pre_delivery_id}`}
                        value={failureNotes[preDelivery.pre_delivery_id] || ""}
                        onChange={(event) =>
                          setFailureNotes((prev) => ({
                            ...prev,
                            [preDelivery.pre_delivery_id]: event.target.value,
                          }))
                        }
                        placeholder="Expliquez brièvement ce qui s'est passé"
                        rows={4}
                      />
                      <Button
                        type="button"
                        className="h-11 w-full bg-orange-600 font-medium text-white hover:bg-orange-700"
                        onClick={() => handleSignalDeliveryFailed(preDelivery)}
                        disabled={isDelivering}
                      >
                        {isDelivering ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <MessageCircle className="h-4 w-4" />
                        )}
                        {isDelivering ? "Signalement..." : "Confirmer l'échec"}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  console.log("Query state:", {
    isLoading: preDeliveriesQuery.isLoading,
    data: preDeliveriesQuery.data,
    dataLength: preDeliveriesQuery.data?.length,
    error: preDeliveriesQuery.error
  })

  const handleLogin = async () => {
    if (!accessCode.trim()) {
      toast({ title: "Code requis", description: "Veuillez saisir un code d'accès", variant: "destructive" })
      return
    }
    
    setIsLoggingIn(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_SERVER_BASE_URL}/deliverers/mobile-deliverer?access_code=${accessCode.trim()}`)
      const result = await response.json()
      
      if (!response.ok || !result.success || !result.data) {
        throw new Error(result.message || "Code d'accès invalide")
      }
      
      const nextProfile = result.data as MobileDelivererProfile
      setProfile(nextProfile)
      localStorage.setItem(SESSION_KEY, JSON.stringify(nextProfile))
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
    setAccessCode("")
    localStorage.removeItem(SESSION_KEY)
  }

  useEffect(() => {
    const savedSession = localStorage.getItem(SESSION_KEY)
    if (savedSession) {
      try {
        const sessionData = JSON.parse(savedSession)
        setProfile(sessionData)
      } catch {
        localStorage.removeItem(SESSION_KEY)
      }
    }
  }, [])

  if (profile) {
    return (
      <div className="mx-auto w-full max-w-7xl min-h-[calc(100dvh-3.5rem)] overflow-x-hidden px-3 pb-28 pt-4 sm:px-4 sm:pb-10 lg:px-8 lg:py-8 space-y-4 sm:space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold text-[#2B015F] sm:text-2xl"> {profile.first_name} {profile.last_name}</h1>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button 
              variant="outline" 
              className="flex-1 sm:w-auto" 
              onClick={refetchPreDeliveries}
              disabled={preDeliveriesQuery.isFetching || assignedPreDeliveriesQuery.isFetching}
            >
              <RefreshCw className="h-4 w-4 mr-2 shrink-0" />
              Actualiser
            </Button>
            <Button variant="outline" className="w-full sm:w-auto" onClick={logout}>
              <LogOut className="h-4 w-4 mr-2 shrink-0" />
              Déconnexion
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-2 gap-2 rounded-2xl border border-[#D9C6FF] bg-[#F6F0FF] p-1">
            <TabsTrigger
              value="commandes"
              className="rounded-2xl px-3 py-2 text-sm font-semibold text-[#5B21B6] transition data-[state=active]:bg-white data-[state=active]:text-[#2B0756] data-[state=active]:shadow-sm"
            >
              Commandes ({preDeliveriesQuery.data?.length || 0})
            </TabsTrigger>
            <TabsTrigger
              value="mes-commandes"
              className="rounded-2xl px-3 py-2 text-sm font-semibold text-[#5B21B6] transition data-[state=active]:bg-white data-[state=active]:text-[#2B0756] data-[state=active]:shadow-sm"
            >
              Mes commandes ({assignedPreDeliveriesQuery.data?.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="commandes" className="space-y-4 sm:space-y-6">
            <Card className="overflow-hidden border-border/80 shadow-sm">
              <CardHeader>
                <CardTitle>Commandes disponibles</CardTitle>
                <CardDescription>
                  Pré-livraisons disponibles pour votre zone
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {preDeliveriesQuery.isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2B015F]" />
                  </div>
                ) : preDeliveriesQuery.data && preDeliveriesQuery.data.length > 0 ? (
                  <div className="space-y-3 px-3 pb-4 pt-2 sm:px-4 sm:pb-6">
                    {preDeliveriesQuery.data.map((preDelivery) => (
                      <Card key={preDelivery.pre_delivery_id} className="shadow-sm">
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <h3 className="font-semibold">{preDelivery.recipient_name}</h3>
                                {preDelivery.customer?.organizationName && (
                                  <p className="text-xs text-muted-foreground">{preDelivery.customer.organizationName}</p>
                                )}
                              </div>
                              <div className="text-right">
                                <p className="font-semibold">{preDelivery.package_value_amount} {preDelivery.package_value_currency}</p>
                                {!preDelivery.is_delivery_price_included && (
                                  <p className="text-xs text-orange-600">+ frais livr.</p>
                                )}
                              </div>
                            </div>
                            {preDelivery.preferred_delivery_date && (
                              <div className="mt-2 flex items-center gap-2 text-xs font-medium text-[#4338CA]">
                                <Calendar className="h-4 w-4 shrink-0" aria-hidden />
                                <span>
                                  Préférence: {formatPreferredDeliveryDate(preDelivery.preferred_delivery_date)}
                                </span>
                              </div>
                            )}
                            <p className="mt-3 rounded-2xl border border-[#E9D5FF] bg-[#F8F0FF] px-3 py-2 text-sm font-medium text-[#5B21B6] shadow-sm">
                              {preDelivery.package_description || "Aucune description fournie"}
                            </p>
                            <p className="text-sm text-muted-foreground">{preDelivery.recipient_address_line}</p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleTakePreDelivery(preDelivery)}
                              className="w-full bg-[#2B015F] text-white hover:bg-[#1A0138] mt-3"
                            >
                              Prendre
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-3 px-4 py-16 text-center">
                    <Package className="h-10 w-10 text-muted-foreground/35" aria-hidden />
                    <p className="text-sm font-medium text-muted-foreground">Aucune commande disponible</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="mes-commandes" className="space-y-4 sm:space-y-6">
            <Card className="overflow-hidden border-border/80 shadow-sm">
              <CardHeader>
                <CardTitle>Mes commandes</CardTitle>
                <CardDescription>
                  Commandes que vous avez acceptées
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {assignedPreDeliveriesQuery.isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2B015F]" />
                  </div>
                ) : (
                  <Tabs value={assignedTab} onValueChange={setAssignedTab} className="space-y-3">
                    <div className="px-3 pt-3 sm:px-4">
                      <TabsList className="grid w-full grid-cols-2 gap-2 rounded-2xl border border-[#D1FAE5] bg-[#ECFDF5] p-1">
                        <TabsTrigger
                          value="en-cours"
                          className="rounded-2xl px-3 py-2 text-sm font-semibold text-[#166534] transition data-[state=active]:bg-white data-[state=active]:text-[#0F3F2D] data-[state=active]:shadow-sm"
                        >
                          En cours ({activeAssignedPreDeliveries.length})
                        </TabsTrigger>
                        <TabsTrigger
                          value="livrees"
                          className="rounded-2xl px-3 py-2 text-sm font-semibold text-[#166534] transition data-[state=active]:bg-white data-[state=active]:text-[#0F3F2D] data-[state=active]:shadow-sm"
                        >
                          Livrées ({deliveredAssignedPreDeliveries.length})
                        </TabsTrigger>
                      </TabsList>
                    </div>
                    <TabsContent value="en-cours" className="m-0">
                      {renderAssignedPreDeliveries(activeAssignedPreDeliveries, "Aucune commande en cours")}
                    </TabsContent>
                    <TabsContent value="livrees" className="m-0">
                      {renderAssignedPreDeliveries(deliveredAssignedPreDeliveries, "Aucune commande livrée")}
                    </TabsContent>
                  </Tabs>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        <Dialog open={!!deliveryToConfirm} onOpenChange={(open) => { if (!open) setDeliveryToConfirm(null) }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Confirmer la livraison</DialogTitle>
              <DialogDescription>
                Vous êtes sur le point de marquer la commande comme livrée. Cette action ne peut pas être annulée.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 text-sm text-muted-foreground">
              <p>
                Destinataire: <span className="font-semibold text-foreground">{deliveryToConfirm?.recipient_name || "—"}</span>
              </p>
              <p>
                Adresse: <span className="font-semibold text-foreground">{deliveryToConfirm?.recipient_address_line || "—"}</span>
              </p>
            </div>
            <DialogFooter className="mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeliveryToConfirm(null)}
                className="w-full sm:w-auto"
              >
                Annuler
              </Button>
              <Button
                type="button"
                className="w-full sm:w-auto bg-green-700 text-white hover:bg-green-800"
                onClick={confirmSignalDelivered}
                disabled={deliveryToConfirm?.pre_delivery_id === deliveringPreDeliveryId}
              >
                {deliveryToConfirm?.pre_delivery_id === deliveringPreDeliveryId ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                {deliveryToConfirm?.pre_delivery_id === deliveringPreDeliveryId ? "Signalement..." : "Confirmer"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-md px-3 py-10 sm:px-4 sm:py-14">
      <Card className="shadow-sm border-border/80">
        <CardHeader>
          <CardTitle>Accès Mobile Deliverer</CardTitle>
          <CardDescription>
            Entrez votre code d'accès pour consulter vos informations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="accessCode">Code d'accès</Label>
            <Input
              id="accessCode"
              type="text"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              placeholder="Ex: 105637"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleLogin()
              }}
              disabled={isLoggingIn}
              className="mt-1"
            />
          </div>
          <Button 
            onClick={handleLogin} 
            disabled={isLoggingIn} 
            className="w-full bg-[#2B015F] hover:bg-[#1A0138]"
          >
            {isLoggingIn ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connexion...
              </>
            ) : (
              "Se connecter"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export default function MobileDelivererPageWrapper() {
  const queryClientRef = useRef<QueryClient>()
  if (!queryClientRef.current) {
    queryClientRef.current = new QueryClient()
  }
  return (
    <QueryClientProvider client={queryClientRef.current}>
      <MobileDelivererPage />
    </QueryClientProvider>
  )
}
