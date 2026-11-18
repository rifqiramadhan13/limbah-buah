export function estimateWasteVolumePerWeek(dailyKg, daysPerWeek) {
  const dailyAmount = Number(dailyKg)
  const operatingDays = Number(daysPerWeek)

  if (!Number.isFinite(dailyAmount) || dailyAmount <= 0) return null
  if (!Number.isInteger(operatingDays) || operatingDays < 1 || operatingDays > 7) return null

  const weeklyKg = dailyAmount * operatingDays
  return {
    weeklyKg,
    monthlyKg: weeklyKg * 52 / 12,
    yearlyKg: weeklyKg * 52,
  }
}
