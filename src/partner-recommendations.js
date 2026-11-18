export function recommendProcessors(profiles, selectedWasteTypes) {
  const selectedTypes = new Set(selectedWasteTypes)

  return profiles
    .filter((profile) => profile.role === 'processor' && Array.isArray(profile.wasteTypes))
    .map((profile) => ({
      ...profile,
      matchingWasteTypes: profile.wasteTypes.filter((type) => selectedTypes.has(type)),
    }))
    .filter((profile) => profile.matchingWasteTypes.length > 0)
    .sort((first, second) => second.matchingWasteTypes.length - first.matchingWasteTypes.length)
    .slice(0, 5)
}
