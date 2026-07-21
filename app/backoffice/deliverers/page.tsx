"use client"

import { useRef, useState, useMemo, useEffect } from "react"
import { useQuery, useMutation, useQueryClient, QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Truck, Search, Loader2, RefreshCw, Phone, MapPin, Package, Plus, Pencil } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AccessControl } from "@/components/backoffice/access-control"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_SERVER_BASE_URL

interface Product {
  _id: string
  product_id: string
  name: string
  description?: string
  customer?: { organization_name?: string }
}

interface StockProduct {
  _id: string
  deliverer_id: string
  product: {
    product_id: string
    name: string
    description: string
  }
  quantity_available: number
  quantity_defective: number
  quantity_missing: number
  created_at: string
}

type StockUpdateType = "increment" | "decrement" | "defective" | "missing"

interface MobileDelivererZone {
  name?: string
  mobile_deliverer_zone_id?: string
}

interface MobileDeliverer {
  _id: string
  mobile_deliverer_id: string
  access_code: string
  first_name: string
  last_name: string
  phone_number: string
  created_at: string
  mobile_deliverer_zones: (string | MobileDelivererZone)[]
  updatedAt: string
  stocks: StockProduct[]
}

function getZoneDisplay(zone: string | MobileDelivererZone): string {
  if (typeof zone !== "string") {
    return zone.name || zone.mobile_deliverer_zone_id || "Zone inconnue"
  }

  // Legacy format: "Human_Readable_Name_/_with-slashes_UUID"
  const withoutId = zone.replace(
    /_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    ""
  )

  return withoutId.replace(/_\/_/g, " / ").replace(/_/g, " ")
}

function AssignProductDialog({
  deliverer,
  products,
  open,
  onOpenChange,
  onAssign,
  isAssigning,
}: {
  deliverer: MobileDeliverer
  products: Product[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onAssign: (payload: { deliverer_id: string; product_id: string }) => void
  isAssigning: boolean
}) {
  const [selectedProductId, setSelectedProductId] = useState("")

  const assignedProductIds = useMemo(() => {
    return new Set((deliverer.stocks || []).map((s) => s.product.product_id).filter(Boolean))
  }, [deliverer.stocks])

  const availableProducts = useMemo(() => {
    return products.filter((p) => p.product_id && !assignedProductIds.has(p.product_id))
  }, [products, assignedProductIds])

  useEffect(() => {
    if (open) setSelectedProductId("")
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-[#B08968]/10">
        <DialogHeader>
          <DialogTitle className="text-[#1a1009]">Assigner un produit</DialogTitle>
          <DialogDescription className="text-[#B08968]">
            Choisissez un produit à assigner à{" "}
            <span className="font-medium text-[#1a1009]">
              {deliverer.first_name} {deliverer.last_name}
            </span>
            .
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {products.length === 0 ? (
            <div className="flex items-center justify-center py-4 text-[#B08968]">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Chargement des produits...
            </div>
          ) : availableProducts.length === 0 ? (
            <p className="text-sm text-[#2D1F16]">
              Tous les produits sont déjà assignés à ce livreur.
            </p>
          ) : (
            <div className="space-y-2">
              <Label className="text-[#1a1009]">Produit</Label>
              <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                <SelectTrigger className="border-[#B08968]/20 focus:ring-[#22D3EE]">
                  <SelectValue placeholder="Sélectionner un produit" />
                </SelectTrigger>
                <SelectContent>
                  {availableProducts.map((product) => (
                    <SelectItem key={product._id} value={product.product_id}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            onClick={() => onAssign({ deliverer_id: deliverer.mobile_deliverer_id, product_id: selectedProductId })}
            disabled={!selectedProductId || isAssigning}
            className="bg-[#22D3EE] text-[#111827] hover:bg-[#22D3EE]/90"
          >
            {isAssigning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
            Assigner
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function UpdateStockDialog({
  deliverer,
  stock,
  open,
  onOpenChange,
  onUpdate,
  isUpdating,
}: {
  deliverer: MobileDeliverer
  stock: StockProduct
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate: (payload: {
    deliverer_id: string
    product_id: string
    quantity: number
    type: StockUpdateType
  }) => void
  isUpdating: boolean
}) {
  const [quantity, setQuantity] = useState("1")
  const [type, setType] = useState<StockUpdateType>("increment")

  useEffect(() => {
    if (open) {
      setQuantity("1")
      setType("increment")
    }
  }, [open])

  const handleSubmit = () => {
    const qty = Number(quantity)
    if (!qty || qty <= 0) return
    onUpdate({
      deliverer_id: deliverer.mobile_deliverer_id,
      product_id: stock.product.product_id,
      quantity: qty,
      type,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-[#B08968]/10">
        <DialogHeader>
          <DialogTitle className="text-[#1a1009]">Mettre à jour le stock</DialogTitle>
          <DialogDescription className="text-[#B08968]">
            {stock.product.name} — {deliverer.first_name} {deliverer.last_name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label className="text-[#1a1009]">Type d&apos;opération</Label>
            <Select value={type} onValueChange={(v) => setType(v as StockUpdateType)}>
              <SelectTrigger className="border-[#B08968]/20 focus:ring-[#22D3EE]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="increment">Ajouter au stock</SelectItem>
                <SelectItem value="decrement">Retirer du stock</SelectItem>
                <SelectItem value="defective">Marquer défectueux</SelectItem>
                <SelectItem value="missing">Marquer manquant</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-[#1a1009]">Quantité</Label>
            <Input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="border-[#B08968]/20 focus-visible:ring-[#22D3EE]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={handleSubmit}
            disabled={isUpdating || !quantity || Number(quantity) <= 0}
            className="bg-[#22D3EE] text-[#111827] hover:bg-[#22D3EE]/90"
          >
            {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Pencil className="mr-2 h-4 w-4" />}
            Appliquer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function DeliverersContent() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [assignDialogDeliverer, setAssignDialogDeliverer] = useState<MobileDeliverer | null>(null)
  const [updateDialogStock, setUpdateDialogStock] = useState<{ deliverer: MobileDeliverer; stock: StockProduct } | null>(null)

  const query = useQuery<MobileDeliverer[]>({
    queryKey: ["mobile-deliverers-with-stocks"],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/deliverers/mobile-deliverers`)
      if (!response.ok) throw new Error("Erreur lors du chargement des livreurs")
      const result = await response.json()
      return (result.data || []) as MobileDeliverer[]
    },
  })

  const productsQuery = useQuery<Product[]>({
    queryKey: ["all-products"],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/deliveries/products`)
      if (!response.ok) throw new Error("Erreur lors du chargement des produits")
      const result = await response.json()
      return (result.data || []) as Product[]
    },
  })

  const deliverers = Array.isArray(query.data) ? query.data : []
  const products = Array.isArray(productsQuery.data) ? productsQuery.data : []

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return deliverers
    return deliverers.filter((d) => {
      const fullName = `${d.first_name ?? ""} ${d.last_name ?? ""}`.toLowerCase()
      return (
        fullName.includes(q) ||
        (d.phone_number ?? "").toLowerCase().includes(q) ||
        (d.mobile_deliverer_id ?? "").toLowerCase().includes(q)
      )
    })
  }, [deliverers, search])

  const assignMutation = useMutation({
    mutationFn: async ({ deliverer_id, product_id }: { deliverer_id: string; product_id: string }) => {
      const response = await fetch(`${API_BASE_URL}/deliveries/assign-product-to-deliverer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deliverer_id, product_id }),
      })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || "Erreur lors de l'assignation")
      }
      return response.json()
    },
    onSuccess: () => {
      toast({ title: "Produit assigné", description: "Le produit a été assigné au livreur." })
      queryClient.invalidateQueries({ queryKey: ["mobile-deliverers-with-stocks"] })
      setAssignDialogDeliverer(null)
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Échec de l'assignation",
        variant: "destructive",
      })
    },
  })

  const updateStockMutation = useMutation({
    mutationFn: async ({
      deliverer_id,
      product_id,
      quantity,
      type,
    }: {
      deliverer_id: string
      product_id: string
      quantity: number
      type: StockUpdateType
    }) => {
      const response = await fetch(`${API_BASE_URL}/deliveries/update-deliverer-stock-quantity`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deliverer_id, product_id, quantity, type }),
      })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || "Erreur lors de la mise à jour du stock")
      }
      return response.json()
    },
    onSuccess: () => {
      toast({ title: "Stock mis à jour", description: "La quantité a été mise à jour." })
      queryClient.invalidateQueries({ queryKey: ["mobile-deliverers-with-stocks"] })
      setUpdateDialogStock(null)
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Échec de la mise à jour",
        variant: "destructive",
      })
    },
  })

  if (query.isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#22D3EE]" />
          <p className="mt-4 text-sm text-[#2D1F16]">Chargement des livreurs...</p>
        </div>
      </div>
    )
  }

  if (query.error) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Card className="max-w-md border-red-200">
          <CardContent className="pt-6 text-center">
            <p className="text-red-600">
              {query.error instanceof Error ? query.error.message : "Erreur de chargement"}
            </p>
            <Button
              variant="outline"
              className="mt-4 border-[#22D3EE] text-[#22D3EE] hover:bg-[#22D3EE]/10"
              onClick={() => query.refetch()}
            >
              Réessayer
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <AccessControl requiredRole="both">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[#1a1009] to-[#2D1F16] text-[#22D3EE] border border-[#B08968]/10">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#1a1009]">Livreurs & stocks</h1>
              <p className="text-sm text-[#B08968]">Visualisez les livreurs et les produits disponibles en stock.</p>
            </div>
          </div>

          <Button
            variant="outline"
            onClick={() => query.refetch()}
            disabled={query.isFetching}
            className="border-[#B08968]/30 text-[#2D1F16] hover:bg-[#B08968]/10 hover:text-[#1a1009]"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${query.isFetching ? "animate-spin" : ""}`} />
            Actualiser
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#B08968]" />
          <Input
            placeholder="Rechercher un livreur par nom, téléphone ou ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 border-[#B08968]/20 focus-visible:ring-[#22D3EE]"
          />
        </div>

        {filtered.length === 0 ? (
          <Card className="border-[#B08968]/10">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Truck className="h-10 w-10 text-[#B08968]/40 mb-3" />
              <p className="text-[#2D1F16]">Aucun livreur trouvé</p>
              <p className="text-sm text-[#B08968]">Vérifiez votre recherche ou rechargez la liste.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-5">
            {filtered.map((deliverer) => {
              const zones = deliverer.mobile_deliverer_zones ?? []
              const stocks = deliverer.stocks ?? []
              return (
                <Card key={deliverer._id} className="border-[#B08968]/10 overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-[#1a1009] to-[#2D1F16] text-white pb-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                          <Truck className="h-4 w-4 text-[#22D3EE]" />
                          {deliverer.first_name ?? ""} {deliverer.last_name ?? ""}
                        </CardTitle>
                        <CardDescription className="text-[#B08968] mt-1">
                          ID: {deliverer.mobile_deliverer_id ?? ""}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2 text-sm text-white/80">
                          <Phone className="h-4 w-4 text-[#22D3EE]" />
                          {deliverer.phone_number ?? ""}
                        </div>
                        <Button
                          size="sm"
                          onClick={() => setAssignDialogDeliverer(deliverer)}
                          className="bg-[#22D3EE] text-[#111827] hover:bg-[#22D3EE]/90 border-0"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Assigner
                        </Button>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {zones.slice(0, 6).map((zone, idx) => (
                        <Badge
                          key={idx}
                          variant="secondary"
                          className="bg-white/10 text-[#B08968] border border-[#B08968]/10 hover:bg-white/10"
                        >
                          <MapPin className="h-3 w-3 mr-1" />
                          {getZoneDisplay(zone)}
                        </Badge>
                      ))}
                      {zones.length > 6 && (
                        <Badge
                          variant="secondary"
                          className="bg-white/10 text-white/70 border border-[#B08968]/10 hover:bg-white/10"
                        >
                          +{zones.length - 6} zones
                        </Badge>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="p-0">
                    {stocks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center px-4">
                      <Package className="h-10 w-10 text-[#B08968]/40 mb-3" />
                      <p className="text-[#1a1009] font-medium">Aucun produit assigné</p>
                      <p className="text-sm text-[#B08968] max-w-md mt-1">
                        Ce livreur n&apos;a actuellement aucun stock de produits enregistré.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-[#f8f6f4] border-b border-[#B08968]/10">
                          <tr>
                            <th className="text-left px-4 py-3 font-semibold text-[#1a1009]">Produit</th>
                            <th className="text-left px-4 py-3 font-semibold text-[#1a1009]">Description</th>
                            <th className="text-center px-4 py-3 font-semibold text-[#1a1009]">Disponible</th>
                            <th className="text-center px-4 py-3 font-semibold text-[#1a1009]">Défectueux</th>
                            <th className="text-center px-4 py-3 font-semibold text-[#1a1009]">Manquant</th>
                            <th className="text-center px-4 py-3 font-semibold text-[#1a1009]">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stocks.map((stock) => (
                            <tr key={stock._id} className="border-b border-[#B08968]/5 last:border-0">
                              <td className="px-4 py-3 font-medium text-[#1a1009]">{stock.product.name}</td>
                              <td className="px-4 py-3 text-[#2D1F16]/80 max-w-xs truncate">
                                {stock.product.description}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <Badge
                                  className={
                                    stock.quantity_available > 0
                                      ? "bg-[#22D3EE]/10 text-[#22D3EE] border border-[#22D3EE]/20"
                                      : "bg-red-50 text-red-600 border border-red-100"
                                  }
                                >
                                  {stock.quantity_available}
                                </Badge>
                              </td>
                              <td className="px-4 py-3 text-center text-[#2D1F16]">{stock.quantity_defective}</td>
                              <td className="px-4 py-3 text-center text-[#2D1F16]">{stock.quantity_missing}</td>
                              <td className="px-4 py-3 text-center">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setUpdateDialogStock({ deliverer, stock })}
                                  className="text-[#22D3EE] hover:bg-[#22D3EE]/10 hover:text-[#22D3EE]"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
          </div>
        )}
      </div>

      {assignDialogDeliverer && (
        <AssignProductDialog
          deliverer={assignDialogDeliverer}
          products={products}
          open={!!assignDialogDeliverer}
          onOpenChange={(open) => !open && setAssignDialogDeliverer(null)}
          onAssign={(payload) => assignMutation.mutate(payload)}
          isAssigning={assignMutation.isPending}
        />
      )}

      {updateDialogStock && (
        <UpdateStockDialog
          deliverer={updateDialogStock.deliverer}
          stock={updateDialogStock.stock}
          open={!!updateDialogStock}
          onOpenChange={(open) => !open && setUpdateDialogStock(null)}
          onUpdate={(payload) => updateStockMutation.mutate(payload)}
          isUpdating={updateStockMutation.isPending}
        />
      )}
    </AccessControl>
  )
}

export default function DeliverersPage() {
  const queryClientRef = useRef<QueryClient>()
  if (!queryClientRef.current) {
    queryClientRef.current = new QueryClient()
  }

  return (
    <QueryClientProvider client={queryClientRef.current}>
      <DeliverersContent />
    </QueryClientProvider>
  )
}
