import assert from 'node:assert/strict'
import { test } from 'node:test'
import { estimateWasteVolumePerWeek } from '../src/waste-estimate.js'

test('estimates weekly, average monthly, and yearly waste volume', () => {
  assert.deepEqual(estimateWasteVolumePerWeek('2.5', '5'), {
    weeklyKg: 12.5,
    monthlyKg: 12.5 * 52 / 12,
    yearlyKg: 650,
  })
})

test('rejects empty or invalid amounts and operating days', () => {
  for (const [amount, days] of [
    ['', '5'],
    ['0', '5'],
    ['-1', '5'],
    ['2', '0'],
    ['2', '1.5'],
    ['2', '8'],
    ['invalid', '5'],
  ]) {
    assert.equal(estimateWasteVolumePerWeek(amount, days), null)
  }
})
