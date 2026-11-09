import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { FRUIT_TYPES } from '../shared/form-options.js'
import { getJson } from './api.js'

function googleMapsLink(partner) {
  if (partner.googleMapsUrl) return partner.googleMapsUrl
  const query = `${partner.latitude},${partner.longitude}`
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
}

function createPopupContent(partner) {
  const content = document.createElement('div')
  content.className = 'partner-map-popup'

  const name = document.createElement('h3')
  name.textContent = partner.name
  content.append(name)

  const region = document.createElement('p')
  region.className = 'partner-map-popup-region'
  region.textContent = partner.region
  content.append(region)

  const address = document.createElement('p')
  address.textContent = partner.address
  content.append(address)

  const acceptedTypes = document.createElement('p')
  acceptedTypes.textContent = `Menerima: ${partner.acceptedFruitTypes.join(', ')}`
  content.append(acceptedTypes)

  if (partner.capacityKg !== null && partner.capacityKg !== undefined) {
    const capacity = document.createElement('p')
    capacity.textContent = `Kapasitas: ${new Intl.NumberFormat('id-ID').format(partner.capacityKg)} kg`
    content.append(capacity)
  }

  const locationLink = document.createElement('a')
  locationLink.className = 'partner-map-popup-link'
  locationLink.href = googleMapsLink(partner)
  locationLink.target = '_blank'
  locationLink.rel = 'noreferrer'
  locationLink.textContent = 'Lihat Lokasi'
  content.append(locationLink)

  return content
}

function PartnerMap({ partners }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const markerLayerRef = useRef(null)
  const [tileError, setTileError] = useState(false)

  useEffect(() => {
    if (!containerRef.current) return undefined

    const map = L.map(containerRef.current, {
      scrollWheelZoom: false,
      zoomControl: true,
    }).setView([-2.5, 118], 4)
    const markers = L.layerGroup().addTo(map)
    const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map)

    tileLayer.on('tileerror', () => setTileError(true))
    tileLayer.on('tileload', () => setTileError(false))
    mapRef.current = map
    markerLayerRef.current = markers

    const resizeFrame = window.requestAnimationFrame(() => map.invalidateSize())
    return () => {
      window.cancelAnimationFrame(resizeFrame)
      map.remove()
      mapRef.current = null
      markerLayerRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    const markerLayer = markerLayerRef.current
    if (!map || !markerLayer) return

    markerLayer.clearLayers()
    const markers = partners.map((partner) => L.marker(
      [partner.latitude, partner.longitude],
      {
        alt: partner.name,
        icon: L.divIcon({
          className: 'partner-map-marker',
          html: '<span></span>',
          iconSize: [30, 38],
          iconAnchor: [15, 36],
          popupAnchor: [0, -32],
        }),
        keyboard: true,
        title: partner.name,
      },
    ).bindPopup(L.popup({ maxWidth: 280 }).setContent(createPopupContent(partner))).addTo(markerLayer))

    if (markers.length === 1) {
      map.setView(markers[0].getLatLng(), 13)
    } else if (markers.length > 1) {
      map.fitBounds(L.featureGroup(markers).getBounds().pad(0.15), { maxZoom: 12 })
    }
  }, [partners])

  return (
    <div className="partner-map-wrap">
      <div
        aria-label="Peta interaktif lokasi mitra pengolah SIRKULIT"
        className="partner-map-canvas"
        ref={containerRef}
        role="application"
      />
      {tileError && (
        <p className="partner-map-tile-error" role="status">
          Peta dasar belum dapat dimuat. Periksa koneksi internet; data mitra tetap tersedia pada hasil pencarian.
        </p>
      )}
      {!partners.length && (
        <div className="partner-map-empty" role="status">
          <strong>Belum ada lokasi mitra yang dapat ditampilkan.</strong>
          <span>Lokasi hanya muncul setelah mitra diverifikasi dan diizinkan untuk dipublikasikan.</span>
        </div>
      )}
    </div>
  )
}

export default function PartnerMapSection() {
  const [filters, setFilters] = useState({ q: '', region: '', fruitType: '' })
  const [regions, setRegions] = useState([])
  const [partners, setPartners] = useState([])
  const [state, setState] = useState({ status: 'loading', error: '' })

  useEffect(() => {
    const controller = new AbortController()
    let active = true
    const timer = window.setTimeout(async () => {
      setState((current) => ({ ...current, status: 'loading', error: '' }))
      const params = new URLSearchParams()
      if (filters.q.trim()) params.set('q', filters.q.trim())
      if (filters.region) params.set('region', filters.region)
      if (filters.fruitType) params.set('fruitType', filters.fruitType)

      try {
        const result = await getJson(`/api/partners?${params}`, { signal: controller.signal })
        if (!active) return
        setPartners(Array.isArray(result.items) ? result.items : [])
        setRegions(Array.isArray(result.regions) ? result.regions : [])
        setState({ status: 'ready', error: '' })
      } catch (error) {
        if (!active || error?.name === 'AbortError') return
        setState({
          status: 'error',
          error: error instanceof Error ? error.message : 'Data mitra tidak dapat dimuat.',
        })
      }
    }, 180)

    return () => {
      active = false
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [filters])

  const updateFilter = (event) => {
    const { name, value } = event.target
    setFilters((current) => ({ ...current, [name]: value }))
  }

  const clearFilters = () => setFilters({ q: '', region: '', fruitType: '' })
  const hasFilters = Object.values(filters).some(Boolean)

  return (
    <section className="partner-map-section section-pad" id="peta-mitra">
      <div className="page-shell">
        <div className="partner-map-heading">
          <div>
            <p className="eyebrow"><span className="eyebrow-line" /> JARINGAN MITRA SIRKULIT</p>
            <h2>Temukan Mitra Pengolah Limbah <em>di Sekitarmu</em></h2>
          </div>
          <p>Jelajahi lokasi mitra SIRKULIT yang telah terdaftar dan terverifikasi untuk menemukan tempat pengolahan limbah kulit buah.</p>
        </div>

        <div className="partner-map-filters" aria-label="Pencarian dan filter mitra">
          <label className="partner-map-filter">
            <span>Nama mitra</span>
            <input
              autoComplete="off"
              maxLength="100"
              name="q"
              onChange={updateFilter}
              placeholder="Cari nama mitra"
              type="search"
              value={filters.q}
            />
          </label>
          <label className="partner-map-filter">
            <span>Wilayah</span>
            <select name="region" onChange={updateFilter} value={filters.region}>
              <option value="">Semua wilayah</option>
              {regions.map((region) => <option key={region} value={region}>{region}</option>)}
            </select>
          </label>
          <label className="partner-map-filter">
            <span>Jenis kulit buah</span>
            <select name="fruitType" onChange={updateFilter} value={filters.fruitType}>
              <option value="">Semua jenis</option>
              {FRUIT_TYPES.map((fruitType) => <option key={fruitType} value={fruitType}>{fruitType}</option>)}
            </select>
          </label>
          <button
            className="button button-outline partner-map-clear"
            disabled={!hasFilters}
            onClick={clearFilters}
            type="button"
          >
            Hapus filter
          </button>
        </div>

        <div className="partner-map-results">
          <p aria-live="polite" className="partner-map-result-count">
            {state.status === 'loading'
              ? 'Memuat lokasi mitra...'
              : `${partners.length} lokasi mitra ditemukan`}
          </p>
          {state.status === 'error' && <p className="partner-map-error" role="alert">{state.error}</p>}
          <PartnerMap partners={partners} />
        </div>
      </div>
    </section>
  )
}
