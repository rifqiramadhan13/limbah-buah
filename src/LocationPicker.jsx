import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const MALANG_VIEW = [-7.9666, 112.6326]

export default function LocationPicker({ latitude, longitude, onSelect }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const markerRef = useRef(null)
  const onSelectRef = useRef(onSelect)

  useEffect(() => {
    onSelectRef.current = onSelect
  }, [onSelect])

  useEffect(() => {
    if (!containerRef.current) return undefined

    const map = L.map(containerRef.current, {
      scrollWheelZoom: false,
      zoomControl: true,
    }).setView(MALANG_VIEW, 12)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map)
    map.on('click', (event) => {
      onSelectRef.current(event.latlng.lat, event.latlng.lng, 'user_confirmed')
    })
    mapRef.current = map

    const resizeFrame = window.requestAnimationFrame(() => map.invalidateSize())
    return () => {
      window.cancelAnimationFrame(resizeFrame)
      map.remove()
      mapRef.current = null
      markerRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      markerRef.current?.remove()
      markerRef.current = null
      return
    }

    if (markerRef.current) {
      markerRef.current.setLatLng([latitude, longitude])
    } else {
      markerRef.current = L.marker([latitude, longitude], { keyboard: true }).addTo(map)
    }
    map.setView([latitude, longitude], Math.max(map.getZoom(), 15))
  }, [latitude, longitude])

  return (
    <div
      aria-label="Pilih titik lokasi usaha pada peta Malang"
      className="location-picker-map"
      ref={containerRef}
      role="application"
    />
  )
}
