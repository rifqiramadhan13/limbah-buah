import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {
  ECOSYSTEM_ROLES,
  FRUIT_TYPES,
  ORGANIC_PRODUCTS,
} from '../shared/form-options.js'
import { getJson } from './api.js'

const MALANG_CENTER = { lat: -7.9666, lng: 112.6326 }
const DEMO_PARTNERS = [
  {
    id: 'demo-klojen',
    role: 'processor',
    name: 'Contoh Mitra Pengolah Klojen',
    city: 'Kota Malang',
    district: 'Klojen',
    latitude: -7.9829,
    longitude: 112.6308,
    wasteTypes: ['Kulit jeruk', 'Kulit pisang'],
  },
  {
    id: 'demo-lowokwaru',
    role: 'processor',
    name: 'Contoh Mitra Pengolah Lowokwaru',
    city: 'Kota Malang',
    district: 'Lowokwaru',
    latitude: -7.9412,
    longitude: 112.617,
    wasteTypes: ['Kulit nanas', 'Kulit mangga'],
  },
  {
    id: 'demo-blimbing',
    role: 'processor',
    name: 'Contoh Mitra Pengolah Blimbing',
    city: 'Kota Malang',
    district: 'Blimbing',
    latitude: -7.9343,
    longitude: 112.6504,
    wasteTypes: ['Kulit pisang', 'Campuran kulit buah'],
  },
  {
    id: 'demo-sukun',
    role: 'processor',
    name: 'Contoh Mitra Pengolah Sukun',
    city: 'Kota Malang',
    district: 'Sukun',
    latitude: -8.0005,
    longitude: 112.6205,
    wasteTypes: ['Kulit jeruk', 'Kulit nanas', 'Kulit mangga'],
  },
].map((profile) => ({
  ...profile,
  source: 'demo',
  province: 'Jawa Timur',
  address: '',
  whatsapp: '',
  productTypes: [],
  productType: '',
  quantityKg: null,
  capacityKg: null,
  processingType: 'Contoh pengolahan limbah kulit buah',
  frequency: '',
  notes: '',
}))
function popupContent(profile) {
  const content = document.createElement('div')
  content.className = 'partner-map-popup'

  const name = document.createElement('h3')
  name.textContent = profile.name
  content.append(name)

  const role = document.createElement('p')
  role.className = 'partner-map-popup-region'
  role.textContent = ECOSYSTEM_ROLES[profile.role] || 'Mitra pengolah limbah organik'
  content.append(role)

  const addDetail = (label, value) => {
    if (!value) return
    const detail = document.createElement('p')
    detail.textContent = `${label}: ${value}`
    content.append(detail)
  }

  addDetail('Alamat', profile.address)
  addDetail('WhatsApp', profile.whatsapp)
  addDetail('Jenis limbah', profile.wasteTypes.join(', '))
  addDetail('Jenis pengolahan', profile.processingType)
  addDetail('Produk', [...profile.productTypes, profile.productType].filter(Boolean).join(', '))
  addDetail('Jumlah tersedia/kebutuhan', profile.quantityKg ? `${profile.quantityKg} kg` : '')
  addDetail('Kapasitas pengolahan', profile.capacityKg ? `${profile.capacityKg} kg` : '')
  addDetail('Frekuensi', profile.frequency)
  addDetail('Keterangan', profile.notes)

  const actions = document.createElement('div')
  actions.className = 'partner-map-popup-actions'
  const detail = document.createElement('a')
  detail.className = 'partner-map-popup-link'
  detail.href = `/peta-ekosistem?location=${encodeURIComponent(profile.id)}`
  detail.textContent = 'Lihat Detail'
  actions.append(detail)

  if (profile.whatsapp) {
    const whatsapp = document.createElement('a')
    whatsapp.className = 'partner-map-popup-link'
    whatsapp.href = `https://wa.me/${profile.whatsapp.replace(/\D/g, '')}`
    whatsapp.target = '_blank'
    whatsapp.rel = 'noreferrer'
    whatsapp.textContent = 'Hubungi WhatsApp'
    actions.append(whatsapp)
  }

  const directions = document.createElement('a')
  directions.className = 'partner-map-popup-link'
  directions.href = `https://www.google.com/maps/dir/?api=1&destination=${profile.latitude},${profile.longitude}`
  directions.target = '_blank'
  directions.rel = 'noreferrer'
  directions.textContent = 'Petunjuk Arah'
  actions.append(directions)
  content.append(actions)
  return content
}

function EcosystemMap({ items, focusId, onSelect }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const markerLayerRef = useRef(null)
  const [mapReady, setMapReady] = useState(false)
  const [tileError, setTileError] = useState(false)

  useEffect(() => {
    if (!containerRef.current) return undefined

    const map = L.map(containerRef.current, {
      scrollWheelZoom: false,
      zoomControl: true,
    }).setView([MALANG_CENTER.lat, MALANG_CENTER.lng], 13)
    const markerLayer = L.layerGroup().addTo(map)
    const tiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map)
    tiles.on('tileerror', () => setTileError(true))
    tiles.on('tileload', () => {
      setTileError(false)
    })
    mapRef.current = { provider: 'leaflet', map }
    markerLayerRef.current = markerLayer
    setMapReady(true)
    const resizeFrame = window.requestAnimationFrame(() => map.invalidateSize())
    const observer = new ResizeObserver(() => map.invalidateSize())
    observer.observe(containerRef.current)

    return () => {
      window.cancelAnimationFrame(resizeFrame)
      observer.disconnect()
      map.remove()
      mapRef.current = null
      markerLayerRef.current = null
    }
  }, [])

  useEffect(() => {
    const mapInstance = mapRef.current
    const markerLayer = markerLayerRef.current
    if (!mapInstance || !mapReady) return

    const selected = items.find((item) => item.id === focusId)
    const map = mapInstance.map
    markerLayer.clearLayers()
    const markers = items.map((profile) => L.marker(
      [profile.latitude, profile.longitude],
      {
        alt: profile.name,
        title: profile.name,
        keyboard: true,
        icon: L.divIcon({
          className: `ecosystem-map-marker ecosystem-map-marker-${profile.role}`,
          html: '<span></span>',
          iconSize: [30, 38],
          iconAnchor: [15, 36],
          popupAnchor: [0, -32],
        }),
      },
    )
      .bindPopup(L.popup({ maxWidth: 340 }).setContent(popupContent(profile)))
      .on('click', () => onSelect(profile.id))
      .addTo(markerLayer))

    if (selected) {
      const marker = markers[items.indexOf(selected)]
      map.setView(marker.getLatLng(), 15)
      marker.openPopup()
    } else if (markers.length > 1) {
      map.fitBounds(L.featureGroup(markers).getBounds().pad(0.15), { maxZoom: 13 })
    } else if (markers.length === 1) {
      map.setView(markers[0].getLatLng(), 13)
    } else {
      map.setView(MALANG_CENTER, 13)
    }
  }, [items, focusId, mapReady, onSelect])

  return (
    <div className="partner-map-wrap">
      <div
        aria-label="Peta interaktif ekosistem limbah organik Malang"
        className="partner-map-canvas"
        ref={containerRef}
        role="application"
      />
      {tileError && (
        <p className="partner-map-tile-error" role="status">
          Peta dasar belum dapat dimuat. Periksa koneksi internet.
        </p>
      )}
      {!items.length && (
        <div className="partner-map-empty" role="status">
          <strong>Tidak ada lokasi mitra yang cocok.</strong>
          <span>Coba ubah pencarian atau filter jenis kulit buah.</span>
        </div>
      )}
    </div>
  )
}

function DirectoryCard({ profile }) {
  const description = profile.role === 'supplier'
    ? `Tersedia: ${profile.wasteTypes.join(', ')} · ${profile.quantityKg} kg`
    : profile.role === 'processor'
      ? `Mengolah: ${profile.wasteTypes.join(', ')} · Kapasitas ${profile.capacityKg} kg`
      : `Membutuhkan: ${profile.productType} · ${profile.quantityKg} kg`

  return (
    <article className="ecosystem-directory-card">
      <div className="ecosystem-directory-card-top">
        <span className={`ecosystem-role-badge ecosystem-role-${profile.role}`}>
          {ECOSYSTEM_ROLES[profile.role]}
        </span>
        <span className="ecosystem-directory-location">{profile.city}, {profile.province}</span>
      </div>
      <h3>{profile.name}</h3>
      <p className="ecosystem-directory-details">{description}</p>
      <p className="ecosystem-directory-frequency">Frekuensi: {profile.frequency}</p>
      {profile.mapLocationId && (
        <a
          className="ecosystem-directory-map-link"
          href={`/peta-ekosistem?location=${encodeURIComponent(profile.mapLocationId)}`}
        >
          Lihat lokasi di peta
        </a>
      )}
      <a
        className="button button-outline ecosystem-contact-link"
        href={`https://wa.me/${profile.whatsapp.replace(/\D/g, '')}`}
        rel="noreferrer"
        target="_blank"
      >
        Hubungi via WhatsApp
      </a>
    </article>
  )
}

function PartnerCard({ profile, selected, onSelect }) {
  const acceptedTypes = profile.wasteTypes.length
    ? profile.wasteTypes.join(', ')
    : 'Belum dicantumkan'

  return (
    <article className={`ecosystem-partner-card${selected ? ' is-selected' : ''}`}>
      <button
        aria-pressed={selected}
        className="ecosystem-partner-card-select"
        onClick={() => onSelect(profile.id)}
        type="button"
      >
        <span className="ecosystem-partner-card-name">{profile.name}</span>
        <span className="ecosystem-partner-card-district">
          {profile.district ? `Kecamatan ${profile.district}` : 'Kecamatan belum dicantumkan'}
        </span>
        <span className="ecosystem-partner-card-waste"><b>Menerima:</b> {acceptedTypes}</span>
      </button>
      {profile.whatsapp && (
        <a
          className="ecosystem-partner-card-contact"
          href={`tel:${profile.whatsapp.replace(/[^\d+]/g, '')}`}
        >
          Telepon: {profile.whatsapp}
        </a>
      )}
      {profile.googleMapsUrl && (
        <a
          className="ecosystem-partner-card-contact"
          href={profile.googleMapsUrl}
          rel="noreferrer"
          target="_blank"
        >
          Buka Google Maps
        </a>
      )}
      <a className="ecosystem-partner-card-action" href="/daftar-limbah">
        Ajukan Setor
      </a>
    </article>
  )
}

export default function EcosystemMapPanel() {
  const [items, setItems] = useState(DEMO_PARTNERS)
  const [dataSource, setDataSource] = useState('demo')
  const [apiSource, setApiSource] = useState('')
  const [selectedItemId, setSelectedItemId] = useState('')
  const [directory, setDirectory] = useState([])
  const [stats, setStats] = useState(null)
  const [filters, setFilters] = useState({
    q: '',
    role: '',
    wasteType: '',
    processingType: '',
    productType: '',
    district: '',
    city: '',
  })
  const [filterOptions, setFilterOptions] = useState({
    districts: [],
    cities: [],
    processingTypes: [],
    productTypes: ORGANIC_PRODUCTS,
  })
  const [state, setState] = useState({ status: 'loading', error: '' })
  const [directoryState, setDirectoryState] = useState({ status: 'loading', error: '' })
  const focusId = new URLSearchParams(window.location.search).get('location') || ''

  useEffect(() => {
    const controller = new AbortController()
    getJson('/api/ecosystem/map', { signal: controller.signal })
      .then((result) => {
        setApiSource(result.source || 'database')
        if (result.source === 'published-reference-locations') {
          setDirectoryState({ status: 'ready', error: '' })
        }
        const apiItems = Array.isArray(result.items) ? result.items : []
        setItems(apiItems)
        setDataSource('api')
        setSelectedItemId('')
        setStats(result.stats || null)
        const options = result.filters || {}
        setFilterOptions((current) => ({
          ...current,
          ...options,
          productTypes: options.productTypes?.length ? options.productTypes : ORGANIC_PRODUCTS,
        }))
        setState({ status: 'ready', error: '' })
      })
      .catch((error) => {
        if (error?.name === 'AbortError') return
        setApiSource('unavailable')
        setDirectoryState({ status: 'ready', error: '' })
        setItems(DEMO_PARTNERS)
        setDataSource('demo')
        setSelectedItemId('')
        setState({
          status: 'error',
          error: error instanceof Error ? error.message : 'Data peta tidak dapat dimuat.',
        })
      })
    return () => controller.abort()
  }, [])

  useEffect(() => {
    if (apiSource !== 'database') return undefined
    const controller = new AbortController()
    getJson('/api/ecosystem/directory', { signal: controller.signal })
      .then((result) => {
        setDirectory(Array.isArray(result.items) ? result.items : [])
        setDirectoryState({ status: 'ready', error: '' })
      })
      .catch((error) => {
        if (error?.name === 'AbortError') return
        setDirectoryState({
          status: 'error',
          error: error instanceof Error ? error.message : 'Direktori tidak dapat dimuat.',
        })
      })
    return () => controller.abort()
  }, [apiSource])

  const updateFilter = (event) => {
    const { name, value } = event.target
    setFilters((current) => ({ ...current, [name]: value }))
  }
  const clearFilters = () => setFilters({
    q: '',
    role: '',
    wasteType: '',
    processingType: '',
    productType: '',
    district: '',
    city: '',
  })
  const hasFilters = Object.values(filters).some(Boolean)
  const query = filters.q.trim().toLowerCase()
  const visibleItems = items.filter((item) => {
    if (filters.role && item.role !== filters.role) return false
    if (filters.wasteType && !item.wasteTypes.includes(filters.wasteType)) return false
    if (filters.processingType && !item.processingType.toLowerCase().includes(filters.processingType.toLowerCase())) return false
    if (filters.productType && item.productType !== filters.productType
      && !item.productTypes.includes(filters.productType)) return false
    if (filters.district && item.district !== filters.district) return false
    if (filters.city && item.city !== filters.city) return false
    return !query || [item.name, item.address, item.city, item.district]
      .filter(Boolean).join(' ').toLowerCase().includes(query)
  })
  const visiblePartners = visibleItems.filter((item) => item.role === 'processor')
  const visibleDirectory = directory.filter((profile) => {
    if (filters.role && profile.role !== filters.role) return false
    if (filters.wasteType && !profile.wasteTypes.includes(filters.wasteType)) return false
    if (filters.productType && profile.productType !== filters.productType
      && !profile.productTypes.includes(filters.productType)) return false
    return !query || [
      profile.name, profile.city, profile.province, profile.productType,
      ...profile.wasteTypes, ...profile.productTypes,
    ].filter(Boolean).join(' ').toLowerCase().includes(query)
  })

  return (
    <div className="ecosystem-map-page-content">
      <section className="ecosystem-map-panel" aria-labelledby="ecosystem-map-title">
        <div className="ecosystem-map-heading">
          <div>
            <p className="eyebrow"><span className="eyebrow-line" /> PETA DIGITAL</p>
            <h1 id="ecosystem-map-title">Peta Ekosistem Limbah Organik <em>Malang</em></h1>
          </div>
          <p>Temukan mitra pengolah limbah kulit buah di wilayah Kota Malang.</p>
        </div>

        {dataSource === 'api' && (
          <div className="ecosystem-map-stats" aria-label="Statistik lokasi peta">
            {[
              ['Pemasok limbah', stats?.suppliers],
              ['Mitra pengolah', stats?.processors],
              ['Pengguna hasil olahan', stats?.buyers],
              ['Total terdaftar', stats?.totalRegistered],
              ['Lokasi terverifikasi', stats?.verifiedLocations],
            ].map(([label, count]) => (
              <div className="ecosystem-map-stat" key={label}>
                <strong>{state.status === 'loading' ? '—' : count ?? 0}</strong>
                <span>{label}</span>
              </div>
            ))}
          </div>
        )}

        <div className="ecosystem-map-split">
          <aside className="ecosystem-partner-sidebar" aria-label="Daftar mitra pengolah">
            <div className="ecosystem-partner-filters">
              <label className="partner-map-filter">
                <span>Cari mitra</span>
                <input maxLength="120" name="q" onChange={updateFilter} placeholder="Nama atau kecamatan" type="search" value={filters.q} />
              </label>
              <label className="partner-map-filter">
                <span>Jenis kulit buah</span>
                <select name="wasteType" onChange={updateFilter} value={filters.wasteType}>
                  <option value="">Semua jenis</option>
                  {FRUIT_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
                </select>
              </label>
              <details className="ecosystem-map-advanced-filters">
                <summary>Filter lanjutan</summary>
                <div className="ecosystem-map-advanced-fields">
                  <label className="partner-map-filter">
                    <span>Kategori mitra</span>
                    <select name="role" onChange={updateFilter} value={filters.role}>
                      <option value="">Semua kategori</option>
                      {Object.entries(ECOSYSTEM_ROLES).map(([role, label]) => <option key={role} value={role}>{label}</option>)}
                    </select>
                  </label>
                  <label className="partner-map-filter">
                    <span>Jenis pengolahan</span>
                    <select name="processingType" onChange={updateFilter} value={filters.processingType}>
                      <option value="">Semua jenis pengolahan</option>
                      {filterOptions.processingTypes.map((type) => <option key={type} value={type}>{type}</option>)}
                    </select>
                  </label>
                  <label className="partner-map-filter">
                    <span>Produk hasil olahan</span>
                    <select name="productType" onChange={updateFilter} value={filters.productType}>
                      <option value="">Semua produk</option>
                      {filterOptions.productTypes.map((type) => <option key={type} value={type}>{type}</option>)}
                    </select>
                  </label>
                  <label className="partner-map-filter">
                    <span>Kecamatan</span>
                    <select name="district" onChange={updateFilter} value={filters.district}>
                      <option value="">Semua kecamatan</option>
                      {[...new Set([...filterOptions.districts, ...DEMO_PARTNERS.map((item) => item.district)])]
                        .map((district) => <option key={district} value={district}>{district}</option>)}
                    </select>
                  </label>
                  <label className="partner-map-filter">
                    <span>Kota/Kabupaten</span>
                    <select name="city" onChange={updateFilter} value={filters.city}>
                      <option value="">Semua kota/kabupaten</option>
                      {[...new Set([...filterOptions.cities, 'Kota Malang'])]
                        .map((city) => <option key={city} value={city}>{city}</option>)}
                    </select>
                  </label>
                </div>
              </details>
              <button className="button button-outline partner-map-clear" disabled={!hasFilters} onClick={clearFilters} type="button">
                Hapus filter
              </button>
            </div>

            <div className="ecosystem-partner-list">
              <p aria-live="polite" className="partner-map-result-count">
                {dataSource === 'demo'
                  ? `${visiblePartners.length} contoh mitra ditampilkan`
                  : state.status === 'loading' ? 'Memuat mitra...' : `${visiblePartners.length} mitra ditemukan`}
              </p>
              {dataSource === 'demo' && (
                <p className="ecosystem-demo-notice" role="status">
                  Contoh data simulasi di Kota Malang; bukan mitra terverifikasi.
                </p>
              )}
              {state.status === 'error' && <p className="partner-map-error" role="alert">{state.error} Menampilkan contoh data simulasi.</p>}
              {state.status === 'ready' && !visiblePartners.length && (
                <p className="ecosystem-directory-empty" role="status">Tidak ada mitra yang cocok dengan pencarian atau filter.</p>
              )}
              {visiblePartners.map((profile) => (
                <PartnerCard
                  key={profile.id}
                  onSelect={setSelectedItemId}
                  profile={profile}
                  selected={(selectedItemId || focusId) === profile.id}
                />
              ))}
            </div>
          </aside>

          <div className="partner-map-results ecosystem-map-results">
            <p aria-live="polite" className="partner-map-result-count">
              {state.status === 'loading' ? 'Memuat peta...' : `${visibleItems.length} lokasi ditampilkan`}
            </p>
            <div className="ecosystem-map-legend" aria-label="Legenda kategori peta">
              {Object.entries(ECOSYSTEM_ROLES).map(([role, label]) => (
                <span className="ecosystem-map-legend-item" key={role}>
                  <i className={`ecosystem-map-legend-dot ecosystem-map-legend-${role}`} />
                  {label}
                </span>
              ))}
            </div>
            <EcosystemMap
              focusId={selectedItemId || focusId}
              items={visibleItems}
              onSelect={setSelectedItemId}
            />
          </div>
        </div>
      </section>

      <section className="ecosystem-directory" aria-labelledby="ecosystem-directory-title">
        <div className="ecosystem-directory-heading">
          <div>
            <p className="eyebrow"><span className="eyebrow-line" /> DIREKTORI EKOSISTEM</p>
            <h2 id="ecosystem-directory-title">Temukan mitra, <em>mulai kerja sama.</em></h2>
          </div>
          <p>Profil ditampilkan setelah diverifikasi dan pemilik menyetujui publikasi kontak.</p>
        </div>
        <p aria-live="polite" className="partner-map-result-count">
          {directoryState.status === 'loading' ? 'Memuat direktori...' : `${visibleDirectory.length} profil ditemukan`}
        </p>
        {directoryState.status === 'error' && <p className="partner-map-error" role="alert">{directoryState.error}</p>}
        {directoryState.status === 'ready' && !visibleDirectory.length && (
          <p className="ecosystem-directory-empty" role="status">
            Belum ada profil publik yang cocok. Profil perlu diverifikasi dan mendapat persetujuan publikasi.
          </p>
        )}
        {visibleDirectory.length > 0 && (
          <div className="ecosystem-directory-grid">
            {visibleDirectory.map((profile) => <DirectoryCard key={profile.id} profile={profile} />)}
          </div>
        )}
      </section>
    </div>
  )
}
