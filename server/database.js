import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { DatabaseSync } from 'node:sqlite'

function ensureColumn(database, table, column, definition) {
  const columns = database.prepare(`PRAGMA table_info(${table})`).all()
  if (!columns.some((item) => item.name === column)) {
    database.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`)
  }
}

export function createDatabase(databasePath = path.resolve('data', 'sirkulit.sqlite')) {
  if (databasePath !== ':memory:') {
    mkdirSync(path.dirname(databasePath), { recursive: true })
  }

  const database = new DatabaseSync(databasePath)
  database.exec(`
    PRAGMA foreign_keys = ON;
    PRAGMA journal_mode = WAL;
    PRAGMA busy_timeout = 5000;

    CREATE TABLE IF NOT EXISTS waste_registrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      registration_code TEXT NOT NULL UNIQUE,
      full_name TEXT NOT NULL,
      business_name TEXT,
      whatsapp TEXT NOT NULL,
      email TEXT,
      producer_type TEXT NOT NULL,
      province TEXT NOT NULL,
      city TEXT NOT NULL,
      district TEXT NOT NULL,
      village TEXT NOT NULL,
      address TEXT NOT NULL,
      fruit_type TEXT NOT NULL,
      quantity_kg REAL NOT NULL CHECK (quantity_kg > 0),
      production_frequency TEXT NOT NULL,
      waste_condition TEXT NOT NULL,
      notes TEXT,
      consent_at TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending_review',
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    );

    CREATE INDEX IF NOT EXISTS waste_registrations_status_created
      ON waste_registrations (status, created_at DESC);

    CREATE TABLE IF NOT EXISTS contact_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      message_code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      email TEXT,
      whatsapp TEXT,
      category TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'new',
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    );

    CREATE INDEX IF NOT EXISTS contact_messages_status_created
      ON contact_messages (status, created_at DESC);

    CREATE TABLE IF NOT EXISTS partners (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      address TEXT NOT NULL,
      region TEXT NOT NULL,
      latitude REAL,
      longitude REAL,
      google_maps_url TEXT,
      accepted_fruit_types TEXT NOT NULL,
      capacity_kg REAL,
      verification_status TEXT NOT NULL DEFAULT 'pending'
        CHECK (verification_status IN ('pending', 'verified', 'rejected')),
      is_location_public INTEGER NOT NULL DEFAULT 0
        CHECK (is_location_public IN (0, 1)),
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      CHECK (
        (latitude IS NULL AND longitude IS NULL) OR
        (latitude BETWEEN -90 AND 90 AND longitude BETWEEN -180 AND 180)
      )
    );

    CREATE INDEX IF NOT EXISTS partners_public_region_name
      ON partners (verification_status, is_location_public, region, name);

    CREATE TABLE IF NOT EXISTS ecosystem_registrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      registration_code TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL CHECK (role IN ('supplier', 'processor', 'buyer')),
      full_name TEXT NOT NULL,
      business_name TEXT,
      whatsapp TEXT NOT NULL,
      email TEXT,
      province TEXT NOT NULL,
      city TEXT NOT NULL,
      district TEXT NOT NULL,
      village TEXT NOT NULL,
      address TEXT NOT NULL,
      producer_type TEXT,
      waste_types TEXT NOT NULL DEFAULT '[]',
      product_types TEXT NOT NULL DEFAULT '[]',
      product_type TEXT,
      processing_type TEXT,
      quantity_kg REAL,
      capacity_kg REAL,
      frequency TEXT NOT NULL,
      waste_condition TEXT,
      notes TEXT,
      consent_at TEXT NOT NULL,
      directory_consent_at TEXT,
      latitude REAL,
      longitude REAL,
      location_status TEXT NOT NULL DEFAULT 'unverified'
        CHECK (location_status IN ('unverified', 'google_verified', 'user_confirmed')),
      map_consent_at TEXT,
      status TEXT NOT NULL DEFAULT 'pending_review'
        CHECK (status IN ('pending_review', 'verified', 'rejected')),
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      CHECK (
        (latitude IS NULL AND longitude IS NULL) OR
        (latitude BETWEEN -90 AND 90 AND longitude BETWEEN -180 AND 180)
      )
    );

    CREATE INDEX IF NOT EXISTS ecosystem_registrations_public_role_location
      ON ecosystem_registrations (status, directory_consent_at, role, province, city);

    CREATE TABLE IF NOT EXISTS ecosystem_seed_locations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      seed_key TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      address TEXT NOT NULL,
      whatsapp TEXT NOT NULL,
      province TEXT NOT NULL,
      city TEXT NOT NULL,
      district TEXT NOT NULL,
      google_maps_url TEXT NOT NULL,
      processing_type TEXT NOT NULL,
      latitude REAL,
      longitude REAL,
      location_status TEXT NOT NULL DEFAULT 'unverified'
        CHECK (location_status IN ('unverified', 'google_verified', 'admin_verified')),
      verification_status TEXT NOT NULL DEFAULT 'pending'
        CHECK (verification_status IN ('pending', 'verified', 'rejected')),
      is_location_public INTEGER NOT NULL DEFAULT 0
        CHECK (is_location_public IN (0, 1)),
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      CHECK (
        (latitude IS NULL AND longitude IS NULL) OR
        (latitude BETWEEN -90 AND 90 AND longitude BETWEEN -180 AND 180)
      )
    );

    CREATE INDEX IF NOT EXISTS ecosystem_seed_locations_public
      ON ecosystem_seed_locations (verification_status, is_location_public, city, district);

    CREATE TABLE IF NOT EXISTS geocode_cache (
      address_hash TEXT PRIMARY KEY,
      latitude REAL,
      longitude REAL,
      location_status TEXT NOT NULL
        CHECK (location_status IN ('google_verified', 'not_found', 'unverified')),
      location_type TEXT,
      formatted_address TEXT,
      checked_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      CHECK (
        (latitude IS NULL AND longitude IS NULL) OR
        (latitude BETWEEN -90 AND 90 AND longitude BETWEEN -180 AND 180)
      )
    );
  `)

  ensureColumn(database, 'ecosystem_registrations', 'latitude', 'REAL')
  ensureColumn(database, 'ecosystem_registrations', 'longitude', 'REAL')
  ensureColumn(database, 'ecosystem_registrations', 'location_status', "TEXT NOT NULL DEFAULT 'unverified'")
  ensureColumn(database, 'ecosystem_registrations', 'map_consent_at', 'TEXT')
  ensureColumn(database, 'ecosystem_registrations', 'processing_type', 'TEXT')

  return database
}
