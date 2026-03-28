# Runtime Configuration

## Runtime config files

PyPNM-WebUI can read runtime agent configuration from:

- `public/config/pypnm-instances.yaml`
- `public/config/pypnm-instances.local.yaml`

These files define:

- available `PyPNM Agent` dropdown targets
- the default selected agent
- per-agent request defaults for capture forms
- runtime polling and request timeout defaults

## Actual load behavior

The UI does **not** treat `.local` as a full replacement file.

Current behavior from code:

1. load `public/config/pypnm-instances.yaml` when present
2. load `public/config/pypnm-instances.local.yaml` when present
3. merge both configs by instance `id`
4. keep unmatched instances from both files
5. use the merged result as the runtime agent list

That means:

- one file can contain multiple instances
- both files can contribute instances
- a `.local` instance with the same `id` as the template instance overrides that
  instance's fields
- a `.local` instance with a new `id` adds another agent to the dropdown

## Recommended role of each file

Use:

- `public/config/pypnm-instances.yaml`
  - version-controlled template
  - safe example agents
  - repo-wide defaults
- `public/config/pypnm-instances.local.yaml`
  - machine-local additions or overrides
  - lab-specific base URLs
  - local modem/IP/community defaults

## If no YAML is configured

If neither runtime YAML file exists or both are invalid:

- the UI does **not** auto-write a YAML file on startup
- the UI falls back to an in-memory default config
- that fallback uses `VITE_PYPNM_API_BASE_URL` from `.env`

So today:

- startup fallback exists
- automatic YAML generation does **not** exist

If you want a real file on disk, use one of these:

- run `./install.sh`
- run `./install.sh --with-pypnm-docsis`
- run `pypnm-webui config-menu`
- create the YAML file manually

## Config menu

Use the interactive editor when you want to manage the local runtime config:

```bash
pypnm-webui config-menu
```

What it edits:

- runtime instance entries
- `defaults.selected_instance`
- `defaults.logging.level`
- per-instance `request_defaults`

Behavior:

- the menu saves `public/config/pypnm-instances.local.yaml`
- if the file already exists and the content changes, the menu creates a
  timestamped `.bak` backup beside it before overwrite
- base URLs are validated as HTTP(S) URLs before save
- if you enter a host/port without a scheme such as `172.19.8.28:8000`, the
  menu auto-normalizes it to `http://172.19.8.28:8000`
- changes to runtime YAML are not part of Vite hot reload
- after editing runtime config, reload the browser page so the updated YAML is
  read

## Behavior in the UI

- the UI starts on `defaults.selected_instance` from the merged config
- the selected instance base URL overrides `VITE_PYPNM_API_BASE_URL`
- `VITE_PYPNM_API_BASE_URL` remains the fallback only when runtime YAML is
  missing or invalid
- use the `PyPNM Agent` dropdown to switch between configured agents at runtime

## Per-agent request defaults

Each instance can carry its own request defaults. This is where you keep values
that differ by PyPNM agent, such as:

- cable modem MAC address
- cable modem IP address
- TFTP IPv4
- TFTP IPv6
- channel ids
- SNMP RW community

Those values live under each instance entry as `request_defaults`.

Notes:

- `channel_ids: []` means all channels
- the selected instance's `request_defaults` prefill the capture and device
  request forms in the UI

## Configuration scenarios

### Scenario 1: one safe repo template only

Use only `public/config/pypnm-instances.yaml` when:

- you want one default local agent in Git
- the values are sanitized and safe to commit
- no machine-local overrides are needed

### Scenario 2: repo template plus local lab overrides

Use both files when:

- the repo should keep a generic template
- your machine needs real lab URLs or modem defaults
- you want to keep those local values out of Git

Typical result:

- template contributes safe baseline agents
- `.local` overrides matching `id`s
- `.local` adds extra lab-only agents

### Scenario 3: local-only active config

Use only `public/config/pypnm-instances.local.yaml` when:

- the template file is absent
- this machine owns all runtime targets locally
- you do not want any version-controlled runtime agents

### Scenario 4: no YAML, env fallback only

Use no runtime YAML when:

- you only need one API target
- you are doing a quick local dev run
- `.env` is enough

In that case the UI uses its in-memory fallback instance and points it at
`VITE_PYPNM_API_BASE_URL`.

## Combined local install behavior

If you run:

```bash
./install.sh --with-pypnm-docsis
```

the installer writes or refreshes a machine-local `Local PyPNM Agent` entry in:

- `public/config/pypnm-instances.local.yaml`

That entry:

- points to the selected same-machine PyPNM host on port `8000`
- is set as `defaults.selected_instance`
- preserves unrelated local runtime agents in the same file

See:

- [Local Combined Install](local-combined-install.md)

## Master example

This is the recommended master example shape for the repo. It shows:

- one safe template instance in the version-controlled file
- two lab-specific instances in `.local`
- merge-by-`id` behavior

### Version-controlled template: `public/config/pypnm-instances.yaml`

```yaml
version: 1
defaults:
  selected_instance: local-pypnm-agent
  poll_interval_ms: 5000
  request_timeout_ms: 30000
  health_path: /health
  logging:
    level: INFO
instances:
  - id: local-pypnm-agent
    label: Local PyPNM Agent
    base_url: http://127.0.0.1:8000
    enabled: true
    tags:
      - lab
      - local
    capabilities:
      - health
      - analysis
      - files
    polling:
      enabled: true
      interval_ms: 5000
    request_defaults:
      cable_modem:
        mac_address: 00:00:00:0B:1B:E0
        ip_address: 10.0.0.1
      tftp:
        ipv4: 127.0.0.1
        ipv6: ::1
      capture:
        channel_ids: []
      snmp:
        rw_community: private
```

### Machine-local file: `public/config/pypnm-instances.local.yaml`

```yaml
version: 1
defaults:
  selected_instance: lab-local
  poll_interval_ms: 5000
  request_timeout_ms: 30000
  health_path: /health
  logging:
    level: INFO
instances:
  - id: lab-local
    label: Lab Local
    base_url: http://172.19.8.28:8000
    enabled: true
    tags:
      - lab
      - local
    capabilities:
      - health
      - analysis
      - files
    polling:
      enabled: true
      interval_ms: 5000
    request_defaults:
      cable_modem:
        mac_address: FC:77:7B:0B:1B:E0
        ip_address: 172.19.32.53
      tftp:
        ipv4: 172.19.8.28
        ipv6: ::1
      capture:
        channel_ids: []
      snmp:
        rw_community: private
  - id: speedtest
    label: Speedtest
    base_url: http://172.19.8.250:8000
    enabled: true
    tags: []
    capabilities:
      - health
      - analysis
    polling:
      enabled: true
      interval_ms: 5000
    request_defaults:
      cable_modem:
        mac_address: FC:77:7B:0B:1B:E0
        ip_address: 172.19.32.53
      tftp:
        ipv4: 172.19.8.250
        ipv6: ::1
      capture:
        channel_ids: []
      snmp:
        rw_community: private
```

## Result of that example

The dropdown will contain:

- `Local PyPNM Agent`
- `Lab Local`
- `Speedtest`

because the runtime loader keeps instances from both files unless they share
the same `id`.
