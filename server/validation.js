import {
  CONTACT_CATEGORIES,
  ECOSYSTEM_ROLES,
  FRUIT_TYPES,
  ORGANIC_PRODUCTS,
  PRODUCTION_FREQUENCIES,
  WASTE_CONDITIONS,
  WASTE_PRODUCER_TYPES,
} from '../shared/form-options.js'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_PATTERN = /^[+\d\s().-]+$/

function text(value, maximumLength, errors, label) {
  if (value === undefined || value === null) return ''
  if (typeof value !== 'string') {
    errors.push(`${label} harus berupa teks.`)
    return ''
  }
  const normalized = value.trim()
  if (normalized.length > maximumLength) {
    errors.push(`${label} maksimal ${maximumLength} karakter.`)
  }
  return normalized
}

function isValidPhone(value) {
  const digits = value.replace(/\D/g, '')
  return PHONE_PATTERN.test(value) && digits.length >= 8 && digits.length <= 15
}

function isValidEmail(value) {
  return !value || (value.length <= 254 && EMAIL_PATTERN.test(value))
}

function isChoice(value, options) {
  return options.includes(value)
}

function nullableCoordinate(value, label, minimum, maximum, errors) {
  if (value === undefined || value === null || value === '') return null
  const coordinate = Number(value)
  if (!Number.isFinite(coordinate) || coordinate < minimum || coordinate > maximum) {
    errors.push(`${label} harus berada antara ${minimum} dan ${maximum}.`)
    return null
  }
  return coordinate
}

function isAllowedGoogleMapsUrl(value) {
  if (!value) return true
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && [
      'google.com',
      'www.google.com',
      'maps.google.com',
      'maps.app.goo.gl',
      'goo.gl',
    ].includes(url.hostname)
      && (url.hostname !== 'google.com' && url.hostname !== 'www.google.com'
        ? true
        : url.pathname.startsWith('/maps'))
  } catch {
    return false
  }
}

export function validatePartner(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return { errors: ['Data mitra tidak valid.'] }
  }

  const errors = []
  const partner = {
    name: text(payload.name, 160, errors, 'Nama mitra'),
    address: text(payload.address, 500, errors, 'Alamat lengkap'),
    region: text(payload.region, 120, errors, 'Wilayah'),
    latitude: nullableCoordinate(payload.latitude, 'Latitude', -90, 90, errors),
    longitude: nullableCoordinate(payload.longitude, 'Longitude', -180, 180, errors),
    googleMapsUrl: text(payload.googleMapsUrl, 1000, errors, 'Tautan Google Maps'),
    capacityKg: payload.capacityKg === undefined || payload.capacityKg === null || payload.capacityKg === ''
      ? null
      : Number(payload.capacityKg),
    verificationStatus: text(payload.verificationStatus, 20, errors, 'Status verifikasi'),
    isLocationPublic: payload.isLocationPublic,
    acceptedFruitTypes: payload.acceptedFruitTypes,
  }

  if (payload.id !== undefined) {
    partner.id = Number(payload.id)
    if (!Number.isSafeInteger(partner.id) || partner.id < 1) {
      errors.push('ID mitra tidak valid.')
    }
  }
  if (!partner.name) errors.push('Nama mitra wajib diisi.')
  if (!partner.address) errors.push('Alamat lengkap wajib diisi.')
  if (!partner.region) errors.push('Wilayah wajib diisi.')
  if ((partner.latitude === null) !== (partner.longitude === null)) {
    errors.push('Latitude dan longitude harus diisi bersama.')
  }
  if (partner.googleMapsUrl && !isAllowedGoogleMapsUrl(partner.googleMapsUrl)) {
    errors.push('Tautan lokasi harus berupa tautan Google Maps HTTPS yang valid.')
  }
  if (!Array.isArray(partner.acceptedFruitTypes) || partner.acceptedFruitTypes.length === 0) {
    errors.push('Pilih setidaknya satu jenis kulit buah yang diterima.')
    partner.acceptedFruitTypes = []
  } else {
    partner.acceptedFruitTypes = [...new Set(partner.acceptedFruitTypes)]
    if (partner.acceptedFruitTypes.some((type) => !isChoice(type, FRUIT_TYPES))) {
      errors.push('Jenis kulit buah yang diterima tidak valid.')
    }
  }
  if (partner.capacityKg !== null && (
    !Number.isFinite(partner.capacityKg)
    || partner.capacityKg <= 0
    || partner.capacityKg > 10000000
  )) {
    errors.push('Kapasitas harus lebih dari 0 dan maksimal 10.000.000 kg.')
  }
  if (!isChoice(partner.verificationStatus, ['pending', 'verified', 'rejected'])) {
    errors.push('Status verifikasi mitra tidak valid.')
  }
  if (typeof partner.isLocationPublic !== 'boolean') {
    errors.push('Status publikasi lokasi harus berupa pilihan ya atau tidak.')
  }
  if (
    partner.isLocationPublic === true
    && (partner.latitude === null || partner.longitude === null)
  ) {
    errors.push('Koordinat harus tersedia sebelum lokasi diizinkan tampil pada peta.')
  }

  return errors.length ? { errors } : { value: partner }
}

export function validateWasteRegistration(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return { errors: ['Isi formulir tidak valid.'] }
  }

  const errors = []
  const registration = {
    fullName: text(payload.fullName, 120, errors, 'Nama lengkap'),
    businessName: text(payload.businessName, 160, errors, 'Nama usaha/instansi'),
    whatsapp: text(payload.whatsapp, 30, errors, 'Nomor WhatsApp'),
    email: text(payload.email, 254, errors, 'Email').toLowerCase(),
    producerType: text(payload.producerType, 80, errors, 'Jenis penghasil limbah'),
    province: text(payload.province, 100, errors, 'Provinsi'),
    city: text(payload.city, 100, errors, 'Kabupaten/kota'),
    district: text(payload.district, 100, errors, 'Kecamatan'),
    village: text(payload.village, 100, errors, 'Desa/kelurahan'),
    address: text(payload.address, 500, errors, 'Alamat lengkap'),
    fruitType: text(payload.fruitType, 80, errors, 'Jenis kulit buah'),
    quantityKg: Number(payload.quantityKg),
    productionFrequency: text(payload.productionFrequency, 80, errors, 'Frekuensi produksi'),
    wasteCondition: text(payload.wasteCondition, 100, errors, 'Kondisi limbah'),
    notes: text(payload.notes, 1000, errors, 'Keterangan tambahan'),
    consent: payload.consent === true,
  }

  if (!registration.fullName) errors.push('Nama lengkap wajib diisi.')
  if (!isValidPhone(registration.whatsapp)) errors.push('Nomor WhatsApp tidak valid.')
  if (!isValidEmail(registration.email)) errors.push('Format email tidak valid.')
  if (!isChoice(registration.producerType, WASTE_PRODUCER_TYPES)) {
    errors.push('Jenis penghasil limbah tidak valid.')
  }
  if (!registration.province) errors.push('Provinsi wajib diisi.')
  if (!registration.city) errors.push('Kabupaten/kota wajib diisi.')
  if (!registration.district) errors.push('Kecamatan wajib diisi.')
  if (!registration.village) errors.push('Desa/kelurahan wajib diisi.')
  if (!registration.address) errors.push('Alamat lengkap wajib diisi.')
  if (!isChoice(registration.fruitType, FRUIT_TYPES)) errors.push('Jenis kulit buah tidak valid.')
  if (!Number.isFinite(registration.quantityKg) || registration.quantityKg <= 0 || registration.quantityKg > 10000000) {
    errors.push('Jumlah limbah harus lebih dari 0 dan maksimal 10.000.000 kg.')
  }
  if (!isChoice(registration.productionFrequency, PRODUCTION_FREQUENCIES)) {
    errors.push('Frekuensi produksi tidak valid.')
  }
  if (!isChoice(registration.wasteCondition, WASTE_CONDITIONS)) {
    errors.push('Kondisi limbah tidak valid.')
  }
  if (!registration.consent) errors.push('Persetujuan penggunaan data wajib diberikan.')

  return errors.length ? { errors } : { value: registration }
}

export function validateEcosystemRegistration(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return { errors: ['Isi formulir tidak valid.'] }
  }

  const errors = []
  const registration = {
    role: text(payload.role, 20, errors, 'Peran'),
    fullName: text(payload.fullName, 120, errors, 'Nama lengkap'),
    businessName: text(payload.businessName, 160, errors, 'Nama usaha/instansi'),
    whatsapp: text(payload.whatsapp, 30, errors, 'Nomor WhatsApp'),
    email: text(payload.email, 254, errors, 'Email').toLowerCase(),
    province: text(payload.province, 100, errors, 'Provinsi'),
    city: text(payload.city, 100, errors, 'Kabupaten/kota'),
    district: text(payload.district, 100, errors, 'Kecamatan'),
    village: text(payload.village, 100, errors, 'Desa/kelurahan'),
    address: text(payload.address, 500, errors, 'Alamat lengkap'),
    producerType: text(payload.producerType, 80, errors, 'Jenis penghasil limbah'),
    productType: text(payload.productType, 100, errors, 'Jenis produk'),
    processingType: text(payload.processingType, 120, errors, 'Jenis pengolahan'),
    quantityKg: payload.quantityKg === undefined || payload.quantityKg === '' ? null : Number(payload.quantityKg),
    capacityKg: payload.capacityKg === undefined || payload.capacityKg === '' ? null : Number(payload.capacityKg),
    frequency: text(payload.frequency, 80, errors, 'Frekuensi'),
    wasteCondition: text(payload.wasteCondition, 100, errors, 'Kondisi limbah'),
    notes: text(payload.notes, 1000, errors, 'Keterangan tambahan'),
    consent: payload.consent === true,
    directoryConsent: payload.directoryConsent === true,
    mapConsent: payload.mapConsent === true,
    locationConfirmed: payload.locationConfirmed === true,
    latitude: nullableCoordinate(payload.latitude, 'Latitude', -90, 90, errors),
    longitude: nullableCoordinate(payload.longitude, 'Longitude', -180, 180, errors),
    wasteTypes: payload.wasteTypes,
    productTypes: payload.productTypes,
  }

  if (!isChoice(registration.role, Object.keys(ECOSYSTEM_ROLES))) {
    errors.push('Peran pendaftar tidak valid.')
  }
  if (!registration.fullName) errors.push('Nama lengkap wajib diisi.')
  if (!isValidPhone(registration.whatsapp)) errors.push('Nomor WhatsApp tidak valid.')
  if (!isValidEmail(registration.email)) errors.push('Format email tidak valid.')
  if (!registration.province) errors.push('Provinsi wajib diisi.')
  if (!registration.city) errors.push('Kabupaten/kota wajib diisi.')
  if (!registration.district) errors.push('Kecamatan wajib diisi.')
  if (!registration.village) errors.push('Desa/kelurahan wajib diisi.')
  if (!registration.address) errors.push('Alamat lengkap wajib diisi.')
  if (!isChoice(registration.frequency, PRODUCTION_FREQUENCIES)) {
    errors.push('Frekuensi tidak valid.')
  }
  if (!registration.consent) errors.push('Persetujuan penggunaan data wajib diberikan.')
  if ((registration.latitude === null) !== (registration.longitude === null)) {
    errors.push('Titik lokasi harus memiliki latitude dan longitude.')
  }
  if (
    registration.latitude !== null
    && registration.longitude !== null
    && !registration.locationConfirmed
  ) {
    errors.push('Konfirmasi titik lokasi sebelum mengirim pendaftaran.')
  }
  if (
    registration.mapConsent
    && (registration.latitude === null || registration.longitude === null)
  ) {
    errors.push('Pilih dan konfirmasi titik lokasi sebelum mengizinkan publikasi peta.')
  }

  const validateTypes = (types, options, label) => {
    if (!Array.isArray(types) || types.length === 0) {
      errors.push(`Pilih setidaknya satu ${label}.`)
      return []
    }
    const uniqueTypes = [...new Set(types)]
    if (uniqueTypes.some((type) => !isChoice(type, options))) {
      errors.push(`${label[0].toUpperCase()}${label.slice(1)} tidak valid.`)
    }
    return uniqueTypes
  }

  if (registration.role === 'supplier') {
    if (!isChoice(registration.producerType, WASTE_PRODUCER_TYPES)) {
      errors.push('Jenis penghasil limbah tidak valid.')
    }
    registration.wasteTypes = validateTypes(registration.wasteTypes, FRUIT_TYPES, 'jenis limbah')
    if (!Number.isFinite(registration.quantityKg) || registration.quantityKg <= 0 || registration.quantityKg > 10000000) {
      errors.push('Jumlah limbah harus lebih dari 0 dan maksimal 10.000.000 kg.')
    }
    if (!isChoice(registration.wasteCondition, WASTE_CONDITIONS)) {
      errors.push('Kondisi limbah tidak valid.')
    }
    registration.productTypes = []
    registration.productType = ''
    registration.processingType = ''
    registration.capacityKg = null
  } else if (registration.role === 'processor') {
    registration.wasteTypes = validateTypes(registration.wasteTypes, FRUIT_TYPES, 'jenis limbah')
    registration.productTypes = validateTypes(registration.productTypes, ORGANIC_PRODUCTS, 'jenis produk')
    if (!registration.processingType) errors.push('Jenis pengolahan wajib diisi.')
    if (!Number.isFinite(registration.capacityKg) || registration.capacityKg <= 0 || registration.capacityKg > 10000000) {
      errors.push('Kapasitas pengolahan harus lebih dari 0 dan maksimal 10.000.000 kg.')
    }
    registration.producerType = ''
    registration.productType = ''
    registration.quantityKg = null
    registration.wasteCondition = ''
  } else if (registration.role === 'buyer') {
    if (!isChoice(registration.productType, ORGANIC_PRODUCTS)) {
      errors.push('Jenis produk yang dibutuhkan tidak valid.')
    }
    if (!Number.isFinite(registration.quantityKg) || registration.quantityKg <= 0 || registration.quantityKg > 10000000) {
      errors.push('Jumlah kebutuhan harus lebih dari 0 dan maksimal 10.000.000 kg.')
    }
    registration.wasteTypes = []
    registration.productTypes = []
    registration.producerType = ''
    registration.processingType = ''
    registration.capacityKg = null
    registration.wasteCondition = ''
  }

  return errors.length ? { errors } : { value: registration }
}

export function validateContactMessage(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return { errors: ['Isi formulir tidak valid.'] }
  }

  const errors = []
  const contact = {
    name: text(payload.name, 120, errors, 'Nama'),
    email: text(payload.email, 254, errors, 'Email').toLowerCase(),
    whatsapp: text(payload.whatsapp, 30, errors, 'Nomor WhatsApp'),
    category: text(payload.category, 80, errors, 'Kategori pertanyaan'),
    message: text(payload.message, 3000, errors, 'Pesan'),
  }

  if (!contact.name) errors.push('Nama wajib diisi.')
  if (!contact.email && !contact.whatsapp) errors.push('Isi email atau nomor WhatsApp.')
  if (!isValidEmail(contact.email)) errors.push('Format email tidak valid.')
  if (contact.whatsapp && !isValidPhone(contact.whatsapp)) {
    errors.push('Nomor WhatsApp tidak valid.')
  }
  if (!isChoice(contact.category, CONTACT_CATEGORIES)) errors.push('Kategori pertanyaan tidak valid.')
  if (!contact.message) errors.push('Pesan wajib diisi.')

  return errors.length ? { errors } : { value: contact }
}
