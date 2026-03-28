# Architecture Overview

## Purpose
`pypnm-webui` is a frontend-only client for PyPNM REST APIs.

- UI handles forms, request execution, and result visualization.
- Backend remains source of truth for business logic and analysis.

## High-Level Structure
- `src/app`: app bootstrap and providers
- `src/routes`: route definitions
- `src/layouts`: shell and page layout
- `src/features`: endpoint/workflow modules
- `src/components`: reusable UI components
- `src/services`: API client and endpoint services
- `src/types`: request/response/domain types
- `src/lib`: shared helpers/utilities

## Design Rules
- Do not reimplement backend logic in UI.
- Keep endpoint integrations isolated in service modules.
- Use typed contracts for all request/response payloads.
- Prefer reusable components over endpoint-specific one-offs.
- Keep analysis math and derived calculations in shared `src/lib` helpers so
  multiple RxMER/analysis views can reuse one implementation.

## Analysis Viewer Baseline
- `src/features/analysis/types.ts` holds typed analysis contracts for the current fixture-backed view.
- `src/features/analysis/analysisViewModel.ts` contains pure display-oriented derivations for summaries and chart series.
- `src/features/analysis/components/` contains reusable technical UI blocks:
  - `DeviceInfoTable`
  - `LineAnalysisChart`
  - `ChannelAnalysisCard`
- `src/components/common/ExportActions.tsx` and `src/lib/export/` provide the
  shared export framework so advanced and single-capture views reuse the same
  PNG/CSV logic instead of implementing endpoint-local download code.
- `src/pages/AnalysisViewerPage.tsx` composes those pieces into the current RxMER echo analysis route.
- Current state: fixture-backed UI proving the analysis composition model without duplicating backend logic.

## Instance Target Selection
- `public/config/pypnm-instances.yaml` is the version-controlled runtime template.
- `public/config/pypnm-instances.local.yaml` is the machine-local runtime config
  file when present.
- The runtime loader merges both files by instance `id` instead of treating
  `.local` as a full-file replacement.
- Each instance can also carry `request_defaults` used to prefill capture and
  device request forms for that specific PyPNM agent.
- `src/app/InstanceConfigProvider.tsx` loads the YAML, normalizes it, and persists the selected instance in local storage.
- `src/components/layout/InstanceSelector.tsx` exposes the dropdown in the top navigation.
- Service calls should take the selected instance base URL from provider state rather than hardcoding one target.
- Shared request form defaults should come from the selected instance rather
  than from hardcoded form values.

## Operations Catalog Direction
- The WebUI uses a compact operations menu modeled after the Postman
  collection structure rather than a flat endpoint table.
- `src/features/operations/operationsNavigation.ts` is the editable registry
  for top-level operations menu entries.
- `src/pages/EndpointExplorerPage.tsx` is the current operations page for
  endpoint-bound request forms and visuals.

## Advanced Workflow Direction

- PyPNM `advance` routes are not one-shot capture endpoints.
- They are long-running multi-capture workflows with an explicit operation life cycle.
- The WebUI should treat them as state-machine-driven workbenches rather than reusing the
  single-capture operations page.

Current backend families under `advance`:

- `/advance/multi/ds/rxMer`
- `/advance/multi/ds/channelEstimation`
- `/advance/multi/us/ofdmaPreEqualization`

Common backend flow:

1. `start`
   - create a background capture job
   - return `group_id` and `operation_id`
2. `status/{operation_id}`
   - return operation state, collected count, and remaining time
3. `results/{operation_id}`
   - return or download captured samples
4. `stop/{operation_id}`
   - stop the capture early
5. `analysis`
   - run one or more analysis types against the existing captured dataset

### WebUI State Machine

The Advanced workbench should use a reusable client-side state machine with these states:

- `idle`
  - no operation started yet
- `starting`
  - start request in flight
- `running`
  - operation started successfully and polling is active
- `stopping`
  - stop request in flight
- `completed`
  - backend reports terminal success state
- `stopped`
  - user stopped the operation early
- `failed`
  - backend start, polling, stop, or analysis failed

Required persisted workflow context:

- selected advanced operation type
- submitted start payload
- `group_id`
- `operation_id`
- latest status payload
- latest results metadata
- latest analysis payload per analysis type

### Important Behavior

- Analysis should be decoupled from capture start.
- Once a capture operation exists, the user should be able to run multiple analysis types
  against the same `operation_id` without restarting the capture.
- If the user stops a running capture early, the WebUI should still allow:
  - viewing collected results
  - running supported analysis types against whatever data was captured
- Status polling should be visible and user-facing:
  - current state
  - collected sample count
  - time remaining when available
  - live refresh while the job is active
- The user should always have an explicit `Stop` action while the job is running.

### Advanced First Slices

The first Advanced implementations should be:

- `Advanced -> RxMER`
- `Advanced -> Channel Estimation`
- `Advanced -> OFDMA PreEq`

RxMER is the correct first slice because the backend already exposes:

- distinct measurement modes
- a clean operation life cycle
- reusable analysis types on the same captured dataset

Expected RxMER workbench sections:

- `Request`
  - measurement duration
  - sample interval
  - measure mode
  - channel selection
  - cable modem and SNMP/TFTP request defaults
- `Run`
  - start button
  - live operation state
  - progress/status summary
  - stop button while active
- `Results`
  - collected samples table
  - result archive download
- `Analysis`
  - select analysis type
  - run analysis against current `operation_id`
  - swap analysis types without forcing a new capture

Initial RxMER analysis types to support:

- `Min / Avg / Max`
- `Heat Map`
- `Echo Detection 1`
- `OFDM Profile Performance 1`

### WebUI Implementation Split

Recommended module layout:

- `src/features/advanced/`
  - advanced workflow state and hooks
  - operation-specific request forms
  - status and results panels
  - analysis selectors and views
- `src/services/advanced/`
  - start/status/results/stop/analysis API calls
- `src/types/advanced/`
  - advanced request/response contracts

Recommended reusable primitives:

- `useAdvancedOperationMachine`
  - manages start, polling, stop, and terminal states
- `useAdvancedAnalysisRunner`
  - runs analysis for an existing `operation_id`
- `AdvancedStatusPanel`
  - live operation status and controls
- `AdvancedResultsPanel`
  - collected sample inventory and downloads
- `AdvancedAnalysisPanel`
  - analysis type selection and rendering

The single-capture `Operations` page should remain separate from this workflow.
The Advanced area should be its own top-level tab and should not be forced into the
endpoint-bound request/visual model used for one-shot operations.

## File Manager Direction
- PyPNM file-management workflows should live under a separate top-navigation
  tab rather than being folded into the endpoint operations menu.
- The File Manager area should represent `/docs/pnm/files` as a dedicated
  workflow surface for:
  - listing registered MAC addresses with stored PNM files
  - searching files by MAC address
  - downloading by transaction ID, filename, MAC address, or operation ID
  - uploading external PNM files
  - requesting analysis by transaction ID
  - requesting hexdump inspection by transaction ID
- The file-manager area should not continue growing as a single verbose page.
  Split it into focused routes under the `Files` tab:
  - `Browse`: registered MACs, search results, and download actions
  - `Upload`: raw file ingest and upload result metadata
  - `Inspect`: transaction-driven hexdump and file-triggered analysis
- The File Manager implementation should follow the same split used elsewhere:
  - feature-specific request and response contracts in `src/types`
  - API calls in `src/services`
  - reusable tables and inspectors in `src/components/common`
  - workflow composition in a dedicated page module
- The file-management visuals will be WebUI-native and should not depend on the
  Postman visualizer set because these endpoints were not part of that Postman
  collection baseline.


## Device Interface Stats

The WebUI includes a dedicated `Operations -> Device -> Interface -> Stats` flow for `/docs/pnm/interface/stats`. It reuses the shared device-connect request form and renders grouped interface inventory tables from the DOCSIS interface statistics response.
