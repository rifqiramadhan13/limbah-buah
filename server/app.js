import { randomBytes, timingSafeEqual } from 'node:crypto'
import { createServer } from 'node:http'
import {
  validateContactMessage,
  validatePartner,
  validateWasteRegistration,
} from './validation.js'
import { FRUIT_TYPES } from '../shared/form-options.js'

const MAX_BODY_BYTES = 16 * 1024
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000
const RATE_LIMIT_MAX_REQUESTS = 8
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

function formatPartner(row) {
  return {
    ...row,
    acceptedFruitTypes: JSON.parse(row.acceptedFruitTypesJson),
    isLocationPublic: Boolean(row.isLocationPublic),
  }
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

export function createApiServer({ database, adminApiKey = process.env.ADMIN_API_KEY } = {}) {
  if (!database) throw new Error('Database harus tersedia untuk menjalankan API.')

  const allowRequest = createRateLimiter()

  return createServer(async (request, response) => {
    try {
    const url = new URL(request.url, 'http://localhost')

    if (request.method === 'GET' && url.pathname === '/api/health') {
      sendJson(response, 200, { status: 'ok' })
      return
    }

    if (request.method === 'POST' && (
      url.pathname === '/api/waste-registrations' ||
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
        database.prepare(`
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

      const result = validateContactMessage(body.value)
      if (result.errors) {
        sendJson(response, 400, { error: 'Periksa kembali pesan Anda.', details: result.errors })
        return
      }

      const contact = result.value
      const messageCode = createReferenceCode('SKC')
      database.prepare(`
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

      const rows = database.prepare(`
        SELECT ${PARTNER_FIELDS}
        FROM partners
        WHERE verification_status = 'verified'
          AND is_location_public = 1
          AND latitude IS NOT NULL
          AND longitude IS NOT NULL
          AND (? = '' OR instr(lower(name), lower(?)) > 0)
          AND (? = '' OR lower(region) = lower(?))
          AND (? = '' OR EXISTS (
            SELECT 1
            FROM json_each(partners.accepted_fruit_types) AS fruit
            WHERE fruit.value = ?
          ))
        ORDER BY name COLLATE NOCASE
      `).all(query, query, region, region, fruitType, fruitType)
      const regions = database.prepare(`
        SELECT DISTINCT region
        FROM partners
        WHERE verification_status = 'verified'
          AND is_location_public = 1
          AND latitude IS NOT NULL
          AND longitude IS NOT NULL
        ORDER BY region COLLATE NOCASE
      `).all().map(({ region: partnerRegion }) => partnerRegion)

      sendJson(response, 200, { items: rows.map(formatPartner), regions })
      return
    }

    if (url.pathname === '/api/admin/partners') {
      if (!requireAdmin(request, response, adminApiKey)) return

      if (request.method === 'GET') {
        const items = database.prepare(`
          SELECT ${PARTNER_FIELDS}
          FROM partners
          ORDER BY updated_at DESC, id DESC
        `).all().map(formatPartner)
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
          const update = database.prepare(`
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
          const insert = database.prepare(`
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

        const saved = database.prepare(`
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

    if (request.method === 'GET' && url.pathname === '/api/admin/submissions') {
      if (!requireAdmin(request, response, adminApiKey)) return

      const type = url.searchParams.get('type') || 'registrations'
      if (!['registrations', 'messages'].includes(type)) {
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

      const isRegistration = type === 'registrations'
      const table = isRegistration ? 'waste_registrations' : 'contact_messages'
      const fields = isRegistration ? REGISTRATION_FIELDS : CONTACT_FIELDS
      const items = database.prepare(`
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
  })
}
