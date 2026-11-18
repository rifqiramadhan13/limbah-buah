import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import pg from 'pg'

const { Pool } = pg
const MIGRATIONS_DIRECTORY = resolve(process.cwd(), 'server', 'migrations')
const MIGRATIONS = ['001_initial_schema.sql']

function normalizeRow(row) {
  return Object.fromEntries(Object.entries(row).map(([key, value]) => {
    if (value !== null && typeof value === 'string' && ['id', 'count'].includes(key)) {
      const number = Number(value)
      if (Number.isSafeInteger(number)) return [key, number]
    }
    return [key, value]
  }))
}

export function translateSqliteSql(sql) {
  let parameterIndex = 0
  let translated = sql
    .replace(/strftime\('%Y-%m-%dT%H:%M:%fZ',\s*'now'\)/g,
      'CURRENT_TIMESTAMP')
    .replace(/\binstr\s*\(/gi, 'strpos(')
    .replace(/\bAS\s+([a-z][A-Za-z0-9]*[A-Z][A-Za-z0-9]*)\b/g, 'AS "$1"')
    .replace(/\?/g, () => `$${++parameterIndex}`)

  const insertWithId = /^\s*INSERT\s+INTO\s+(waste_registrations|contact_messages|partners|ecosystem_registrations|ecosystem_seed_locations)\b/i
  if (insertWithId.test(translated) && !/\bRETURNING\b/i.test(translated)) {
    translated = `${translated.trim().replace(/;$/, '')} RETURNING id`
  }
  return translated
}

function createStatement(pool, sql) {
  const query = translateSqliteSql(sql)
  return {
    async get(...values) {
      const result = await pool.query(query, values)
      return result.rows[0] ? normalizeRow(result.rows[0]) : undefined
    },
    async all(...values) {
      const result = await pool.query(query, values)
      return result.rows.map(normalizeRow)
    },
    async run(...values) {
      const result = await pool.query(query, values)
      return {
        changes: result.rowCount,
        lastInsertRowid: result.rows[0]?.id,
      }
    },
  }
}

export async function createPostgresDatabase(connectionString = process.env.DATABASE_URL) {
  if (!connectionString) {
    throw new Error('DATABASE_URL wajib dikonfigurasi untuk database PostgreSQL.')
  }

  const pool = new Pool({
    connectionString,
    max: 2,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 10000,
  })

  try {
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      await client.query("SELECT pg_advisory_xact_lock(hashtext('sirkulit_schema_migrations'))")
      await client.query(`
        CREATE TABLE IF NOT EXISTS sirkulit_schema_migrations (
          name TEXT PRIMARY KEY,
          applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `)
      await client.query(`
        ALTER TABLE sirkulit_schema_migrations ENABLE ROW LEVEL SECURITY;
        REVOKE ALL ON TABLE sirkulit_schema_migrations FROM PUBLIC
      `)
      await client.query(`
        DO $$
        DECLARE
          api_role TEXT;
        BEGIN
          FOREACH api_role IN ARRAY ARRAY['anon', 'authenticated', 'service_role'] LOOP
            IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = api_role) THEN
              EXECUTE format('REVOKE ALL ON TABLE sirkulit_schema_migrations FROM %I', api_role);
            END IF;
          END LOOP;
        END;
        $$
      `)
      for (const migration of MIGRATIONS) {
        const applied = await client.query(
          'SELECT 1 FROM sirkulit_schema_migrations WHERE name = $1',
          [migration],
        )
        if (applied.rowCount) continue
        const schema = await readFile(resolve(MIGRATIONS_DIRECTORY, migration), 'utf8')
        await client.query(schema)
        await client.query(
          'INSERT INTO sirkulit_schema_migrations (name) VALUES ($1)',
          [migration],
        )
      }
      await client.query('COMMIT')
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  } catch (error) {
    await pool.end()
    throw error
  }

  return {
    prepare(sql) {
      return createStatement(pool, sql)
    },
    async close() {
      await pool.end()
    },
  }
}
