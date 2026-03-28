# Release Workflow

## Prerequisites

Run bootstrap once:

```bash
./install.sh
```

This ensures:
- Node 22 is installed/selected
- `.venv` exists for Python tooling

## Release Version Model

- `VERSION` is the release source of truth.
- It uses `MAJOR.MINOR.MAINTENANCE.BUILD`.
- Release tags use that value with a `v` prefix, for example `v0.1.0.0`.
- `package.json` and `package-lock.json` are kept in sync with the derived npm-compatible version `MAJOR.MINOR.MAINTENANCE`.

## Development Saves And Release Cleanliness

Normal development commits should use:

```bash
./tools/git/git-save.sh --commit-msg "Message"
```

`git-save.sh` runs checks first, then bumps only the `BUILD` segment, stages all
changes, and creates the commit. This keeps version files committed and avoids
release failures caused by dirty local version bumps.

## Validate before release

```bash
.venv/bin/python ./tools/release/check_version.py
.venv/bin/python ./tools/release/test-runner.py
```

## Bump version

View current:

```bash
.venv/bin/python ./tools/support/bump_version.py --current
```

Auto bump:

```bash
.venv/bin/python ./tools/support/bump_version.py --next maintenance
```

Build-only bump:

```bash
.venv/bin/python ./tools/support/bump_version.py --next build
```

Set explicit:

```bash
.venv/bin/python ./tools/support/bump_version.py 0.2.0.0
```

## Run release

Default release flow (checks + commit + tag + push):

```bash
.venv/bin/python ./tools/release/release.py --commit-msg "Release"
```

When `--next` is omitted, `release.py` performs an implicit `maintenance` bump before validation, commit, tag, and push.

Release workflow also regenerates docs UI preview screenshots with:

- `npm run docs:capture-ui-previews`

Use `--skip-docs-previews` to bypass that step when needed.

By default, release uses existing sanitized JSON examples to render preview
graphs and does not run live endpoint capture.

Optional live endpoint capture during release:

- `npm run docs:capture-live-endpoint-examples`

This capture includes:

- single capture form endpoints
- spectrum analyzer endpoints (SNMP-only retrieval mode)
- operations endpoints
- advanced workbench start/status and per-analysis endpoints

Use `--with-live-endpoint-examples` to enable that step when needed.
For manual runs, the helper supports:

- `npm run docs:capture-live-endpoint-examples -- --mask-mac-oui 00:00:00`

As part of the release flow, `release.py` also sanitizes:

- `public/config/pypnm-instances.yaml`

Release sanitization behavior:

- rewrites `public/config/pypnm-instances.yaml` to a clean template
- clears all `instances` entries from that tracked template file
- keeps only safe default fields
- writes a sanitized runtime-config artifact under:

- `release-reports/runtime-config/pypnm-instances.sanitized.yaml`

Release with automatic version bump:

```bash
.venv/bin/python ./tools/release/release.py --commit-msg "Release" --next maintenance
```

Release with a build bump:

```bash
.venv/bin/python ./tools/release/release.py --commit-msg "Release" --next build
```

Release with explicit version:

```bash
.venv/bin/python ./tools/release/release.py --commit-msg "Release" --version 0.2.0.0
```

Safe dry-style release (no push):

```bash
.venv/bin/python ./tools/release/release.py --commit-msg "Release" --no-push
```

Skip tag creation:

```bash
.venv/bin/python ./tools/release/release.py --commit-msg "Release" --no-tag
```

## Notes

- `VERSION` is the authoritative release version and uses `MAJOR.MINOR.MAINTENANCE.BUILD`.
- `package.json` and `package-lock.json` keep the derived npm-compatible `MAJOR.MINOR.MAINTENANCE` version.
- `git-save.sh` includes the build bump in the save commit before release work begins.
- tag creation follows the `v<version>` pattern, for example `v0.1.0.0`
- Release workflow only allows `main` or `hot-fix` branches.
- By default, working tree must be clean.
- Failure logs are stored under `release-reports/logs/`.
- The sanitized runtime-config release artifact is stored under
  `release-reports/runtime-config/`.
- Live endpoint example outputs are stored under
  `docs/examples/live-captures/`.
