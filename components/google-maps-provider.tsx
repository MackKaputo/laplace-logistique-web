"use client"

import { useState, useEffect, type ReactNode } from "react"
import { LoadScript } from "@react-google-maps/api"

// Define the Google Maps libraries needed across the app.
// We now include "drawing" so the Zone Manager can render its polygon tools.
const libraries: ("places" | "drawing" | "geometry" | "localContext" | "visualization")[] = ["places", "drawing"]

interface GoogleMapsProviderProps {
  children: ReactNode
}

export default function GoogleMapsProvider({ children }: GoogleMapsProviderProps) {
  const [apiKey, setApiKey] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchApiKey() {
      try {
        const response = await fetch("/api/google-maps")
        if (!response.ok) {
          throw new Error("Failed to fetch Google Maps API key")
        }
        const data = await response.json()
        // Extract the API key from the script URL
        const urlObj = new URL(data.scriptUrl)
        const key = urlObj.searchParams.get("key")
        if (key) {
          setApiKey(key)
        } else {
          console.error("API key not found in script URL")
        }
      } catch (error) {
        console.error("Error fetching Google Maps API key:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchApiKey()
  }, [])

  return (
    <div>
      {children}
    </div>
  )
}
