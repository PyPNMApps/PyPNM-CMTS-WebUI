# Troubleshooting

## Vite fails with syntax errors (e.g. optional chaining)

Cause:
- old Node runtime in current shell.

Check:

```bash
node -v
which node
```

Expected:
- Node 22.x
- path under `~/.nvm/...`

Fix:

```bash
./install.sh
```

Then reinstall dependencies if needed:

```bash
rm -rf node_modules package-lock.json
npm ci
npm link
```

## `nvm: command not found`

Run installer:

```bash
curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
source ~/.bashrc
```

Then re-run `./install.sh`.

## Clean install shows `pypnm-docsis` pip dependency warnings

Cause:
- the calling shell may have leaked Python project state into the install
  process, typically through `PYTHONPATH` or `PYTHONHOME`.

Current behavior:
- `install.sh` now creates and uses `.venv` in isolated mode to avoid inheriting
  those variables.

If you still see the warning on an older checkout:

```bash
rm -rf .venv
./install.sh
```

If you still see it after that, check:

```bash
echo "$PYTHONPATH"
echo "$PYTHONHOME"
```

## UI loads but API requests fail

- verify PyPNM backend is running
- verify the selected instance in the top-bar dropdown
- verify `public/config/pypnm-instances.local.yaml` base URLs when using a local override
- otherwise verify `public/config/pypnm-instances.yaml` base URLs
- verify `.env` `VITE_PYPNM_API_BASE_URL` if YAML fallback is being used
- check browser devtools network tab for failing request paths/statuses

If `config-menu` was used recently:

- `base_url` should be saved as a full HTTP(S) URL (for example `http://172.19.8.28:8000`)
- entries such as `172.19.8.28:8000` are auto-normalized to `http://172.19.8.28:8000`
- non-HTTP(S) values are rejected at prompt time and should be corrected

## Request form rejects MAC or IP input

The UI now validates common network inputs before submit.

Checks include:

- MAC address must resolve to 12 hex characters
- IP address must be valid IPv4 or IPv6 where accepted
- TFTP IPv4 must be valid IPv4 when provided
- TFTP IPv6 must be valid IPv6 when provided

Examples of accepted MAC delimiters:

- `aa:bb:cc:dd:ee:ff`
- `aa-bb-cc-dd-ee-ff`
- `aa.bb.cc.dd.ee.ff`

If a field is still rejected:

- remove mixed delimiter styles from the same value
- remove non-hex characters from MAC input
- verify IPv4 octets are within `0-255`
- verify IPv6 uses a valid compressed or full notation

## Files hexdump or analysis opens a blank or missing page

The Files workflow hands hexdump and analysis payloads to a dedicated browser
tab through browser storage.

If the new tab looks wrong:

- make sure browser popups are allowed for the WebUI origin
- retry the action from the `Files` page
- hard refresh the new tab if the browser cached an older bundle

## `pypnm-webui: command not found`

Re-register the local CLI from the repo root:

```bash
npm link
```

Then verify:

```bash
pypnm-webui --help
```

## Combined local install chose the wrong backend host

Re-run the combined install and force a new choice:

```bash
./install.sh --with-pypnm-docsis --reconfigure-local-agent
```

Or set the host directly:

```bash
./install.sh --with-pypnm-docsis --local-api-host 127.0.0.1
```

## same-machine startup fails because `pypnm` is missing

Verify the backend virtual environment:

```bash
.venv/bin/pypnm --version
```

If that fails, rerun:

```bash
./install.sh --with-pypnm-docsis
```

## `pypnm-docsis: command not found` after combined install

Reload your shell so `~/.local/bin` is on `PATH`:

```bash
source ~/.bashrc
```

Then verify:

```bash
pypnm-docsis --version
```
