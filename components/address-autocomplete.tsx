"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { MapPin, Loader2, Navigation } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

// Add a new prop to capture coordinates
interface AddressAutocompleteProps {
  id: string
  placeholder?: string
  value: string
  onChange: (address: string, coordinates?: { lat: number; lng: number }) => void
  required?: boolean
  autoFill?: boolean
}

export default function AddressAutocomplete({
  id,
  placeholder,
  value,
  onChange,
  required = false,
}: AddressAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value)
  const [isLocating, setIsLocating] = useState(false)
  const { toast } = useToast()

  // Sync external value with internal state
  useEffect(() => {
    if (value !== inputValue) {
      setInputValue(value)
    }
  }, [value, inputValue])

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    onChange(newValue)
  }

  // Get current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Géolocalisation non supportée",
        description: "Votre navigateur ne supporte pas la géolocalisation.",
        variant: "destructive",
      })
      return
    }

    setIsLocating(true)

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          // Use OpenStreetMap's Nominatim for reverse geocoding
          const { latitude, longitude } = position.coords
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
            {
              headers: {
                "Accept-Language": "fr",
              },
            },
          )

          if (!response.ok) {
            throw new Error("Erreur lors de la récupération de l'adresse")
          }

          const data = await response.json()

          // Format the address
          const address = data.display_name

          // Update the input value
          setInputValue(address)

          // Update the onChange handler to pass coordinates
          const handleSelect = async (address: string) => {
            setIsLocating(false)

            try {
              // Get coordinates for the selected address
              const response = await fetch(`/api/google-maps?address=${encodeURIComponent(address)}`)
              const data = await response.json()

              if (data.results && data.results.length > 0) {
                const location = data.results[0].geometry.location
                onChange(address, { lat: location.lat, lng: location.lng })
              } else {
                onChange(address)
              }
            } catch (error) {
              console.error("Error fetching coordinates:", error)
              onChange(address)
            }
          }

          handleSelect(address)

          toast({
            title: "Localisation réussie",
            description: "Votre position actuelle a été détectée.",
          })
        } catch (error) {
          console.error("Error getting address:", error)
          toast({
            title: "Erreur de localisation",
            description: "Impossible de récupérer votre adresse. Veuillez saisir manuellement.",
            variant: "destructive",
          })
        } finally {
          setIsLocating(false)
        }
      },
      (error) => {
        setIsLocating(false)
        console.error("Geolocation error:", error)

        let errorMessage = "Impossible de récupérer votre position."

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Vous avez refusé l'accès à votre position."
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Votre position est indisponible."
            break
          case error.TIMEOUT:
            errorMessage = "La demande de localisation a expiré."
            break
        }

        toast({
          title: "Erreur de géolocalisation",
          description: errorMessage,
          variant: "destructive",
        })
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    )
  }

  return (
    <div className="relative flex">
      <div className="relative flex-1">
        <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          id={id}
          placeholder={placeholder}
          className="pl-10"
          value={inputValue}
          onChange={handleInputChange}
          required={required}
        />
      </div>
      <Button type="button" variant="outline" className="ml-2" onClick={getCurrentLocation} disabled={isLocating}>
        {isLocating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />}
        <span className="sr-only">Utiliser ma position actuelle</span>
      </Button>
    </div>
  )
}
