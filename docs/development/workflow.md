# Development Workflow

## Local Setup
1. Run `./install.sh` for first-time setup.
2. Start dev server with `pypnm-webui serve`.
3. Run tests with `npm run test`.
4. Run lint checks with `npm run lint`.
5. Run production build validation with `npm run build`.
6. Build docs with `npm run docs:build`.
7. Serve docs locally with `npm run docs:serve`.
8. Capture UI preview screenshots for docs with `npm run docs:capture-ui-previews`.
9. List or stop local WebUI dev processes with `pypnm-webui kill-pypnm-webui`.

## Git Workflow Helpers
- `./tools/git/git-save.sh --commit-msg "..."` runs checks, bumps the `BUILD` notation, stages, and commits.
- `./tools/git/git-save.sh --commit-msg "..." --push` also pushes.
- `./tools/git/git-push.sh --commit-msg "..."` commit+push helper for quick flows.
- `./tools/git/git-reset-branch-history.sh` rewrites branch history; use only with care.

## Release Workflow
- `.venv/bin/python ./tools/support/bump_version.py --next maintenance` bumps the repository release version.
- `.venv/bin/python ./tools/support/bump_version.py --next build` increments the build component only.
- `.venv/bin/python ./tools/release/check_version.py` validates package version consistency.
- `.venv/bin/python ./tools/release/test-runner.py` runs lint/test/build gates.
- `.venv/bin/python ./tools/release/release.py` runs release checks, performs a default maintenance bump, then commits/tags/pushes unless overridden.
- `git-save.sh` now commits the build bump so `release.py` does not fail later on dirty version files.

## Development Logging
- Use `docs/development/logging.md` for the custom client-to-file logging flow and log-level configuration.

## Maintenance Helpers
- `pypnm-webui kill-pypnm-webui --list` shows active PyPNM-WebUI processes for this repo.
- `pypnm-webui kill-pypnm-webui --kill` shows numbered entries and prompts for a selection.
- `pypnm-webui kill-pypnm-webui --kill <INDEX_OR_PID>` stops one matching process.
- `pypnm-webui kill-pypnm-webui --kill-all` stops all matching PyPNM-WebUI processes for this repo.

## PR Guidance
- Keep changes scoped to a single feature/module when possible.
- Include screenshots for UI-impacting changes.
- Document API assumptions in `docs/api-integration.md`.
- For shared request-form hover text, use `docs/development/field-hints.md`.

## Quality Gates (target)
- Lint: pass
- Type-check: pass
- Unit/component tests: pass
- Critical flow smoke test: pass
