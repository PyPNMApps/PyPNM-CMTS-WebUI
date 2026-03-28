# CI Workflows

This repository uses GitHub Actions for build quality and docs publishing.

## Core checks

- `npm run lint`
- `npm run test`
- `npm run build`

## Install validation

Combined-install coverage verifies:

- `./install.sh --with-pypnm-docsis`
- runtime config generation
- local stack startup expectations

## Docs pipeline

Docs pipeline runs:

- docs build validation
- MkDocs publish (GitHub Pages)

## CI review checklist

When a run fails:

1. identify failing workflow and matrix axis
2. reproduce locally with lint/test/build
3. verify install script behavior if failure is install-related
