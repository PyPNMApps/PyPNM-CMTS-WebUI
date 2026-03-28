# Getting Started

## 1. Install and bootstrap

From the repo root:

```bash
./install.sh
```

If you also want Python docs/release tooling installed into `.venv`:

```bash
./install.sh --development
```

Details:
- [Install And Bootstrap](install-and-bootstrap.md)
- [Local Combined Install](local-combined-install.md)

Optional dependency security check:

```bash
npm audit
```

Expected output after a current install is `found 0 vulnerabilities`.

## 2. Configure API endpoint

If `pypnm-docsis` and WebUI are on the same machine and you want the installer
to configure the local backend automatically, use:

```bash
./install.sh --with-pypnm-docsis
```

Combined local-stack details:
- [Local Combined Install](local-combined-install.md)

Edit `.env` if your PyPNM API is not local default:

```env
VITE_PYPNM_API_BASE_URL=http://127.0.0.1:8080
VITE_REQUEST_TIMEOUT_MS=30000
```

Runtime instance selection details:
- [Runtime Configuration](runtime-configuration.md)

To edit agent entries and per-agent request defaults interactively:

```bash
pypnm-webui config-menu
```

That writes the active local override file:

- `public/config/pypnm-instances.local.yaml`

## 3. Start the UI

```bash
pypnm-webui serve
```

Open:
- `http://127.0.0.1:4175`

## 4. First checks

- Use the top-bar `PyPNM Agent` dropdown to confirm the active instance from the runtime YAML config.
- Open `Health` page and verify backend connectivity.
- Open `Single Capture` and confirm the PNM capture pages are using the selected
  instance defaults.
- Confirm the `Capture Inputs` chip turns green when the current MAC, IP, and SNMP community can be verified through `/system/sysDescr`.
- Confirm the execution button stays grayed out until that chip reports
  `Online`.
- Open `About` and confirm the loaded WebUI version.

## 5. Common first workflows

- `Single Capture` for one-shot PNM capture flows such as RxMER, histogram, FEC summary, modulation profile, and OFDMA pre-equalization
- `Advanced -> RxMER`, `Channel Estimation`, or `OFDMA PreEq` for stateful multi-capture, polling, stop, results ZIP, and reusable analysis
- `Spectrum Analyzer` for friendly, full-band, OFDM, and SCQAM capture flows
- `Files` for stored capture search, hexdump, JSON inspection, and file analysis

Request forms validate common network fields before submit:

- `MAC Address`
- `IP Address`
- `TFTP IPv4`
- `TFTP IPv6`
