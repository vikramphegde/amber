import './style.css'
import actions from './actions.js'
import {
  defaultPreferences,
  deleteAllData,
  loadPreferences,
  loadSessions,
  savePreferences,
  saveSession,
} from './local-data.js'
import { buildTriggerReply, voiceCards } from './voice.js'

const triggerLabels = [
  ['bored', 'Bored'],
  ['lonely', 'Lonely'],
  ['comparing', 'Comparing'],
  ['future', 'Worried about the future'],
  ['unsure', 'Not sure'],
]

const stateLabels = {
  OPEN: 'A moment to arrive',
  NAME_IT: 'Name what’s here',
  RESET: 'A small reset',
  SMALL_ACTION: 'One small thing',
  CLOSE: 'Close for tonight',
}

const F = {
  adultConfirmed: false,
  ageDenied: false,
  screen: 'session',
  preferences: { ...defaultPreferences },
  sessions: [],
  sessionSaved: false,
  storageError: '',
  storageNotice: '',
  state: 'OPEN',
  moodBefore: null,
  moodAfter: null,
  trigger: null,
  action: null,
  actionCompleted: null,
  gesture: 'idle',
  breathRunning: false,
  breathStartedAt: null,
  extendedOnce: false,
  showWrapOffer: false,
  startedAt: Date.now(),
}

const app = document.querySelector('#app')

try {
  F.preferences = loadPreferences()
  F.sessions = loadSessions()
} catch (error) {
  F.storageError = error.message
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character])
}

function progressMarkup() {
  const states = Object.keys(stateLabels)
  const activeIndex = states.indexOf(F.state)
  const progress = F.state === 'CLOSE' ? 100 : ((activeIndex + 1) / states.length) * 100

  return `
    <div class="session-progress">
      <div class="progress-copy"><span>${stateLabels[F.state]}</span><span>${F.state === 'CLOSE' ? 'Complete' : `Step ${activeIndex + 1} of ${states.length}`}</span></div>
      <div class="progress-track" role="progressbar" aria-label="Session progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progress}">
        <span style="width: ${progress}%"></span>
      </div>
    </div>
  `
}

function moodMarkup(prompt, selection) {
  const ratings = [
    ['1', 'Very low'],
    ['2', 'Low'],
    ['3', 'In the middle'],
    ['4', 'Okay'],
    ['5', 'Good'],
  ]

  return `
    <fieldset class="choice-group mood-group">
      <legend>${prompt}</legend>
      <div class="mood-options">
        ${ratings.map(([value, label]) => `
          <button class="mood-button${selection === value ? ' is-selected' : ''}" type="button" data-mood="${value}" aria-label="${value}: ${label}" aria-pressed="${selection === value}">
            <span aria-hidden="true">${value}</span>
          </button>
        `).join('')}
      </div>
      <div class="mood-ends" aria-hidden="true"><span>Rough</span><span>Steady</span></div>
    </fieldset>
  `
}

function stepMarkup() {
  if (F.state === 'OPEN') {
    return `
      <p class="eyebrow">No need to catch up</p>
      <h2 id="step-title" tabindex="-1">You’re here now.</h2>
      <p class="step-copy">I’m Ember, a scripted prototype. Your choices stay here unless you opt in to local check-ins.</p>
      ${moodMarkup('How are you feeling right now?', F.moodBefore)}
      <button class="button button-primary" type="button" data-action="continue" ${F.moodBefore ? '' : 'disabled'}>Continue <span aria-hidden="true">→</span></button>
    `
  }

  if (F.state === 'NAME_IT') {
    const response = F.trigger ? buildTriggerReply(F.trigger, F.preferences) : null
    return `
      <p class="eyebrow">No right answer</p>
      <h2 id="step-title" tabindex="-1">What’s weighing on you?</h2>
      <p class="step-copy">Pick one, or skip explaining.</p>
      <div class="trigger-options" role="group" aria-label="What might be behind the scroll?">
        ${triggerLabels.map(([id, label]) => `<button class="choice-chip${F.trigger === id ? ' is-selected' : ''}" type="button" data-trigger="${id}" aria-pressed="${F.trigger === id}">${label}</button>`).join('')}
      </div>
      ${response ? `<div class="ember-reply" data-gesture="${response.gesture}"><span class="reply-mark" aria-hidden="true">✦</span><p>${escapeHTML(response.text)}</p></div>
        ${F.preferences.readAloud ? '<button class="button button-quiet" type="button" data-action="read-aloud">Read this line aloud</button>' : ''}` : ''}
      <button class="button button-primary" type="button" data-action="continue">Take a breath <span aria-hidden="true">→</span></button>
      <button class="button button-quiet" type="button" data-action="skip-trigger">Skip this step</button>
    `
  }

  if (F.state === 'RESET') {
    const elapsed = F.breathStartedAt ? Math.min(36, Math.floor((Date.now() - F.breathStartedAt) / 1000)) : 0
    const phase = elapsed >= 36 ? 'Finished' : Math.floor(elapsed / 9) % 2 === 0 ? 'Breathe in' : 'Breathe out'
    return `
      <p class="eyebrow">Nothing to get right</p>
      <h2 id="step-title" tabindex="-1">Let your shoulders drop.</h2>
      <p class="step-copy">Follow the glow if it helps. You can skip whenever you want.</p>
      <div class="breath-scene${F.breathRunning ? ' is-breathing' : ''}">
        <span class="breath-orbit" aria-hidden="true"></span>
        <span class="breath-core" aria-hidden="true"></span>
        <span class="breath-instruction" aria-live="polite" aria-atomic="true">${F.breathRunning ? phase : 'At your own pace'}</span>
        ${F.breathRunning ? `<span class="breath-time" aria-hidden="true">${Math.max(0, 36 - elapsed)} sec</span>` : ''}
      </div>
      <p class="breath-caption">${F.breathRunning ? 'No special way to breathe. Just notice one breath.' : 'A short pause is enough.'}</p>
      ${F.breathRunning
        ? `<button class="button button-primary" type="button" data-action="stop-breath">Continue <span aria-hidden="true">→</span></button>`
        : `<button class="button button-primary" type="button" data-action="start-breath">Start a short reset <span aria-hidden="true">→</span></button>`}
      <button class="button button-quiet" type="button" data-action="skip-reset">Skip this step</button>
    `
  }

  if (F.state === 'SMALL_ACTION') {
    const selected = F.action
    return `
      <p class="eyebrow">Your call, your pace</p>
      <h2 id="step-title" tabindex="-1">${selected ? 'That’s yours to choose.' : 'What feels doable tonight?'}</h2>
      <p class="step-copy">${selected ? 'No need to make it a bigger thing.' : 'A small offline moment can be enough. Rest is an option too.'}</p>
      ${selected
        ? `<div class="selected-action"><span class="action-icon" aria-hidden="true">${selected.level === 'rest' ? '☾' : '✳'}</span><p>${escapeHTML(selected.text)}</p></div>
          ${selected.level === 'rest'
            ? `<button class="button button-primary" type="button" data-action="finish-rest">Close for tonight <span aria-hidden="true">→</span></button>`
            : `<div class="completion-options">
                <button class="button button-primary" type="button" data-action="complete-action">I did it <span aria-hidden="true">→</span></button>
                <button class="button button-quiet" type="button" data-action="leave-action">I’ll leave it for tonight</button>
              </div>`}
          <button class="button button-quiet" type="button" data-action="change-action">Choose something else</button>`
        : `<div class="action-levels">
            ${[
              ['tiny', 'Tiny', 'A few seconds'],
              ['small', 'Small', 'About a minute'],
              ['stretch', 'A stretch', 'A few minutes'],
            ].map(([level, title, time]) => `
              <section class="action-level">
                <h3>${title}<span>${time}</span></h3>
                ${actions[level].map((action) => `<button class="action-option" type="button" data-action-id="${action.id}"><span>${action.text}</span><span aria-hidden="true">＋</span></button>`).join('')}
              </section>
            `).join('')}
            <button class="rest-option" type="button" data-action="choose-rest"><span><strong>Just rest tonight</strong><small>No task. You can stop here.</small></span><span aria-hidden="true">☾</span></button>
          </div>`}
    `
  }

  if (F.state === 'CLOSE') {
    if (!F.closedEarly && !F.skipMoodAfter) {
      return `
        <p class="eyebrow">Before you go</p>
        <h2 id="step-title" tabindex="-1">How are you feeling now?</h2>
        <p class="step-copy">A quick tap, if you want. It stays on this page.</p>
        ${moodMarkup('Choose what fits best right now.', F.moodAfter)}
        <button class="button button-primary" type="button" data-action="finish-close" ${F.moodAfter ? '' : 'disabled'}>Finish for tonight <span aria-hidden="true">→</span></button>
        <button class="button button-quiet" type="button" data-action="finish-close">Skip and finish</button>
      `
    }

    return `
      <p class="eyebrow">The glow can rest now</p>
      <h2 id="step-title" tabindex="-1">${F.closedEarly ? 'You can stop here.' : 'You made a little room.'}</h2>
      <p class="step-copy">${F.closedEarly
        ? 'Thanks for checking in. Take the next moment at your own pace.'
        : F.actionCompleted
          ? 'You chose that step and gave it a go. That was yours.'
          : F.action?.level === 'rest'
            ? 'You chose rest. That is enough for tonight.'
            : F.action
              ? 'You chose a next step for yourself. It can wait until you’re ready.'
              : 'You showed up tonight. That counts.'}</p>
      <div class="goodnight-glow" aria-hidden="true"><span></span></div>
      <p class="goodnight-note">I’m a scripted guide, and I’ll leave it here for tonight.</p>
      ${F.storageError ? `<p class="storage-message" role="status">${escapeHTML(F.storageError)}</p>` : ''}
      ${F.storageNotice ? `<p class="storage-message" role="status">${escapeHTML(F.storageNotice)}</p>` : ''}
      <button class="button button-quiet" type="button" data-action="new-session">Start another session</button>
    `
  }
}

function helpDialogMarkup() {
  return `
    <dialog class="help-dialog" id="help-dialog" aria-labelledby="help-title">
      <form method="dialog">
        <button class="dialog-close" aria-label="Close help options">×</button>
      </form>
      <p class="eyebrow">A real person can help</p>
      <h2 id="help-title">You don’t have to figure it out alone.</h2>
      <p class="help-copy">I’m an AI guide, not emergency support. If you’re in immediate danger, contact local emergency services or someone nearby you trust.</p>
      <div class="help-links">
        <a href="tel:988"><span><strong>US &amp; territories</strong><small>Call or text 988 · Suicide &amp; Crisis Lifeline</small></span><span aria-hidden="true">↗</span></a>
        <a href="tel:14416"><span><strong>India</strong><small>Call 14416 · Tele-MANAS</small></span><span aria-hidden="true">↗</span></a>
      </div>
      <p class="help-copy help-footnote">Elsewhere, find a local crisis line through <a href="https://findahelpline.com/" target="_blank" rel="noreferrer">Find A Helpline</a>.</p>
    </dialog>
  `
}

function wrapOfferMarkup() {
  if (!F.showWrapOffer || F.state === 'CLOSE') return ''
  return `
    <aside class="wrap-offer" aria-live="polite">
      <p>We’ve been here a little while. Want to wrap up, or continue?</p>
      <div>
        <button type="button" class="button button-primary" data-action="finish-close">Wrap up</button>
        <button type="button" class="button button-quiet" data-action="extend">Continue once</button>
      </div>
    </aside>
  `
}

function ageGateMarkup() {
  return `
    <main class="age-gate-shell">
      <section class="age-gate-card" aria-labelledby="age-gate-title">
        <span class="wordmark"><span class="wordmark-flame" aria-hidden="true">✦</span>ember</span>
        ${F.ageDenied
          ? `<h1 id="age-gate-title">This space is for adults.</h1>
             <p>Ember is intended for people 18 and older. If you need support, please reach out to a trusted adult or local emergency services.</p>`
          : `<p class="room-note"><span class="room-line"></span> Before we begin</p>
             <h1 id="age-gate-title">This space is for adults.</h1>
             <p>Ember is a scripted prototype for adults 18 and older. It is not mental-health care or emergency support.</p>
             <button class="button button-primary" type="button" data-action="confirm-adult">I’m 18 or older — continue</button>
             <button class="button button-quiet" type="button" data-action="deny-adult">I’m under 18</button>`}
      </section>
    </main>
  `
}

function sliderMarkup(key, label, hint) {
  return `
    <label class="preference-slider">
      <span class="slider-heading"><strong>${label}</strong><output data-slider-value="${key}">${F.preferences[key]}</output></span>
      <small>${hint}</small>
      <input type="range" min="0" max="100" step="1" value="${F.preferences[key]}" data-preference="${key}" aria-label="${label}">
    </label>
  `
}

function settingsMarkup() {
  return `
    <div class="data-screen">
      <p class="eyebrow">Your preferences</p>
      <h2 id="screen-title" tabindex="-1">Make this voice yours.</h2>
      <p class="step-copy">These settings stay in this browser. You can change them or delete them whenever you like.</p>
      <fieldset class="voice-cards">
        <legend>Choose a guide voice</legend>
        ${Object.entries(voiceCards).map(([id, voice]) => `
          <label class="voice-card${F.preferences.voice === id ? ' is-selected' : ''}">
            <input type="radio" name="voice" value="${id}" data-preference="voice" ${F.preferences.voice === id ? 'checked' : ''}>
            <span><strong>${voice.name}</strong><small>${voice.description}</small></span>
          </label>
        `).join('')}
      </fieldset>
      <div class="slider-grid">
        ${sliderMarkup('warmth', 'Warmth', 'Cool and simple to warmer and more reassuring.')}
        ${sliderMarkup('directness', 'Directness', 'Gentle and open to clear and concise.')}
        ${sliderMarkup('playfulness', 'Playfulness', 'Kept light; humor is only about the situation.')}
        ${sliderMarkup('pace', 'Pace', 'Used only for read-aloud speed.')}
      </div>
      <label class="setting-toggle"><input type="checkbox" data-preference="saveLocally" ${F.preferences.saveLocally ? 'checked' : ''}><span><strong>Save session check-ins on this browser</strong><small>Stores mood taps, chosen trigger, action choice, and whether you tried it. No name or free-text messages. Off by default. Turning this off stops future saves; use Delete all local data to erase earlier check-ins.</small></span></label>
      <label class="setting-toggle"><input type="checkbox" data-preference="readAloud" ${F.preferences.readAloud ? 'checked' : ''} ${'speechSynthesis' in window ? '' : 'disabled'} aria-describedby="read-aloud-help"><span><strong>Allow read-aloud</strong><small id="read-aloud-help">${'speechSynthesis' in window ? 'Nothing plays automatically. Browser or device speech services may handle the audio; captions remain visible.' : 'Read-aloud is not supported in this browser. Captions remain visible.'}</small></span></label>
      ${F.storageError ? `<p class="storage-message" role="alert">${escapeHTML(F.storageError)}</p>` : ''}
      ${F.storageNotice ? `<p class="storage-message" role="status">${escapeHTML(F.storageNotice)}</p>` : ''}
      <div class="settings-actions">
        <button class="button button-primary" type="button" data-action="save-settings">Save settings</button>
        <button class="button button-quiet" type="button" data-action="delete-data">Delete all local data</button>
      </div>
    </div>
  `
}

function weekStart(date) {
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  day.setDate(day.getDate() - ((day.getDay() + 6) % 7))
  return day
}

function trendsMarkup() {
  const now = new Date()
  const currentWeek = weekStart(now)
  const weeks = Array.from({ length: 4 }, (_, index) => {
    const start = new Date(currentWeek)
    start.setDate(start.getDate() - index * 7)
    const end = new Date(start)
    end.setDate(end.getDate() + 7)
    const records = F.sessions.filter((record) => {
      const completedAt = new Date(record.completedAt)
      return completedAt >= start && completedAt < end
    })
    const moodsBefore = records.map((record) => Number(record.moodBefore)).filter(Number.isFinite)
    const moodsAfter = records.map((record) => Number(record.moodAfter)).filter(Number.isFinite)
    const label = index === 0 ? 'This week' : `${index} week${index === 1 ? '' : 's'} ago`
    return {
      label,
      count: records.length,
      before: moodsBefore.length ? (moodsBefore.reduce((sum, mood) => sum + mood, 0) / moodsBefore.length).toFixed(1) : '—',
      after: moodsAfter.length ? (moodsAfter.reduce((sum, mood) => sum + mood, 0) / moodsAfter.length).toFixed(1) : '—',
    }
  })
  const maxCount = Math.max(1, ...weeks.map((week) => week.count))

  return `
    <div class="data-screen">
      <p class="eyebrow">A quiet reflection</p>
      <h2 id="screen-title" tabindex="-1">Your week, if you chose to save it.</h2>
      <p class="step-copy">These notes live only in this browser. They’re not a score or a goal.</p>
      ${!F.preferences.saveLocally
        ? `<div class="empty-state"><p>Local check-in saving is off. Nothing is being recorded.</p><button class="button button-primary" type="button" data-action="settings">Choose in settings</button></div>`
        : F.sessions.length === 0
          ? `<div class="empty-state"><p>No check-ins saved yet. That’s completely fine.</p><p>Saving is optional and can be turned off or deleted in settings.</p></div>`
          : `<section class="trend-section" aria-labelledby="sessions-title">
              <h3 id="sessions-title">Saved check-ins</h3>
              <ul class="weekly-bars">
                ${weeks.map((week) => `
                  <li>
                    <span>${week.label}</span>
                    <span class="bar-track" role="img" aria-label="${week.count} check-ins"><span style="width:${week.count ? Math.max(8, (week.count / maxCount) * 100) : 0}%"></span></span>
                    <span>${week.count}</span>
                  </li>
                `).join('')}
              </ul>
            </section>
            <section class="trend-section" aria-labelledby="mood-title">
              <h3 id="mood-title">Mood taps · 1 rough, 5 steady</h3>
              <ul class="mood-trends">
                ${weeks.map((week) => `<li><span>${week.label}</span><span>Before ${week.before}</span><span>After ${week.after}</span></li>`).join('')}
              </ul>
            </section>
            <p class="privacy-note">Only this browser can see these check-ins. Delete them in settings at any time.</p>`}
      ${F.storageError ? `<p class="storage-message" role="alert">${escapeHTML(F.storageError)}</p>` : ''}
      <button class="button button-quiet" type="button" data-action="settings">Privacy &amp; settings</button>
    </div>
  `
}

function render(focus = false) {
  document.documentElement.dataset.theme = F.preferences.theme
  if (!F.adultConfirmed) {
    app.innerHTML = ageGateMarkup()
    app.querySelector('[data-action="confirm-adult"]')?.addEventListener('click', () => {
      F.adultConfirmed = true
      F.startedAt = Date.now()
      render()
      app.querySelector('#step-title')?.focus()
    })
    app.querySelector('[data-action="deny-adult"]')?.addEventListener('click', () => {
      F.ageDenied = true
      render()
      app.querySelector('#age-gate-title')?.focus()
    })
    return
  }

  const closed = F.state === 'CLOSE' && (F.closedEarly || F.skipMoodAfter)
  document.documentElement.dataset.closed = String(closed)
  document.documentElement.dataset.gesture = F.state === 'NAME_IT' && F.trigger
    ? buildTriggerReply(F.trigger, F.preferences).gesture
    : F.state === 'RESET' ? 'shared_exhale'
      : F.state === 'SMALL_ACTION' ? 'open_hand_next'
        : closed ? 'soft_wave' : 'lantern_hands'

  app.innerHTML = `
    <header class="topbar">
      <a class="wordmark" href="./" aria-label="Ember home"><span class="wordmark-flame" aria-hidden="true">✦</span>ember</a>
      <div class="topbar-actions">
        <span class="ai-label"><span aria-hidden="true"></span> Scripted prototype</span>
        <button class="icon-button theme-toggle" type="button" aria-label="${F.preferences.theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}" aria-pressed="${F.preferences.theme === 'light'}" data-action="theme">◐</button>
        ${F.preferences.readAloud ? '<button class="help-button" type="button" data-action="stop-speaking">Mute read-aloud</button>' : ''}
        ${F.screen !== 'session' ? '<button class="help-button" type="button" data-action="session-home">Session</button>' : ''}
        <button class="help-button" type="button" data-action="trends">My check-ins</button>
        <button class="help-button" type="button" data-action="settings">Settings</button>
        <button class="help-button" type="button" data-action="help">Need real help?</button>
      </div>
    </header>
    ${F.screen === 'session' ? `<main class="page-shell">
      <section class="intro" aria-labelledby="app-title">
        <div class="room-note"><span class="room-line"></span> A quieter place to land</div>
        <h1 id="app-title">A softer landing<br />after the <em>scroll.</em></h1>
        <p class="intro-copy">A short, gentle pause. No fixing yourself. Just one next moment, if you want it.</p>
        <div class="ember-figure" role="img" aria-label="A small warm light in a quiet night room">
          <span class="figure-halo"></span>
          <svg class="figure-art" viewBox="0 0 240 280" aria-hidden="true">
            <path class="figure-shadow" d="M37 246c14-18 42-28 83-28s69 10 83 28v19H37z"/>
            <path class="figure-body" d="M56 226c2-33 20-61 44-72l20-7 20 7c24 11 42 39 44 72-16 13-38 20-64 20s-48-7-64-20z"/>
            <path class="figure-head" d="M82 111c0-31 17-53 38-53s38 22 38 53c0 27-16 46-38 46s-38-19-38-46z"/>
            <path class="figure-hair" d="M80 112c-7-34 9-65 40-65 30 0 47 25 41 62-8-4-16-14-20-23-13 15-36 24-61 26z"/>
            <path class="figure-face" d="M99 117c3 2 6 2 9 0m27 0c3 2 6 2 9 0m-24 13c4 3 8 3 12 0"/>
            <path class="figure-arm figure-arm-left" d="M64 187c12 0 23 6 31 17"/>
            <path class="figure-arm figure-arm-right" d="M176 187c-12 0-23 6-31 17"/>
            <circle class="lantern-glow" cx="120" cy="197" r="20"/>
            <path class="lantern" d="M111 192h18l-2 17h-14zm3-5a6 6 0 0 1 12 0"/>
            <path class="lantern-line" d="M115 197h10m-10 5h10"/>
          </svg>
          <span class="figure-caption">${voiceCards[F.preferences.voice].name} <span>·</span> scripted guide</span>
        </div>
        <p class="privacy-note"><span aria-hidden="true">⌁</span> Settings stay in this browser. Check-ins save only if you opt in.</p>
      </section>

      <section class="session-card" aria-label="Guided session">
        <div class="card-top">${progressMarkup()}<button class="exit-button" type="button" data-action="early-exit">I’m good for tonight</button></div>
        <div class="step-content" aria-live="polite" aria-atomic="true">${stepMarkup()}</div>
        ${wrapOfferMarkup()}
        <footer class="card-footer"><span>One step at a time.</span><span>Leave whenever you like.</span></footer>
      </section>
    </main>` : `<main class="data-page">${F.screen === 'settings' ? settingsMarkup() : trendsMarkup()}</main>`}
    ${helpDialogMarkup()}
  `

  if (focus) app.querySelector('#step-title, #screen-title')?.focus()

  const dialog = document.querySelector('#help-dialog')
  app.querySelector('[data-action="help"]')?.addEventListener('click', () => dialog.showModal())
  dialog?.querySelector('form')?.addEventListener('submit', () => {
    requestAnimationFrame(() => app.querySelector('[data-action="help"]')?.focus())
  })

  document.querySelectorAll('[data-mood]').forEach((button) => {
    button.addEventListener('click', () => {
      if (F.state === 'OPEN') F.moodBefore = button.dataset.mood
      if (F.state === 'CLOSE') F.moodAfter = button.dataset.mood
      render()
      app.querySelector(`[data-mood="${button.dataset.mood}"]`)?.focus()
    })
  })

  document.querySelectorAll('[data-trigger]').forEach((button) => {
    button.addEventListener('click', () => {
      F.trigger = button.dataset.trigger
      F.gesture = buildTriggerReply(F.trigger, F.preferences).gesture
      render()
      app.querySelector(`[data-trigger="${F.trigger}"]`)?.focus()
    })
  })

  document.querySelectorAll('[data-action-id]').forEach((button) => {
    button.addEventListener('click', () => {
      const item = Object.values(actions).flat().find((candidate) => candidate.id === button.dataset.actionId)
      if (!item) return
      const level = Object.keys(actions).find((key) => actions[key].includes(item))
      F.action = { ...item, level }
      F.actionCompleted = null
      render(true)
    })
  })

  document.querySelectorAll('[data-action]').forEach((button) => {
    button.addEventListener('click', () => handleAction(button.dataset.action))
  })

  document.querySelectorAll('[data-preference]').forEach((control) => {
    control.addEventListener('change', () => {
      const key = control.dataset.preference
      F.preferences[key] = control.type === 'checkbox' ? control.checked : control.type === 'radio' ? control.value : Number(control.value)
      try {
        savePreferences(F.preferences)
        F.storageError = ''
      } catch {
        F.storageError = 'Settings could not be saved in this browser. Check storage permissions and try again.'
      }
      if (key === 'readAloud' && !F.preferences.readAloud) window.speechSynthesis?.cancel()
      if (key === 'voice' || key === 'warmth' || key === 'directness' || key === 'playfulness') {
        render()
      } else {
        const output = app.querySelector(`[data-slider-value="${key}"]`)
        if (output) output.value = String(F.preferences[key])
      }
    })
    control.addEventListener('input', () => {
      if (control.type !== 'range') return
      const key = control.dataset.preference
      F.preferences[key] = Number(control.value)
      const output = app.querySelector(`[data-slider-value="${key}"]`)
      if (output) output.value = control.value
    })
  })
}

function recordSession() {
  if (F.sessionSaved || !F.preferences.saveLocally) return
  const session = {
    completedAt: new Date().toISOString(),
    moodBefore: F.moodBefore,
    moodAfter: F.moodAfter,
    trigger: F.trigger,
    actionId: F.action?.id || null,
    actionCompleted: F.actionCompleted,
  }
  try {
    saveSession(session)
    F.sessions = loadSessions()
    F.sessionSaved = true
    F.storageError = ''
  } catch {
    F.storageError = 'This session could not be saved locally. You can continue without saving it.'
  }
}

function goTo(state) {
  F.state = state
  F.gesture = state === 'RESET' ? 'shared_exhale' : state === 'SMALL_ACTION' ? 'open_hand_next' : 'idle'
  F.breathRunning = false
  render(true)
}

function handleAction(action) {
  if (action === 'theme') {
    F.preferences.theme = F.preferences.theme === 'light' ? 'dark' : 'light'
    document.documentElement.dataset.theme = F.preferences.theme
    try {
      savePreferences(F.preferences)
      F.storageError = ''
    } catch {
      F.storageError = 'The theme could not be saved in this browser.'
    }
    render()
    app.querySelector('[data-action="theme"]')?.focus()
  } else if (action === 'continue' && F.state === 'OPEN') {
    goTo('NAME_IT')
  } else if (action === 'continue' && F.state === 'NAME_IT') {
    goTo('RESET')
  } else if (action === 'skip-trigger') {
    F.trigger = null
    goTo('RESET')
  } else if (action === 'start-breath') {
    F.breathRunning = true
    F.breathStartedAt = Date.now()
    render()
    clearInterval(breathTimer)
    breathTimer = setInterval(() => {
      const elapsed = Date.now() - F.breathStartedAt
      if (elapsed >= 36000) {
        clearInterval(breathTimer)
        F.breathRunning = false
        goTo('SMALL_ACTION')
        return
      }
      const instruction = app.querySelector('.breath-instruction')
      if (instruction) instruction.textContent = Math.floor(elapsed / 9000) % 2 === 0 ? 'Breathe in' : 'Breathe out'
      const time = app.querySelector('.breath-time')
      if (time) time.textContent = `${Math.max(0, 36 - Math.floor(elapsed / 1000))} sec`
    }, 1000)
  } else if (action === 'stop-breath') {
    clearInterval(breathTimer)
    F.breathRunning = false
    goTo('SMALL_ACTION')
  } else if (action === 'skip-reset') {
    clearInterval(breathTimer)
    goTo('SMALL_ACTION')
  } else if (action === 'choose-rest') {
    F.action = { id: 'rest-tonight', level: 'rest', text: 'Just rest tonight. No task to finish.' }
    F.actionCompleted = null
    render(true)
  } else if (action === 'change-action') {
    F.action = null
    F.actionCompleted = null
    render(true)
  } else if (action === 'complete-action') {
    F.actionCompleted = true
    goTo('CLOSE')
  } else if (action === 'leave-action' || action === 'finish-rest') {
    F.actionCompleted = false
    goTo('CLOSE')
  } else if (action === 'finish-close') {
    F.skipMoodAfter = true
    F.showWrapOffer = false
    recordSession()
    goTo('CLOSE')
  } else if (action === 'early-exit') {
    F.closedEarly = true
    F.showWrapOffer = false
    clearInterval(breathTimer)
    recordSession()
    goTo('CLOSE')
  } else if (action === 'extend') {
    F.extendedOnce = true
    F.showWrapOffer = false
    render()
    app.querySelector('#step-title')?.focus()
  } else if (action === 'settings') {
    window.speechSynthesis?.cancel()
    F.screen = 'settings'
    F.storageNotice = ''
    render(true)
  } else if (action === 'trends') {
    window.speechSynthesis?.cancel()
    F.screen = 'trends'
    F.storageNotice = ''
    render(true)
  } else if (action === 'save-settings') {
    try {
      savePreferences(F.preferences)
      F.storageError = ''
      F.storageNotice = 'Your settings are saved on this browser.'
    } catch {
      F.storageError = 'Settings could not be saved in this browser. Check storage permissions and try again.'
    }
    render(true)
  } else if (action === 'delete-data') {
    if (window.confirm('Delete all saved check-ins and preferences from this browser? This cannot be undone.')) {
      try {
        deleteAllData()
        F.preferences = { ...defaultPreferences }
        F.sessions = []
        F.sessionSaved = false
        F.storageError = ''
        F.storageNotice = 'All Ember data has been deleted from this browser.'
      } catch {
        F.storageError = 'Ember could not delete browser data. Check browser storage permissions and try again.'
      }
      render(true)
    }
  } else if (action === 'read-aloud') {
    if (!F.preferences.readAloud || !('speechSynthesis' in window)) return
    const reply = F.trigger ? buildTriggerReply(F.trigger, F.preferences) : null
    if (!reply) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(reply.text)
    utterance.rate = 0.8 + (F.preferences.pace / 100) * 0.4
    window.speechSynthesis.speak(utterance)
  } else if (action === 'stop-speaking') {
    window.speechSynthesis?.cancel()
  } else if (action === 'session-home') {
    window.speechSynthesis?.cancel()
    F.screen = 'session'
    F.storageNotice = ''
    render(true)
  } else if (action === 'new-session') {
    F.screen = 'session'
    F.state = 'OPEN'
    F.moodBefore = null
    F.moodAfter = null
    F.trigger = null
    F.action = null
    F.actionCompleted = null
    F.sessionSaved = false
    F.skipMoodAfter = false
    F.closedEarly = false
    F.startedAt = Date.now()
    render(true)
  }
}

let breathTimer
render()

setInterval(() => {
  const elapsed = Date.now() - F.startedAt
  if (F.adultConfirmed && elapsed >= 10 * 60 * 1000 && !F.extendedOnce && !F.showWrapOffer && F.state !== 'CLOSE') {
    F.showWrapOffer = true
    render()
  }
}, 15000)
