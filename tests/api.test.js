import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, rmdirSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { after, before, test } from 'node:test'
import { createApiServer } from '../server/app.js'
import { createDatabase } from '../server/database.js'

const validRegistration = {
  fullName: 'Rina Contoh',
  businessName: 'Usaha Jus',
  whatsapp: '+62 812 3456 7890',
  email: 'rina@example.com',
  producerType: 'Usaha makanan dan minuman',
  province: 'Jawa Barat',
  city: 'Bandung',
  district: 'Coblong',
  village: 'Dago',
  address: 'Jalan Contoh Nomor 1',
  fruitType: 'Kulit jeruk',
  quantityKg: '12.5',
  productionFrequency: 'Setiap hari',
  wasteCondition: 'Baru dipisahkan dan relatif segar',
  notes: '',
  consent: true,
}

const validPartner = {
  name: 'Mitra Kompos Uji',
  address: 'Jalan Contoh Nomor 10, Bandung',
  region: 'Bandung',
  latitude: -6.914744,
  longitude: 107.60981,
  googleMapsUrl: 'https://www.google.com/maps?q=-6.914744,107.60981',
  acceptedFruitTypes: ['Kulit jeruk', 'Kulit pisang'],
  capacityKg: 250,
  verificationStatus: 'verified',
  isLocationPublic: true,
}

let database
let server
let baseUrl

before(async () => {
  database = createDatabase(':memory:')
  server = createApiServer({ database, adminApiKey: 'a'.repeat(64) })
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  baseUrl = `http://127.0.0.1:${server.address().port}`
})

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()))
  })
  database.close()
})

test('stores a valid waste registration and returns its review status', async () => {
  const response = await fetch(`${baseUrl}/api/waste-registrations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(validRegistration),
  })
  const body = await response.json()

  assert.equal(response.status, 201)
  assert.match(body.registrationCode, /^SK-\d{4}-[A-F0-9]{8}$/)
  assert.equal(body.status, 'pending_review')
  assert.equal(body.statusLabel, 'Menunggu Peninjauan')

  const saved = database.prepare('SELECT * FROM waste_registrations').get()
  assert.equal(saved.full_name, validRegistration.fullName)
  assert.equal(saved.quantity_kg, 12.5)
  assert.equal(saved.status, 'pending_review')
  assert.ok(saved.consent_at)
  assert.equal(JSON.stringify(body).includes(validRegistration.whatsapp), false)

  const publicResponse = await fetch(`${baseUrl}/api/admin/submissions?type=registrations`)
  assert.equal(publicResponse.status, 401)

  const adminResponse = await fetch(`${baseUrl}/api/admin/submissions?type=registrations`, {
    headers: { Authorization: `Bearer ${'a'.repeat(64)}` },
  })
  const adminBody = await adminResponse.json()
  assert.equal(adminResponse.status, 200)
  assert.equal(adminBody.items.length, 1)
  assert.equal(adminBody.items[0].fullName, validRegistration.fullName)
})

test('rejects invalid registration without persisting it', async () => {
  const response = await fetch(`${baseUrl}/api/waste-registrations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...validRegistration, quantityKg: -1, consent: false }),
  })
  const body = await response.json()

  assert.equal(response.status, 400)
  assert.ok(body.details.includes('Persetujuan penggunaan data wajib diberikan.'))
  assert.equal(database.prepare('SELECT COUNT(*) AS count FROM waste_registrations').get().count, 1)
})

test('stores contact messages and exposes them only to an authorized administrator', async () => {
  const response = await fetch(`${baseUrl}/api/contact-messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Budi',
      email: 'budi@example.com',
      whatsapp: '',
      category: 'Kemitraan pengolahan',
      message: 'Saya ingin bertanya mengenai kemitraan.',
    }),
  })
  const body = await response.json()

  assert.equal(response.status, 201)
  assert.match(body.messageCode, /^SKC-\d{4}-[A-F0-9]{8}$/)
  assert.equal(database.prepare('SELECT status FROM contact_messages').get().status, 'new')

  const publicResponse = await fetch(`${baseUrl}/api/admin/submissions?type=messages`)
  assert.equal(publicResponse.status, 401)

  const adminResponse = await fetch(`${baseUrl}/api/admin/submissions?type=messages`, {
    headers: { Authorization: `Bearer ${'a'.repeat(64)}` },
  })
  const adminBody = await adminResponse.json()
  assert.equal(adminResponse.status, 200)
  assert.equal(adminBody.items.length, 1)
  assert.equal(adminBody.items[0].name, 'Budi')
})

test('requires a valid contact channel and a supported category', async () => {
  const response = await fetch(`${baseUrl}/api/contact-messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Budi',
      email: '',
      whatsapp: '',
      category: 'Kategori palsu',
      message: 'Pesan.',
    }),
  })
  const body = await response.json()

  assert.equal(response.status, 400)
  assert.ok(body.details.includes('Isi email atau nomor WhatsApp.'))
  assert.ok(body.details.includes('Kategori pertanyaan tidak valid.'))
  assert.equal(database.prepare('SELECT COUNT(*) AS count FROM contact_messages').get().count, 1)
})

test('rejects non-JSON form submissions', async () => {
  const response = await fetch(`${baseUrl}/api/waste-registrations`, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: 'not json',
  })

  assert.equal(response.status, 415)
})

test('persists saved records across SQLite connections', () => {
  const directory = mkdtempSync(path.join(os.tmpdir(), 'sirkulit-storage-'))
  const databasePath = path.join(directory, 'sirkulit.sqlite')
  const databaseModule = pathToFileURL(path.resolve('server/database.js')).href
  const writeScript = `
    import { createDatabase } from ${JSON.stringify(databaseModule)}
    const database = createDatabase(${JSON.stringify(databasePath)})
    database.prepare('INSERT INTO contact_messages (message_code, name, category, message) VALUES (?, ?, ?, ?)')
      .run('SKC-TEST-00000001', 'Penguji', 'Lainnya', 'Pesan uji persistensi')
    database.close()
  `
  const readScript = `
    import { createDatabase } from ${JSON.stringify(databaseModule)}
    const database = createDatabase(${JSON.stringify(databasePath)})
    const message = database.prepare('SELECT name, message FROM contact_messages WHERE message_code = ?')
      .get('SKC-TEST-00000001')
    console.log(JSON.stringify(message))
    database.close()
  `

  try {
    const write = spawnSync(process.execPath, ['--input-type=module', '-e', writeScript], { encoding: 'utf8' })
    assert.equal(write.status, 0, write.stderr)

    const read = spawnSync(process.execPath, ['--input-type=module', '-e', readScript], { encoding: 'utf8' })
    assert.equal(read.status, 0, read.stderr)
    assert.deepEqual(JSON.parse(read.stdout), {
      name: 'Penguji',
      message: 'Pesan uji persistensi',
    })
  } finally {
    rmSync(databasePath, { force: true })
    rmdirSync(directory)
  }
})

test('does not enable the administrator endpoint without a strong configured key', async () => {
  const unconfiguredServer = createApiServer({ database, adminApiKey: 'too-short' })
  await new Promise((resolve) => unconfiguredServer.listen(0, '127.0.0.1', resolve))

  try {
    const response = await fetch(
      `http://127.0.0.1:${unconfiguredServer.address().port}/api/admin/submissions`,
    )
    assert.equal(response.status, 503)
  } finally {
    await new Promise((resolve, reject) => {
      unconfiguredServer.close((error) => (error ? reject(error) : resolve()))
    })
  }
})

test('stores partner locations and only returns verified, public, geocoded partners', async () => {
  const publicResponse = await fetch(`${baseUrl}/api/partners`)
  assert.equal(publicResponse.status, 200)
  assert.deepEqual((await publicResponse.json()).items, [])

  const unauthorizedResponse = await fetch(`${baseUrl}/api/admin/partners`)
  assert.equal(unauthorizedResponse.status, 401)

  const adminHeaders = {
    Authorization: `Bearer ${'a'.repeat(64)}`,
    'Content-Type': 'application/json',
  }
  const addPartner = async (partner) => {
    const response = await fetch(`${baseUrl}/api/admin/partners`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify(partner),
    })
    return { response, body: await response.json() }
  }

  const created = await addPartner(validPartner)
  assert.equal(created.response.status, 201)
  const partnerId = created.body.partner.id
  assert.equal(created.body.partner.latitude, validPartner.latitude)
  assert.equal(created.body.partner.longitude, validPartner.longitude)
  assert.deepEqual(created.body.partner.acceptedFruitTypes, validPartner.acceptedFruitTypes)

  const pending = await addPartner({
    ...validPartner,
    name: 'Mitra Belum Diverifikasi',
    verificationStatus: 'pending',
  })
  assert.equal(pending.response.status, 201)

  const privatePartner = await addPartner({
    ...validPartner,
    name: 'Mitra Privat',
    isLocationPublic: false,
  })
  assert.equal(privatePartner.response.status, 201)

  const listed = await fetch(`${baseUrl}/api/partners`)
  const listedBody = await listed.json()
  assert.equal(listed.status, 200)
  assert.deepEqual(listedBody.items.map((item) => item.name), [validPartner.name])
  assert.deepEqual(listedBody.regions, ['Bandung'])

  const byName = await fetch(`${baseUrl}/api/partners?q=kompos`)
  assert.equal((await byName.json()).items.length, 1)

  const byRegion = await fetch(`${baseUrl}/api/partners?region=Bandung`)
  assert.equal((await byRegion.json()).items.length, 1)

  const byFruitType = await fetch(
    `${baseUrl}/api/partners?fruitType=${encodeURIComponent('Kulit pisang')}`,
  )
  assert.equal((await byFruitType.json()).items.length, 1)

  const noMatch = await fetch(
    `${baseUrl}/api/partners?fruitType=${encodeURIComponent('Kulit mangga')}`,
  )
  assert.equal((await noMatch.json()).items.length, 0)

  const updated = await addPartner({
    ...validPartner,
    id: partnerId,
    name: 'Mitra Kompos Diperbarui',
    latitude: -6.92,
    longitude: 107.62,
    region: 'Cimahi',
  })
  assert.equal(updated.response.status, 200)
  assert.equal(updated.body.partner.latitude, -6.92)
  assert.equal(updated.body.partner.longitude, 107.62)

  const filtered = await fetch(`${baseUrl}/api/partners?region=Cimahi`)
  const filteredBody = await filtered.json()
  assert.equal(filteredBody.items[0].name, 'Mitra Kompos Diperbarui')
  assert.deepEqual(filteredBody.regions, ['Cimahi'])

  const adminList = await fetch(`${baseUrl}/api/admin/partners`, { headers: adminHeaders })
  const adminBody = await adminList.json()
  assert.equal(adminBody.items.length, 3)

  const hidden = await addPartner({
    ...validPartner,
    id: partnerId,
    verificationStatus: 'rejected',
  })
  assert.equal(hidden.response.status, 200)
  const afterRejection = await fetch(`${baseUrl}/api/partners`)
  assert.deepEqual((await afterRejection.json()).items, [])
})

test('rejects invalid or unpublishable partner location data', async () => {
  const response = await fetch(`${baseUrl}/api/admin/partners`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${'a'.repeat(64)}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...validPartner,
      latitude: 91,
      longitude: 181,
      googleMapsUrl: 'javascript:alert(1)',
    }),
  })
  const body = await response.json()

  assert.equal(response.status, 400)
  assert.ok(body.details.some((detail) => detail.startsWith('Latitude')))
  assert.ok(body.details.some((detail) => detail.startsWith('Longitude')))
  assert.ok(body.details.some((detail) => detail.startsWith('Tautan lokasi')))
})
