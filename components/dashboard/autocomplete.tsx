"use client"

import { useRef } from "react"
import { Autocomplete } from "@react-google-maps/api"
import type { google } from "google-maps"

// No longer importing LoadScript directly
// Instead, this component should be used inside GoogleMapsProvider

export default function PlaceAutocomplete() {
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)

  const handlePlaceChanged = () => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace()
      console.log("Selected Place:", place)
    }
  }

  return (
    <Autocomplete
      onLoad={(autocomplete) => (autocompleteRef.current = autocomplete)}
      onPlaceChanged={handlePlaceChanged}
    >
      <input type="text" placeholder="Search a place" style={{ width: "100%", height: "40px", padding: "10px" }} />
    </Autocomplete>
  )
}
