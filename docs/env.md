# Environment Configuration

## Required Variables
- `VITE_PYPNM_API_BASE_URL`: Base URL for PyPNM REST API.

## Optional Variables
- `VITE_REQUEST_TIMEOUT_MS`: HTTP timeout override in milliseconds.
- `PRODUCT_PROFILE`: install/runtime profile selector (`pypnm-webui` or
  `pypnm-cmts-webui`).
- `VITE_PRODUCT_PROFILE`: client-visible profile selector; installer keeps this
  aligned with `PRODUCT_PROFILE`.

## Runtime Instance Config
- Path: `public/config/pypnm-instances.yaml`
- Local Path: `public/config/pypnm-instances.local.yaml`
- Purpose: define multiple PyPNM instances for the UI dropdown
- Behavior:
  - the UI loads both runtime YAML files when present
  - the two files are merged by instance `id`
  - unmatched instances from both files remain in the dropdown
  - selected instance base URL overrides `VITE_PYPNM_API_BASE_URL`
  - if both runtime YAML files are missing or invalid, the UI falls back to
    `.env` through an in-memory default config

## YAML Shape
```yaml
version: 1

defaults:
  selected_instance: pypnm-agent-1
  poll_interval_ms: 5000
  request_timeout_ms: 30000
  health_path: /health
  logging:
    level: INFO

instances: []
```

`config-menu` can print this schema directly with:

```bash
pypnm-cmts-webui config-menu
# then press: s
```

`config-menu` enforces profile-specific defaults:

- `pypnm-cmts-webui`: rejects `request_defaults.cable_modem`
- `pypnm-webui`: allows `request_defaults.cable_modem`

## Example
```env
VITE_PYPNM_API_BASE_URL=http://127.0.0.1:8000
VITE_REQUEST_TIMEOUT_MS=15000
```

## Notes
- Keep `.env.local` out of version control.
- Provide defaults in `.env.example` once scaffold is created.
