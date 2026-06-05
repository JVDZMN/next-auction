'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
import 'leaflet.markercluster'

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/leaflet/marker-icon-2x.png',
  iconUrl:       '/leaflet/marker-icon.png',
  shadowUrl:     '/leaflet/marker-shadow.png',
})

export interface CarsMapProps {
  cars: {
    id:           string
    year:         number
    brand:        string
    model:        string
    currentPrice: number
    images:       string[]
    km?:          number | null
    latitude:     number
    longitude:    number
  }[]
  locale: string
}

export function CarsMap({ cars, locale }: CarsMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef       = useRef<L.Map | null>(null)
  const clusterRef   = useRef<L.MarkerClusterGroup | null>(null)

  // Initialise map once
  useEffect(() => {
    if (!containerRef.current) return

    const map = L.map(containerRef.current).setView([56.2639, 9.5018], 7)
    mapRef.current = map

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map)

    const cluster = L.markerClusterGroup({ maxClusterRadius: 60 })
    clusterRef.current = cluster
    map.addLayer(cluster)

    // Leaflet needs a size refresh after the container becomes visible in the DOM
    const t = setTimeout(() => map.invalidateSize(), 50)

    return () => {
      clearTimeout(t)
      map.remove()
      mapRef.current  = null
      clusterRef.current = null
    }
  }, [])

  // Update markers when cars prop changes
  useEffect(() => {
    const cluster = clusterRef.current
    const map     = mapRef.current
    if (!cluster || !map) return

    cluster.clearLayers()

    cars.forEach(car => {
      const popup = `
        <a href="/${locale}/cars/${car.id}" style="text-decoration:none;color:inherit;display:block">
          <div style="width:220px;font-family:sans-serif;cursor:pointer">
            ${car.images[0] ? `
              <img src="${car.images[0]}"
                   style="width:100%;height:130px;object-fit:cover;border-radius:6px;margin-bottom:8px" />
            ` : ''}
            <div style="padding:0 2px">
              <p style="font-weight:700;margin:0 0 4px;font-size:14px">
                ${car.year} ${car.brand} ${car.model}
              </p>
              <p style="color:#b45309;font-weight:700;font-size:16px;margin:0 0 4px">
                ${car.currentPrice.toLocaleString('da-DK')} kr
              </p>
              ${car.km ? `
                <p style="color:#888;font-size:12px;margin:0">
                  ${car.km.toLocaleString('da-DK')} km · ${car.year}
                </p>
              ` : ''}
            </div>
          </div>
        </a>
      `
      const marker = L.marker([car.latitude, car.longitude])
      marker.bindPopup(popup, { maxWidth: 240, className: 'car-popup' })
      cluster.addLayer(marker)
    })

    if (cars.length > 0) {
      try {
        map.fitBounds(cluster.getBounds(), { padding: [40, 40], maxZoom: 12 })
      } catch {
        // bounds can fail if all markers are at same point
      }
    }
  }, [cars, locale])

  return <div ref={containerRef} style={{ height: '100%', width: '100%' }} />
}
