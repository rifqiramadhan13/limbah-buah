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
const ROLE_COLORS = { supplier: '#2f7b50', processor: '#2878b8', buyer: '#e18a28' }
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
let googleMapsLoader

function loadGoogleMaps() {
  if (!GOOGLE_MAPS_API_KEY) return Promise.resolve(null)
  if (window.google?.maps) return Promise.resolve(window.google.maps)
  if (googleMapsLoader) return googleMapsLoader

  googleMapsLoader = new Promise((resolve, reject) => {
    const callbackName = '__sirkulitGoogleMapsReady'
    window[callbackName] = () => {
      delete window[callbackName]
      resolve(window.google?.maps || null)
    }

    const script = document.createElement('script')
    script.async = true
    script.defer = true
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(GOOGLE_MAPS_API_KEY)}&callback=${callbackName}&v=weekly`
    script.onerror = () => {
      delete window[callbackName]
      googleMapsLoader = null
      reject(new Error('Google Maps gagal dimuat.'))
    }
    document.head.append(script)
  })

  return googleMapsLoader
}

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

function EcosystemMap({ items, focusId }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const markerLayerRef = useRef(null)
  const infoWindowRef = useRef(null)
  const [mapReady, setMapReady] = useState(false)
  const [tileError, setTileError] = useState(false)
  const [mapNotice, setMapNotice] = useState('')

  useEffect(() => {
    if (!containerRef.current) return undefined

    let active = true
    const initializeMap = async () => {
      let googleMaps = null
      try {
        googleMaps = await loadGoogleMaps()
      } catch {
        setMapNotice('Google Maps tidak tersedia saat ini; peta OpenStreetMap digunakan sebagai alternatif.')
      }
      if (!active) return

      if (googleMaps) {
        const map = new googleMaps.Map(containerRef.current, {
          center: MALANG_CENTER,
          zoom: 10,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
        })
        mapRef.current = { provider: 'google', map }
        infoWindowRef.current = new googleMaps.InfoWindow()
        setMapReady(true)
        return
      }

      if (!GOOGLE_MAPS_API_KEY) {
        setMapNotice('Google Maps belum dikonfigurasi; peta OpenStreetMap digunakan sebagai alternatif.')
      }
      const map = L.map(containerRef.current, {
        scrollWheelZoom: false,
        zoomControl: true,
      }).setView([MALANG_CENTER.lat, MALANG_CENTER.lng], 10)
      const markerLayer = L.layerGroup().addTo(map)
      const tiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map)
      tiles.on('tileerror', () => setTileError(true))
      tiles.on('tileload', () => {
        setTileError(false)
        setMapNotice('')
      })
      mapRef.current = { provider: 'leaflet', map }
      markerLayerRef.current = markerLayer
      setMapReady(true)
      window.requestAnimationFrame(() => map.invalidateSize())
    }
    initializeMap()

    return () => {
      active = false
      if (mapRef.current?.provider === 'leaflet') mapRef.current.map.remove()
      if (mapRef.current?.provider === 'google') {
        markerLayerRef.current?.forEach((marker) => marker.setMap(null))
      }
      mapRef.current = null
      markerLayerRef.current = null
      infoWindowRef.current = null
    }
  }, [])

  useEffect(() => {
    const mapInstance = mapRef.current
    const markerLayer = markerLayerRef.current
    if (!mapInstance || !mapReady) return

    const selected = items.find((item) => item.id === focusId)
    if (mapInstance.provider === 'google') {
      markerLayerRef.current?.forEach((marker) => marker.setMap(null))
      const googleMaps = window.google.maps
      const markers = items.map((profile) => {
        const marker = new googleMaps.Marker({
          position: { lat: profile.latitude, lng: profile.longitude },
          title: profile.name,
          icon: {
            path: googleMaps.SymbolPath.CIRCLE,
            scale: 9,
            fillColor: ROLE_COLORS[profile.role] || ROLE_COLORS.processor,
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
          },
          map: mapInstance.map,
        })
        marker.addListener('click', () => {
          infoWindowRef.current.setContent(popupContent(profile))
          infoWindowRef.current.open({ map: mapInstance.map, anchor: marker })
        })
        return marker
      })
      markerLayerRef.current = markers
      if (selected) {
        mapInstance.map.setCenter({ lat: selected.latitude, lng: selected.longitude })
        mapInstance.map.setZoom(15)
        googleMaps.event.trigger(markers[items.indexOf(selected)], 'click')
      } else if (markers.length > 1) {
        const bounds = new googleMaps.LatLngBounds()
        markers.forEach((marker) => bounds.extend(marker.getPosition()))
        mapInstance.map.fitBounds(bounds)
      } else if (markers.length === 1) {
        mapInstance.map.setCenter(markers[0].getPosition())
        mapInstance.map.setZoom(13)
      } else {
        mapInstance.map.setCenter(MALANG_CENTER)
        mapInstance.map.setZoom(10)
      }
      return
    }

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
    ).bindPopup(L.popup({ maxWidth: 340 }).setContent(popupContent(profile))).addTo(markerLayer))

    if (selected) {
      const marker = markers[items.indexOf(selected)]
      map.setView(marker.getLatLng(), 15)
      marker.openPopup()
    } else if (markers.length > 1) {
      map.fitBounds(L.featureGroup(markers).getBounds().pad(0.15), { maxZoom: 12 })
    } else if (markers.length === 1) {
      map.setView(markers[0].getLatLng(), 13)
    } else {
      map.setView(MALANG_CENTER, 10)
    }
  }, [items, focusId, mapReady])

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
      {mapNotice && <p className="partner-map-tile-error" role="status">{mapNotice}</p>}
      {!items.length && (
        <div className="partner-map-empty" role="status">
          <strong>Belum ada lokasi terverifikasi untuk ditampilkan.</strong>
          <span>Lokasi hanya muncul setelah koordinat diverifikasi, pemilik menyetujui publikasi, dan pengelola menyetujui profil.</span>
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

export default function EcosystemMapPanel() {
  const [items, setItems] = useState([])
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
        setItems(Array.isArray(result.items) ? result.items : [])
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
        setState({
          status: 'error',
          error: error instanceof Error ? error.message : 'Data peta tidak dapat dimuat.',
        })
      })
    return () => controller.abort()
  }, [])

  useEffect(() => {
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
  }, [])

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
          <p>Jelajahi lokasi pemasok, mitra pengolah, dan pengguna hasil olahan yang sudah diverifikasi di Malang.</p>
        </div>

        <div className="ecosystem-map-stats" aria-label="Statistik lokasi dari database">
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

        <div className="ecosystem-map-legend" aria-label="Legenda kategori peta">
          {Object.entries(ECOSYSTEM_ROLES).map(([role, label]) => (
            <span className="ecosystem-map-legend-item" key={role}>
              <i className={`ecosystem-map-legend-dot ecosystem-map-legend-${role}`} />
              {label}
            </span>
          ))}
        </div>

        <div className="ecosystem-map-filters" aria-label="Filter peta ekosistem">
          <label className="partner-map-filter">
            <span>Nama, usaha, atau alamat</span>
            <input maxLength="120" name="q" onChange={updateFilter} placeholder="Cari lokasi" type="search" value={filters.q} />
          </label>
          <label className="partner-map-filter">
            <span>Kategori</span>
            <select name="role" onChange={updateFilter} value={filters.role}>
              <option value="">Semua lokasi</option>
              {Object.entries(ECOSYSTEM_ROLES).map(([role, label]) => <option key={role} value={role}>{label}</option>)}
            </select>
          </label>
          <label className="partner-map-filter">
            <span>Jenis limbah</span>
            <select name="wasteType" onChange={updateFilter} value={filters.wasteType}>
              <option value="">Semua jenis limbah</option>
              {FRUIT_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
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
              {filterOptions.districts.map((district) => <option key={district} value={district}>{district}</option>)}
            </select>
          </label>
          <label className="partner-map-filter">
            <span>Kota/Kabupaten</span>
            <select name="city" onChange={updateFilter} value={filters.city}>
              <option value="">Semua kota/kabupaten</option>
              {filterOptions.cities.map((city) => <option key={city} value={city}>{city}</option>)}
            </select>
          </label>
          <button className="button button-outline partner-map-clear" disabled={!hasFilters} onClick={clearFilters} type="button">
            Hapus filter
          </button>
        </div>

        <div className="partner-map-results">
          <p aria-live="polite" className="partner-map-result-count">
            {state.status === 'loading' ? 'Memuat lokasi terverifikasi...' : `${visibleItems.length} lokasi terverifikasi ditemukan`}
          </p>
          {state.status === 'error' && <p className="partner-map-error" role="alert">{state.error}</p>}
          <EcosystemMap focusId={focusId} items={visibleItems} />
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
