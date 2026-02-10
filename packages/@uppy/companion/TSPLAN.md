# TypeScript Port Plan (Companion)

Goal: port `@uppy/companion` to TypeScript safely, with no observable runtime/packaging changes for downstream users (except improved editor autocomplete and potential type errors for incorrect usage).

Non-goals: redesigning runtime validation, changing public API behavior, or breaking existing configuration shapes.

## Safety Invariants

- Keep published entrypoints stable:
  - `package.json` `exports` continues to point at `dist/**/*.js`.
  - `bin/companion` continues to import from `dist/standalone/start-server.js`.
  - File layout under `dist/` remains compatible with previous releases.
- Preserve ESM + Node semantics:
  - Keep `"type": "module"` and `moduleResolution`/`module` as `NodeNext`.
- Keep runtime behavior stable:
  - No new strict runtime validation that rejects inputs that previously worked (unless current code already throws/4xx).
- Prefer TypeScript that is “erasable”:
  - Enable `erasableSyntaxOnly` so Node can strip types when desired.
  - Avoid non-erasable TS syntax: `enum`, `namespace`, decorators, parameter properties, etc.
- Prefer `unknown` + guards/schemas over `any`/`as`:
  - Boundaries accept `unknown` where needed.
  - Narrow via zod schemas and small, explicit type guards.

## Tooling Strategy

### `.ts` import specifiers, emitted `.js`

We want source imports like `import x from './x.ts'` but emitted JS imports to remain `./x.js`.

TypeScript settings to enable:
- `allowImportingTsExtensions: true`
- `rewriteRelativeImportExtensions: true`
- `erasableSyntaxOnly: true`

This allows us to:
- keep authoring `.ts` imports (explicitness),
- keep the emitted `dist/**/*.js` runnable by Node and consistent for consumers,
- guarantee we didn’t introduce non-erasable TS features.

### Zod as the “central truth”

Introduce a central schemas module under `src/schemas/` (zod v3):
- Prefer tolerant schemas first:
  - `z.object({...}).passthrough()` for options bags to avoid breaking unknown keys.
  - `z.coerce.*` for env/query inputs that are often strings.
  - Use `safeParse` + fallback/defaults where current runtime is permissive.
- Export both input/output types:
  - `type XInput = z.input<typeof XSchema>`
  - `type X = z.output<typeof XSchema>`
- Public API parameters should prefer `XInput` (broad); internals should use `X` (narrow).

## Migration Order (incremental, always buildable)

### Phase 0: Baseline + Guardrails

1. Ensure `build`, `typecheck`, and `test` are run for Companion in CI.
2. Add smoke tests that lock in the published surface:
   - Import `@uppy/companion` and assert expected exports exist (`app`, `socket`, `errors`, etc).
   - Optionally: a basic “standalone server starts” smoke check.
3. Treat emitted `dist/**` as an invariant (paths/entrypoints must stay stable).

### Phase 1: TS Execution Model + Build Config

1. Enable `erasableSyntaxOnly` and `.ts` import rewriting for build.
2. Keep `allowJs: true` during migration.
3. Convert the public entrypoints first:
   - `src/companion.(js->ts)`
   - `src/standalone/(index|helper|start-server).(js->ts)` as needed
4. Ensure `dist/companion.d.ts` stops leaking `any` for key exports where feasible.

### Phase 2: Central Schemas + Boundary Types

1. Add zod v3 and create `src/schemas/`:
   - `EnvSchema` (coerced strings to numbers/booleans where used)
   - `CompanionOptionsSchema` (tolerant/passthrough initially)
   - Request param/query/body schemas for core endpoints (tolerant first)
2. Update boundary points to accept `unknown` then narrow:
   - Companion options input
   - Provider API responses (validate only fields that are read)

### Phase 3: Core Internals (highly depended upon)

Convert and type the modules that most other code depends on:
- `server/helpers/**`
- `server/logger`
- `server/emitter/**`
- `server/socket`
- error types + shared domain objects (upload/job/progress payloads)

### Phase 4: Controllers and Middleware

Convert `server/controllers/**` and `server/middlewares`:
- Use zod schemas to narrow `req.params/query/body` where it improves safety.
- Avoid behavioral changes:
  - prefer coercion and defaults over rejecting requests.

### Phase 5: Provider Framework + Providers

1. Type the provider base interface and the most used providers first.
2. For third-party API JSON:
   - start with `unknown`
   - use zod to validate only accessed fields
3. Finish leaf providers last, letting inference flow down.

## Strictness Ratchet (avoid big-bang)

- Start with a migration-friendly baseline (keep `allowJs`, avoid flipping everything to strict immediately).
- Enforce “style” constraints early:
  - discourage `as any`, `// @ts-ignore`
  - prefer `satisfies`, `unknown`, schemas/guards
- Once most code is converted and schemas are in place:
  - ratchet toward `noImplicitAny: true` and (eventually) `strict: true`.

## Verification Checklist (each phase)

- `yarn workspace @uppy/companion build`
- `yarn workspace @uppy/companion typecheck`
- `yarn workspace @uppy/companion test`
- Smoke checks:
  - `import('@uppy/companion')` exports exist
  - optional: server starts in standalone mode
