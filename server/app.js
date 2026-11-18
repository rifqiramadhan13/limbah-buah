import { randomBytes, timingSafeEqual } from 'node:crypto'
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, isAbsolute, relative, resolve } from 'node:path'
import {
  validateContactMessage,
  validateEcosystemRegistration,
  validatePartner,
  validateWasteRegistration,
} from './validation.js'
import { geocodeAddress, getCachedGeocode } from './geocoding.js'
import { ECOSYSTEM_ROLES, FRUIT_TYPES, ORGANIC_PRODUCTS } from '../shared/form-options.js'

const MAX_BODY_BYTES = 16 * 1024
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000
const RATE_LIMIT_MAX_REQUESTS = 8
const REGISTRATION_STATUS_DETAILS = {
  pending_review: {
    label: 'Menunggu Peninjauan',
    message: 'Pengelola sedang meninjau pendaftaran Anda.',
  },
  verified: {
    label: 'Disetujui',
    message: 'Pendaftaran Anda telah disetujui. Profil publik hanya ditampilkan jika Anda menyetujui publikasi.',
  },
  rejected: {
    label: 'Belum Disetujui',
    message: 'Pendaftaran belum disetujui. Silakan hubungi pengelola melalui kanal resmi untuk informasi selanjutnya.',
  },
}
const STATIC_CONTENT_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
}
const REGISTRATION_FIELDS = `
  id, registration_code AS registrationCode, full_name AS fullName,
  business_name AS businessName, whatsapp, email, producer_type AS producerType,
  province, city, district, village, address, fruit_type AS fruitType,
  quantity_kg AS quantityKg, production_frequency AS productionFrequency,
  waste_condition AS wasteCondition, notes, consent_at AS consentAt,
  status, created_at AS createdAt
`
const CONTACT_FIELDS = `
  id, message_code AS messageCode, name, email, whatsapp, category,
  message, status, created_at AS createdAt
`
const PARTNER_FIELDS = `
  id, name, address, region, latitude, longitude,
  google_maps_url AS googleMapsUrl,
  accepted_fruit_types AS acceptedFruitTypesJson,
  capacity_kg AS capacityKg,
  verification_status AS verificationStatus,
  is_location_public AS isLocationPublic,
  created_at AS createdAt, updated_at AS updatedAt
`
const ECOSYSTEM_FIELDS = `
  id, registration_code AS registrationCode, role,
  full_name AS fullName, business_name AS businessName,
  whatsapp, email, province, city, district, village, address,
  producer_type AS producerType, waste_types AS wasteTypesJson,
  product_types AS productTypesJson, product_type AS productType,
  processing_type AS processingType,
  quantity_kg AS quantityKg, capacity_kg AS capacityKg,
  frequency, waste_condition AS wasteCondition, notes,
  consent_at AS consentAt, directory_consent_at AS directoryConsentAt,
  latitude, longitude, location_status AS locationStatus,
  map_consent_at AS mapConsentAt, status, created_at AS createdAt
`
const SEED_LOCATION_FIELDS = `
  id, seed_key AS seedKey, name, address, whatsapp, province, city, district,
  google_maps_url AS googleMapsUrl, processing_type AS processingType,
  latitude, longitude, location_status AS locationStatus,
  verification_status AS verificationStatus,
  is_location_public AS isLocationPublic, notes, created_at AS createdAt
`

function sendJson(response, status, payload) {
  response.writeHead(status, {
    'Cache-Control': 'no-store',
    'Content-Type': 'application/json; charset=utf-8',
    'X-Content-Type-Options': 'nosniff',
  })
  response.end(JSON.stringify(payload))
}

async function readJson(request) {
  if (!request.headers['content-type']?.toLowerCase().startsWith('application/json')) {
    return { error: { status: 415, message: 'Gunakan format application/json.' } }
  }

  const contentLength = Number(request.headers['content-length'] || 0)
  if (contentLength > MAX_BODY_BYTES) {
    return { error: { status: 413, message: 'Ukuran formulir terlalu besar.' } }
  }

  const chunks = []
  let size = 0
  for await (const chunk of request) {
    size += chunk.length
    if (size > MAX_BODY_BYTES) {
      return { error: { status: 413, message: 'Ukuran formulir terlalu besar.' } }
    }
    chunks.push(chunk)
  }

  try {
    return { value: JSON.parse(Buffer.concat(chunks).toString('utf8')) }
  } catch {
    return { error: { status: 400, message: 'Format formulir tidak valid.' } }
  }
}

function createReferenceCode(prefix) {
  return `${prefix}-${new Date().getUTCFullYear()}-${randomBytes(4).toString('hex').toUpperCase()}`
}

function isAuthorized(request, configuredKey) {
  const authorization = request.headers.authorization || ''
  const suppliedKey = authorization.startsWith('Bearer ') ? authorization.slice(7) : ''
  if (!configuredKey || Buffer.byteLength(configuredKey) < 32 || suppliedKey.length !== configuredKey.length) {
    return false
  }
  return timingSafeEqual(Buffer.from(suppliedKey), Buffer.from(configuredKey))
}

function requireAdmin(request, response, configuredKey) {
  if (!configuredKey || Buffer.byteLength(configuredKey) < 32) {
    sendJson(response, 503, { error: 'Akses administrator belum dikonfigurasi.' })
    return false
  }
  if (!isAuthorized(request, configuredKey)) {
    sendJson(response, 401, { error: 'Autentikasi administrator diperlukan.' })
    return false
  }
  return true
}

async function sendStaticFile(response, pathname, staticDirectory) {
  let decodedPath
  try {
    decodedPath = decodeURIComponent(pathname)
  } catch {
    sendJson(response, 400, { error: 'Path tidak valid.' })
    return
  }

  const root = resolve(staticDirectory)
  const requestedPath = resolve(root, `.${decodedPath}`)
  const relativePath = relative(root, requestedPath)
  if (relativePath.startsWith('..') || isAbsolute(relativePath)) {
    sendJson(response, 404, { error: 'Resource tidak ditemukan.' })
    return
  }

  let filePath = requestedPath
  let content
  try {
    content = await readFile(filePath)
  } catch (error) {
    if (error.code !== 'ENOENT' && error.code !== 'EISDIR') throw error
    if (extname(decodedPath)) {
      sendJson(response, 404, { error: 'Resource tidak ditemukan.' })
      return
    }
    filePath = resolve(root, 'index.html')
    content = await readFile(filePath)
  }

  response.writeHead(200, {
    'Cache-Control': decodedPath.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'no-cache',
    'Content-Type': STATIC_CONTENT_TYPES[extname(filePath)] || 'application/octet-stream',
    'X-Content-Type-Options': 'nosniff',
  })
  response.end(content)
}

function formatPartner(row) {
  return {
    ...row,
    acceptedFruitTypes: JSON.parse(row.acceptedFruitTypesJson),
    isLocationPublic: Boolean(row.isLocationPublic),
  }
}

function formatEcosystemRegistration(row) {
  return {
    ...row,
    wasteTypes: JSON.parse(row.wasteTypesJson),
    productTypes: JSON.parse(row.productTypesJson),
  }
}

function completeRegistrationAddress(registration) {
  return [
    registration.address,
    registration.village,
    registration.district,
    registration.city,
    registration.province,
    'Indonesia',
  ].filter(Boolean).join(', ')
}

function createRateLimiter() {
  const requests = new Map()

  return (key) => {
    const now = Date.now()
    const recent = (requests.get(key) || []).filter((timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS)
    if (recent.length >= RATE_LIMIT_MAX_REQUESTS) {
      requests.set(key, recent)
      return false
    }
    recent.push(now)
    requests.set(key, recent)
    return true
  }
}

export function createApiHandler({
  database,
  adminApiKey = process.env.ADMIN_API_KEY,
  staticDirectory = '',
} = {}) {
  if (!database) throw new Error('Database harus tersedia untuk menjalankan API.')

  const allowRequest = createRateLimiter()

  return async (request, response) => {
    try {
    const url = new URL(request.url, 'http://localhost')

    if (request.method === 'GET' && url.pathname === '/api/health') {
      sendJson(response, 200, { status: 'ok' })
      return
    }

    if (request.method === 'POST' && url.pathname === '/api/registration-status') {
      const clientAddress = request.socket.remoteAddress || 'unknown'
      if (!allowRequest(`${clientAddress}:${url.pathname}`)) {
        sendJson(response, 429, { error: 'Terlalu banyak percobaan. Silakan coba kembali nanti.' })
        return
      }

      const body = await readJson(request)
      if (body.error) {
        sendJson(response, body.error.status, { error: body.error.message })
        return
      }

      const registrationCode = typeof body.value?.registrationCode === 'string'
        ? body.value.registrationCode.trim().toUpperCase()
        : ''
      const whatsapp = typeof body.value?.whatsapp === 'string'
        ? body.value.whatsapp.trim()
        : ''
      const phoneDigits = whatsapp.replace(/\D/g, '')
      if (
        !/^SKR?-\d{4}-[A-F0-9]{8}$/.test(registrationCode)
        || !/^[+\d\s().-]+$/.test(whatsapp)
        || phoneDigits.length < 8
        || phoneDigits.length > 15
      ) {
        sendJson(response, 400, { error: 'Masukkan kode registrasi dan nomor WhatsApp yang valid.' })
        return
      }

      const registration = await database.prepare(`
        SELECT registration_code AS registrationCode, whatsapp, status,
          created_at AS createdAt
        FROM waste_registrations
        WHERE registration_code = ?
        UNION ALL
        SELECT registration_code AS registrationCode, whatsapp, status,
          created_at AS createdAt
        FROM ecosystem_registrations
        WHERE registration_code = ?
      `).get(registrationCode, registrationCode)
      if (!registration || registration.whatsapp.replace(/\D/g, '') !== phoneDigits) {
        sendJson(response, 404, { error: 'Kode registrasi atau nomor WhatsApp tidak cocok.' })
        return
      }

      const statusDetails = REGISTRATION_STATUS_DETAILS[registration.status]
      sendJson(response, 200, {
        registrationCode: registration.registrationCode,
        status: registration.status,
        statusLabel: statusDetails.label,
        statusMessage: statusDetails.message,
        createdAt: registration.createdAt,
      })
      return
    }

    if (request.method === 'POST' && url.pathname === '/api/ecosystem/geocode') {
      const clientAddress = request.socket.remoteAddress || 'unknown'
      if (!allowRequest(`${clientAddress}:${url.pathname}`)) {
        sendJson(response, 429, { error: 'Terlalu banyak permintaan geocoding. Silakan coba kembali nanti.' })
        return
      }

      const body = await readJson(request)
      if (body.error) {
        sendJson(response, body.error.status, { error: body.error.message })
        return
      }
      const address = typeof body.value?.address === 'string' ? body.value.address.trim() : ''
      if (!address || address.length > 1000) {
        sendJson(response, 400, { error: 'Alamat wajib diisi dan maksimal 1.000 karakter.' })
        return
      }
      if (!process.env.GOOGLE_GEOCODING_API_KEY) {
        sendJson(response, 503, { error: 'Geocoding Google belum dikonfigurasi. Pilih titik lokasi secara manual pada peta.' })
        return
      }

      const result = await geocodeAddress(database, address)
      if (result.status !== 'google_verified') {
        sendJson(response, 422, {
          error: result.status === 'not_found'
            ? 'Alamat belum ditemukan. Periksa alamat atau pilih titik secara manual pada peta.'
            : 'Alamat belum dapat diverifikasi secara presisi. Pilih titik lokasi secara manual pada peta.',
          status: result.status,
          formattedAddress: result.formattedAddress || null,
        })
        return
      }
      sendJson(response, 200, result)
      return
    }

    if (request.method === 'POST' && (
      url.pathname === '/api/waste-registrations' ||
      url.pathname === '/api/ecosystem/registrations' ||
      url.pathname === '/api/contact-messages'
    )) {
      const clientAddress = request.socket.remoteAddress || 'unknown'
      if (!allowRequest(`${clientAddress}:${url.pathname}`)) {
        sendJson(response, 429, { error: 'Terlalu banyak pengiriman. Silakan coba kembali nanti.' })
        return
      }

      const body = await readJson(request)
      if (body.error) {
        sendJson(response, body.error.status, { error: body.error.message })
        return
      }

      if (url.pathname === '/api/waste-registrations') {
        const result = validateWasteRegistration(body.value)
        if (result.errors) {
          sendJson(response, 400, { error: 'Periksa kembali data pendaftaran.', details: result.errors })
          return
        }

        const registration = result.value
        const registrationCode = createReferenceCode('SK')
        await database.prepare(`
          INSERT INTO waste_registrations (
            registration_code, full_name, business_name, whatsapp, email, producer_type,
            province, city, district, village, address, fruit_type, quantity_kg,
            production_frequency, waste_condition, notes, consent_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
        `).run(
          registrationCode,
          registration.fullName,
          registration.businessName || null,
          registration.whatsapp,
          registration.email || null,
          registration.producerType,
          registration.province,
          registration.city,
          registration.district,
          registration.village,
          registration.address,
          registration.fruitType,
          registration.quantityKg,
          registration.productionFrequency,
          registration.wasteCondition,
          registration.notes || null,
        )

        sendJson(response, 201, {
          registrationCode,
          status: 'pending_review',
          statusLabel: 'Menunggu Peninjauan',
        })
        return
      }

      if (url.pathname === '/api/ecosystem/registrations') {
        const result = validateEcosystemRegistration(body.value)
        if (result.errors) {
          sendJson(response, 400, { error: 'Periksa kembali data pendaftaran.', details: result.errors })
          return
        }

        const registration = result.value
        const registrationCode = createReferenceCode('SKR')
        const latitude = registration.mapConsent ? registration.latitude : null
        const longitude = registration.mapConsent ? registration.longitude : null
        const cachedGeocode = registration.mapConsent
          ? await getCachedGeocode(database, completeRegistrationAddress(registration))
          : null
        const geocodeMatches = cachedGeocode?.status === 'google_verified'
          && Math.abs(cachedGeocode.latitude - latitude) < 0.000001
          && Math.abs(cachedGeocode.longitude - longitude) < 0.000001
        const locationStatus = latitude === null
          ? 'unverified'
          : geocodeMatches ? 'google_verified' : 'user_confirmed'
        await database.prepare(`
          INSERT INTO ecosystem_registrations (
            registration_code, role, full_name, business_name, whatsapp, email,
            province, city, district, village, address, producer_type, waste_types,
            product_types, product_type, processing_type, quantity_kg, capacity_kg, frequency,
            waste_condition, notes, consent_at, directory_consent_at,
            latitude, longitude, location_status, map_consent_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
            strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
            CASE WHEN ? = 1 THEN strftime('%Y-%m-%dT%H:%M:%fZ', 'now') ELSE NULL END,
            ?, ?, ?, CASE WHEN ? = 1 THEN strftime('%Y-%m-%dT%H:%M:%fZ', 'now') ELSE NULL END)
        `).run(
          registrationCode,
          registration.role,
          registration.fullName,
          registration.businessName || null,
          registration.whatsapp,
          registration.email || null,
          registration.province,
          registration.city,
          registration.district,
          registration.village,
          registration.address,
          registration.producerType || null,
          JSON.stringify(registration.wasteTypes),
          JSON.stringify(registration.productTypes),
          registration.productType || null,
          registration.processingType || null,
          registration.quantityKg,
          registration.capacityKg,
          registration.frequency,
          registration.wasteCondition || null,
          registration.notes || null,
          registration.directoryConsent ? 1 : 0,
          latitude,
          longitude,
          locationStatus,
          registration.mapConsent ? 1 : 0,
        )

        sendJson(response, 201, {
          registrationCode,
          status: 'pending_review',
          statusLabel: 'Menunggu Peninjauan',
        })
        return
      }

      const result = validateContactMessage(body.value)
      if (result.errors) {
        sendJson(response, 400, { error: 'Periksa kembali pesan Anda.', details: result.errors })
        return
      }

      const contact = result.value
      const messageCode = createReferenceCode('SKC')
      await database.prepare(`
        INSERT INTO contact_messages (message_code, name, email, whatsapp, category, message)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        messageCode,
        contact.name,
        contact.email || null,
        contact.whatsapp || null,
        contact.category,
        contact.message,
      )

      sendJson(response, 201, { messageCode, message: 'Pesan berhasil dikirim.' })
      return
    }

    if (request.method === 'GET' && url.pathname === '/api/ecosystem/directory') {
      const query = (url.searchParams.get('q') || '').trim().toLowerCase()
      const role = (url.searchParams.get('role') || '').trim()
      const region = (url.searchParams.get('region') || '').trim().toLowerCase()
      if (query.length > 100 || region.length > 120) {
        sendJson(response, 400, { error: 'Panjang pencarian atau wilayah melebihi batas.' })
        return
      }
      if (role && !Object.hasOwn(ECOSYSTEM_ROLES, role)) {
        sendJson(response, 400, { error: 'Kategori pengguna tidak valid.' })
        return
      }

      const rows = (await database.prepare(`
        SELECT id, role, full_name AS fullName, business_name AS businessName,
          whatsapp, province, city, waste_types AS wasteTypesJson,
          product_types AS productTypesJson, product_type AS productType,
          quantity_kg AS quantityKg, capacity_kg AS capacityKg,
          frequency, latitude, longitude,
          location_status AS locationStatus, map_consent_at AS mapConsentAt
        FROM ecosystem_registrations
        WHERE status = 'verified'
          AND directory_consent_at IS NOT NULL
          AND (? = '' OR role = ?)
          AND (? = '' OR instr(lower(city || ' ' || province), ?) > 0)
        ORDER BY created_at DESC, id DESC
      `).all(role, role, region, region)).map((row) => {
        const wasteTypes = JSON.parse(row.wasteTypesJson)
        const productTypes = JSON.parse(row.productTypesJson)
        const item = {
          id: row.id,
          role: row.role,
          name: row.businessName || row.fullName,
          whatsapp: row.whatsapp,
          province: row.province,
          city: row.city,
          wasteTypes,
          productTypes,
          productType: row.productType,
          quantityKg: row.quantityKg,
          capacityKg: row.capacityKg,
          frequency: row.frequency,
          mapLocationId: row.mapConsentAt
            && row.latitude !== null && row.longitude !== null
            && ['google_verified', 'user_confirmed'].includes(row.locationStatus)
            ? `registration:${row.id}`
            : null,
        }
        const searchable = [
          item.name,
          item.province,
          item.city,
          item.productType,
          ...item.wasteTypes,
          ...item.productTypes,
        ].filter(Boolean).join(' ').toLowerCase()
        return { item, matches: !query || searchable.includes(query) }
      }).filter(({ matches }) => matches).map(({ item }) => item)

      const regions = (await database.prepare(`
        SELECT DISTINCT city, province
        FROM ecosystem_registrations
        WHERE status = 'verified' AND directory_consent_at IS NOT NULL
        ORDER BY lower(province), lower(city)
      `).all()).map(({ city, province }) => `${city}, ${province}`)

      sendJson(response, 200, { items: rows, regions })
      return
    }

    if (request.method === 'GET' && url.pathname === '/api/ecosystem/map') {
      const filters = {
        q: (url.searchParams.get('q') || '').trim().toLowerCase(),
        role: (url.searchParams.get('role') || '').trim(),
        wasteType: (url.searchParams.get('wasteType') || '').trim(),
        processingType: (url.searchParams.get('processingType') || '').trim().toLowerCase(),
        productType: (url.searchParams.get('productType') || '').trim(),
        district: (url.searchParams.get('district') || '').trim().toLowerCase(),
        city: (url.searchParams.get('city') || '').trim().toLowerCase(),
      }
      if (
        filters.q.length > 120
        || filters.processingType.length > 120
        || filters.productType.length > 100
        || filters.district.length > 100
        || filters.city.length > 100
      ) {
        sendJson(response, 400, { error: 'Panjang pencarian melebihi batas.' })
        return
      }
      if (filters.role && !Object.hasOwn(ECOSYSTEM_ROLES, filters.role)) {
        sendJson(response, 400, { error: 'Kategori pengguna tidak valid.' })
        return
      }
      if (filters.wasteType && !FRUIT_TYPES.includes(filters.wasteType)) {
        sendJson(response, 400, { error: 'Jenis limbah tidak valid.' })
        return
      }
      if (filters.productType && !ORGANIC_PRODUCTS.includes(filters.productType)) {
        sendJson(response, 400, { error: 'Jenis produk tidak valid.' })
        return
      }

      const partners = (await database.prepare(`
        SELECT id, name, address, region, latitude, longitude,
          google_maps_url AS googleMapsUrl,
          accepted_fruit_types AS wasteTypesJson,
          capacity_kg AS capacityKg
        FROM partners
        WHERE verification_status = 'verified'
          AND is_location_public = 1
          AND latitude IS NOT NULL AND longitude IS NOT NULL
      `).all()).map((row) => ({
        id: `partner:${row.id}`,
        source: 'partner',
        role: 'processor',
        name: row.name,
        whatsapp: '',
        address: row.address,
        province: '',
        city: row.region,
        district: '',
        latitude: row.latitude,
        longitude: row.longitude,
        googleMapsUrl: row.googleMapsUrl,
        wasteTypes: JSON.parse(row.wasteTypesJson),
        productTypes: [],
        productType: '',
        quantityKg: null,
        capacityKg: row.capacityKg,
        processingType: 'Mitra pengolah organik',
        frequency: '',
        notes: '',
      }))
      const seeds = (await database.prepare(`
        SELECT id, name, address, whatsapp, province, city, district,
          google_maps_url AS googleMapsUrl, processing_type AS processingType,
          latitude, longitude, notes
        FROM ecosystem_seed_locations
        WHERE verification_status = 'verified'
          AND is_location_public = 1
          AND latitude IS NOT NULL AND longitude IS NOT NULL
      `).all()).map((row) => ({
        ...row,
        id: `seed:${row.id}`,
        source: 'seed',
        role: 'processor',
        wasteTypes: [],
        productTypes: [],
        productType: '',
        quantityKg: null,
        capacityKg: null,
        frequency: '',
      }))
      const registrations = (await database.prepare(`
        SELECT id, role, full_name AS fullName, business_name AS businessName,
          whatsapp, address, province, city, district,
          waste_types AS wasteTypesJson, product_types AS productTypesJson,
          product_type AS productType, processing_type AS processingType,
          quantity_kg AS quantityKg, capacity_kg AS capacityKg,
          frequency, notes, latitude, longitude
        FROM ecosystem_registrations
        WHERE status = 'verified'
          AND map_consent_at IS NOT NULL
          AND location_status IN ('google_verified', 'user_confirmed')
          AND latitude IS NOT NULL AND longitude IS NOT NULL
      `).all()).map((row) => ({
        ...row,
        id: `registration:${row.id}`,
        source: 'registration',
        name: row.businessName || row.fullName,
        googleMapsUrl: '',
        wasteTypes: JSON.parse(row.wasteTypesJson),
        productTypes: JSON.parse(row.productTypesJson),
      }))
      const allItems = [...partners, ...seeds, ...registrations]
      const items = allItems.filter((item) => {
        if (filters.role && item.role !== filters.role) return false
        if (filters.wasteType && !item.wasteTypes.includes(filters.wasteType)) return false
        if (filters.productType && item.productType !== filters.productType
          && !item.productTypes.includes(filters.productType)) return false
        if (filters.processingType
          && !item.processingType.toLowerCase().includes(filters.processingType)) return false
        if (filters.district && !item.district.toLowerCase().includes(filters.district)) return false
        if (filters.city && !item.city.toLowerCase().includes(filters.city)) return false
        if (!filters.q) return true
        const searchable = [
          item.name,
          item.address,
          item.city,
          item.district,
          item.processingType,
          item.productType,
          ...item.wasteTypes,
          ...item.productTypes,
        ].filter(Boolean).join(' ').toLowerCase()
        return searchable.includes(filters.q)
      })

      const legacySupplierCount = (await database.prepare(
        'SELECT COUNT(*) AS count FROM waste_registrations',
      ).get()).count
      const roleCounts = (await database.prepare(`
        SELECT role, COUNT(*) AS count
        FROM ecosystem_registrations
        GROUP BY role
      `).all()).reduce((counts, row) => ({ ...counts, [row.role]: row.count }), {})
      const partnerCount = (await database.prepare('SELECT COUNT(*) AS count FROM partners').get()).count
      const seedCount = (await database.prepare('SELECT COUNT(*) AS count FROM ecosystem_seed_locations').get()).count
      const totalRegistered = legacySupplierCount
        + Object.values(roleCounts).reduce((sum, count) => sum + count, 0)
        + partnerCount
        + seedCount
      const seedFilters = await database.prepare(`
        SELECT district, city, processing_type AS processingType
        FROM ecosystem_seed_locations
      `).all()

      sendJson(response, 200, {
        items,
        stats: {
          suppliers: legacySupplierCount + (roleCounts.supplier || 0),
          processors: partnerCount + seedCount + (roleCounts.processor || 0),
          buyers: roleCounts.buyer || 0,
          totalRegistered,
          verifiedLocations: allItems.length,
        },
        filters: {
          districts: [...new Set([
            ...allItems.map((item) => item.district),
            ...seedFilters.map((item) => item.district),
          ].filter(Boolean))].sort(),
          cities: [...new Set([
            ...allItems.map((item) => item.city),
            ...seedFilters.map((item) => item.city),
          ].filter(Boolean))].sort(),
          processingTypes: [...new Set([
            ...allItems.map((item) => item.processingType),
            ...seedFilters.map((item) => item.processingType),
          ].filter(Boolean))].sort(),
          productTypes: [...new Set(allItems.flatMap((item) => [
            ...item.productTypes,
            item.productType,
          ]).filter(Boolean))].sort(),
        },
      })
      return
    }

    if (request.method === 'GET' && url.pathname === '/api/partners') {
      const query = (url.searchParams.get('q') || '').trim()
      const region = (url.searchParams.get('region') || '').trim()
      const fruitType = (url.searchParams.get('fruitType') || '').trim()

      if (query.length > 100 || region.length > 120) {
        sendJson(response, 400, { error: 'Panjang pencarian atau wilayah melebihi batas.' })
        return
      }
      if (fruitType && !FRUIT_TYPES.includes(fruitType)) {
        sendJson(response, 400, { error: 'Jenis kulit buah tidak valid.' })
        return
      }

      const rows = (await database.prepare(`
        SELECT ${PARTNER_FIELDS}
        FROM partners
        WHERE verification_status = 'verified'
          AND is_location_public = 1
          AND latitude IS NOT NULL
          AND longitude IS NOT NULL
          AND (? = '' OR instr(lower(name), lower(?)) > 0)
          AND (? = '' OR lower(region) = lower(?))
        ORDER BY lower(name)
      `).all(query, query, region, region)).filter((row) =>
        !fruitType || JSON.parse(row.acceptedFruitTypesJson).includes(fruitType))
      const regions = (await database.prepare(`
        SELECT DISTINCT region
        FROM partners
        WHERE verification_status = 'verified'
          AND is_location_public = 1
          AND latitude IS NOT NULL
          AND longitude IS NOT NULL
        ORDER BY lower(region)
      `).all()).map(({ region: partnerRegion }) => partnerRegion)

      sendJson(response, 200, { items: rows.map(formatPartner), regions })
      return
    }

    if (url.pathname === '/api/admin/partners') {
      if (!requireAdmin(request, response, adminApiKey)) return

      if (request.method === 'GET') {
        const items = (await database.prepare(`
          SELECT ${PARTNER_FIELDS}
          FROM partners
          ORDER BY updated_at DESC, id DESC
        `).all()).map(formatPartner)
        sendJson(response, 200, { items })
        return
      }

      if (request.method === 'POST') {
        const body = await readJson(request)
        if (body.error) {
          sendJson(response, body.error.status, { error: body.error.message })
          return
        }

        const result = validatePartner(body.value)
        if (result.errors) {
          sendJson(response, 400, { error: 'Periksa kembali data mitra.', details: result.errors })
          return
        }

        const partner = result.value
        let partnerId
        if (partner.id) {
          const update = await database.prepare(`
            UPDATE partners SET
              name = ?, address = ?, region = ?, latitude = ?, longitude = ?,
              google_maps_url = ?, accepted_fruit_types = ?, capacity_kg = ?,
              verification_status = ?, is_location_public = ?,
              updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
            WHERE id = ?
          `).run(
            partner.name,
            partner.address,
            partner.region,
            partner.latitude,
            partner.longitude,
            partner.googleMapsUrl || null,
            JSON.stringify(partner.acceptedFruitTypes),
            partner.capacityKg,
            partner.verificationStatus,
            partner.isLocationPublic ? 1 : 0,
            partner.id,
          )
          if (update.changes === 0) {
            sendJson(response, 404, { error: 'Mitra tidak ditemukan.' })
            return
          }
          partnerId = partner.id
        } else {
          const insert = await database.prepare(`
            INSERT INTO partners (
              name, address, region, latitude, longitude, google_maps_url,
              accepted_fruit_types, capacity_kg, verification_status, is_location_public
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            partner.name,
            partner.address,
            partner.region,
            partner.latitude,
            partner.longitude,
            partner.googleMapsUrl || null,
            JSON.stringify(partner.acceptedFruitTypes),
            partner.capacityKg,
            partner.verificationStatus,
            partner.isLocationPublic ? 1 : 0,
          )
          partnerId = Number(insert.lastInsertRowid)
        }

        const saved = await database.prepare(`
          SELECT ${PARTNER_FIELDS}
          FROM partners
          WHERE id = ?
        `).get(partnerId)
        sendJson(response, partner.id ? 200 : 201, { partner: formatPartner(saved) })
        return
      }

      sendJson(response, 405, { error: 'Metode tidak diizinkan.' })
      return
    }

    if (url.pathname === '/api/admin/ecosystem-seeds') {
      if (!requireAdmin(request, response, adminApiKey)) return
      if (request.method !== 'GET') {
        sendJson(response, 405, { error: 'Metode tidak diizinkan.' })
        return
      }
      const items = (await database.prepare(`
        SELECT ${SEED_LOCATION_FIELDS}
        FROM ecosystem_seed_locations
        ORDER BY lower(city), lower(name)
      `).all()).map((row) => ({
        ...row,
        isLocationPublic: Boolean(row.isLocationPublic),
      }))
      sendJson(response, 200, { items })
      return
    }

    if (url.pathname.startsWith('/api/admin/ecosystem-seeds/')) {
      if (!requireAdmin(request, response, adminApiKey)) return
      if (request.method !== 'PATCH') {
        sendJson(response, 405, { error: 'Metode tidak diizinkan.' })
        return
      }
      const id = Number(url.pathname.slice('/api/admin/ecosystem-seeds/'.length))
      if (!Number.isSafeInteger(id) || id < 1) {
        sendJson(response, 400, { error: 'ID lokasi awal tidak valid.' })
        return
      }
      const body = await readJson(request)
      if (body.error) {
        sendJson(response, body.error.status, { error: body.error.message })
        return
      }
      const latitude = body.value?.latitude === null || body.value?.latitude === ''
        ? null
        : Number(body.value?.latitude)
      const longitude = body.value?.longitude === null || body.value?.longitude === ''
        ? null
        : Number(body.value?.longitude)
      const verificationStatus = body.value?.verificationStatus
      const isLocationPublic = body.value?.isLocationPublic
      const validCoordinates = (latitude === null && longitude === null) || (
        Number.isFinite(latitude) && latitude >= -90 && latitude <= 90
        && Number.isFinite(longitude) && longitude >= -180 && longitude <= 180
      )
      if (!validCoordinates) {
        sendJson(response, 400, { error: 'Latitude dan longitude harus berupa koordinat yang valid dan diisi bersama.' })
        return
      }
      if (!['pending', 'verified', 'rejected'].includes(verificationStatus)) {
        sendJson(response, 400, { error: 'Status verifikasi lokasi tidak valid.' })
        return
      }
      if (typeof isLocationPublic !== 'boolean') {
        sendJson(response, 400, { error: 'Status publikasi lokasi harus berupa pilihan ya atau tidak.' })
        return
      }
      if (verificationStatus === 'verified' && (latitude === null || longitude === null)) {
        sendJson(response, 400, { error: 'Lokasi harus memiliki koordinat yang diverifikasi sebelum dipublikasikan.' })
        return
      }
      if (isLocationPublic && verificationStatus !== 'verified') {
        sendJson(response, 400, { error: 'Verifikasi lokasi sebelum mengizinkan publikasi.' })
        return
      }

      const update = await database.prepare(`
        UPDATE ecosystem_seed_locations SET
          latitude = ?, longitude = ?,
          location_status = CASE
            WHEN CAST(? AS REAL) IS NULL THEN 'unverified'
            WHEN location_status = 'google_verified' THEN 'google_verified'
            ELSE 'admin_verified'
          END,
          verification_status = ?, is_location_public = ?
        WHERE id = ?
      `).run(latitude, longitude, latitude, verificationStatus, isLocationPublic ? 1 : 0, id)
      if (update.changes === 0) {
        sendJson(response, 404, { error: 'Lokasi awal tidak ditemukan.' })
        return
      }
      const item = await database.prepare(`
        SELECT ${SEED_LOCATION_FIELDS}
        FROM ecosystem_seed_locations
        WHERE id = ?
      `).get(id)
      sendJson(response, 200, {
        location: { ...item, isLocationPublic: Boolean(item.isLocationPublic) },
      })
      return
    }

    if (url.pathname.startsWith('/api/admin/ecosystem-registrations/')) {
      if (!requireAdmin(request, response, adminApiKey)) return
      if (request.method !== 'PATCH') {
        sendJson(response, 405, { error: 'Metode tidak diizinkan.' })
        return
      }
      const id = Number(url.pathname.slice('/api/admin/ecosystem-registrations/'.length))
      if (!Number.isSafeInteger(id) || id < 1) {
        sendJson(response, 400, { error: 'ID pendaftaran tidak valid.' })
        return
      }
      const body = await readJson(request)
      if (body.error) {
        sendJson(response, body.error.status, { error: body.error.message })
        return
      }
      const status = body.value?.status
      if (!['pending_review', 'verified', 'rejected'].includes(status)) {
        sendJson(response, 400, { error: 'Status pendaftaran tidak valid.' })
        return
      }
      const update = await database.prepare(
        'UPDATE ecosystem_registrations SET status = ? WHERE id = ?',
      ).run(status, id)
      if (update.changes === 0) {
        sendJson(response, 404, { error: 'Pendaftaran tidak ditemukan.' })
        return
      }
      sendJson(response, 200, { id, status })
      return
    }

    if (request.method === 'GET' && url.pathname === '/api/admin/submissions') {
      if (!requireAdmin(request, response, adminApiKey)) return

      const type = url.searchParams.get('type') || 'registrations'
      if (!['registrations', 'messages', 'ecosystem'].includes(type)) {
        sendJson(response, 400, { error: 'Jenis data tidak valid.' })
        return
      }

      const rawLimit = Number(url.searchParams.get('limit') || 50)
      if (!Number.isInteger(rawLimit) || rawLimit < 1 || rawLimit > 100) {
        sendJson(response, 400, { error: 'Limit harus berupa angka antara 1 dan 100.' })
        return
      }

      const rawBeforeId = url.searchParams.get('beforeId')
      const beforeId = rawBeforeId === null ? Number.MAX_SAFE_INTEGER : Number(rawBeforeId)
      if (!Number.isSafeInteger(beforeId) || beforeId < 1) {
        sendJson(response, 400, { error: 'beforeId tidak valid.' })
        return
      }

      if (type === 'ecosystem') {
        const items = (await database.prepare(`
          SELECT ${ECOSYSTEM_FIELDS}
          FROM ecosystem_registrations
          WHERE id < ?
          ORDER BY id DESC
          LIMIT ?
        `).all(beforeId, rawLimit)).map(formatEcosystemRegistration)
        sendJson(response, 200, {
          items,
          nextBeforeId: items.length === rawLimit ? items.at(-1).id : null,
        })
        return
      }

      const isRegistration = type === 'registrations'
      const table = isRegistration ? 'waste_registrations' : 'contact_messages'
      const fields = isRegistration ? REGISTRATION_FIELDS : CONTACT_FIELDS
      const items = await database.prepare(`
        SELECT ${fields}
        FROM ${table}
        WHERE id < ?
        ORDER BY id DESC
        LIMIT ?
      `).all(beforeId, rawLimit)

      sendJson(response, 200, {
        items,
        nextBeforeId: items.length === rawLimit ? items.at(-1).id : null,
      })
      return
    }

    if (url.pathname.startsWith('/api/')) {
      sendJson(response, 404, { error: 'Endpoint tidak ditemukan.' })
      return
    }

    if (request.method === 'GET' && staticDirectory) {
      await sendStaticFile(response, url.pathname, staticDirectory)
      return
    }

    sendJson(response, 404, { error: 'Resource tidak ditemukan.' })
    } catch (error) {
      console.error(
        'SIRKULIT API request failed:',
        error instanceof Error ? error.message : 'Unknown error',
      )
      if (response.headersSent) {
        response.destroy()
        return
      }
      sendJson(response, 500, { error: 'Terjadi gangguan server. Silakan coba kembali.' })
    }
  }
}

export function createApiServer(options = {}) {
  return createServer(createApiHandler(options))
}
