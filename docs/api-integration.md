# API Integration

`PyPNM-CMTS-WebUI` is frontend-only and consumes CMTS APIs.

## Current MVP endpoints

### Health / runtime

- `GET /health`
- `GET /ops/servingGroupWorker/process`

### Serving Group selection

- `POST /cmts/servingGroup/operations/get/cableModems`
  - request includes `cmts.serving_group.id`
  - WebUI uses `refresh.mode: light`

### RxMER operation lifecycle

- `POST /cmts/pnm/sg/ds/ofdm/rxmer/startCapture`
- `POST /cmts/pnm/sg/ds/ofdm/rxmer/status`
- `POST /cmts/pnm/sg/ds/ofdm/rxmer/results`
- `POST /cmts/pnm/sg/ds/ofdm/rxmer/cancel`

## Integration rules

- never duplicate backend business logic in UI
- keep endpoint calls in service modules
- keep request/response types strict and centralized
- show explicit loading/error states for each fetch
- keep request payload inspection available via `Request JSON` popup
