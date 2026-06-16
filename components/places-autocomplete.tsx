"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { MapPin } from "lucide-react"
import usePlacesAutocomplete, { getGeocode, getLatLng } from "use-places-autocomplete"
import useOnclickOutside from "react-cool-onclickoutside"
import { useToast } from "@/hooks/use-toast"
import type { google } from "googlemaps"

// Add a new prop to capture coordinates
interface PlacesAutocompleteProps {
  id: string
  placeholder?: string
  value: string
  onChange: (address: string, coordinates?: { lat: number; lng: number }) => void
  required?: boolean
}

export default function PlacesAutocomplete({
  id,
  placeholder,
  value,
  onChange,
  required = false,
}: PlacesAutocompleteProps) {
  const [isScriptLoaded, setIsScriptLoaded] = useState(false)
  const { toast } = useToast()
  const initialValueSet = useRef(false)

  // Load Google Maps script
  useEffect(() => {
    // Check if script is already loaded
    if (window.google?.maps?.places) {
      setIsScriptLoaded(true)
      return
    }

    const loadGoogleMapsScript = async () => {
      try {
        // Fetch API key from our backend
        const response = await fetch("/api/google-maps")
        if (!response.ok) {
          throw new Error("Failed to fetch Google Maps API key")
        }

        const { scriptUrl } = await response.json()

        // Create script element
        const script = document.createElement("script")
        script.src = scriptUrl
        script.async = true
        script.defer = true

        script.onload = () => {
          setIsScriptLoaded(true)
        }

        script.onerror = () => {
          console.error("Error loading Google Maps script")
          toast({
            title: "Erreur",
            description: "Impossible de charger Google Maps. La suggestion d'adresses peut ne pas fonctionner.",
            variant: "destructive",
          })
        }

        document.head.appendChild(script)
      } catch (error) {
        console.error("Error setting up Google Maps:", error)
        toast({
          title: "Erreur",
          description: "Impossible de configurer Google Maps. La suggestion d'adresses peut ne pas fonctionner.",
          variant: "destructive",
        })
      }
    }

    loadGoogleMapsScript()
  }, [toast])

  const {
    ready,
    value: inputValue,
    suggestions: { status, data },
    setValue,
    clearSuggestions,
  } = usePlacesAutocomplete({
    requestOptions: {
      /* Define search scope here */
      componentRestrictions: { country: ["cd", "cg", "ci", "bf", "bj", "tg", "sn", "ml", "ne", "fr"] },
      types: ["address"],
    },
    debounce: 300,
    cacheKey: "places-autocomplete",
    initOnMount: isScriptLoaded,
  })

  // Set initial value only once when component is ready
  useEffect(() => {
    if (ready && value && !initialValueSet.current) {
      setValue(value, false)
      initialValueSet.current = true
    }
  }, [ready, value, setValue])

  // Handle input change
  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Always update the local input value
    const newValue = e.target.value

    // Only call the Places API setValue if it's ready
    if (ready) {
      setValue(newValue)
    } else {
      // If Places API isn't ready yet, at least update the displayed value
      // and notify the parent component
      onChange(newValue)
    }
  }

  const handleSelect = (description: string) => () => {
    setValue(description, false)
    // Update the onPlaceSelect function to pass coordinates
    const onPlaceSelect = (place: google.maps.places.PlaceResult) => {
      if (place.formatted_address) {
        setValue(place.formatted_address)

        // Pass coordinates if available
        if (place.geometry && place.geometry.location) {
          const lat = place.geometry.location.lat()
          const lng = place.geometry.location.lng()
          onChange(place.formatted_address, { lat, lng })
        } else {
          onChange(place.formatted_address)
        }
      }
    }
    onChange(description)
    clearSuggestions()

    // Get latitude and longitude (optional, for future use)
    getGeocode({ address: description })
      .then((results) => {
        const { lat, lng } = getLatLng(results[0])
        console.log("📍 Coordinates: ", { lat, lng })
      })
      .catch((error) => {
        console.error("Error getting geocode:", error)
      })
  }

  // Close suggestions when clicking outside
  const ref = useOnclickOutside(() => {
    clearSuggestions()
  })

  return (
    <div ref={ref} className="relative w-full">
      <div className="relative">
        <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          id={id}
          placeholder={placeholder}
          className="pl-10"
          value={inputValue}
          onChange={handleInput}
          // Remove the disabled attribute that was causing the input to be disabled when the modal opens
          // Instead, we'll allow typing even if Google Maps hasn't loaded yet
          required={required}
        />
      </div>
      {!ready && isScriptLoaded && (
        <div className="text-xs text-amber-600 mt-1">Chargement des suggestions d'adresses...</div>
      )}

      {/* Suggestions dropdown */}
      {status === "OK" && (
        <ul className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
          {data.map(({ place_id, description, structured_formatting }) => (
            <li
              key={place_id}
              onClick={handleSelect(description)}
              className="relative cursor-pointer select-none py-2 px-3 hover:bg-gray-100"
            >
              <div className="flex items-center">
                <span className="font-medium">{structured_formatting.main_text}</span>
                <span className="ml-1 text-gray-500">{structured_formatting.secondary_text}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
