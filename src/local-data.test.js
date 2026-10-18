import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  defaultPreferences,
  deleteAllData,
  loadPreferences,
  loadSessions,
  savePreferences,
  saveSession,
} from './local-data.js'

function createStorage() {
  const values = new Map()
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
  }
}

test('uses local-saving-off defaults without writing any data', () => {
  const storage = createStorage()
  assert.deepEqual(loadPreferences(storage), defaultPreferences)
  assert.deepEqual(loadSessions(storage), [])
})

test('saves validated voice preferences and session check-ins locally', () => {
  const storage = createStorage()
  const preferences = { ...defaultPreferences, voice: 'oak', saveLocally: true }
  const session = {
    completedAt: new Date().toISOString(),
    moodBefore: '2',
    moodAfter: '4',
    trigger: 'lonely',
    actionId: 'tiny-water',
    actionCompleted: false,
  }

  savePreferences(preferences, storage)
  saveSession(session, storage)

  assert.deepEqual(loadPreferences(storage), preferences)
  assert.deepEqual(loadSessions(storage), [session])
})

test('rejects malformed local records instead of silently discarding them', () => {
  const storage = createStorage()
  storage.setItem('ember.sessions.v1', '{broken')
  assert.throws(() => loadSessions(storage), /could not be read/)

  storage.setItem('ember.sessions.v1', JSON.stringify([{ completedAt: 'not-a-date' }]))
  assert.throws(() => loadSessions(storage), /invalid/)
})

test('deletes preferences and saved check-ins from local storage', () => {
  const storage = createStorage()
  savePreferences({ ...defaultPreferences, saveLocally: true }, storage)
  saveSession({
    completedAt: new Date().toISOString(),
    moodBefore: null,
    moodAfter: null,
    trigger: null,
    actionId: null,
    actionCompleted: null,
  }, storage)

  deleteAllData(storage)

  assert.deepEqual(loadPreferences(storage), defaultPreferences)
  assert.deepEqual(loadSessions(storage), [])
})
