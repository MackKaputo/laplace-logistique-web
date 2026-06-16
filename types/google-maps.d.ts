/// <reference types="@types/googlemaps" />

declare global {
  interface Window {
    google: {
      maps: {
        places: {
          Autocomplete: new (
            input: HTMLInputElement,
            options?: google.maps.places.AutocompleteOptions,
          ) => google.maps.places.Autocomplete
        }
      }
    }
  }
}

export {}
