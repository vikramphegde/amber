# Ember

Ember is an adult-only (18+) prototype for a kinder landing after doomscrolling. The current guided session remains scripted; it does not send mood or trigger choices to Gemini.

## Run locally

1. Install [Node.js](https://nodejs.org/).
2. Open this folder in VS Code.
3. In the integrated terminal, run:

   ```sh
   npm install
   npm run dev
   ```

4. Open the local URL printed by Vite. This starts Vite and the local `/chat` server.

Use `npm run build` to create a production build in `dist/`.
Use `npm test` to run the API contract and output-check tests.

## Gemini API route (M2)

The server-side `POST /chat` route is structured to call Gemini and validate its JSON response against Ember's output rules. It accepts adult confirmation, a fixed trigger choice, and an optional short message. The AI route is deliberately not connected to the session UI. During this development session no API key was configured and no provider call was made.

## Safety pre-check and crisis path (M3)

The route checks every submitted message before calling Gemini. Clear, explicit urgent-risk phrases take a deterministic crisis response; the model is not called for those requests. A model `risk_flag` also falls back to that response. The crisis response points to local emergency services, U.S. 988, India Tele-MANAS 14416, and Find A Helpline. If the safety check fails, the endpoint fails closed and does not generate a reply.

This first pre-check is a small phrase-matching prototype, not a validated risk classifier. It can miss indirect, ambiguous, multilingual, or context-dependent disclosures and can flag benign mentions. The red-team tests use mock model responses; they do not certify model behavior. Do not deploy this route or use it for real-user support until a qualified human safety review and more robust, evaluated safety process are in place. The existing “Need real help?” dialog remains the prototype’s always-available help surface.

The Gemini API and Google AI Studio require the developer to be 18 or older. No provider credentials or calls are used by the local test suite. Keep the API disconnected and use mock responses only unless an eligible adult developer takes responsibility for provider access. If an adult later evaluates the free tier, Google may use prompts and responses to improve its products; test only with synthetic data. A Google AI subscription does not include Gemini API usage. The adult confirmation in the app is self-attested and is not age verification.

## Local privacy, voice, and read-aloud (M4–M6)

Session logging is off by default. If enabled, only mood taps, the fixed trigger choice, chosen action, completion choice, and timestamp are stored in this browser; no account or server sync is used. The settings screen can delete all saved data. This is device-local browser storage, not a hosted database, so clearing browser data also removes it.

Ember, Oak, and Spark have distinct scripted voice cards. Warmth, directness, and playfulness choose among human-written lines; pace only changes read-aloud speed. The selected trigger, gesture, action library, and session flow are not changed by voice choice. Read-aloud is opt-in, never automatic, and can be muted; its visible caption stays on screen. Browser/device speech services may have their own processing policies.

## Safety and release status

This is a development prototype for an intended adult audience. The phrase-matching safety pre-check is not a validated risk classifier, and the fixed crisis response is not emergency support. Do not deploy or use this with real people until the safety approach, crisis resources, privacy, age controls, and provider terms have been reviewed by qualified adults. No public hosting or production database is configured.
