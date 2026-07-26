import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { formatDuration } from '../src/utils/time'

describe('formatDuration', () => {
  it('formats the default five-minute timer', () => {
    assert.equal(formatDuration(5 * 60), '05:00')
  })

  it('adds an hour segment when needed', () => {
    assert.equal(formatDuration(3723), '1:02:03')
  })

  it('never displays a negative duration', () => {
    assert.equal(formatDuration(-10), '00:00')
  })

  it('can display centiseconds', () => {
    assert.equal(formatDuration(65.42, true), '01:05.42')
  })
})
