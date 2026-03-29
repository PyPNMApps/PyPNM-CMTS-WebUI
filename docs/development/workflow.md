# Development Workflow

## Local setup

```bash
./install.sh --with-pypnm-cmts-webui --development
pypnm-cmts-webui serve
```

## Quality gates

Run before commit:

```bash
npm run lint
npm run test
npm run build
```

## Docs

```bash
npm run docs:build
npm run docs:serve
```

## Git helper

```bash
./tools/git/git-save.sh --commit-msg "Feature: your summary"
```

This helper runs checks, updates build version notation, stages, and commits.
