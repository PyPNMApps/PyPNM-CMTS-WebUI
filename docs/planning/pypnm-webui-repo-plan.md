# PyPNM-WebUI Repository Plan

## 1. Repository Purpose
`pypnm-webui` is a standalone frontend client for the PyPNM REST API.

- Scope: UI rendering, form input, request orchestration, response visualization.
- Non-scope: SNMP logic, DOCSIS decoding, analysis engines, backend business rules.
- Contract: backend remains source of truth; UI displays backend-derived results and metadata.

## 2. Recommended Tech Stack
Use your recommended stack as default:

- Framework: React 18+
- Language: TypeScript (strict mode)
- Build/dev: Vite
- Package manager: `pnpm` (fast, deterministic, workspace-friendly)
- Routing: React Router
- HTTP: Axios
- Data fetching/cache: TanStack Query
- Forms: React Hook Form
- Validation: Zod
- Styling: Tailwind CSS (+ small design token layer)
- Tables: TanStack Table
- Charts: Recharts (expandable later to ECharts if needed)
- Testing: Vitest + React Testing Library + MSW (+ Playwright smoke E2E)

Why: practical, well-supported, fast local dev, strong typing, modular growth path.

## 3. Proposed Repository Structure
```text
pypnm-webui/
  src/
    app/                 # app bootstrap, providers, global config
    routes/              # route definitions and route guards
    layouts/             # app shell, page frame, header/sidebar
    pages/               # top-level screens
    features/            # endpoint/workflow modules
      health/
      endpoint-explorer/
      measurements/
      results/
      files/
      analysis/
      settings/
    components/          # reusable UI components
      common/
      data-display/
      forms/
      feedback/
    services/            # API services by domain/endpoint group
      api-client.ts
      health.service.ts
      measurement.service.ts
      results.service.ts
    hooks/               # reusable hooks
    lib/                 # utility helpers, formatters, constants
    types/               # shared TypeScript models/types
      api/
      domain/
    assets/              # static assets used by app
    styles/              # global styles/tokens
  public/                # static public files
  tests/                 # integration/helpers/e2e support
  docs/                  # architecture and developer docs
  .env.example
  vite.config.ts
  tsconfig.json
  package.json
  README.md
```

## 4. UI Architecture
- Page-level organization: each route maps to a feature page with feature-local components/services.
- Feature modularity: endpoint-specific forms/results inside `src/features/<feature>`.
- Reusable components: tables, status badges, JSON viewer, loading/error panels in `src/components`.
- Shared API layer: one Axios instance + interceptors; service modules wrap endpoint calls.
- Shared models: `src/types/api` for request/response contracts.
- Env config: `VITE_PYPNM_API_BASE_URL`.
- Error states: normalized API error object, displayed consistently.
- Loading states: skeleton/spinner at section level, not full-page block where possible.
- Empty states: explicit “No data returned” with request context shown.

## 5. API Integration Strategy
- Centralized API client (`api-client.ts`):
  - baseURL, timeout, headers, interceptors, request ID support.
- Endpoint services:
  - `health.service.ts`, `measurements.service.ts`, etc.
- Typed contracts:
  - Zod schemas for runtime validation + inferred TS types.
- Query strategy:
  - TanStack Query for GET/status/results polling.
  - mutations for POST/trigger operations.
- Retry/timeout:
  - short retries for idempotent health/status calls.
  - no blind retries for operation-triggering POSTs unless explicit.
- Response normalization:
  - map backend envelope (`status`, `message`, `timestamp`, payload) to UI view model.
- File/download handling:
  - blob download helpers, filename extraction from headers, failure fallback.

## 6. Initial Screens And Features (MVP)
1. Home / Overview
- Purpose: entry point + quick system summary.
- Inputs: none.
- Outputs: API target, connectivity status, recent actions.

2. Health / Connectivity
- Purpose: verify API availability and basic diagnostics.
- Inputs: optional target override.
- Outputs: response metadata, latency, status messages.

3. Endpoint Explorer
- Purpose: browse available endpoint workflows and payload templates.
- Inputs: endpoint/filter selection.
- Outputs: endpoint docs summary, sample request, execute action.

4. Measurement Request (generic first)
- Purpose: submit one real PyPNM operation (MAC/IP + endpoint-specific fields).
- Inputs: MAC/IP/endpoint options.
- Outputs: submitted payload preview + operation identifiers/status.

5. Results / Detail Viewer
- Purpose: show structured result envelope and parsed sections.
- Inputs: operation ID / params.
- Outputs: cards, tables, JSON raw.

6. File List / Analysis Viewer (basic)
- Purpose: list generated artifacts and show analysis summary panels.
- Inputs: operation context.
- Outputs: file table, quick metrics/charts.

## 7. Visualization Strategy
- Summary cards: status, counts, durations, key metrics.
- Detail panels: per-domain sections (device, measurement, files, analysis).
- Raw response viewer: collapsible JSON inspector.
- Tables: TanStack Table for sortable/filterable structures.
- Charts: Recharts for line/bar/area (RxMER/histograms/modulation summaries).
- Expandable advanced sections for engineering data density.
- Export affordances: copy payload, download JSON/CSV where available.
- Future-ready chart modules for spectrum/constellation/histogram workflows.

## 8. UX Guidance
- Explicit, technical forms with labeled required/optional fields.
- Keep request/response traceability visible:
  - show submitted payload,
  - endpoint path,
  - backend status/message/timestamp.
- Dual-view: interpreted UI + raw JSON.
- Strong feedback:
  - pending, success, error, partial data.
- Copy-to-clipboard controls for MACs, operation IDs, payloads.

## 9. Configuration And Environments
- `.env` variables:
  - `VITE_PYPNM_API_BASE_URL`
  - optional `VITE_REQUEST_TIMEOUT_MS`
- Modes:
  - local dev (`vite`)
  - production build (`vite build`)
- API target switching:
  - settings page override persisted in local storage (optional).
- Docker later:
  - `Dockerfile` + static host (nginx/caddy) after MVP stabilization.

## 10. Testing Strategy
- Unit tests:
  - formatters, mappers, utility helpers.
- Component tests:
  - forms, tables, error/loading panels.
- API mocking:
  - MSW for deterministic endpoint behavior.
- Smoke tests:
  - app loads, routing works, health page call.
- Minimal E2E:
  - one critical flow: submit request -> poll status -> view result.

## 11. Documentation Plan
Initial docs:
- `README.md`: setup/run/build/test.
- `docs/architecture.md`: module boundaries and data flow.
- `docs/api-integration.md`: client patterns and envelope assumptions.
- `docs/env.md`: env variables and configuration.
- `docs/development/workflow.md`: lint/test/PR conventions.
- `docs/roadmap.md`: post-MVP features.

## 12. Implementation Phases
### Phase 0: Scaffold and Tooling
- Objective: bootstrap repo and standards.
- Deliverables: Vite TS app, lint/format/test setup, base docs.
- Acceptance: app runs, tests run, CI baseline passes.

### Phase 1: App Shell + Routing
- Objective: layout and navigation.
- Deliverables: sidebar/header, route structure, placeholder pages.
- Acceptance: navigable shell with consistent layout.

### Phase 2: API Client + Health
- Objective: stable REST foundation.
- Deliverables: Axios client, error normalization, health page.
- Acceptance: health call works with loading/error states.

### Phase 3: Endpoint Explorer + Generic Measurement Form
- Objective: first useful workflow.
- Deliverables: endpoint catalog, form with Zod validation, submit mutation.
- Acceptance: successful POST with visible request/response metadata.

### Phase 4: Results Viewer + Reusable Data Panels
- Objective: readable technical outputs.
- Deliverables: summary cards, tables, JSON viewer, detail panels.
- Acceptance: operation results render consistently for sample payloads.

### Phase 5: Visualization + File/Analysis Panels
- Objective: richer engineering insights.
- Deliverables: chart modules, file list, analysis view.
- Acceptance: at least one charted endpoint flow works end-to-end.

### Phase 6: Hardening, Tests, Docs, Container Prep
- Objective: production-readiness baseline.
- Deliverables: smoke E2E, improved test coverage, Docker-ready config, finalized docs.
- Acceptance: CI stable, onboarding docs complete.

## 13. Risks And Design Rules
- Never duplicate backend logic.
- Avoid hardcoding backend-internal assumptions.
- Keep endpoint integration isolated per service module.
- Type all request/response payloads.
- Reuse components; avoid page-specific one-offs unless justified.
- Keep auth/RBAC extension points in routing and API client.
- Maintain cross-platform developer workflow (Linux/Windows friendly scripts and setup).

## 14. Deliverable Summary
- Recommended repo name: `pypnm-webui`
- Recommended stack: React + TS + Vite + Router + TanStack Query + Axios + RHF + Zod + Tailwind + TanStack Table + Recharts + Vitest/RTL/MSW
- Recommended MVP:
  1. App shell/navigation
  2. Health/connectivity
  3. Endpoint explorer
  4. Generic measurement form
  5. Results/detail viewer
  6. Reusable cards/tables/JSON panels
- Final folder tree: see Section 3
- Phased roadmap: see Section 12
- Next step recommendation:
  1. Create repo scaffold (Phase 0)
  2. Implement API client + health page (Phase 2)
  3. Build first real endpoint workflow (Phase 3)
