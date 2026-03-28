# Navigation And Agent Selection

## Top Navigation

The top navigation includes:

- `Files`
- `Operations`
- `Spectrum Analyzer`
- `Single Capture`
- `Advanced`
- `Health`
- `Settings`
- `About`

## PyPNM Agent Dropdown

The top bar includes the `PyPNM Agent` selector sourced from:

- `public/config/pypnm-instances.yaml`
- `public/config/pypnm-instances.local.yaml`

Use it to switch the active backend instance without rebuilding the UI.

Important:

- edits to the runtime YAML config files are not part of Vite hot reload
- after changing those files, reload the browser page so the updated runtime
  config is loaded

## Online Gating

Single-capture and advanced execution buttons stay disabled until the request
panel reports the cable modem as `Online`.

When execution is blocked, the action button remains grayed out and does not
show a click-style pointer on hover. This is intentional and indicates that the
current MAC, IP, and SNMP RW community have not yet passed the online check.
