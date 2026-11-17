import { createHash } from 'node:crypto'

function normalizeAddress(address) {
  return address.normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase()
}

export function getCachedGeocode(database, address) {
  const addressHash = createHash('sha256').update(normalizeAddress(address)).digest('hex')
  const cached = database.prepare(`
    SELECT latitude, longitude, location_status AS status,
      location_type AS locationType, formatted_address AS formattedAddress
    FROM geocode_cache
    WHERE address_hash = ?
  `).get(addressHash)
  return cached || null
}

export async function geocodeAddress(database, address, apiKey = process.env.GOOGLE_GEOCODING_API_KEY) {
  if (!apiKey) return { status: 'not_configured' }

  const addressHash = createHash('sha256').update(normalizeAddress(address)).digest('hex')
  const cached = getCachedGeocode(database, address)
  if (cached) return cached

  const params = new URLSearchParams({ address, region: 'id', key: apiKey })
  const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?${params}`, {
    signal: AbortSignal.timeout(10000),
  })
  if (!response.ok) {
    throw new Error(`Layanan geocoding merespons HTTP ${response.status}.`)
  }

  const result = await response.json()
  if (result.status === 'ZERO_RESULTS') {
    database.prepare(`
      INSERT INTO geocode_cache (address_hash, location_status)
      VALUES (?, 'not_found')
    `).run(addressHash)
    return { status: 'not_found' }
  }
  if (result.status !== 'OK' || !Array.isArray(result.results) || !result.results[0]) {
    throw new Error(`Layanan geocoding gagal: ${result.error_message || result.status || 'respons tidak valid'}.`)
  }

  const match = result.results[0]
  const locationType = match.geometry?.location_type || null
  const coordinates = match.geometry?.location
  const exactMatch = locationType === 'ROOFTOP'
    && Number.isFinite(coordinates?.lat)
    && Number.isFinite(coordinates?.lng)
  const status = exactMatch ? 'google_verified' : 'unverified'
  const latitude = exactMatch ? coordinates.lat : null
  const longitude = exactMatch ? coordinates.lng : null
  const formattedAddress = match.formatted_address || null

  database.prepare(`
    INSERT INTO geocode_cache (
      address_hash, latitude, longitude, location_status, location_type, formatted_address
    ) VALUES (?, ?, ?, ?, ?, ?)
  `).run(addressHash, latitude, longitude, status, locationType, formattedAddress)

  return { latitude, longitude, status, locationType, formattedAddress }
}
