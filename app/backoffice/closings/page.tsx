"use client"

import { useRef, useState } from "react"
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query"
import { Loader2, Users } from "lucide-react"
import { ClosingsContent } from "@/app/closings/page"
import { AccessControl } from "@/components/backoffice/access-control"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_SERVER_BASE_URL

interface CloserCustomer {
  name: string
  customer_id: string
}

interface Closer {
  _id: string
  user_id: string
  access_code: string
  first_name: string
  last_name: string
  role: string
  email: string
  phone_number: string
  is_available?: boolean
  customers: CloserCustomer[]
  discord_webhook_url?: string
}

function CloserSelector({
  closers,
  selectedId,
  onSelect,
  isLoading,
  error,
  onRetry,
}: {
  closers: Closer[]
  selectedId: string
  onSelect: (id: string) => void
  isLoading: boolean
  error: Error | null
  onRetry: () => void
}) {
  return (
    <div className="flex h-[60vh] items-center justify-center">
      <Card className="w-full max-w-md border-[#B08968]/10">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[#1a1009] to-[#2D1F16] text-[#22D3EE] border border-[#B08968]/10">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#1a1009]">Closings</h1>
              <p className="text-sm text-[#B08968]">Sélectionnez un closer pour voir ses clients.</p>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-[#22D3EE]" />
            </div>
          ) : error ? (
            <div className="space-y-3 text-center">
              <p className="text-sm text-red-600">
                {error instanceof Error ? error.message : "Erreur de chargement"}
              </p>
              <Button
                variant="outline"
                onClick={onRetry}
                className="border-[#22D3EE] text-[#22D3EE] hover:bg-[#22D3EE]/10"
              >
                Réessayer
              </Button>
            </div>
          ) : closers.length === 0 ? (
            <p className="text-sm text-[#2D1F16] py-4 text-center">Aucun closer trouvé.</p>
          ) : (
            <Select value={selectedId} onValueChange={onSelect}>
              <SelectTrigger className="border-[#B08968]/20 focus:ring-[#22D3EE]">
                <SelectValue placeholder="Choisir un closer" />
              </SelectTrigger>
              <SelectContent>
                {closers.map((closer) => (
                  <SelectItem key={closer.user_id} value={closer.user_id}>
                    {closer.first_name} {closer.last_name}
                    {closer.is_available === false ? " (indisponible)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function BackofficeClosingsContent() {
  const [selectedCloserId, setSelectedCloserId] = useState<string>("")

  const closersQuery = useQuery<Closer[]>({
    queryKey: ["backoffice-closers"],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/users/closers`)
      if (!response.ok) throw new Error("Erreur lors du chargement des closers")
      const result = await response.json()
      return (result.data || []) as Closer[]
    },
  })

  const closers = Array.isArray(closersQuery.data) ? closersQuery.data : []
  const selectedCloser = closers.find((c) => c.user_id === selectedCloserId)

  return (
    <AccessControl requiredRole="both">
      {!selectedCloser ? (
        <CloserSelector
          closers={closers}
          selectedId={selectedCloserId}
          onSelect={setSelectedCloserId}
          isLoading={closersQuery.isLoading}
          error={closersQuery.error}
          onRetry={() => closersQuery.refetch()}
        />
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#1a1009]">Closings</h1>
              <p className="text-sm text-[#B08968]">
                Contexte : {selectedCloser.first_name} {selectedCloser.last_name}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-[#2D1F16]">Changer de closer :</span>
              <Select
                value={selectedCloserId}
                onValueChange={setSelectedCloserId}
              >
                <SelectTrigger className="w-full sm:w-[260px] border-[#B08968]/20 focus:ring-[#22D3EE]">
                  <SelectValue placeholder="Choisir un closer" />
                </SelectTrigger>
                <SelectContent>
                  {closers.map((closer) => (
                    <SelectItem key={closer.user_id} value={closer.user_id}>
                      {closer.first_name} {closer.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <ClosingsContent initialProfile={selectedCloser} />
        </div>
      )}
    </AccessControl>
  )
}

export default function BackofficeClosingsPage() {
  const queryClientRef = useRef<QueryClient>()
  if (!queryClientRef.current) {
    queryClientRef.current = new QueryClient()
  }

  return (
    <QueryClientProvider client={queryClientRef.current}>
      <BackofficeClosingsContent />
    </QueryClientProvider>
  )
}
