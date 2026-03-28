# Install And Bootstrap

## Command

From the repo root:

```bash
./install.sh
```

Install WebUI plus a same-machine `pypnm-docsis` backend:

```bash
./install.sh --with-pypnm-docsis
```

Install Python development tooling used by docs/release workflows:

```bash
./install.sh --development
```

Update an existing install to the latest tagged release:

```bash
./install.sh --update-webui
```

Update to a specific tag:

```bash
./install.sh --update-webui v0.1.6.0
```

Reset local install artifacts before reinstall:

```bash
./uninstall.sh --confirm-uninstall
```

## Platform support

Validated on:

- Ubuntu 22.04 LTS
- Ubuntu 24.04 LTS

Other modern Linux distributions may work but are not yet part of the formal
test matrix.

## Minimum shell dependency

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

Dependency security note:

- `npm ci` installs exactly from `package-lock.json`
- security patch updates are shipped through lockfile updates in this repo
- if you pulled the latest code and ran `./install.sh`, you get those patched
  dependency versions automatically

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
- installs local-stack helpers for same-machine backend + frontend startup

## Update behavior

When `--update-webui` is used:

- the script fetches tags from `origin`
- checks out the latest tag unless you provide one explicitly
- creates or resets a local branch for that tag instead of leaving the repo in a
  detached `HEAD` state
- does not overwrite your active runtime config directly
- merges your local runtime config values into the current template shape
- reminds you to restart any running WebUI server after the update

Runtime config model:

- `public/config/pypnm-instances.yaml` is the version-controlled template
- `public/config/pypnm-instances.local.yaml` is the machine-local runtime file
- runtime config is merged by instance `id`; `.local` is not a full-file replacement

## Combined local install

Use this when `pypnm-docsis` and WebUI run on the same machine and you want the
installer to configure the WebUI local agent automatically.

Primary command:

```bash
./install.sh --with-pypnm-docsis
```

Useful variants:

```bash
./install.sh --with-pypnm-docsis --local-api-host 127.0.0.1
./install.sh --with-pypnm-docsis --local-api-port 8081
./install.sh --with-pypnm-docsis --pypnm-docsis-path ../PyPNM
./install.sh --with-pypnm-docsis --reconfigure-local-agent
./install.sh --development --with-pypnm-docsis
```

Full instructions:

- [Local Combined Install](local-combined-install.md)

## After install

Start the UI with:

```bash
pypnm-webui serve
```

Start UI and auto-start local backend for selected `local-pypnm-agent`:

```bash
pypnm-webui serve --start-local-pypnm-docsis
```

If `local-pypnm-agent` is selected, `pypnm-webui serve` performs a startup
reachability check against that backend and warns when `pypnm-docsis` is not
running.

Same-machine backend + frontend is also available with:

```bash
pypnm-webui start-local-stack
```

Start only the backend FastAPI service with:

```bash
pypnm-docsis serve --host <selected-local-api-host> --port <selected-local-api-port>
```

If you need to inspect or stop local WebUI dev servers:

```bash
pypnm-webui kill-pypnm-webui --list
pypnm-webui kill-pypnm-webui --kill
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
