CREATE TABLE IF NOT EXISTS waste_registrations (
  id BIGSERIAL PRIMARY KEY,
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
  quantity_kg DOUBLE PRECISION NOT NULL CHECK (quantity_kg > 0),
  production_frequency TEXT NOT NULL,
  waste_condition TEXT NOT NULL,
  notes TEXT,
  consent_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending_review',
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS waste_registrations_status_created
  ON waste_registrations (status, created_at DESC);

CREATE TABLE IF NOT EXISTS contact_messages (
  id BIGSERIAL PRIMARY KEY,
  message_code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  email TEXT,
  whatsapp TEXT,
  category TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS contact_messages_status_created
  ON contact_messages (status, created_at DESC);

CREATE TABLE IF NOT EXISTS partners (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  region TEXT NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  google_maps_url TEXT,
  accepted_fruit_types TEXT NOT NULL,
  capacity_kg DOUBLE PRECISION,
  verification_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  is_location_public INTEGER NOT NULL DEFAULT 0 CHECK (is_location_public IN (0, 1)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (
    (latitude IS NULL AND longitude IS NULL) OR
    (latitude BETWEEN -90 AND 90 AND longitude BETWEEN -180 AND 180)
  )
);
CREATE INDEX IF NOT EXISTS partners_public_region_name
  ON partners (verification_status, is_location_public, region, name);

CREATE TABLE IF NOT EXISTS ecosystem_registrations (
  id BIGSERIAL PRIMARY KEY,
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
  quantity_kg DOUBLE PRECISION,
  capacity_kg DOUBLE PRECISION,
  frequency TEXT NOT NULL,
  waste_condition TEXT,
  notes TEXT,
  consent_at TIMESTAMPTZ NOT NULL,
  directory_consent_at TIMESTAMPTZ,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  location_status TEXT NOT NULL DEFAULT 'unverified'
    CHECK (location_status IN ('unverified', 'google_verified', 'user_confirmed')),
  map_consent_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending_review'
    CHECK (status IN ('pending_review', 'verified', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (
    (latitude IS NULL AND longitude IS NULL) OR
    (latitude BETWEEN -90 AND 90 AND longitude BETWEEN -180 AND 180)
  )
);
CREATE INDEX IF NOT EXISTS ecosystem_registrations_public_role_location
  ON ecosystem_registrations (status, directory_consent_at, role, province, city);

CREATE TABLE IF NOT EXISTS ecosystem_seed_locations (
  id BIGSERIAL PRIMARY KEY,
  seed_key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  province TEXT NOT NULL,
  city TEXT NOT NULL,
  district TEXT NOT NULL,
  google_maps_url TEXT NOT NULL,
  processing_type TEXT NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  location_status TEXT NOT NULL DEFAULT 'unverified'
    CHECK (location_status IN ('unverified', 'google_verified', 'admin_verified')),
  verification_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  is_location_public INTEGER NOT NULL DEFAULT 0 CHECK (is_location_public IN (0, 1)),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (
    (latitude IS NULL AND longitude IS NULL) OR
    (latitude BETWEEN -90 AND 90 AND longitude BETWEEN -180 AND 180)
  )
);
CREATE INDEX IF NOT EXISTS ecosystem_seed_locations_public
  ON ecosystem_seed_locations (verification_status, is_location_public, city, district);

CREATE TABLE IF NOT EXISTS geocode_cache (
  address_hash TEXT PRIMARY KEY,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  location_status TEXT NOT NULL
    CHECK (location_status IN ('google_verified', 'not_found', 'unverified')),
  location_type TEXT,
  formatted_address TEXT,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (
    (latitude IS NULL AND longitude IS NULL) OR
    (latitude BETWEEN -90 AND 90 AND longitude BETWEEN -180 AND 180)
  )
);

ALTER TABLE waste_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE ecosystem_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ecosystem_seed_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE geocode_cache ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE
  waste_registrations,
  contact_messages,
  partners,
  ecosystem_registrations,
  ecosystem_seed_locations,
  geocode_cache
FROM PUBLIC;

DO $$
DECLARE
  api_role TEXT;
BEGIN
  FOREACH api_role IN ARRAY ARRAY['anon', 'authenticated', 'service_role'] LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = api_role) THEN
      EXECUTE format(
        'REVOKE ALL ON TABLE waste_registrations, contact_messages, partners, ecosystem_registrations, ecosystem_seed_locations, geocode_cache FROM %I',
        api_role
      );
    END IF;
  END LOOP;
END;
$$;
