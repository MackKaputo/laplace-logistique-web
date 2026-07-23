"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2, Send, ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { useQuery, useQueryClient, QueryClient, QueryClientProvider } from "@tanstack/react-query"

interface PreDeliveryRow {
  id: string
  recipient_address_line: string
  recipient_name: string
  recipient_phone_number: string
  package_description: string
  package_value_currency: string
  package_value_amount: string
  is_delivery_price_included: boolean
  status?: string
}

function PreDeliveryContent() {
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const [rows, setRows] = useState<PreDeliveryRow[]>([
    {
      id: crypto.randomUUID(),
      recipient_address_line: "",
      recipient_name: "",
      recipient_phone_number: "",
      package_description: "",
      package_value_currency: "CDF",
      package_value_amount: "",
      is_delivery_price_included: false,
    },
  ])

  const [isSubmitting, setIsSubmitting] = useState(false)

  const { data: preDeliveries, isLoading: isLoadingPreDeliveries } = useQuery({
    queryKey: ["pre-deliveries", user?.id],
    queryFn: async () => {
      if (!user?.id) return []
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_SERVER_BASE_URL}/deliveries/pre-deliveries?customer_id=${user.id}`,
      )
      if (!response.ok) {
        throw new Error("Erreur lors du chargement des pré-livraisons")
      }
      const result = await response.json()
      return result.data || []
    },
    enabled: !!user?.id,
  })

  const addRow = () => {
    setRows([
      ...rows,
      {
        id: crypto.randomUUID(),
        recipient_address_line: "",
        recipient_name: "",
        recipient_phone_number: "",
        package_description: "",
        package_value_currency: "CDF",
        package_value_amount: "",
        is_delivery_price_included: false,
      },
    ])
  }

  const removeRow = (id: string) => {
    if (rows.length > 1) {
      setRows(rows.filter((row) => row.id !== id))
    }
  }

  const updateRow = (id: string, field: keyof PreDeliveryRow, value: any) => {
    setRows(rows.map((row) => (row.id === id ? { ...row, [field]: value } : row)))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const invalidRows = rows.filter(
      (row) =>
        !row.recipient_address_line ||
        !row.recipient_phone_number ||
        !row.package_description ||
        !row.package_value_amount,
    )

    if (invalidRows.length > 0) {
      toast({
        title: "Erreur de validation",
        description: "Veuillez remplir tous les champs obligatoires (adresse, téléphone, description, valeur)",
        variant: "destructive",
      })
      setIsSubmitting(false)
      return
    }

    try {
      const preDeliveryOrders = rows.map((row) => ({
        recipient_address_line: row.recipient_address_line,
        recipient_name: row.recipient_name || undefined,
        recipient_phone_number: row.recipient_phone_number,
        package_description: row.package_description,
        package_value_currency: row.package_value_currency,
        package_value_amount: Number.parseFloat(row.package_value_amount),
        is_delivery_price_included: row.is_delivery_price_included,
        customer_id: user?.id,
      }))

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_SERVER_BASE_URL}/deliveries/pre-deliveries`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(preDeliveryOrders),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        toast({
          title: "Succès",
          description: `${rows.length} commande(s) soumise(s) avec succès`,
          variant: "default",
        })

        setRows([
          {
            id: crypto.randomUUID(),
            recipient_address_line: "",
            recipient_name: "",
            recipient_phone_number: "",
            package_description: "",
            package_value_currency: "CDF",
            package_value_amount: "",
            is_delivery_price_included: false,
          },
        ])

        queryClient.invalidateQueries({ queryKey: ["pre-deliveries", user?.id] })
      } else {
        toast({
          title: "Erreur",
          description: result.message || "Une erreur s'est produite lors de la soumission",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error submitting pre-deliveries:", error)
      toast({
        title: "Erreur",
        description: "Impossible de soumettre les commandes. Veuillez réessayer.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusLabel = (status?: string) => {
    if (!status) return "En attente"

    const statusLabels: Record<string, string> = {
      confirmed: "Confirmé",
      no_response: "Pas de réponse",
      unreachable_phone_number: "Numéro injoignable",
      not_interested: "Pas intéressé",
      does_not_remember: "Ne se souvient pas",
      beyond_delivery_zone: "Hors zone de livraison",
      will_call_us_when_ready: "Rappellera quand prêt",
    }

    return statusLabels[status] || "En attente"
  }

  const getStatusColor = (status?: string) => {
    if (!status) return "bg-yellow-100 text-yellow-800"

    const statusColors: Record<string, string> = {
      confirmed: "bg-green-100 text-green-800",
      no_response: "bg-gray-100 text-gray-800",
      unreachable_phone_number: "bg-rose-100 text-rose-800",
      not_interested: "bg-red-100 text-red-800",
      does_not_remember: "bg-orange-100 text-orange-800",
      beyond_delivery_zone: "bg-purple-100 text-purple-800",
      will_call_us_when_ready: "bg-blue-100 text-blue-800",
    }

    return statusColors[status] || "bg-yellow-100 text-yellow-800"
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>
        <h1 className="text-3xl font-bold text-[#2B015F]">Commande de livraison – adresse à confirmer</h1>
        <p className="text-gray-600 mt-2">
          Utilisez ce formulaire lorsque vous ne disposez pas encore de la commune ou du quartier du destinataire. Vous
          pouvez ajouter plusieurs commandes et les soumettre en une seule fois avec les informations disponibles. Notre
          équipe contactera le destinataire, complétera les détails de localisation et validera la livraison avant son
          lancement.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    Adresse de livraison, Numéro et Référence *
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Nom du destinataire</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Téléphone *</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Description du colis *</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Devise</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Valeur *</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Frais livraison inclus?</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.map((row, index) => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Input
                        placeholder="Ex: Av. Wagenia N°123, Réf: Immeuble bleu"
                        value={row.recipient_address_line}
                        onChange={(e) => updateRow(row.id, "recipient_address_line", e.target.value)}
                        required
                        className="min-w-[250px]"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Input
                        placeholder="Nom complet (optionnel)"
                        value={row.recipient_name}
                        onChange={(e) => updateRow(row.id, "recipient_name", e.target.value)}
                        className="min-w-[180px]"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Input
                        type="tel"
                        placeholder="+243 000 000 000"
                        value={row.recipient_phone_number}
                        onChange={(e) => updateRow(row.id, "recipient_phone_number", e.target.value)}
                        required
                        className="min-w-[150px]"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Input
                        placeholder="Décrivez le colis"
                        value={row.package_description}
                        onChange={(e) => updateRow(row.id, "package_description", e.target.value)}
                        required
                        className="min-w-[200px]"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Select
                        value={row.package_value_currency}
                        onValueChange={(value) => updateRow(row.id, "package_value_currency", value)}
                      >
                        <SelectTrigger className="w-[100px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CDF">CDF</SelectItem>
                          <SelectItem value="USD">USD</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-4 py-3">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={row.package_value_amount}
                        onChange={(e) => updateRow(row.id, "package_value_amount", e.target.value)}
                        required
                        className="min-w-[120px]"
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={row.is_delivery_price_included}
                        onChange={(e) => updateRow(row.id, "is_delivery_price_included", e.target.checked)}
                        className="w-4 h-4 cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(row.status)}`}
                      >
                        {getStatusLabel(row.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden divide-y">
            {rows.map((row, index) => (
              <div key={row.id} className="p-4 space-y-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Commande #{index + 1}</span>
                </div>

                <div>
                  <Label className="text-xs">Adresse de livraison, Numéro et Référence *</Label>
                  <Input
                    placeholder="Ex: Av. Wagenia N°123, Réf: Immeuble bleu"
                    value={row.recipient_address_line}
                    onChange={(e) => updateRow(row.id, "recipient_address_line", e.target.value)}
                    required
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label className="text-xs">Nom du destinataire (optionnel)</Label>
                  <Input
                    placeholder="Nom complet"
                    value={row.recipient_name}
                    onChange={(e) => updateRow(row.id, "recipient_name", e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label className="text-xs">Numéro de téléphone *</Label>
                  <Input
                    type="tel"
                    placeholder="+243 000 000 000"
                    value={row.recipient_phone_number}
                    onChange={(e) => updateRow(row.id, "recipient_phone_number", e.target.value)}
                    required
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label className="text-xs">Description du colis *</Label>
                  <Input
                    placeholder="Décrivez le colis"
                    value={row.package_description}
                    onChange={(e) => updateRow(row.id, "package_description", e.target.value)}
                    required
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Devise</Label>
                    <Select
                      value={row.package_value_currency}
                      onValueChange={(value) => updateRow(row.id, "package_value_currency", value)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CDF">CDF</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Valeur *</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={row.package_value_amount}
                      onChange={(e) => updateRow(row.id, "package_value_amount", e.target.value)}
                      required
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`delivery-price-${row.id}`}
                    checked={row.is_delivery_price_included}
                    onChange={(e) => updateRow(row.id, "is_delivery_price_included", e.target.checked)}
                    className="w-4 h-4 cursor-pointer"
                  />
                  <Label htmlFor={`delivery-price-${row.id}`} className="text-xs cursor-pointer">
                    Le coût de la livraison est inclus dans le prix du colis
                  </Label>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-sm text-gray-600">Statut:</span>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(row.status)}`}
                  >
                    {getStatusLabel(row.status)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mt-6">
          <Button type="button" variant="outline" onClick={addRow} className="flex-1 sm:flex-none bg-transparent">
            <Plus className="mr-2 h-4 w-4" />
            Ajouter une ligne
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => removeRow(rows[rows.length - 1].id)}
            disabled={rows.length === 1}
            className="flex-1 sm:flex-none text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
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

      {/* Section to display submitted pre-deliveries */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-[#2B015F] mb-4">Commandes en attente de confirmation</h2>
        <p className="text-gray-600 mb-6">
          Ces commandes ont été soumises et sont en attente de confirmation de l'adresse. Elles disparaîtront de cette
          liste une fois l'adresse confirmée.
        </p>

        {isLoadingPreDeliveries ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2B015F]"></div>
          </div>
        ) : preDeliveries && preDeliveries.length > 0 ? (
          <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Date</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Adresse</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Destinataire</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Téléphone</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Description</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Valeur</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Frais livraison inclus</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {preDeliveries.map((delivery: any) => (
                    <tr key={delivery._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">
                        {new Date(delivery.created_at || delivery.createdAt).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="px-4 py-3 text-sm">{delivery.recipient_address_line}</td>
                      <td className="px-4 py-3 text-sm">{delivery.recipient_name || "—"}</td>
                      <td className="px-4 py-3 text-sm">{delivery.recipient_phone_number}</td>
                      <td className="px-4 py-3 text-sm">{delivery.package_description}</td>
                      <td className="px-4 py-3 text-sm">
                        {delivery.package_value_amount} {delivery.package_value_currency}
                      </td>
                      <td className="px-4 py-3 text-sm text-center">
                        {delivery.is_delivery_price_included ? (
                          <span className="text-green-600">✓</span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(delivery.status)}`}
                        >
                          {getStatusLabel(delivery.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden divide-y">
              {preDeliveries.map((delivery: any) => (
                <div key={delivery._id} className="p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-sm">{delivery.recipient_address_line}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(delivery.created_at || delivery.createdAt).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                  </div>
                  {delivery.recipient_name && (
                    <p className="text-sm">
                      <span className="text-gray-600">Destinataire:</span> {delivery.recipient_name}
                    </p>
                  )}
                  <p className="text-sm">
                    <span className="text-gray-600">Téléphone:</span> {delivery.recipient_phone_number}
                  </p>
                  <p className="text-sm">
                    <span className="text-gray-600">Description:</span> {delivery.package_description}
                  </p>
                  <p className="text-sm">
                    <span className="text-gray-600">Valeur:</span> {delivery.package_value_amount}{" "}
                    {delivery.package_value_currency}
                  </p>
                  {delivery.is_delivery_price_included && (
                    <p className="text-sm text-green-600">✓ Coût de livraison inclus</p>
                  )}
                  <div className="flex justify-between items-start">
                    <span className="text-sm text-gray-600">Statut:</span>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(delivery.status)}`}
                    >
                      {getStatusLabel(delivery.status)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
            <p className="text-gray-500">Aucune commande en attente de confirmation</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function PreDeliveryPage() {
  const queryClientRef = useRef<QueryClient>()
  if (!queryClientRef.current) {
    queryClientRef.current = new QueryClient()
  }

  return (
    <QueryClientProvider client={queryClientRef.current}>
      <PreDeliveryContent />
    </QueryClientProvider>
  )
}
