import { MALANG_SEED_LOCATIONS } from './malang-locations.js'
import { ECOSYSTEM_ROLES, FRUIT_TYPES, ORGANIC_PRODUCTS } from '../shared/form-options.js'

// Published reference locations already supplied by the project. No user
// registrations or private contacts are read by this public map service.
export function publicMapLocations(locations = MALANG_SEED_LOCATIONS) {
  return locations.filter((location) => location.verificationStatus === 'verified'
    && location.isLocationPublic
    && Number.isFinite(location.latitude) && Math.abs(location.latitude) <= 90
    && Number.isFinite(location.longitude) && Math.abs(location.longitude) <= 180)
    .map((location) => ({
      id: `seed:${location.seedKey}`,
      source: 'seed',
      role: 'processor',
      name: location.name,
      address: location.address,
      whatsapp: location.whatsapp || '',
      province: location.province,
      city: location.city,
      district: location.district,
      latitude: location.latitude,
      longitude: location.longitude,
      googleMapsUrl: location.googleMapsUrl,
      processingType: location.processingType,
      wasteTypes: [],
      productTypes: [],
      productType: '',
      quantityKg: null,
      capacityKg: null,
      frequency: '',
      notes: '',
    }))
}

export function mapApiResponse(url) {
  const allItems = publicMapLocations()
  const params = url.searchParams
  const query = (params.get('q') || '').trim().toLowerCase()
  const role = params.get('role') || ''
  const wasteType = params.get('wasteType') || params.get('fruitType') || ''
  const productType = params.get('productType') || ''
  if ([...params.values()].some((value) => value.length > 120)
    || (role && !Object.hasOwn(ECOSYSTEM_ROLES, role))
    || (wasteType && !FRUIT_TYPES.includes(wasteType))
    || (productType && !ORGANIC_PRODUCTS.includes(productType))) {
    return { status: 400, body: { error: 'Filter pencarian tidak valid.' } }
  }
  const items = allItems.filter((item) => {
    if (role && item.role !== role) return false
    if (wasteType && !item.wasteTypes.includes(wasteType)) return false
    if (productType && item.productType !== productType && !item.productTypes.includes(productType)) return false
    for (const field of ['city', 'district', 'processingType']) {
      const filter = (params.get(field) || '').trim().toLowerCase()
      if (filter && !item[field].toLowerCase().includes(filter)) return false
    }
    const region = (params.get('region') || '').trim().toLowerCase()
    if (region && item.city.toLowerCase() !== region) return false
    return !query || [item.name, item.address, item.city, item.district, item.processingType]
      .join(' ').toLowerCase().includes(query)
  })
  const unique = (field) => [...new Set(allItems.map((item) => item[field]).filter(Boolean))].sort()

  if (url.pathname === '/api/partners') {
    return { status: 200, body: {
      items: items.map((item) => ({ ...item, region: item.city, acceptedFruitTypes: item.wasteTypes })),
      regions: unique('city'),
    } }
  }
  return { status: 200, body: {
    source: 'published-reference-locations',
    items,
    stats: {
      suppliers: 0, processors: allItems.length, buyers: 0,
      totalRegistered: allItems.length, verifiedLocations: allItems.length,
    },
    filters: {
      districts: unique('district'), cities: unique('city'),
      processingTypes: unique('processingType'), productTypes: [],
    },
  } }
}
