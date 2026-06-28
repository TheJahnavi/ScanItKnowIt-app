# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development — Express + Vite HMR together via tsx
npm run dev

# Type checking only (no emit)
npm run check

# Production build — Vite client + esbuild server bundle + copy assets
npm run build

# Run production build locally
npm start
```

No test suite. No lint script — `npm run check` is the only code-quality gate.

## Deployment Architecture

**Frontend** — GitHub Pages serves `scanitknowit.com` from static files (`index.html` + `assets/`) committed to the repo root. These are the output of `vite build` (`dist/public/`), manually copied to root and committed.

**Backend** — Express API runs separately (Vercel target). Because frontend and backend are on different origins, every API call in the client must be prefixed with `import.meta.env.VITE_API_URL ?? ''`. In local dev this env var is unset, so relative URLs fall through to Vite's dev proxy. In production, set it to the Vercel deployment URL.

**Repositories**
- Local dev / feature source: this repo
- Production repo (GitHub Pages host): `https://github.com/TheJahnavi/ScanItKnowIt-app`

## Architecture

Monorepo: React SPA (Vite) served by Express. In development, Vite is mounted inside Express (`server/vite.ts`). In production Express serves `dist/public/`.

`server/index.ts` must export `app` as default (for serverless import) and guard `server.listen()` behind `!process.env.VERCEL`. `server/start.ts` handles the listener for local dev.

### AI Stack (three-tier fallback)

**Primary — Groq** (`server/services/groq.ts`):
- Vision: `llama-3.2-11b-vision-preview` (500 req/day free)
- Text analysis (composition, ingredients, reddit, chat): `llama-3.3-70b-versatile` (14,400 req/day free)
- Uses `response_format: { type: "json_object" }` — no markdown unwrapping needed
- Rate-limit state: module-level `lastPerMinute429` / `lastPerDay429` with separate cooldowns (65 s / 23 h)

**Fallback — Gemini** (`server/services/openai.ts` — misnamed; uses `@google/generative-ai`, not OpenAI):
- Both vision and analysis: `gemini-2.5-flash-lite` (20 req/day free)
- Uses `generationConfig: { responseMimeType: "application/json" }` for JSON endpoints
- Module-level `last429Timestamp`; all Gemini calls fast-fail for 60 s after any quota error
- `withGeminiRetry()` retries 503 (transient) but never 429

**Tertiary — OCR / databases** (no AI quota cost):
- OCR.Space API → barcode extraction → Open Food Facts / Open Beauty Facts lookup
- USDA FoodData Central for nutrition fallback
- `analyzeCompositionFallback()` / `analyzeIngredientsFallback()` in `server/services/fallbackGrounding.ts`

### Full request lifecycle

#### Phase 1 — Image capture → product identification

1. `CameraScreen` captures from live camera or file picker.
2. `compressImage()` resizes to max 512px, quality 0.80, JPEG:
   - **Worker path** (preferred): zero-copy transfer to `OffscreenCanvas` Web Worker at `/workers/image-compressor.worker.js` via `Transferable` bitmap.
   - **Main-thread fallback**: `<canvas>` resize + `toBlob`.
3. XHR `POST /api/analyze-product` (multipart, 50 MB limit). XHR `upload.onprogress` drives 0→30%; a `setInterval` simulates 30→90% during AI processing.
4. Server: Groq vision → Gemini vision → OCR fallback. Saves raw bytes to `data/images/img-{ts}.jpg`; falls back to inline `data:image/jpeg;base64,...` if disk write fails (read-only filesystem on Vercel).
5. Each detected product stored in `MemStorage` with a UUID; all deep-analysis fields start `null`. Capped at 5 products.
6. Response: `[{ analysisId, productName, productSummary, productCategory, productContext:{what,who,when}, extractedText:{ingredients,brand}, imageUrl, isFallbackMode, isGeneralScene, compositionData:null, ingredientsData:null, redditData:null }]`
7. `CameraScreen` internal view states: `camera → loading → identification`. On single product: skips selection screen. `home.tsx` `AppState` has only two values: `"camera" | "analysis"`.
8. `ProductIdentificationScreen` shows the image with colored bounding boxes (fake client-side coordinates from `BOX_LAYOUTS[]`) and a product list.
9. `home.tsx` transitions `AppState → "analysis"`, passes `analysisIds: string[]` to `AnalysisScreen`.

#### Phase 2 — Analysis page

`AnalysisScreen` accepts `analysisIds: string[]`. Single ID renders normally; multiple IDs renders a horizontal scroll-snap container with `AnalysisPanelMemo` (React.memo prevents re-renders from activeIndex changes).

Each panel calls `GET /api/analysis/:analysisId` on mount to hydrate `ProductHeaderCard`. Allergen badges and dietary filter tags are computed **client-side** from `extractedText.ingredients` via `detectAllergens()` — no API call.

`detectProductType()` uses a 5-priority heuristic: calories > compositionCategory > nutritionText > productSummary > productName. Once `compositionData` loads, `productType` from UPCA is authoritative.

#### Phase 3 — Lazy deep analysis

Four accordion cards in `AnalysisPanel` using TanStack Query hooks in `client/src/hooks/useAnalysisData.ts`:

| Card | Title (food) | Title (non-food) | Endpoint | Trigger |
|---|---|---|---|---|
| `calories` | Nutrition Facts | Product Highlights | `POST /api/analyze-composition` | Auto-starts on active panel mount |
| `ingredients` | Ingredient Safety | Ingredient Safety | `POST /api/analyze-ingredients` | Auto-starts in parallel with composition |
| `reddit` | Reddit Reviews | Reddit Reviews | `POST /api/analyze-reddit` | IntersectionObserver (0.3 threshold) |
| `qa` | Ask the AI | Ask the AI | `POST /api/chat/:analysisId` | User message send |

All hooks: `staleTime: Infinity`, `gcTime: 30min`. Reddit uses isolated `postRedditAnalysis()` so its 503 never sets `isRateLimit:true` and never triggers the global cooldown banner.

### API endpoints

```
POST /api/analyze-product          → ARA prompt → ProductAnalysis[]
GET  /api/analysis/:analysisId     → fetch stored analysis (no AI calls)
POST /api/analyze-composition      → UPCA prompt → ICompositionAnalysis
POST /api/analyze-ingredients      → UISA prompt → IngredientsData
POST /api/analyze-reddit           → community sentiment prompt → RedditData | 503
POST /api/chat/:analysisId         → chat prompt → plain text string
GET  /api/chat/:analysisId         → chat history array
GET  /api/images/:filename         → serve uploaded image from data/images/
POST /api/select-product           → (legacy, not called by current client)
POST /api/analyze-product/deep     → (dead route, not called by current client)
```

### Prompts

All prompts are defined in two places — Groq version in `server/services/groq.ts`, Gemini version in `server/services/openai.ts`. They are functionally identical in structure; Groq version adds a `buildProductContext()` helper that formats the shared product context block.

- **ARA** (`scanProductWithGroqVision` / `identifyProductAndExtractText`): JSON array, one object per product. Branded: verbatim ingredient list + all barcodes in `brand` field. Non-branded scene: each visible component as ingredient with estimated quantity; `brand = "Not applicable"` sets `isGeneralScene: true`.
- **UPCA** (`analyzeCompositionGroq` / `analyzeComposition`): Food → calories/fat/protein + full `compositionalDetails[]` + DV%. Non-food → macros=0 + chemical components. Outputs `productType`, `productContext`, `categoryBadges[]` (max 6), `nutritionHighlights[]` (exactly 3 arc gauge objects with `lucideIcon`, `arcPercent`, `arcColor`).
- **UISA** (`analyzeIngredientsGroq` / `analyzeIngredients`): Per-ingredient `Safe|Moderate|Harmful` + one-line reason with regulatory source. Falls back to training knowledge when extracted ingredients are missing/placeholder.
- **Community** (`searchRedditReviewsGroq` / `searchRedditReviews`): Training-knowledge sentiment — NOT a real Reddit API. Returns `null` for obscure products → server sends 503.
- **Chat** (`generateChatResponseGroq` / `generateChatResponse`): Plain text only. Gemini version adds `tools: [{ googleSearch: {} }]` for live web grounding. Groq version uses training knowledge only.

### Client-side utilities

| File | Purpose |
|---|---|
| `client/src/lib/dietary-filters.ts` | `detectAllergens()`, `getDietaryTags()` — pure string matching, no API |
| `client/src/lib/nutrient-score.ts` | `computeNutrientDensityScore()` — scores 0–100 from protein/fiber/vitamins vs calories |
| `client/src/lib/top-metrics.ts` | `getTopThreeMetrics()` — picks 3 most meaningful arc-gauge metrics for product type |
| `client/src/hooks/useAnalysisData.ts` | `useCompositionQuery`, `useIngredientsQuery`, `useRedditQuery` — TanStack Query wrappers with `forceRefetch()` that sets `forceRefresh:true` in POST body |
| `client/src/components/history.tsx` | `HistorySheet` — bottom-sheet portal showing scan history with 7-day activity bar chart, category donut, and per-scan health score badge; opened from camera screen |
| `client/src/components/tutorial-overlay.tsx` | `TutorialOverlay` — first-run 5-step spotlight walkthrough; auto-shows unless `localStorage.getItem("siki-tutorial-done")` is set; rendered inside `home.tsx` alongside `CameraScreen` |
| `client/src/components/data-error-state.tsx` | Error/empty state component used inside analysis cards |
| `client/src/hooks/use-scan-history.ts` | `addScan()`, `getHistory()`, `updateScanScore()`, `clearHistory()`, `getTrends()`, `computeHealthScore()`, `guessCategory()` — `localStorage`-backed scan history, max 10 entries; emits `"siki-history-update"` custom event on changes |

### Key design decisions & non-obvious patterns

**Rate-limit system:** Module-level timestamp vars in both service files. After quota exhaustion, `checkGroqCooldown()` / `checkQuotaCooldown()` fast-fail all calls for their respective cooldown periods. `withGroqRetry()` / `withGeminiRetry()` retry 503 (transient overload) but never 429.

**forceRefresh bypass:** POST bodies with `{ forceRefresh: true }` skip the cached `compositionData`/`ingredientsData`/`redditData` in storage and re-call AI. Each card's Refresh button sends this.

**Image storage:** Raw bytes written to `data/images/img-{ts}.jpg`. The `mkdirSync` at module load time must be wrapped in try-catch — Vercel's filesystem is read-only and will throw on cold start. On disk-write failure, falls back to `data:image/jpeg;base64,...` inline in MemStorage. The `/api/images/:filename` route 404s on Vercel (images stored as base64 instead).

**`isGeneralScene` flag:** Set when `extractedText.brand` matches `/^not applicable$|^not visible$/i`. Reddit card is hidden for general scenes (always 503s). Composition prompt switches to meal-estimation mode.

**Scan Another cleanup:** `handleScanAnother()` in `home.tsx` calls `queryClient.removeQueries` for all four cache key types eagerly — doesn't wait for gcTime.

**No database:** `MemStorage` (`server/storage.ts`) holds three `Map` instances. All data lost on server restart. On Vercel, each cold start gets fresh Maps — no scan history persists across invocations.

**CORS:** Required because GitHub Pages (`scanitknowit.com`) and the backend (Vercel, different domain) are cross-origin. The Express app must call `app.use(cors({ origin: process.env.CORS_ORIGIN || 'https://scanitknowit.com' }))`. All client API fetch calls prefix with `import.meta.env.VITE_API_URL ?? ''`.

### Dead code (safe to ignore)

- `USE_HUGGINGFACE = false`, `DEMO_MODE = false` in `openai.ts` — all HuggingFace/demo paths unreachable
- `openai` npm package — installed but never imported
- `@tensorflow-models/mobilenet`, `@tensorflow/tfjs` — installed but never imported
- `analyzeFeatures()` in `openai.ts` — UPSA endpoint commented out in `routes.ts`
- `POST /api/select-product`, `POST /api/analyze-product/deep` — registered but never called by client
- `@neondatabase/serverless`, `wouter`, `tesseract.js`, `sharp` — installed but unused

### TanStack Query cache keys

```
["composition",  analysisId]   staleTime: Infinity, gcTime: 30min
["ingredients",  analysisId]   staleTime: Infinity, gcTime: 30min
["reddit",       analysisId]   staleTime: Infinity, gcTime: 30min, retry: false
["/api/chat/${id}"]            staleTime: Infinity, gcTime: 60min — patched by useMutation onSuccess
["analysis",     analysisId]   invalidated on "Scan Another"
```

### Design system

Brand colors (hardcoded, not Tailwind defaults):
- Primary blue: `#2d3a8c` (buttons, active states)
- Accent blue: `#4A6BFF`
- Bounding box lime: `#B2F746` / electric blue: `#4466FA` / pink: `#FF86C3`
- App background: `#0E0E0E`

Camera and processing screens are always dark (`#0E0E0E`) — they overlay a live camera feed. Analysis and sheet surfaces respond to `useTheme()`. Theme state lives in `client/src/hooks/use-theme.tsx`.

Brand assets (`Logo`, `AppIconDark`, `AppIconLight`, `AppTitle`) live in `client/src/components/`. Theme-aware SVGs in `client/public/assets/`.

### Environment variables

| Variable | Required | Where used | Notes |
|---|---|---|---|
| `GROQ_API_KEY` | **Yes** | Backend | Primary AI — all vision + analysis |
| `GEMINI_API_KEY` | **Yes** | Backend | Fallback AI — `gemini-2.5-flash-lite` |
| `OCR_API_KEY` | No | Backend | OCR.Space fallback; hardcoded default in `ocrFallback.ts` |
| `USDA_API_KEY` | No | Backend | USDA FDC nutrition fallback; hardcoded default in `usdaFdc.ts` |
| `CORS_ORIGIN` | Yes (prod) | Backend | Allowed frontend origin, e.g. `https://scanitknowit.com` |
| `NODE_ENV` | Yes (prod) | Backend | Must be `production` — switches from Vite HMR to `serveStatic()` |
| `PORT` | No | Backend | Defaults to `10000`; overridden by host automatically |
| `VERCEL` | Auto | Backend | Set to `1` by Vercel runtime — guards `listen()` and `serveStatic()` |
| `VITE_API_URL` | Yes (prod) | Frontend build | Backend URL baked into Vite build; empty string in local dev |
