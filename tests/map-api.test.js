import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import server from '../netlify/server/index.mjs'
import { publicMapLocations } from '../server/map-api.js'

let baseUrl
before(async () => {
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  baseUrl = `http://127.0.0.1:${server.address().port}`
})
after(() => new Promise((resolve) => server.close(resolve)))

test('deployed map API returns the five existing published locations as JSON', async () => {
  const response = await fetch(`${baseUrl}/api/ecosystem/map`)
  assert.equal(response.status, 200)
  assert.match(response.headers.get('content-type'), /application\/json/)
  const result = await response.json()
  assert.equal(result.source, 'published-reference-locations')
  assert.equal(result.items.length, 5)
  assert.equal(result.stats.verifiedLocations, 5)
  assert.ok(result.items.every((item) => Number.isFinite(item.latitude) && item.source === 'seed'))
  assert.ok(result.filters.districts.includes('Dau'))
})

test('only public verified locations with valid coordinates are exposed', () => {
  const location = { verificationStatus: 'verified', isLocationPublic: true, latitude: -8, longitude: 112 }
  assert.equal(publicMapLocations([
    { ...location, verificationStatus: 'pending' },
    { ...location, isLocationPublic: false },
    { ...location, latitude: null },
    { ...location, longitude: 181 },
  ]).length, 0)
})

test('map API filters existing locations and rejects invalid filters', async () => {
  const filtered = await fetch(`${baseUrl}/api/ecosystem/map?district=Dau`).then((r) => r.json())
  assert.equal(filtered.items.length, 2)
  assert.ok(filtered.items.every((item) => item.district === 'Dau'))
  const empty = await fetch(`${baseUrl}/api/ecosystem/map?role=buyer`).then((r) => r.json())
  assert.deepEqual(empty.items, [])
  const invalid = await fetch(`${baseUrl}/api/ecosystem/map?role=invalid`)
  assert.equal(invalid.status, 400)
})

test('partner API supplies the legacy map format without inventing accepted waste types', async () => {
  const response = await fetch(`${baseUrl}/api/partners?q=Grand%20Larva`)
  const result = await response.json()
  assert.equal(result.items.length, 1)
  assert.deepEqual(result.items[0].acceptedFruitTypes, [])
  assert.equal(result.items[0].region, 'Kota Malang')
})

test('map service rejects writes and unknown routes', async () => {
  const write = await fetch(`${baseUrl}/api/ecosystem/map`, { method: 'POST' })
  assert.equal(write.status, 405)
  assert.equal(write.headers.get('allow'), 'GET')
  const missing = await fetch(`${baseUrl}/api/missing`)
  assert.equal(missing.status, 404)
})
