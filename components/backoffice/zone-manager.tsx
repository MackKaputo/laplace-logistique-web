"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { MapPin, Plus, Trash2, Edit, Save, X, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { google } from "google-maps"

// Types
interface Zone {
  id: string
  name: string
  geometry: {
    type: "Polygon"
    coordinates: number[][][]
  }
  createdAt: string
}

declare global {
  interface Window {
    google: typeof google
    initMap: () => void
  }
}

export default function ZoneManager() {
  const [zones, setZones] = useState<Zone[]>([])
  const [isMapLoaded, setIsMapLoaded] = useState(false)
  const [isLoadingMap, setIsLoadingMap] = useState(true)
  const [newZoneName, setNewZoneName] = useState("")
  const [isCreatingZone, setIsCreatingZone] = useState(false)
  const [editingZone, setEditingZone] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const mapRef = useRef<google.maps.Map | null>(null)
  const drawingManagerRef = useRef<google.maps.drawing.DrawingManager | null>(null)
  const polygonsRef = useRef<google.maps.Polygon[]>([])
  const { toast } = useToast()

  // Load zones from localStorage
  useEffect(() => {
    const savedZones = localStorage.getItem("daredare-zones")
    if (savedZones) {
      try {
        setZones(JSON.parse(savedZones))
      } catch (error) {
        console.error("Error loading zones:", error)
      }
    }
  }, [])

  // Save zones to localStorage
  const saveZones = useCallback((updatedZones: Zone[]) => {
    localStorage.setItem("daredare-zones", JSON.stringify(updatedZones))
    setZones(updatedZones)
  }, [])

  // Initialize Google Maps
  useEffect(() => {
    const initializeMap = () => {
      if (typeof window !== "undefined" && window.google && window.google.maps && window.google.maps.drawing) {
        const mapElement = document.getElementById("zone-map")
        if (!mapElement) return

        // Initialize map centered on Kinshasa
        const map = new window.google.maps.Map(mapElement, {
          center: { lat: -4.3276, lng: 15.3136 },
          zoom: 11,
          mapTypeId: window.google.maps.MapTypeId.ROADMAP,
        })

        // Initialize drawing manager
        const drawingManager = new window.google.maps.drawing.DrawingManager({
          drawingMode: null,
          drawingControl: true,
          drawingControlOptions: {
            position: window.google.maps.ControlPosition.TOP_CENTER,
            drawingModes: [window.google.maps.drawing.OverlayType.POLYGON],
          },
          polygonOptions: {
            fillColor: "#2B015F",
            fillOpacity: 0.3,
            strokeWeight: 2,
            strokeColor: "#2B015F",
            clickable: true,
            editable: true,
            zIndex: 1,
          },
        })

        drawingManager.setMap(map)

        // Handle polygon completion
        drawingManager.addListener("polygoncomplete", (polygon: google.maps.Polygon) => {
          if (!newZoneName.trim()) {
            toast({
              title: "Erreur",
              description: "Veuillez entrer un nom pour la zone avant de dessiner.",
              variant: "destructive",
            })
            polygon.setMap(null)
            return
          }

          const path = polygon.getPath()
          const coordinates: number[][] = []

          for (let i = 0; i < path.getLength(); i++) {
            const point = path.getAt(i)
            coordinates.push([point.lng(), point.lat()])
          }

          // Close the polygon by adding the first point at the end
          if (coordinates.length > 0) {
            coordinates.push(coordinates[0])
          }

          const newZone: Zone = {
            id: Date.now().toString(),
            name: newZoneName.trim(),
            geometry: {
              type: "Polygon",
              coordinates: [coordinates],
            },
            createdAt: new Date().toISOString(),
          }

          const updatedZones = [...zones, newZone]
          saveZones(updatedZones)
          polygonsRef.current.push(polygon)

          setNewZoneName("")
          setIsCreatingZone(false)
          drawingManager.setDrawingMode(null)

          toast({
            title: "Zone créée",
            description: `La zone "${newZone.name}" a été créée avec succès.`,
          })
        })

        // Load existing zones on map
        zones.forEach((zone) => {
          const coordinates = zone.geometry.coordinates[0].map((coord) => ({
            lat: coord[1],
            lng: coord[0],
          }))

          const polygon = new window.google.maps.Polygon({
            paths: coordinates,
            fillColor: "#2B015F",
            fillOpacity: 0.3,
            strokeWeight: 2,
            strokeColor: "#2B015F",
            clickable: true,
          })

          polygon.setMap(map)
          polygonsRef.current.push(polygon)

          // Add info window
          const infoWindow = new window.google.maps.InfoWindow({
            content: `<div style="padding: 8px;"><strong>${zone.name}</strong></div>`,
          })

          polygon.addListener("click", () => {
            infoWindow.setPosition(coordinates[0])
            infoWindow.open(map)
          })
        })

        mapRef.current = map
        drawingManagerRef.current = drawingManager
        setIsMapLoaded(true)
        setIsLoadingMap(false)
      }
    }

    // Check if Google Maps is already loaded with drawing library
    if (window.google && window.google.maps && window.google.maps.drawing) {
      console.log("Google Maps already loaded, initializing...")
      initializeMap()
    } else {
      console.log("Waiting for Google Maps to load...")
      // Wait for Google Maps to load
      const checkGoogleMaps = setInterval(() => {
        console.log("Checking Google Maps availability...")
        if (window.google && window.google.maps && window.google.maps.drawing) {
          console.log("Google Maps loaded, initializing map...")
          clearInterval(checkGoogleMaps)
          initializeMap()
        }
      }, 500)

      // Cleanup interval after 15 seconds
      setTimeout(() => {
        clearInterval(checkGoogleMaps)
        if (!isMapLoaded) {
          console.error("Google Maps failed to load after 15 seconds")
          setIsLoadingMap(false)
          toast({
            title: "Erreur de chargement",
            description: "Impossible de charger Google Maps. Veuillez rafraîchir la page.",
            variant: "destructive",
          })
        }
      }, 15000)
    }
  }, [zones, newZoneName, isMapLoaded, toast, saveZones])

  const startCreatingZone = () => {
    if (!newZoneName.trim()) {
      toast({
        title: "Nom requis",
        description: "Veuillez entrer un nom pour la nouvelle zone.",
        variant: "destructive",
      })
      return
    }
    setIsCreatingZone(true)
    if (drawingManagerRef.current) {
      drawingManagerRef.current.setDrawingMode(window.google.maps.drawing.OverlayType.POLYGON)
    }
  }

  const cancelCreatingZone = () => {
    setIsCreatingZone(false)
    setNewZoneName("")
    if (drawingManagerRef.current) {
      drawingManagerRef.current.setDrawingMode(null)
    }
  }

  const deleteZone = (zoneId: string) => {
    const updatedZones = zones.filter((zone) => zone.id !== zoneId)
    saveZones(updatedZones)

    toast({
      title: "Zone supprimée",
      description: "La zone a été supprimée avec succès.",
    })

    // Clear all polygons and reload
    polygonsRef.current.forEach((polygon) => polygon.setMap(null))
    polygonsRef.current = []

    // Reload zones on map
    setTimeout(() => {
      if (mapRef.current) {
        updatedZones.forEach((zone) => {
          const coordinates = zone.geometry.coordinates[0].map((coord) => ({
            lat: coord[1],
            lng: coord[0],
          }))

          const polygon = new window.google.maps.Polygon({
            paths: coordinates,
            fillColor: "#2B015F",
            fillOpacity: 0.3,
            strokeWeight: 2,
            strokeColor: "#2B015F",
            clickable: true,
          })

          polygon.setMap(mapRef.current!)
          polygonsRef.current.push(polygon)

          const infoWindow = new window.google.maps.InfoWindow({
            content: `<div style="padding: 8px;"><strong>${zone.name}</strong></div>`,
          })

          polygon.addListener("click", () => {
            infoWindow.setPosition(coordinates[0])
            infoWindow.open(mapRef.current!)
          })
        })
      }
    }, 100)
  }

  const startEditingZone = (zone: Zone) => {
    setEditingZone(zone.id)
    setEditName(zone.name)
  }

  const saveZoneEdit = (zoneId: string) => {
    if (!editName.trim()) {
      toast({
        title: "Erreur",
        description: "Le nom de la zone ne peut pas être vide.",
        variant: "destructive",
      })
      return
    }

    const updatedZones = zones.map((zone) => (zone.id === zoneId ? { ...zone, name: editName.trim() } : zone))
    saveZones(updatedZones)
    setEditingZone(null)
    setEditName("")

    toast({
      title: "Zone modifiée",
      description: "Le nom de la zone a été mis à jour.",
    })
  }

  const cancelEdit = () => {
    setEditingZone(null)
    setEditName("")
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Gestion des Zones de Livraison
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Zone Creation Form */}
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="zone-name">Nom de la nouvelle zone</Label>
              <Input
                id="zone-name"
                value={newZoneName}
                onChange={(e) => setNewZoneName(e.target.value)}
                placeholder="Ex: Centre-ville, Gombe, etc."
                disabled={isCreatingZone}
              />
            </div>
            <div className="flex gap-2">
              {!isCreatingZone ? (
                <Button onClick={startCreatingZone} className="bg-[#2B015F] hover:bg-[#2B015F]/90">
                  <Plus className="h-4 w-4 mr-2" />
                  Créer Zone
                </Button>
              ) : (
                <Button onClick={cancelCreatingZone} variant="outline">
                  <X className="h-4 w-4 mr-2" />
                  Annuler
                </Button>
              )}
            </div>
          </div>

          {isCreatingZone && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800 text-sm">
                <strong>Mode création activé:</strong> Cliquez sur la carte pour dessiner les contours de la zone "
                {newZoneName}".
              </p>
            </div>
          )}

          {/* Map Container */}
          <div className="border rounded-lg overflow-hidden">
            {isLoadingMap ? (
              <div className="flex items-center justify-center h-[500px] bg-gray-50">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-[#2B015F]" />
                  <p className="text-gray-600">Chargement de la carte...</p>
                  <p className="text-xs text-gray-400 mt-2">
                    {typeof window !== "undefined" && window.google
                      ? "Google Maps API chargé"
                      : "En attente de Google Maps API"}
                  </p>
                </div>
              </div>
            ) : (
              <div id="zone-map" style={{ height: "500px", width: "100%" }} />
            )}
          </div>

          {/* Zones List */}
          <div>
            <h3 className="text-lg font-medium mb-4">Zones Existantes ({zones.length})</h3>
            {zones.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Aucune zone créée pour le moment.</p>
                <p className="text-sm">Créez votre première zone en utilisant le formulaire ci-dessus.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {zones.map((zone) => (
                  <div key={zone.id} className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                    <div className="flex items-center gap-3">
                      <MapPin className="h-5 w-5 text-[#2B015F]" />
                      <div>
                        {editingZone === zone.id ? (
                          <Input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-48"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") saveZoneEdit(zone.id)
                              if (e.key === "Escape") cancelEdit()
                            }}
                          />
                        ) : (
                          <>
                            <h4 className="font-medium">{zone.name}</h4>
                            <p className="text-sm text-gray-500">
                              {zone.geometry.coordinates[0].length - 1} points • Créée le{" "}
                              {new Date(zone.createdAt).toLocaleDateString("fr-FR")}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{zone.geometry.coordinates[0].length - 1} points</Badge>
                      {editingZone === zone.id ? (
                        <>
                          <Button size="sm" onClick={() => saveZoneEdit(zone.id)}>
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={cancelEdit}>
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button size="sm" variant="outline" onClick={() => startEditingZone(zone)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => deleteZone(zone.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
