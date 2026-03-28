# Runtime Configuration

## Runtime files

`PyPNM-CMTS-WebUI` loads runtime instance data from:

- `public/config/pypnm-instances.yaml` (repo template)
- `public/config/pypnm-instances.local.yaml` (machine-local overrides)

The UI merges these by instance `id`.

## Recommended model

- keep safe defaults in `pypnm-instances.yaml`
- keep lab/local endpoints in `pypnm-instances.local.yaml`
- use `pypnm-cmts-webui config-menu` for local edits

```bash
pypnm-cmts-webui config-menu
```

## Required instance fields

Each instance should include:

- `id`
- `label`
- `base_url`
- `enabled`

For current Serving Group RxMER flow, ensure `base_url` points to a CMTS API
that supports:

- `/health`
- `/ops/servingGroupWorker/process`
- `/cmts/servingGroup/operations/get/cableModems`
- `/cmts/pnm/sg/ds/ofdm/rxmer/startCapture`

## Environment fallback

If runtime YAML is unavailable, the app falls back to:

- `VITE_PYPNM_API_BASE_URL`
- `VITE_REQUEST_TIMEOUT_MS`

in `.env`.
