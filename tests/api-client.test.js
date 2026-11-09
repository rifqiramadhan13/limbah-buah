import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'
import { postJson } from '../src/api.js'

const originalFetch = globalThis.fetch

afterEach(() => {
  globalThis.fetch = originalFetch
})

test('reports an actionable error when the API response is empty', async () => {
  globalThis.fetch = async () => new Response(null, { status: 502 })

  await assert.rejects(
    postJson('/api/waste-registrations', {}),
    /Server tidak mengirim respons \(HTTP 502\).*API SIRKULIT sedang berjalan/,
  )
})

test('reports an actionable error when the API response is not JSON', async () => {
  globalThis.fetch = async () => new Response('<html>proxy error</html>', {
    status: 502,
    headers: { 'Content-Type': 'text/html' },
  })

  await assert.rejects(
    postJson('/api/contact-messages', {}),
    /Respons server tidak valid \(HTTP 502\)/,
  )
})

test('rejects JSON responses that do not contain an object', async () => {
  globalThis.fetch = async () => new Response('null', {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })

  await assert.rejects(
    postJson('/api/waste-registrations', {}),
    /Format respons server tidak sesuai \(HTTP 200\)/,
  )
})

test('returns successful JSON responses and surfaces API validation errors', async () => {
  globalThis.fetch = async () => new Response('{"registrationCode":"SK-2026-12345678"}', {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  })

  assert.deepEqual(await postJson('/api/waste-registrations', {}), {
    registrationCode: 'SK-2026-12345678',
  })

  globalThis.fetch = async () => new Response('{"details":["Nama wajib diisi."]}', {
    status: 400,
    headers: { 'Content-Type': 'application/json' },
  })
  await assert.rejects(postJson('/api/contact-messages', {}), /Nama wajib diisi\./)
})
