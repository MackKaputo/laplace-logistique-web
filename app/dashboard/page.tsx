"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Package, LogOut, User, Settings, Search, Filter, Phone, MapPin, CheckCircle, Clock, AlertCircle, Truck, XCircle, PhoneOff, HelpCircle, MapPinOff, PhoneCall } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import RoleGuard from "@/components/role-guard"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Delivery {
  _id: string
  identifier_column: string
  recipient_address_line: string
  recipient_name: string
  recipient_phone_number: string
  package_description: string
  package_value_amount: string
  package_value_currency: string
  status: string
  note: string
  created_at: string
  mobile_deliverer?: {
    name: string
  }
  mobile_deliverer_zone?: {
    name: string
  }
}

export default function Dashboard() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("tous")
  const { user, logout } = useAuth()
  const router = useRouter()

  // Fetch deliveries
  useEffect(() => {
    const fetchDeliveries = async () => {
      if (!user?.id) return

      try {
        const apiUrl = `${process.env.NEXT_PUBLIC_API_SERVER_BASE_URL}/deliveries/pre-deliveries?customer_id=${user.id}`
        
        const response = await fetch(apiUrl)
        
        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("Votre session a expiré. Veuillez vous reconnecter.")
          } else if (response.status === 403) {
            throw new Error("Vous n'avez pas l'autorisation d'accéder à ces données.")
          } else if (response.status === 404) {
            throw new Error("Le service de livraisons est temporairement indisponible.")
          } else if (response.status >= 500) {
            throw new Error("Le serveur rencontre des difficultés techniques. Veuillez réessayer dans quelques minutes.")
          } else {
            throw new Error("Impossible de charger les livraisons. Veuillez réessayer.")
          }
        }

        const result = await response.json()
        setDeliveries(result.data || [])
      } catch (err) {
        if (err instanceof Error && err.message.includes("API")) {
          setError("La configuration de l'API est manquante. Veuillez contacter l'administrateur.")
        } else {
          setError(err instanceof Error ? err.message : "Une erreur inattendue est survenue. Veuillez réessayer.")
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchDeliveries()
  }, [user?.id])

  const getStatusInfo = (status: string) => {
    const statusMap: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
      delivered: {
        label: "Livré",
        color: "bg-green-100 text-green-800 border-green-200",
        icon: <CheckCircle className="h-3 w-3" />
      },
      assigned: {
        label: "Assigné",
        color: "bg-blue-100 text-blue-800 border-blue-200",
        icon: <Truck className="h-3 w-3" />
      },
      unassigned: {
        label: "En attente",
        color: "bg-yellow-100 text-yellow-800 border-yellow-200",
        icon: <Clock className="h-3 w-3" />
      },
      delivery_start_to_recipient: {
        label: "En livraison",
        color: "bg-purple-100 text-purple-800 border-purple-200",
        icon: <Truck className="h-3 w-3" />
      },
      failed_pickup: {
        label: "Échec collecte",
        color: "bg-red-100 text-red-800 border-red-200",
        icon: <AlertCircle className="h-3 w-3" />
      },
      delivery_failed: {
        label: "Échec livraison",
        color: "bg-red-200 text-red-900 border-red-300",
        icon: <XCircle className="h-3 w-3" />
      },
      no_response: {
        label: "Pas de réponse",
        color: "bg-gray-100 text-gray-600 border-gray-200",
        icon: <PhoneOff className="h-3 w-3" />
      },
      confirmed: {
        label: "Confirmé",
        color: "bg-green-100 text-green-800 border-green-200",
        icon: <CheckCircle className="h-3 w-3" />
      },
      not_interested: {
        label: "Pas intéressé",
        color: "bg-red-100 text-red-700 border-red-200",
        icon: <XCircle className="h-3 w-3" />
      },
      does_not_remember: {
        label: "Ne se souvient pas",
        color: "bg-orange-100 text-orange-700 border-orange-200",
        icon: <HelpCircle className="h-3 w-3" />
      },
      beyond_delivery_zone: {
        label: "Hors zone",
        color: "bg-purple-100 text-purple-700 border-purple-200",
        icon: <MapPinOff className="h-3 w-3" />
      },
      will_call_us_when_ready: {
        label: "Rappellera quand prêt",
        color: "bg-blue-100 text-blue-700 border-blue-200",
        icon: <PhoneCall className="h-3 w-3" />
      }
    }

    return statusMap[status] || {
      label: status,
      color: "bg-gray-100 text-gray-800 border-gray-200",
      icon: <Clock className="h-3 w-3" />
    }
  }

  const filteredDeliveries = deliveries.filter((delivery) => {
    // Filter by status
    if (statusFilter !== "tous" && delivery.status !== statusFilter) {
      return false
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        delivery.recipient_name?.toLowerCase().includes(query) ||
        delivery.package_description?.toLowerCase().includes(query) ||
        delivery.recipient_phone_number?.includes(query) ||
        delivery.identifier_column?.toLowerCase().includes(query)
      )
    }

    return true
  })

  const navigateToNewDelivery = () => {
    router.push("/dashboard/pre-delivery")
  }

  const navigateToSettings = () => {
    router.push("/dashboard/settings")
  }

  return (
    <RoleGuard allowedRoles={["enterprise", "hospital", "admin", "personal"]}>
      <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] to-[#f1f5f9] pt-24">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-[#1a1009] mb-2">Livraisons</h1>
              <p className="text-[#B08968]">
                Gérez et suivez toutes vos livraisons en temps réel
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              {/* User Profile Card */}
              <div className="group relative">
                <div className="flex items-center gap-3 bg-gradient-to-r from-[#1a1009] to-[#2a1809] px-4 py-3 rounded-2xl border border-[#B08968]/20 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#22D3EE] to-[#06b6d4] flex items-center justify-center shadow-lg">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-white text-sm">
                      {user?.name || `${user?.first_name} ${user?.last_name}`}
                    </div>
                    <div className="text-[#B08968]/80 text-xs">
                      {user?.organizationName}
                    </div>
                  </div>
                  <div className="text-[#B08968]/60 group-hover:text-white transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={navigateToSettings}
                  className="border-[#B08968]/30 text-[#1a1009] hover:bg-[#B08968]/10 hover:border-[#22D3EE]/50 transition-all duration-300"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Paramètres
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => logout()}
                  className="border-red-200/50 text-red-600 hover:bg-red-50 hover:border-red-300 transition-all duration-300"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Déconnexion
                </Button>
              </div>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#B08968]/60" />
              <Input
                placeholder="Rechercher par client, produit, téléphone ou référence..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white border-[#B08968]/20 focus:border-[#22D3EE]/50"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-[#B08968]/60" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48 bg-white border-[#B08968]/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tous">Tous les statuts</SelectItem>
                  <SelectItem value="unassigned">En attente</SelectItem>
                  <SelectItem value="confirmed">Confirmé</SelectItem>
                  <SelectItem value="assigned">Assigné</SelectItem>
                  <SelectItem value="delivery_start_to_recipient">En livraison</SelectItem>
                  <SelectItem value="delivered">Livré</SelectItem>
                  <SelectItem value="failed_pickup">Échec collecte</SelectItem>
                  <SelectItem value="delivery_failed">Échec livraison</SelectItem>
                  <SelectItem value="no_response">Pas de réponse</SelectItem>
                  <SelectItem value="not_interested">Pas intéressé</SelectItem>
                  <SelectItem value="does_not_remember">Ne se souvient pas</SelectItem>
                  <SelectItem value="beyond_delivery_zone">Hors zone</SelectItem>
                  <SelectItem value="will_call_us_when_ready">Rappellera quand prêt</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          
          {/* Deliveries List */}
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#22D3EE]"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
              <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <p className="text-red-700">{error}</p>
            </div>
          ) : filteredDeliveries.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-[#B08968]/20 rounded-xl p-12 text-center">
              <Package className="h-12 w-12 text-[#B08968]/40 mx-auto mb-4" />
              <p className="text-[#B08968] text-lg font-medium mb-2">
                {searchQuery || statusFilter !== "tous" ? "Aucune livraison trouvée" : "Aucune livraison"}
              </p>
              <p className="text-[#B08968]/60 text-sm mb-4">
                {searchQuery || statusFilter !== "tous" 
                  ? "Essayez de modifier vos filtres de recherche" 
                  : "Commencez par créer votre première livraison"}
              </p>
              {!searchQuery && statusFilter === "tous" && (
                <Button onClick={navigateToNewDelivery} className="bg-[#22D3EE] text-[#111827] hover:bg-[#22D3EE]/90">
                  <Package className="mr-2 h-4 w-4" />
                  Créer une livraison
                </Button>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-[#B08968]/10 overflow-hidden">
              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#f8fafc] border-b border-[#B08968]/10">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[#1a1009] uppercase tracking-wider">Référence</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[#1a1009] uppercase tracking-wider">Client & Produit</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[#1a1009] uppercase tracking-wider">Contact</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[#1a1009] uppercase tracking-wider">Valeur</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[#1a1009] uppercase tracking-wider">Statut</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[#1a1009] uppercase tracking-wider">Détails</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#B08968]/10">
                    {filteredDeliveries.map((delivery) => {
                      const statusInfo = getStatusInfo(delivery.status)
                      
                      return (
                        <tr key={delivery._id} className="hover:bg-[#f8fafc] transition-colors">
                          <td className="px-4 py-3 text-sm font-medium text-[#1a1009]">
                            {delivery.identifier_column}
                          </td>
                          <td className="px-4 py-3">
                            <div className="space-y-1">
                              <p className="text-sm font-medium text-[#1a1009]">
                                {delivery.recipient_name || "Non spécifié"}
                              </p>
                              <p className="text-sm text-[#B08968]/80 max-w-xs" title={delivery.package_description}>
                                {delivery.package_description}
                              </p>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="space-y-1">
                              <a
                                href={`tel:${delivery.recipient_phone_number}`}
                                className="text-sm text-[#22D3EE] hover:text-[#22D3EE]/80 transition-colors flex items-center gap-1"
                              >
                                <Phone className="h-3 w-3" />
                                {delivery.recipient_phone_number}
                              </a>
                              <p className="text-sm text-[#B08968]/80 max-w-xs" title={delivery.recipient_address_line}>
                                <MapPin className="h-3 w-3 inline mr-1" />
                                {delivery.recipient_address_line}
                              </p>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-[#1a1009]">
                            {delivery.package_value_amount} {delivery.package_value_currency}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${statusInfo.color}`}>
                              {statusInfo.icon}
                              {statusInfo.label}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="space-y-1">
                              {delivery.note && (
                                <p className="text-sm text-[#B08968]/80 italic" title={delivery.note}>
                                  "{delivery.note.length > 30 ? delivery.note.substring(0, 30) + '...' : delivery.note}"
                                </p>
                              )}
                              <p className="text-xs text-[#B08968]/60">
                                {new Date(delivery.created_at).toLocaleString("fr-FR", {
                                  weekday: 'short',
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="lg:hidden divide-y divide-[#B08968]/10">
                {filteredDeliveries.map((delivery) => {
                  const statusInfo = getStatusInfo(delivery.status)
                  
                  return (
                    <div key={delivery._id} className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-[#B08968]/60">
                          {delivery.identifier_column}
                        </span>
                        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${statusInfo.color}`}>
                          {statusInfo.icon}
                          {statusInfo.label}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs font-medium text-[#B08968]/60">Client</p>
                          <p className="text-sm text-[#1a1009]">{delivery.recipient_name || "Non spécifié"}</p>
                        </div>
                        
                        <div>
                          <p className="text-xs font-medium text-[#B08968]/60">Produit</p>
                          <p className="text-sm text-[#B08968]/80">{delivery.package_description}</p>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="flex-1">
                            <p className="text-xs font-medium text-[#B08968]/60">Téléphone</p>
                            <a
                              href={`tel:${delivery.recipient_phone_number}`}
                              className="text-sm text-[#22D3EE] hover:text-[#22D3EE]/80 transition-colors flex items-center gap-1"
                            >
                              <Phone className="h-3 w-3" />
                              {delivery.recipient_phone_number}
                            </a>
                          </div>
                          
                          <div>
                            <p className="text-xs font-medium text-[#B08968]/60">Valeur</p>
                            <p className="text-sm font-medium text-[#1a1009]">
                              {delivery.package_value_amount} {delivery.package_value_currency}
                            </p>
                          </div>
                        </div>
                        
                        <div>
                          <p className="text-xs font-medium text-[#B08968]/60">Adresse</p>
                          <p className="text-sm text-[#B08968]/80">{delivery.recipient_address_line}</p>
                        </div>
                        
                        {delivery.note && (
                          <div>
                            <p className="text-xs font-medium text-[#B08968]/60">Note</p>
                            <p className="text-sm text-[#B08968]/80 italic">{delivery.note}</p>
                          </div>
                        )}
                        
                        <div>
                          <p className="text-xs font-medium text-[#B08968]/60">Date</p>
                          <p className="text-sm text-[#B08968]/60">
                            {new Date(delivery.created_at).toLocaleString("fr-FR", {
                              weekday: 'short',
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </RoleGuard>
  )
}
