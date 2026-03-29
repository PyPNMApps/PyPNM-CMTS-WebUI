# Getting Started

## 1. Install

From the repo root:

```bash
./install.sh
```

If you also want docs/release tooling in `.venv`:

```bash
./install.sh --development
```

If WebUI and local backend are on the same machine:

```bash
./install.sh --with-pypnm-docsis-cmts
```

## 2. Start the WebUI

```bash
pypnm-cmts-webui serve
```

Default URL:

- `http://127.0.0.1:4175`

## 3. Configure runtime instances

Use the interactive menu:

```bash
pypnm-cmts-webui config-menu
```

This writes machine-local runtime overrides to:

- `public/config/pypnm-instances.local.yaml`

Useful menu shortcut:

- choose `s` to show the minimal runtime YAML schema example

## 4. First operator check

1. open `Health` and confirm the selected CMTS API is reachable
2. open `Serving Group -> RxMER`
3. pick serving groups and confirm cable modems populate
4. verify request JSON using the `Request JSON` popup in the Capture Request header
5. open `Single Capture -> Dashboard` and confirm the modem table populates
6. use an `Action` route (for example RxMER or Spectrum Analyzer) to verify handoff into PW-derived pages

See:

- [Serving Group RxMER](serving-group-rxmer.md)
