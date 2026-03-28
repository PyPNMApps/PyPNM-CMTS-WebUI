# Install And Bootstrap

## Install Commands

From the repo root:

```bash
./install.sh
```

Install WebUI plus same-machine backend:

```bash
./install.sh --with-pypnm-docsis
```

Install docs/release development tooling:

```bash
./install.sh --development
```

Reset local install artifacts:

```bash
./uninstall.sh --confirm-uninstall
```

## Platform support

Validated on:

- Ubuntu 22.04 LTS
- Ubuntu 24.04 LTS

Other modern Linux distributions may work but are not yet part of the formal
test matrix.

## Dependencies

`install.sh` can bootstrap missing Python venv tooling on Ubuntu/Debian when
`--development` or `--with-pypnm-docsis` is used.

Required for all installs:

- `git`
- `curl`
- `node`/`npm` via `nvm` (Node 22)

Required only for `--development` and/or `--with-pypnm-docsis`:

- Python 3 (`python3` or `PYTHON_BIN`)
- Python venv support (`python -m venv`)

Example (Ubuntu) if your box is missing prerequisites:

```bash
sudo apt-get update
sudo apt-get install -y git curl python3 python3-venv
```

Note:

- on Ubuntu/Debian, installer will attempt `apt-get install` for missing
  Python venv packages and may prompt for sudo

## What `install.sh` does

- installs `nvm` if missing
- installs and uses Node 22
- sets Node 22 as the default
- creates `.env` from `.env.example` if needed
- runs `npm ci`
- refreshes `public/config/pypnm-instances.local.yaml` from the version-controlled
  template while preserving local values

When `--development` is used, it also:

- creates `.venv` if missing
- installs Python tooling for release and docs workflows into `.venv`
- installs Playwright Chromium used by `npm run docs:capture-ui-previews`

When `--with-pypnm-docsis` is used, it also:

- uses the same `.venv` created by WebUI install
- installs `pypnm-docsis` into that shared virtual environment
- installs `~/.local/bin/pypnm-docsis` as a shim to that backend CLI
- chooses a local API host automatically or with one prompt
- prompts for local API port in interactive installs unless overridden
- configures `Local PyPNM Agent` in `public/config/pypnm-instances.local.yaml`
- sets `local-pypnm-agent` as the selected runtime instance
- installs local-stack helper commands

## After install

Start the UI with:

```bash
pypnm-cmts-webui serve
```

Start UI and auto-start local backend for selected local agent:

```bash
pypnm-cmts-webui serve --start-local-pypnm-docsis
```

If `local-pypnm-agent` is selected, `pypnm-cmts-webui serve` performs a startup
reachability check against that backend and warns when `pypnm-docsis` is not
running.

Start only the backend FastAPI service with:

```bash
pypnm-docsis serve --host <selected-local-api-host> --port <selected-local-api-port>
```

If you need to inspect or stop local WebUI dev servers:

```bash
pypnm-cmts-webui kill-pypnm-webui --list
pypnm-cmts-webui kill-pypnm-webui --kill
```

## Uninstall

Remove local install artifacts:

```bash
./uninstall.sh
```

Non-interactive uninstall:

```bash
./uninstall.sh --confirm-uninstall
```

Optional extras:

```bash
./uninstall.sh --confirm-uninstall --remove-env --remove-data
```
