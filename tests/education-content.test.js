import assert from 'node:assert/strict'
import { test } from 'node:test'
import { educationTopics } from '../src/education-content.js'

test('provides detailed, sourced content for each education topic', () => {
  assert.deepEqual(
    educationTopics.map((topic) => topic.title),
    ['Karakteristik kimia', 'Proses pengolahan', 'Kimia berkelanjutan'],
  )

  for (const topic of educationTopics) {
    assert.ok(topic.introduction.length > 100)
    assert.ok(topic.sections.length >= 3)
    assert.ok(topic.sources.length >= 2)

    for (const section of topic.sections) {
      assert.ok(section.paragraphs.length > 0)
    }

    for (const source of topic.sources) {
      assert.ok(source.authors)
      assert.ok(source.publisher)
      assert.match(source.url, /^https:\/\//)
    }
  }
})
