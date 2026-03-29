# Architecture

## Purpose

`PyPNM-CMTS-WebUI` is a frontend application for CMTS REST APIs.

- UI handles request composition and visualization.
- CMTS backend remains source of truth for data and analysis.

## Current MVP UI surfaces

- `Serving Group` (RxMER first operation)
- `SingleCapture`
- `Spectrum Analyzer`
- `Health`
- `Settings`
- `About`

## Source layout

- `src/pcw`: CMTS-specific UI/workflow code
- `src/pw`: PW-derived shared UI/workflow code
- `src/components/common`: reusable UI pieces
- `src/services`: shared infrastructure services (`http`, `health`, `files`, etc.)
- `src/types`: request/response contracts
- `src/lib`: pure shared helpers

### Namespaced split

- `src/pcw/pages`: CMTS workflow pages (`Cmts*`)
- `src/pcw/features`: CMTS feature modules (`serving-group`, `spectrum-analyzer`)
- `src/pcw/services`: CMTS endpoint services (`servingGroup*`)
- `src/pw/pages`: PW-style explorer/analysis pages
- `src/pw/features`: PW-derived features (`operations`, `advanced`, `analysis`, `single-capture`)
- `src/pw/services`: PW-style capture and advanced services

## Serving Group RxMER architecture

- route page: `src/pcw/pages/CmtsSgRxMerWorkflowPage.tsx`
- reusable request form: `src/pcw/features/serving-group/components/ServingGroupCaptureRequestForm.tsx`
- API transport: `requestWithBaseUrl` in `src/services/http.ts`
- runtime instance selection from YAML via app provider

## PW and PCW contract shim

PCW reuses PW request and visualization flows. A compatibility shim in
`src/lib/pwCompat.ts` defines the contract for endpoint translation.

- PW API paths are mapped through one adapter (`toPwApiPath`)
- PCW-only APIs (`/cmts/...`) pass through unchanged
- Shared flows call the shim, not hardcoded prefixes

```mermaid
flowchart LR
  UI[PW-style UI Flows<br/>EndpointExplorer, Single Capture, Files]
  NAV[Operation Registry<br/>operationsNavigation]
  SERVICES[Service Layer<br/>captureConnectivityService<br/>pnmFilesService<br/>singleCaptureService]
  SHIM[pwCompat contract<br/>toPwApiPath(path)]
  PWAPI[/PW API via embedded prefix<br/>/cm/docs/...<br/>/cm/system/.../]
  PCWAPI[/PCW-native API<br/>/cmts/.../]
  BACKEND[PyPNM-CMTS backend]

  UI --> NAV
  UI --> SERVICES
  NAV --> SHIM
  SERVICES --> SHIM
  SHIM --> PWAPI
  SHIM --> PCWAPI
  PWAPI --> BACKEND
  PCWAPI --> BACKEND
```

## Constraints

- no backend logic in UI
- strict typing for payload contracts
- reusable shared components for repeated request patterns
- theme parity across dark and light modes
