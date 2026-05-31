'use client'

import { useState, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { Button } from '@/components/ui/button'

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/leaflet/marker-icon-2x.png',
  iconUrl:       '/leaflet/marker-icon.png',
  shadowUrl:     '/leaflet/marker-shadow.png',
})

interface Props {
  onLocationChange:  (lat: number, lng: number) => void
  onClear:           () => void
  externalPosition?: [number, number] | null
}

function FlyTo({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap()
  useEffect(() => {
    map.flyTo([lat, lng], 14, { duration: 1 })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lng])
  return null
}

function ClickHandler({ onLocationChange }: { onLocationChange: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) { onLocationChange(e.latlng.lat, e.latlng.lng) },
  })
  return null
}

export default function CarLocationPicker({ onLocationChange, onClear, externalPosition }: Props) {
  const [position,   setPosition]   = useState<[number, number] | null>(null)
  const [flyTarget,  setFlyTarget]  = useState<{ lat: number; lng: number } | null>(null)
  const prevExtRef = useRef<[number, number] | null>(null)

  // When DAWA fills in coordinates, move the pin and fly the map there
  useEffect(() => {
    if (!externalPosition) return
    if (
      prevExtRef.current?.[0] === externalPosition[0] &&
      prevExtRef.current?.[1] === externalPosition[1]
    ) return
    const pos = externalPosition
    prevExtRef.current = pos
    const id = setTimeout(() => {
      setPosition(pos)
      setFlyTarget({ lat: pos[0], lng: pos[1] })
    }, 0)
    return () => clearTimeout(id)
  }, [externalPosition])

  const handleLocationChange = (lat: number, lng: number) => {
    setPosition([lat, lng])
    onLocationChange(lat, lng)
  }

  const handleClear = () => {
    setPosition(null)
    setFlyTarget(null)
    prevExtRef.current = null
    onClear()
  }

  return (
    <div className="space-y-2">
      <div>
        <p className="text-sm font-medium">Car location (optional)</p>
        <p className="text-xs text-muted-foreground">
          Click on the map to mark where the car is located, or pick an address above to set it automatically
        </p>
      </div>

      <div style={{ height: 350 }} className="rounded-md overflow-hidden border">
        <MapContainer
          center={[56.2639, 9.5018]}
          zoom={6}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onLocationChange={handleLocationChange} />
          {flyTarget && <FlyTo lat={flyTarget.lat} lng={flyTarget.lng} />}
          {position && (
            <Marker
              position={position}
              draggable
              eventHandlers={{
                dragend(e) {
                  const latlng = (e.target as L.Marker).getLatLng()
                  handleLocationChange(latlng.lat, latlng.lng)
                },
              }}
            />
          )}
        </MapContainer>
      </div>

      {position && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            📍 {position[0].toFixed(4)}° N, {position[1].toFixed(4)}° E
          </p>
          <Button type="button" variant="ghost" size="sm" onClick={handleClear}>
            Clear location
          </Button>
        </div>
      )}
    </div>
  )
}
