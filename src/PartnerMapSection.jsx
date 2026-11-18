import { useCallback, useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { FRUIT_TYPES } from '../shared/form-options.js'
import { getJson } from './api.js'

const MALANG_CENTER = [-7.9666, 112.6326]

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

function PartnerMap({ partners, selectedPartnerId, onSelectPartner }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const markerLayerRef = useRef(null)
  const markerRefs = useRef(new Map())
  const [tileError, setTileError] = useState(false)

  useEffect(() => {
    if (!containerRef.current) return undefined

    const map = L.map(containerRef.current, {
      scrollWheelZoom: false,
      zoomControl: true,
    }).setView(MALANG_CENTER, 13)
    const markers = L.layerGroup().addTo(map)
    const tileLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20,
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
      markerRefs.current = new Map()
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    const markerLayer = markerLayerRef.current
    if (!map || !markerLayer) return

    markerLayer.clearLayers()
    markerRefs.current = new Map()
    partners.forEach((partner) => {
      const marker = L.marker(
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
      )
        .bindPopup(L.popup({ maxWidth: 280 }).setContent(createPopupContent(partner)))
        .on('click', () => onSelectPartner(partner.id))
        .addTo(markerLayer)
      markerRefs.current.set(partner.id, marker)
    })
  }, [partners, onSelectPartner])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const marker = markerRefs.current.get(selectedPartnerId)
    if (!selectedPartnerId) {
      map.flyTo(MALANG_CENTER, 13, { duration: 0.6 })
      return
    }
    if (!marker) return

    map.flyTo(marker.getLatLng(), Math.max(map.getZoom(), 15), { duration: 0.6 })
    marker.openPopup()
  }, [selectedPartnerId, partners])

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
    </div>
  )
}

export default function PartnerMapSection({ onRegister }) {
  const [filters, setFilters] = useState({ q: '', fruitType: '' })
  const [partners, setPartners] = useState([])
  const [selectedPartnerId, setSelectedPartnerId] = useState(null)
  const [state, setState] = useState({ status: 'loading', error: '' })

  const selectPartner = useCallback((partnerId) => {
    setSelectedPartnerId(partnerId)
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    let active = true
    const timer = window.setTimeout(async () => {
      setState((current) => ({ ...current, status: 'loading', error: '' }))
      const params = new URLSearchParams()
      if (filters.q.trim()) params.set('q', filters.q.trim())
      if (filters.fruitType) params.set('fruitType', filters.fruitType)

      try {
        const result = await getJson(`/api/partners?${params}`, { signal: controller.signal })
        if (!active) return
        const nextPartners = Array.isArray(result.items) ? result.items : []
        setPartners(nextPartners)
        setSelectedPartnerId((current) => (
          nextPartners.some((partner) => partner.id === current) ? current : null
        ))
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

  const clearFilters = () => setFilters({ q: '', fruitType: '' })
  const hasFilters = Object.values(filters).some(Boolean)

  return (
    <section className="partner-map-section section-pad" id="peta-mitra">
      <div className="page-shell">
        <div className="partner-map-heading">
          <div>
            <p className="eyebrow"><span className="eyebrow-line" /> JARINGAN MITRA SIRKULIT</p>
            <h2>Temukan Mitra Setor Kulit Buah <em>di Sekitarmu</em></h2>
          </div>
          <p>Temukan mitra terverifikasi, lihat jenis kulit buah yang diterima, lalu ajukan penyetoran.</p>
        </div>

        <div className="partner-map-layout">
          <aside className="partner-map-sidebar" aria-label="Daftar mitra">
            <div className="partner-map-filters" aria-label="Pencarian dan filter mitra">
              <label className="partner-map-filter">
                <span>Cari mitra</span>
                <input
                  autoComplete="off"
                  maxLength="100"
                  name="q"
                  onChange={updateFilter}
                  placeholder="Nama mitra"
                  type="search"
                  value={filters.q}
                />
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

            <div className="partner-map-list">
              <p aria-live="polite" className="partner-map-result-count">
                {state.status === 'loading'
                  ? 'Memuat lokasi mitra...'
                  : `${partners.length} mitra ditemukan`}
              </p>
              {state.status === 'error' && <p className="partner-map-error" role="alert">{state.error}</p>}
              {state.status === 'ready' && !partners.length && (
                <p className="partner-map-list-empty" role="status">
                  Tidak ada mitra yang cocok. Coba ubah pencarian atau filter.
                </p>
              )}
              {partners.map((partner) => (
                <article
                  className={`partner-map-card${selectedPartnerId === partner.id ? ' is-selected' : ''}`}
                  key={partner.id}
                >
                  <button
                    aria-pressed={selectedPartnerId === partner.id}
                    className="partner-map-card-select"
                    onClick={() => selectPartner(partner.id)}
                    type="button"
                  >
                    <span className="partner-map-card-name">{partner.name}</span>
                    <span className="partner-map-card-region">Wilayah / kecamatan: {partner.region}</span>
                    <span className="partner-map-card-types">
                      <span>Menerima:</span> {partner.acceptedFruitTypes.join(', ')}
                    </span>
                  </button>
                  <a
                    className="partner-map-card-cta"
                    href="/daftar-limbah"
                    onClick={onRegister}
                  >
                    Ajukan Setor
                  </a>
                </article>
              ))}
            </div>
          </aside>

          <div className="partner-map-results">
            <PartnerMap
              onSelectPartner={selectPartner}
              partners={partners}
              selectedPartnerId={selectedPartnerId}
            />
          </div>
        </div>
      </div>
    </section>
  )
}
