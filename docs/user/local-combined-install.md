# Local Combined Install

Use this workflow when `pypnm-docsis` and `PyPNM-WebUI` will run on the same
machine and you want the installer to configure the WebUI for that local
backend automatically.

## Goal

This mode aims to be close to zero-touch:

- install the WebUI
- install a local `pypnm-docsis` backend
- choose a local API host automatically or with one prompt
- configure the WebUI `Local PyPNM Agent`
- make that local agent the selected default
- give you one command to start both services
- give you a direct backend CLI command (`pypnm-docsis`)

## One-command install

From the repo root:

```bash
./install.sh --with-pypnm-docsis
```

## What the installer does

When `--with-pypnm-docsis` is used, the installer:

- keeps the normal WebUI bootstrap behavior
- uses the same `.venv` managed by WebUI install
- installs `pypnm-docsis` into that shared environment
- detects local IPv4 addresses on the machine
- chooses a local API host for WebUI runtime config
- writes or updates `public/config/pypnm-instances.local.yaml`
- creates a `Local PyPNM Agent` runtime entry
- reserves the runtime id `local-pypnm-agent` for that combined-install entry
- sets `defaults.selected_instance` to `local-pypnm-agent`
- installs a local helper command path:
  - `pypnm-webui start-local-stack`

## Default ports

This workflow assumes both services are on the same host.

Defaults:

- PyPNM backend: `8000`
- WebUI: `4175`

## Local API host selection

The only install-time choice is the host the WebUI should use for the local
PyPNM backend.

Possible outcomes:

- `127.0.0.1`
  - use this when the browser and both services run on the same machine
  - simplest and safest default
- a detected interface IP such as `172.19.8.28` or `192.168.1.44`
  - use this when you want the browser or other clients to reach the backend
    through a real interface address

Current behavior:

- if `--local-api-host` is supplied, the installer uses it without prompting
- if `--local-api-port` is supplied, the installer uses that port in
  `Local PyPNM Agent` `base_url`
- if a Local PyPNM Agent is already configured, the installer reuses that host
  unless `--reconfigure-local-agent` is passed
- if the install is non-interactive, it defaults to `127.0.0.1`
- if interactive, the installer prompts for host and port when those values are
  not provided by CLI overrides

## Recommended install patterns

### Simplest local-only setup

```bash
./install.sh --with-pypnm-docsis
```

### Force loopback

```bash
./install.sh --with-pypnm-docsis --local-api-host 127.0.0.1
```

### Use a non-default local API port

```bash
./install.sh --with-pypnm-docsis --local-api-host 172.19.8.28 --local-api-port 8081
```

### Force a known interface IP

```bash
./install.sh --with-pypnm-docsis --local-api-host 172.19.8.28
```

### Re-prompt for the local host later

```bash
./install.sh --with-pypnm-docsis --reconfigure-local-agent
```

### Install backend from a local PyPNM checkout

```bash
./install.sh --with-pypnm-docsis --pypnm-docsis-path ../PyPNM
```

### Install a specific backend package version

```bash
./install.sh --with-pypnm-docsis --pypnm-docsis-version 1.5.10.0
```

## Generated WebUI runtime agent

The installer creates or refreshes this runtime agent entry:

```yaml
version: 1
defaults:
  selected_instance: local-pypnm-agent
instances:
  - id: local-pypnm-agent
    label: Local PyPNM Agent
    base_url: http://127.0.0.1:8000
    enabled: true
    tags:
      - local
      - combined-install
    capabilities:
      - health
      - analysis
      - files
    polling:
      enabled: true
      interval_ms: 5000
    request_defaults:
      cable_modem:
        mac_address: ""
        ip_address: ""
      tftp:
        ipv4: 127.0.0.1
        ipv6: ::1
      capture:
        channel_ids: []
      snmp:
        rw_community: private
```

Notes:

- the exact `base_url` follows the selected local API host and port
- `tftp.ipv4` follows the selected local API host
- the installer writes to `public/config/pypnm-instances.local.yaml`
- the installer preserves other instance entries in that file
- rerunning the installer refreshes the Local PyPNM Agent entry without wiping
  unrelated local agents

## Installed paths

This workflow adds or updates:

- shared Python environment:
  - `.venv`
- WebUI runtime variables:
  - `.env`
- backend CLI shim:
  - `~/.local/bin/pypnm-docsis`
- machine-local runtime config:
  - `public/config/pypnm-instances.local.yaml`

## Start both services

After install:

```bash
pypnm-webui serve --start-local-pypnm-docsis
```

Same-machine backend + frontend is also available with:

```bash
pypnm-webui start-local-stack
```

Behavior:

- starts `pypnm-docsis` from `.venv`
- starts WebUI on port `4175`
- stops the backend process when the WebUI process exits

Start only the backend service:

```bash
pypnm-docsis serve --host <selected-local-api-host> --port <selected-local-api-port>
```

## Verify the setup

1. Open:
   - `http://127.0.0.1:4175`
2. Confirm the top-bar agent is `Local PyPNM Agent`
3. Open `Health`
4. Verify the backend responds successfully
5. Open `Files` or `Single Capture` and confirm requests use the local agent

## Reconfigure later

If the local IP choice changes:

```bash
./install.sh --with-pypnm-docsis --reconfigure-local-agent
```

If you already know the new host:

```bash
./install.sh --with-pypnm-docsis --local-api-host 192.168.1.44
```

## Troubleshooting

### WebUI starts but API requests fail

Check:

- `public/config/pypnm-instances.local.yaml`
- `Local PyPNM Agent` `base_url`
- that `pypnm-docsis` is listening on port `8000`
- that the selected runtime agent in the top bar is still `Local PyPNM Agent`

### Wrong local IP was selected

Re-run:

```bash
./install.sh --with-pypnm-docsis --reconfigure-local-agent
```

or specify it directly:

```bash
./install.sh --with-pypnm-docsis --local-api-host 127.0.0.1
```

### `pypnm` is missing

Check:

```bash
.venv/bin/pypnm --version
```

If that fails, rerun the combined install.

### Port `8000` is already in use

Either stop the conflicting service or start the combined stack with a different
backend port:

```bash
pypnm-webui start-local-stack --api-port 8001
```

If you change the backend port for normal use, update the local runtime config
to match.

### Port `4175` is already in use

Start the combined stack on a different WebUI port:

```bash
pypnm-webui start-local-stack --webui-port 4174
```
