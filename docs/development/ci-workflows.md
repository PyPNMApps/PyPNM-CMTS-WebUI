# CI Workflows

This repository uses GitHub Actions for quality checks, install verification,
integration validation, security analysis, and docs publishing.

## Workflow summary

| Workflow | Purpose | OS coverage | Key matrix |
| --- | --- | --- | --- |
| `ubuntu-checks.yml` | Fast lint, test, and build gates for frontend changes | Ubuntu 22.04, 24.04 | Node 22 |
| `ubuntu-pypnm-integration.yml` | Live integration against a running local PyPNM backend | Ubuntu 22.04, 24.04 | Python 3.12, Node 22 |
| `ubuntu-with-pypnm-docsis-install.yml` | Verifies `./install.sh --with-pypnm-docsis` end-to-end | Ubuntu 22.04, 24.04 | Python 3.10, 3.11, 3.12, 3.13 |
| `codeql.yml` | Static security analysis for JavaScript/TypeScript | macOS latest | CodeQL JS/TS |
| `publish-mkdocs.yml` | Builds and deploys docs site to GitHub Pages | Ubuntu latest | Python 3.12, Node 22 |

## Current CI behavior

### Ubuntu checks (`ubuntu-checks.yml`)

- runs on push and PR for `main` and `develop`
- installs dependencies with `npm ci`
- runs:
  - `npm run lint`
  - `npm run test`
  - `npm run build`

### Ubuntu PyPNM integration (`ubuntu-pypnm-integration.yml`)

- checks out both repos:
  - this WebUI repo
  - `PyPNMApps/PyPNM`
- installs PyPNM from source and starts backend on `127.0.0.1:8000`
- validates backend health endpoint
- runs WebUI lint/test/build plus live integration test:
  - `npm run test:integration`

### Ubuntu combined install (`ubuntu-with-pypnm-docsis-install.yml`)

- validates combined local install mode across Ubuntu + Python versions
- executes helper:
  - `tools/install/ci-verify-with-pypnm-docsis.sh`
- helper covers:
  - clean environment setup
  - `./install.sh --with-pypnm-docsis --pypnm-docsis-path ../PyPNM --local-api-host 127.0.0.1`
  - runtime config verification for reserved `local-pypnm-agent`
  - local stack startup and live health integration validation

### CodeQL (`codeql.yml`)

- runs CodeQL analysis for JavaScript/TypeScript
- scheduled weekly and on `main` pushes/PRs

### Docs publish (`publish-mkdocs.yml`)

- runs on `main` pushes
- installs Node 22 and runs `npm ci`
- runs frontend `npm run build`
- installs Playwright Chromium
- runs `npm run docs:capture-ui-previews` to generate UI preview screenshots and
  refresh:
  - `docs/user/ui-previews/index.md`
  - `docs/user/ui-previews/single-capture.md`
  - `docs/user/ui-previews/advanced.md`
  - `docs/user/ui-previews/platform.md`
- enforces `mkdocs build --strict`
- deploys to GitHub Pages

## Why this matrix is important

The install and runtime changes for `--with-pypnm-docsis` are validated in CI
across:

- Ubuntu 22.04 and 24.04
- Python 3.10 through 3.13

This protects against:

- environment creation regressions in `.venv`
- backend CLI/shim install regressions
- runtime config generation regressions
- local stack startup regressions

## Troubleshooting CI failures

If a CI run fails:

1. Check the failing workflow and matrix axis first (OS + Python).
2. For combined install failures, inspect `/tmp/pypnm-webui-stack.log` artifact output in job logs.
3. Reproduce locally from repo root:
   - `npm run lint`
   - `npm run test`
   - `npm run build`
   - `./tools/install/ci-verify-with-pypnm-docsis.sh --pypnm-path ../PyPNM`
4. Confirm runtime config output:
   - `public/config/pypnm-instances.local.yaml`
   - selected id should be `local-pypnm-agent`
