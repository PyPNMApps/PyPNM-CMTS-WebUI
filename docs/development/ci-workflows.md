# CI Workflows

This repository uses GitHub Actions for build quality and docs publishing.

## Core checks

- `npm run lint`
- `npm run test`
- `npm run build`

## Matrix coverage

- Ubuntu:
  - `22.04`
  - `24.04`
- Python:
  - `3.10`
  - `3.11`
  - `3.12`
  - `3.13`

`ubuntu-pypnm-integration.yml` and `ubuntu-with-pypnm-docsis-install.yml`
cover the Ubuntu/Python matrix combinations.

## Install validation

Combined-install coverage verifies:

- `./install.sh --with-pypnm-docsis`
- runtime config generation
- local stack startup expectations

## Release script behavior

`tools/release/release.py` currently runs:

- lint
- test
- build
- runtime config sanitization

Docs capture/MkDocs steps are intentionally not part of release flow for now.

## Docs pipeline

Docs pipeline runs:

- docs build validation
- MkDocs publish (GitHub Pages)

## CI review checklist

When a run fails:

1. identify failing workflow and matrix axis
2. reproduce locally with lint/test/build
3. verify install script behavior if failure is install-related
