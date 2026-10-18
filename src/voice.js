const replies = {
  bored: {
    gesture: 'slow_blink_tilt',
    lines: {
      ember: {
        plain: 'That restless, nothing-feels-right feeling can be a lot. You don’t have to make sense of it right now.',
        warm: 'That restless feeling can be exhausting. You don’t have to make sense of it all tonight.',
        playful: 'A restless scroll can leave everything feeling loud. No need to untangle the whole internet tonight.',
        direct: 'That restless feeling can be a lot. Stay with this moment.',
      },
      oak: {
        plain: 'Restlessness can wear you out. One moment at a time is enough.',
        warm: 'That restless feeling can take a lot out of you. You can let this moment be enough.',
        playful: 'Sometimes the scroll leaves your brain with too many tabs open. You can close them one at a time.',
        direct: 'That sounds tiring. Take this one moment at a time.',
      },
      spark: {
        plain: 'Everything can feel a little noisy after a long scroll. You can pause here.',
        warm: 'That unsettled feeling is a lot to carry. There’s room to pause here.',
        playful: 'Your feed can be a very loud roommate. It’s okay to take a little quiet.',
        direct: 'That feels restless. A pause is enough.',
      },
    },
  },
  lonely: {
    gesture: 'give_space',
    lines: {
      ember: {
        plain: 'Lonely can feel loud after a long scroll. You don’t have to explain.',
        warm: 'Feeling lonely can weigh on you. You don’t have to explain it here.',
        playful: 'A crowded feed can still leave a quiet feeling. You don’t have to explain it.',
        direct: 'That sounds lonely. You don’t have to explain.',
      },
      oak: {
        plain: 'That sounds like a lonely moment. It’s okay to name it simply.',
        warm: 'I hear that this feels lonely. You can take your time with it.',
        playful: 'A feed full of people can still feel strangely quiet. That can be hard.',
        direct: 'That sounds lonely. Take your time.',
      },
      spark: {
        plain: 'Loneliness can show up even when the screen is full. You’re allowed to notice it.',
        warm: 'That lonely feeling matters. You can let it be here without solving it.',
        playful: 'The screen can be busy while the room feels quiet. That’s a real contrast.',
        direct: 'That’s a lonely feeling. It’s okay to notice it.',
      },
    },
  },
  comparing: {
    gesture: 'slow_blink_tilt',
    lines: {
      ember: {
        plain: 'Seeing everyone’s highlight reel can sting. Your night doesn’t need to measure up.',
        warm: 'Those comparisons can really sting. Your night is allowed to be its own.',
        playful: 'A feed is a highlight reel, not the whole movie. Your night doesn’t need to compete.',
        direct: 'That comparison hurts. Your night doesn’t need to measure up.',
      },
      oak: {
        plain: 'It can hurt to measure your life against a feed. You can set that measure down for tonight.',
        warm: 'That comparison sounds heavy. You deserve room to have your own kind of night.',
        playful: 'A highlight reel leaves out a lot of the actual film. You don’t have to compete with it.',
        direct: 'That comparison hurts. You can set it down for tonight.',
      },
      spark: {
        plain: 'Everyone else’s best moments can make your own night feel smaller. They don’t define it.',
        warm: 'It’s understandable that those comparisons sting. Your night still belongs to you.',
        playful: 'The feed shows the trailer, not the whole story. No need to audition against it.',
        direct: 'That stings. Your night is yours.',
      },
    },
  },
  future: {
    gesture: 'lantern_hands',
    lines: {
      ember: {
        plain: 'The future can feel huge when it all lands at once. We can stay with just tonight.',
        warm: 'That’s a lot to hold about the future. Tonight is enough to focus on for now.',
        playful: 'The future likes to arrive all at once. We can leave tomorrow’s tabs unopened for a bit.',
        direct: 'That feels big. Stay with tonight for now.',
      },
      oak: {
        plain: 'Worry about what’s ahead can crowd the present. You can take this one piece at a time.',
        warm: 'It makes sense that the future feels heavy right now. You don’t have to carry it all tonight.',
        playful: 'The future can be a noisy planner. You only need to be in this evening.',
        direct: 'That’s a lot. One piece at a time.',
      },
      spark: {
        plain: 'Thinking ahead can make everything feel bigger. This moment is smaller.',
        warm: 'It’s okay if the future feels like a lot. You can come back to this moment.',
        playful: 'The future is trying to book your whole calendar at once. Tonight can stay unscheduled.',
        direct: 'That feels huge. Come back to this moment.',
      },
    },
  },
  unsure: {
    gesture: 'settling_palm',
    lines: {
      ember: {
        plain: 'Not knowing is a real answer. We can start there.',
        warm: 'It’s okay not to know yet. We can start exactly there.',
        playful: '“Not sure” counts as an answer. No extra paperwork needed.',
        direct: 'Not sure is enough. Start there.',
      },
      oak: {
        plain: 'You don’t need a clear answer right now. “Not sure” is enough.',
        warm: 'You can take your time finding words. Not knowing is okay too.',
        playful: 'You can leave the question mark where it is for now.',
        direct: 'You don’t know yet. That’s okay.',
      },
      spark: {
        plain: 'Not knowing can be the honest place to begin. No rush to label it.',
        warm: 'You’re allowed to be unsure. There’s no need to force an answer.',
        playful: 'The answer can stay in draft mode for tonight.',
        direct: 'Not sure is a place to begin.',
      },
    },
  },
}

export const voiceCards = Object.freeze({
  ember: { name: 'Ember', description: 'Warm, steady, and close to the original guide.' },
  oak: { name: 'Oak', description: 'A little more grounded and direct.' },
  spark: { name: 'Spark', description: 'A little brighter, with gentle humor about the situation.' },
})

export function buildTriggerReply(trigger, preferences) {
  const entry = replies[trigger]
  if (!entry) throw new Error(`Unknown trigger: ${trigger}`)

  const voice = voiceCards[preferences.voice] ? preferences.voice : 'ember'
  const lines = entry.lines[voice]
  const text = preferences.directness >= 80
    ? lines.direct
    : preferences.playfulness >= 70
      ? lines.playful
      : preferences.warmth >= 70
        ? lines.warm
        : lines.plain

  return { text, gesture: entry.gesture }
}
