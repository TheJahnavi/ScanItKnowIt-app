# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development (Express + Vite HMR together via tsx)
npm run dev

# Type checking only (no emit)
npm run check

# Production build (Vite client + esbuild server + copy assets)
npm run build

# Run production build
npm start
```

No test suite. No lint script — use `npm run check` for TypeScript errors.

## Architecture

Monorepo: React SPA (Vite) served by Express. In development, Vite is mounted inside Express (`server/vite.ts`). In production, Express serves `dist/public/`.

### AI Stack (two-tier fallback)

**Primary — Groq** (`server/services/groq.ts`):
- Vision: `llama-3.2-11b-vision-preview` (500 req/day free)
- Text analysis (composition, ingredients, reddit, chat): `llama-3.3-70b-versatile` (14,400 req/day free)
- Uses `response_format: { type: "json_object" }` — no markdown unwrapping needed
- Rate-limit state: two module-level vars `lastPerMinute429` / `lastPerDay429` with separate cooldowns (65 s / 23 h)

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
4. Server: Groq vision → Gemini vision → OCR fallback. Saves raw bytes to `data/images/img-{ts}.jpg`; falls back to inline `data:image/jpeg;base64,...` if disk write fails.
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
| `client/src/hooks/use-scan-history.ts` | `addScan()`, `getScanHistory()` — `localStorage`-backed scan history, max 50 entries |

### Key design decisions & non-obvious patterns

**Rate-limit system:** Module-level timestamp vars in both service files. After quota exhaustion, `checkGroqCooldown()` / `checkQuotaCooldown()` fast-fail all calls for their respective cooldown periods. `withGroqRetry()` / `withGeminiRetry()` retry 503 (transient overload) but never 429.

**forceRefresh bypass:** POST bodies with `{ forceRefresh: true }` skip the cached `compositionData`/`ingredientsData`/`redditData` in storage and re-call AI. Each card's Refresh button sends this.

**Image storage:** Raw bytes written to `data/images/img-{ts}.jpg` on server startup dir. On disk-write failure (e.g., read-only filesystem), falls back to `data:image/jpeg;base64,...` inline in MemStorage — functional but memory-heavy.

**`isGeneralScene` flag:** Set when `extractedText.brand` matches `/^not applicable$|^not visible$/i`. Reddit card is hidden for general scenes (always 503s). Composition prompt switches to meal-estimation mode.

**Scan Another cleanup:** `handleScanAnother()` in `home.tsx` calls `queryClient.removeQueries` for all four cache key types eagerly — doesn't wait for gcTime.

**No database:** `MemStorage` (`server/storage.ts`) holds three `Map` instances. All data lost on server restart. Same product scanned twice costs two full AI calls.

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

| Variable | Required | Service | Notes |
|---|---|---|---|
| `GROQ_API_KEY` | **Yes** | Groq Cloud | Primary AI — all vision + analysis |
| `GEMINI_API_KEY` | Yes | Google AI Studio | Fallback AI — `gemini-2.5-flash-lite` |
| `OCR_API_KEY` | No | OCR.Space | Barcode/label OCR fallback; has hardcoded default in `ocrFallback.ts` |
| `USDA_API_KEY` | No | USDA FDC | Nutrition composition fallback; has hardcoded default in `usdaFdc.ts` |
| `NODE_ENV` | Yes (prod) | Express | Must be `production` — switches from Vite HMR to `serveStatic()` |
| `PORT` | No | Express | Defaults to `10000` (Render-compatible); Render sets automatically |
| `ALLOWED_ORIGINS` | No | CORS (if added) | Comma-separated allowed origins for production CORS |

### Repositories

- **Production repo**: `https://github.com/TheJahnavi/ScanItKnowIt-app`
- **Old repo (cleaned)**: `https://github.com/jahnavitry-tech/ScanItKnowItprod`

## graphify

This project has a graphify knowledge graph at `graphify-out/`.

- Before answering architecture or codebase questions, read `graphify-out/GRAPH_REPORT.md` for god nodes and community structure.
- If `graphify-out/wiki/index.md` exists, navigate it instead of reading raw files.
- After modifying code files in this session, run `graphify update .` to keep the graph current (AST-only, no API cost).
