import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { DatabaseSync } from 'node:sqlite'

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
  `)

  return database
}
