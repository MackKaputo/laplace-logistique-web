"use client"

import { useRef, useState, useMemo } from "react"
import { useQuery, QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Package, Search, Loader2, RefreshCw, Building2, Tag } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { AccessControl } from "@/components/backoffice/access-control"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_SERVER_BASE_URL

interface Customer {
  customer_id: string
  organization_name: string
}

interface Product {
  _id: string
  product_id: string
  customer: Customer
  name: string
  description: string
  customer_id: string
  created_at: string
}

function formatDate(dateString: string) {
  if (!dateString) return "—"
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(dateString))
}

function ProductsContent() {
  const { toast } = useToast()
  const [search, setSearch] = useState("")

  const query = useQuery<Product[]>({
    queryKey: ["all-products"],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/deliveries/products`)
      if (!response.ok) throw new Error("Erreur lors du chargement des produits")
      const result = await response.json()
      return (result.data || []) as Product[]
    },
  })

  const products = Array.isArray(query.data) ? query.data : []

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return products
    return products.filter((p) => {
      const customerName = p.customer?.organization_name ?? ""
      return (
        (p.name ?? "").toLowerCase().includes(q) ||
        (p.description ?? "").toLowerCase().includes(q) ||
        (p.product_id ?? "").toLowerCase().includes(q) ||
        customerName.toLowerCase().includes(q)
      )
    })
  }, [products, search])

  if (query.isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#22D3EE]" />
          <p className="mt-4 text-sm text-[#2D1F16]">Chargement des produits...</p>
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
              <Package className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#1a1009]">Produits</h1>
              <p className="text-sm text-[#B08968]">Liste de tous les produits existants.</p>
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
            placeholder="Rechercher par nom, client, description ou ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 border-[#B08968]/20 focus-visible:ring-[#22D3EE]"
          />
        </div>

        {filtered.length === 0 ? (
          <Card className="border-[#B08968]/10">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Package className="h-10 w-10 text-[#B08968]/40 mb-3" />
              <p className="text-[#2D1F16]">Aucun produit trouvé</p>
              <p className="text-sm text-[#B08968]">Vérifiez votre recherche ou rechargez la liste.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((product) => (
              <Card key={product._id} className="border-[#B08968]/10 overflow-hidden flex flex-col">
                <CardHeader className="bg-gradient-to-r from-[#1a1009] to-[#2D1F16] text-white pb-4">
                  <CardTitle className="text-lg font-bold flex items-start gap-2">
                    <Package className="h-4 w-4 text-[#22D3EE] shrink-0 mt-1" />
                    <span className="line-clamp-2">{product.name}</span>
                  </CardTitle>
                  <CardDescription className="text-[#B08968] mt-1 line-clamp-1">
                    {product.description || "Aucune description"}
                  </CardDescription>
                </CardHeader>

                <CardContent className="flex-1 p-4 space-y-3">
                  <div className="flex items-start gap-2 text-sm text-[#2D1F16]">
                    <Building2 className="h-4 w-4 text-[#B08968] shrink-0 mt-0.5" />
                    <span className="line-clamp-2">
                      {product.customer?.organization_name || "Client inconnu"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-[#B08968]">
                    <Tag className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{product.product_id}</span>
                  </div>

                  <div className="pt-3 border-t border-[#B08968]/10 flex items-center justify-between text-xs">
                    <Badge
                      variant="secondary"
                      className="bg-[#22D3EE]/10 text-[#22D3EE] border border-[#22D3EE]/20 hover:bg-[#22D3EE]/10"
                    >
                      {formatDate(product.created_at)}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AccessControl>
  )
}

export default function ProductsPage() {
  const queryClientRef = useRef<QueryClient>()
  if (!queryClientRef.current) {
    queryClientRef.current = new QueryClient()
  }

  return (
    <QueryClientProvider client={queryClientRef.current}>
      <ProductsContent />
    </QueryClientProvider>
  )
}
