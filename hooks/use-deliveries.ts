"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/contexts/auth-context"
import { fetchUserDeliveries } from "@/lib/api"

export function useDeliveries() {
  const [deliveries, setDeliveries] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  const fetchDeliveries = useCallback(async () => {
    if (!user?.id) {
      setDeliveries([])
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      const data = await fetchUserDeliveries(user.id)
      setDeliveries(data)
    } catch (err) {
      setError("Failed to load deliveries. Please try again later.")
      console.error("Error loading deliveries:", err)
    } finally {
      setIsLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    fetchDeliveries()
  }, [fetchDeliveries])

  return {
    deliveries,
    isLoading,
    error,
    refetch: fetchDeliveries,
  }
}
