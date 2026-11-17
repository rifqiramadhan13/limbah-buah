import { geocodeAddress } from './geocoding.js'

export const MALANG_SEED_LOCATIONS = [
  {
    seedKey: 'griyo-maggot-bsf-tirtawangi-farm',
    name: 'Griyo Maggot BSF & Tirtawangi Farm',
    address: 'Perum Cluster Segaran Indah Gg. Mangir No.Kav-07, RT.06/RW.09, Cerme, Kendalpayak, Kec. Pakisaji, Kabupaten Malang, Jawa Timur 65162.',
    whatsapp: '081235306540',
    province: 'Jawa Timur',
    city: 'Kabupaten Malang',
    district: 'Pakisaji',
    googleMapsUrl: 'https://maps.app.goo.gl/TPCg9e3MJ1yrBwwX7?g_st=iw',
    processingType: 'Budidaya maggot BSF',
  },
  {
    seedKey: 'grand-larva-maggot-bsf-malang',
    name: 'Grand Larva Maggot BSF Malang',
    address: 'Jl. Perum Joyo Grand kavling Depag 2 No.52, Merjosari, Kec. Lowokwaru, Kota Malang, Jawa Timur 65144.',
    whatsapp: '0895413346797',
    province: 'Jawa Timur',
    city: 'Kota Malang',
    district: 'Lowokwaru',
    googleMapsUrl: 'https://maps.app.goo.gl/stMoHwwNqiRXpKDd6?g_st=iw',
    processingType: 'Budidaya maggot BSF',
  },
  {
    seedKey: 'biokomposer-cacing-s-supriyadi',
    name: 'Kompleks Pengolahan Limbah Organik Dengan Biokomposer Cacing',
    address: 'Jalan S. Supriadi 9 A No.13, Sukun, Kec. Sukun, Kota Malang, Jawa Timur 65147.',
    whatsapp: '03415366267',
    province: 'Jawa Timur',
    city: 'Kota Malang',
    district: 'Sukun',
    googleMapsUrl: 'https://maps.app.goo.gl/pjQrpbQuFqzViYCv9?g_st=iw',
    processingType: 'Pengolahan limbah organik menggunakan biokomposer cacing',
  },
  {
    seedKey: 'tpst-3r-mulyoagung-bersatu',
    name: 'TPST 3R Mulyoagung Bersatu',
    address: 'Jl. TPST No.01, Jetak Lor, Mulyoagung, Kec. Dau, Kabupaten Malang, Jawa Timur 65151.',
    whatsapp: '081335555131',
    province: 'Jawa Timur',
    city: 'Kabupaten Malang',
    district: 'Dau',
    googleMapsUrl: 'https://maps.app.goo.gl/J4vVmvYaev3rj9VAA?g_st=iw',
    processingType: 'Pengelolaan dan pemilahan limbah melalui TPST 3R',
  },
  {
    seedKey: 'maggot-bsf-metia-larva',
    name: 'Maggot BSF Metia Larva',
    address: 'Jl. Raya Dermo No.113A, Jetis, Mulyoagung, Kec. Dau, Kabupaten Malang, Jawa Timur 65151.',
    whatsapp: '085604756995',
    province: 'Jawa Timur',
    city: 'Kabupaten Malang',
    district: 'Dau',
    googleMapsUrl: 'https://maps.app.goo.gl/8AxoAGXycXWVe6mz6',
    processingType: 'Budidaya maggot BSF',
  },
]

export function seedMalangLocations(database) {
  const insert = database.prepare(`
    INSERT OR IGNORE INTO ecosystem_seed_locations (
      seed_key, name, address, whatsapp, province, city, district,
      google_maps_url, processing_type
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  for (const location of MALANG_SEED_LOCATIONS) {
    insert.run(
      location.seedKey,
      location.name,
      location.address,
      location.whatsapp,
      location.province,
      location.city,
      location.district,
      location.googleMapsUrl,
      location.processingType,
    )
  }
}

export async function verifyMalangSeedLocations(database, apiKey = process.env.GOOGLE_GEOCODING_API_KEY) {
  if (!apiKey) return { verified: 0, pending: MALANG_SEED_LOCATIONS.length }

  const pending = database.prepare(`
    SELECT seed_key AS seedKey, address
    FROM ecosystem_seed_locations
    WHERE location_status = 'unverified'
  `).all()
  let verified = 0

  for (const location of pending) {
    try {
      const result = await geocodeAddress(database, location.address, apiKey)
      if (result.status !== 'google_verified') continue
      database.prepare(`
        UPDATE ecosystem_seed_locations SET
          latitude = ?, longitude = ?, location_status = 'google_verified',
          verification_status = 'verified', is_location_public = 1
        WHERE seed_key = ?
      `).run(result.latitude, result.longitude, location.seedKey)
      verified += 1
    } catch (error) {
      console.error(
        `Geocoding lokasi awal ${location.seedKey} gagal:`,
        error instanceof Error ? error.message : 'Kesalahan tidak diketahui',
      )
    }
  }

  return { verified, pending: pending.length - verified }
}
