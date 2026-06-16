"use client"

import type React from "react"

import { useRef, useState, useEffect } from "react"
import { Autocomplete as GoogleAutocomplete } from "@react-google-maps/api"
import { Input } from "@/components/ui/input"
import { MapPin } from "lucide-react"
import type { google } from "google-maps"

interface AutocompleteProps {
  id: string
  placeholder?: string
  value: string
  onChange: (address: string, coordinates?: { lat: number; lng: number }) => void
  required?: boolean
}

export default function Autocomplete({
  id,
  placeholder = "Search for an address",
  value,
  onChange,
  required = false,
}: AutocompleteProps) {
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [inputValue, setInputValue] = useState(value)
  const [isLoaded, setIsLoaded] = useState(false)
  const [selectedPlace, setSelectedPlace] = useState<google.maps.places.PlaceResult | null>(null)

  // Update internal state when prop value changes
  useEffect(() => {
    setInputValue(value)
  }, [value])

  // Check if Google Maps API is loaded
  useEffect(() => {
    if (window.google && window.google.maps) {
      setIsLoaded(true)
    } else {
      const checkGoogleMapsLoaded = setInterval(() => {
        if (window.google && window.google.maps) {
          setIsLoaded(true)
          clearInterval(checkGoogleMapsLoaded)
        }
      }, 100)

      return () => clearInterval(checkGoogleMapsLoaded)
    }
  }, [])

  // This effect processes the selected place when it changes
  useEffect(() => {
    if (selectedPlace) {
      if (selectedPlace.formatted_address || selectedPlace.name) {
        // Get coordinates if available
        let coordinates: { lat: number; lng: number } | undefined = undefined

        if (selectedPlace.geometry?.location) {
          coordinates = {
            lat: selectedPlace.geometry.location.lat(),
            lng: selectedPlace.geometry.location.lng(),
          }
        }

        // Use formatted_address if available, otherwise use name
        const addressText = selectedPlace.formatted_address || selectedPlace.name || ""

        // Update parent component state with the selected address and coordinates
        onChange(addressText, coordinates)

        // Update local input value
        setInputValue(addressText)
      }

      // Reset selectedPlace after processing
      setSelectedPlace(null)
    }
  }, [selectedPlace, onChange])

  const handlePlaceChanged = () => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace()
      if (place && (place.formatted_address || place.name)) {
        setSelectedPlace(place)
      }
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)

    // Also update parent state with the typed value (without coordinates)
    onChange(newValue)
  }

  // Add a click handler for the pac-container (Google's dropdown)
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      // Check if the click is on a pac-item (Google's dropdown item)
      const target = e.target as HTMLElement
      if (target.classList.contains("pac-item") || target.parentElement?.classList.contains("pac-item")) {
        // Give time for Google to process the selection
        setTimeout(() => {
          if (autocompleteRef.current) {
            const place = autocompleteRef.current.getPlace()
            if (place && (place.formatted_address || place.name)) {
              setSelectedPlace(place)
            } else {
              // If Google didn't return a place, try to get the selected text
              const input = inputRef.current
              if (input) {
                // Trigger a place changed event after a short delay
                setTimeout(() => {
                  if (autocompleteRef.current) {
                    const place = autocompleteRef.current.getPlace()
                    if (place) {
                      setSelectedPlace(place)
                    }
                  }
                }, 300)
              }
            }
          }
        }, 100)
      }
    }

    document.addEventListener("click", handleDocumentClick)
    return () => {
      document.removeEventListener("click", handleDocumentClick)
    }
  }, [])

  return (
    <div className="relative w-full">
      <div className="relative">
        <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        {isLoaded ? (
          <GoogleAutocomplete
            onLoad={(autocomplete) => {
              autocompleteRef.current = autocomplete
              // Set restrictions to DRC only
              autocomplete.setComponentRestrictions({
                country: ["cd"],
              })
            }}
            onPlaceChanged={handlePlaceChanged}
            options={{
              // No types restriction to include all places
              fields: ["formatted_address", "geometry", "name", "types"],
            }}
          >
            <Input
              ref={inputRef}
              id={id}
              placeholder={placeholder}
              className="pl-10"
              value={inputValue}
              onChange={handleInputChange}
              required={required}
              // Add these event handlers to help with mouse selection
              onBlur={() => {
                // Give time for place_changed event to fire before blur
                setTimeout(() => {
                  if (autocompleteRef.current) {
                    const place = autocompleteRef.current.getPlace()
                    if (place && (place.formatted_address || place.name)) {
                      setSelectedPlace(place)
                    }
                  }
                }, 150)
              }}
            />
          </GoogleAutocomplete>
        ) : (
          <Input
            id={id}
            placeholder={placeholder}
            className="pl-10"
            value={inputValue}
            onChange={handleInputChange}
            required={required}
          />
        )}
      </div>
      {!isLoaded && <div className="text-xs text-gray-500 mt-1">Loading Google Maps...</div>}
    </div>
  )
}
