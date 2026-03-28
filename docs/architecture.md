# Architecture

## Purpose

`PyPNM-CMTS-WebUI` is a frontend application for CMTS REST APIs.

- UI handles request composition and visualization.
- CMTS backend remains source of truth for data and analysis.

## Current MVP UI surfaces

- `Serving Group` (RxMER first operation)
- `Health`
- `Settings`
- `About`

## Source layout

- `src/pages`: route-level pages
- `src/features`: workflow-specific modules
- `src/components/common`: reusable UI pieces
- `src/services`: endpoint clients
- `src/types`: request/response contracts
- `src/lib`: pure shared helpers

## Serving Group RxMER architecture

- route page: `CmtsSgRxMerWorkflowPage`
- reusable request form: `ServingGroupCaptureRequestForm`
- API transport: `requestWithBaseUrl` in `src/services/http.ts`
- runtime instance selection from YAML via app provider

## Constraints

- no backend logic in UI
- strict typing for payload contracts
- reusable shared components for repeated request patterns
- theme parity across dark and light modes
