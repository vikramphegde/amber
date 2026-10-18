const urgentRiskPatterns = [
  /\b(?:i(?:'m| am)?\s*)?(?:going to|plan(?:ning)? to|intend to|about to)\s+(?:kill myself|end my life|take my life|hurt myself|harm myself|cut myself|overdose)\b/i,
  /\b(?:i(?:'m| am)?\s*)?(?:might|may|could)\s+(?:kill myself|end my life|take my life|hurt myself|harm myself|cut myself|overdose)\b/i,
  /\b(?:i want to|i wanna)\s+(?:die|kill myself|end my life|take my life|hurt myself|harm myself)\b/i,
  /\b(?:i can't|i cannot|i don't think i can|i do not think i can)\s+(?:keep myself safe|stop myself from (?:hurting|killing) myself)\b/i,
  /\b(?:i(?:'m| am)?\s*)?(?:suicidal|going to commit suicide)\b/i,
  /\b(?:i(?:'m| am)?\s*)?(?:in immediate danger|not safe right now|about to hurt someone)\b/i,
  /\b(?:someone|he|she|they)\s+(?:is|are)\s+about to\s+(?:hurt|kill)\s+me\b/i,
  /\b(?:i(?:'ve| have)?\s*)?(?:taken|swallowed)\s+(?:a lot of|too many|an overdose of)\b/i,
]

export function checkSafety(message) {
  if (typeof message !== 'string') {
    throw new TypeError('Safety check requires a string message.')
  }
  return {
    riskFlag: urgentRiskPatterns.some((pattern) => pattern.test(message)),
  }
}

export const crisisResponse = Object.freeze({
  reply: 'I’m glad you told me. I’m an AI guide, not emergency support. If you may hurt yourself or someone else soon, contact local emergency services now or go to someone nearby you trust. In the U.S. or territories, call or text 988; in India, call Tele-MANAS at 14416. Elsewhere, find a local crisis line at findahelpline.com.',
  gesture: 'give_space',
  action_id: null,
  mood_signal: null,
  risk_flag: true,
  crisis: true,
  help: [
    { label: 'U.S. & territories: call or text 988', href: 'tel:988' },
    { label: 'India: call Tele-MANAS 14416', href: 'tel:14416' },
    { label: 'Find local crisis support', href: 'https://findahelpline.com/' },
  ],
})
