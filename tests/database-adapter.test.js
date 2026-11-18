import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { test } from 'node:test'
import { createApiHandler } from '../server/app.js'
import { createDatabase } from '../server/database.js'
import { invokeApiHandler } from '../server/netlify-adapter.js'
import {
  createPostgresDatabase,
  translateSqliteSql,
} from '../server/postgres-database.js'

test('translates SQLite query syntax and preserves parameter order for Postgres', () => {
  const sql = translateSqliteSql(`
    SELECT full_name AS fullName, created_at AS createdAt
    FROM waste_registrations
    WHERE instr(lower(city), ?) > 0 AND id = ?
      AND created_at < strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
  `)

  assert.match(sql, /full_name AS "fullName"/)
  assert.match(sql, /created_at AS "createdAt"/)
  assert.match(sql, /strpos\(lower\(city\), \$1\)/)
  assert.match(sql, /id = \$2/)
  assert.match(sql, /CURRENT_TIMESTAMP/)
  assert.match(translateSqliteSql(
    'INSERT INTO partners (name) VALUES (?)',
  ), /VALUES \(\$1\) RETURNING id$/)
})

test('Postgres initialization fails clearly instead of falling back without a connection string', async () => {
  await assert.rejects(
    createPostgresDatabase(''),
    /DATABASE_URL wajib dikonfigurasi/,
  )
})

test('the Postgres migration creates all current application tables and migrations tracking', async () => {
  const schema = await readFile(
    path.resolve('server/migrations/001_initial_schema.sql'),
    'utf8',
  )

  for (const table of [
    'waste_registrations',
    'contact_messages',
    'partners',
    'ecosystem_registrations',
    'ecosystem_seed_locations',
    'geocode_cache',
  ]) {
    assert.match(schema, new RegExp(`CREATE TABLE IF NOT EXISTS ${table}`))
  }
  assert.match(schema, /consent_at TIMESTAMPTZ NOT NULL/)
  assert.match(schema, /accepted_fruit_types TEXT NOT NULL/)
  assert.match(schema, /ALTER TABLE waste_registrations ENABLE ROW LEVEL SECURITY/)
  assert.match(schema, /REVOKE ALL ON TABLE[\s\S]*FROM PUBLIC/)
})

test('Netlify function adapter routes requests through the same API handler', async () => {
  const database = createDatabase(':memory:')
  const apiHandler = createApiHandler({ database })

  try {
    const health = await invokeApiHandler(apiHandler, {
      path: '/.netlify/functions/api/health',
      httpMethod: 'GET',
      headers: {},
    })
    assert.equal(health.statusCode, 200)
    assert.deepEqual(JSON.parse(health.body), { status: 'ok' })

    const invalidRegistration = await invokeApiHandler(apiHandler, {
      path: '/api/waste-registrations',
      rawQuery: '',
      httpMethod: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ consent: false }),
    })
    assert.equal(invalidRegistration.statusCode, 400)
    assert.equal(database.prepare('SELECT COUNT(*) AS count FROM waste_registrations').get().count, 0)
  } finally {
    database.close()
  }
})
