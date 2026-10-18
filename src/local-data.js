export const PREFERENCES_KEY = 'ember.preferences.v1'
export const SESSIONS_KEY = 'ember.sessions.v1'

export const defaultPreferences = Object.freeze({
  voice: 'ember',
  warmth: 65,
  directness: 55,
  playfulness: 20,
  pace: 45,
  saveLocally: false,
  readAloud: false,
  theme: 'dark',
})

const voices = new Set(['ember', 'oak', 'spark'])

function parseStored(storage, key, fallback) {
  const value = storage.getItem(key)
  if (value === null) return fallback
  try {
    return JSON.parse(value)
  } catch {
    throw new Error(`Saved Ember data (${key}) could not be read. Use Settings to delete it and start fresh.`)
  }
}

export function loadPreferences(storage = localStorage) {
  const value = parseStored(storage, PREFERENCES_KEY, defaultPreferences)
  const valid = value
    && typeof value === 'object'
    && voices.has(value.voice)
    && ['warmth', 'directness', 'playfulness', 'pace'].every((key) => Number.isInteger(value[key]) && value[key] >= 0 && value[key] <= 100)
    && typeof value.saveLocally === 'boolean'
    && typeof value.readAloud === 'boolean'
    && ['dark', 'light'].includes(value.theme)
  if (!valid) throw new Error('Saved Ember preferences are invalid. Use Settings to delete them and start fresh.')
  return { ...defaultPreferences, ...value }
}

export function savePreferences(preferences, storage = localStorage) {
  storage.setItem(PREFERENCES_KEY, JSON.stringify(preferences))
}

export function loadSessions(storage = localStorage) {
  const value = parseStored(storage, SESSIONS_KEY, [])
  const valid = Array.isArray(value) && value.every((session) => (
    session
    && typeof session === 'object'
    && Number.isFinite(Date.parse(session.completedAt))
    && (session.moodBefore === null || /^[1-5]$/.test(session.moodBefore))
    && (session.moodAfter === null || /^[1-5]$/.test(session.moodAfter))
    && (session.trigger === null || typeof session.trigger === 'string')
    && (session.actionId === null || typeof session.actionId === 'string')
    && (session.actionCompleted === null || typeof session.actionCompleted === 'boolean')
  ))
  if (!valid) throw new Error('Saved session data is invalid. Use Settings to delete it and start fresh.')
  return value
}

export function saveSession(session, storage = localStorage) {
  const sessions = loadSessions(storage)
  storage.setItem(SESSIONS_KEY, JSON.stringify([...sessions, session].slice(-200)))
}

export function deleteAllData(storage = localStorage) {
  storage.removeItem(PREFERENCES_KEY)
  storage.removeItem(SESSIONS_KEY)
}
