import assert from 'node:assert/strict'
import { test } from 'node:test'
import { defaultPreferences } from './local-data.js'
import { buildTriggerReply, voiceCards } from './voice.js'

const gestures = {
  bored: 'slow_blink_tilt',
  lonely: 'give_space',
  comparing: 'slow_blink_tilt',
  future: 'lantern_hands',
  unsure: 'settling_palm',
}

test('voice swaps preserve the fixed gesture for every trigger', () => {
  for (const trigger of Object.keys(gestures)) {
    for (const voice of Object.keys(voiceCards)) {
      const reply = buildTriggerReply(trigger, { ...defaultPreferences, voice })
      assert.equal(reply.gesture, gestures[trigger])
      assert.ok(reply.text.length > 0)
    }
  }
})

test('voice sliders change only the scripted wording, not the selected trigger response', () => {
  const variants = [
    { warmth: 20, directness: 20, playfulness: 0 },
    { warmth: 100, directness: 20, playfulness: 0 },
    { warmth: 20, directness: 85, playfulness: 0 },
    { warmth: 20, directness: 20, playfulness: 90 },
  ].map((sliders) => buildTriggerReply('lonely', {
    ...defaultPreferences,
    ...sliders,
  }))

  assert.equal(new Set(variants.map(({ text }) => text)).size, variants.length)
  assert.ok(variants.every(({ gesture }) => gesture === 'give_space'))
})

test('all voice scripts stay short and avoid prohibited relationship or shame language', () => {
  for (const trigger of Object.keys(gestures)) {
    for (const voice of Object.keys(voiceCards)) {
      for (const preferences of [
        { warmth: 0, directness: 0, playfulness: 0 },
        { warmth: 100, directness: 0, playfulness: 0 },
        { warmth: 0, directness: 100, playfulness: 0 },
        { warmth: 0, directness: 0, playfulness: 100 },
      ]) {
        const { text } = buildTriggerReply(trigger, {
          ...defaultPreferences,
          voice,
          ...preferences,
        })
        assert.ok((text.match(/[.!?]+(?=\s|$)/g) || []).length <= 2)
        assert.doesNotMatch(text, /\b(?:I love you|I missed you|sweetheart|darling|lazy|streak)\b/i)
      }
    }
  }
})

test('rejects unknown trigger keys', () => {
  assert.throws(() => buildTriggerReply('free-text', defaultPreferences), /Unknown trigger/)
})
