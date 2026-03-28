# Release Helpers

## Purpose

These helpers support version inspection, version bumping, validation, and release execution for `PyPNM-WebUI`.

## Prerequisites

Run bootstrap once:

```bash
./install.sh
```

This ensures:
- Node 22 is installed and selected
- `.venv` exists for Python-based release tooling

## Release Versioning

- `VERSION` is the authoritative release version file.
- The format is `MAJOR.MINOR.MAINTENANCE.BUILD`.
- Git tags are created from `VERSION`, for example `v0.1.0.0`.
- `package.json` and `package-lock.json` keep the derived npm-compatible version `MAJOR.MINOR.MAINTENANCE`.

This means:
- release and tagging use the four-part version
- the Node package metadata keeps a valid npm semver

## Version Helpers

Show the current repository version:

```bash
.venv/bin/python ./tools/support/bump_version.py --current
```

Compute and apply the next maintenance version:

```bash
.venv/bin/python ./tools/support/bump_version.py --next maintenance
```

Set an explicit version:

```bash
.venv/bin/python ./tools/support/bump_version.py 0.2.0.0
```

Notes:
- valid bump modes are `major`, `minor`, `maintenance`, and `build`
- `--next maintenance` resets the build component to `0`
- `--next build` increments only the build component

## Development Save Behavior

`./tools/git/git-save.sh` uses the build bump during normal development saves.

It performs this order:

1. run lint, test, and build checks
2. bump the `BUILD` segment in `VERSION`
3. sync `package.json` and `package-lock.json`
4. stage changes
5. create the save commit

This means the save commit already contains the updated version notation.
The build bump is not left behind as an uncommitted local change.

## Validation Helpers

Run release-oriented validation checks:

```bash
.venv/bin/python ./tools/release/check_version.py
.venv/bin/python ./tools/release/test-runner.py
```

## Release Runner

Show release runner help:

```bash
.venv/bin/python ./tools/release/release.py --help
```

Default behavior:
- running `release.py` with no `--next` performs a maintenance bump automatically
- running `release.py` sanitizes `public/config/pypnm-instances.yaml` in place
  to a clean template with no tracked instance entries
- running `release.py` also writes a sanitized runtime-config artifact under
  `release-reports/runtime-config/`
- running `release.py` regenerates docs previews from existing sanitized JSON
  examples (no live endpoint capture by default)

For the full release sequence and branch rules, use [Release Workflow](release-workflow.md).

### Optional Release Flags

- `--with-live-endpoint-examples` enables live endpoint example generation
- `--skip-live-endpoint-examples` explicit skip alias (default behavior)
- `--skip-docs-previews` skips UI screenshot regeneration

### Live Endpoint Capture Helper

Run manually:

```bash
npm run docs:capture-live-endpoint-examples -- --mask-mac-oui 00:00:00
```

Notes:
- MAC addresses are sanitized with a configurable OUI prefix
- system description fields are sanitized for documentation-safe artifacts
