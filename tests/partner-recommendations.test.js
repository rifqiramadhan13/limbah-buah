import assert from 'node:assert/strict'
import { test } from 'node:test'
import { recommendProcessors } from '../src/partner-recommendations.js'

test('recommends processors matching selected waste types and prioritizes stronger matches', () => {
  const recommendations = recommendProcessors([
    { id: 1, role: 'processor', wasteTypes: ['Kulit jeruk', 'Kulit pisang'] },
    { id: 2, role: 'processor', wasteTypes: ['Kulit jeruk'] },
    { id: 3, role: 'processor', wasteTypes: ['Kulit apel'] },
    { id: 4, role: 'supplier', wasteTypes: ['Kulit jeruk', 'Kulit pisang'] },
  ], ['Kulit jeruk', 'Kulit pisang'])

  assert.deepEqual(recommendations.map(({ id }) => id), [1, 2])
  assert.deepEqual(recommendations[0].matchingWasteTypes, ['Kulit jeruk', 'Kulit pisang'])
})

test('limits partner recommendations to five profiles', () => {
  const profiles = Array.from({ length: 7 }, (_, index) => ({
    id: index + 1,
    role: 'processor',
    wasteTypes: ['Kulit jeruk'],
  }))

  assert.equal(recommendProcessors(profiles, ['Kulit jeruk']).length, 5)
})
