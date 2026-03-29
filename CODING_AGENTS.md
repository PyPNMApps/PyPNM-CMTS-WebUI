# Coding Agent Guidance

## Core Purpose (Required)

- This repository is **frontend-only** for PyPNM-CMTS-WebUI.
- Do not implement or duplicate backend logic from CMTS platform services
  (protocol parsing, business logic, analysis engines).
- All technical data must come from CMTS REST APIs.

## Reuse-First Rules (Required)

- Reuse existing UI components/hooks/services before creating new ones.
- Assume new user-requested UI/logic behavior should be implemented as
  common-code by default. Only keep behavior endpoint-specific when there is a
  concrete technical reason, and ask the user before diverging from common-code.
- When multiple visuals need the same metadata rendering or formatting behavior, extract it into `src/components/common` or `src/lib` instead of duplicating it inside a feature view.
- Keep endpoint integrations isolated in feature/service modules.
- Centralize API transport concerns (base URL, headers, timeout, interceptors) in one API client.
- Reuse shared request/response types in `src/types`.
- Centralize reusable request-form hover text in a shared hint registry instead of hardcoding inline helper copy in individual forms.
- Keep diffs minimal and focused; avoid formatting churn.

## Typing And API Contracts (Required)

- Use strict TypeScript typing.
- Avoid `any` unless unavoidable and justified inline.
- Define typed request/response models for each endpoint integration.
- When backend contracts already define a canonical enum or shared data type
  for a concept such as file types, mirror that type once in the WebUI and reuse it
  instead of scattering raw string literals or duplicate local variants.
- Mirror common sanitized placeholder data once in shared modules and
  reuse it across fixtures and sample payloads. For system descriptions, use
  the shared generic JSON `{\"HW_REV\":\"1.0\",\"VENDOR\":\"LANCity\",\"BOOTR\":\"NONE\",\"SW_REV\":\"1.0.0\",\"MODEL\":\"LCPET-3\"}`
  via a common constant instead of repeating inline objects.
- Validate external API payloads at boundaries (for example with Zod).
- Prefer shared type aliases/interfaces over ad-hoc inline types.
- For large integer-style UI inputs such as Hz, bandwidth, or bin counts,
  parse user-entered separators through a shared numeric-input utility
  rather than relying on endpoint-local string cleanup.

## Architecture Constraints (Required)

- Keep a clean split between:
  - `features/` (workflow modules)
  - `components/` (reusable UI)
  - `services/` (API integrations)
  - `types/` (contracts)
  - `lib/` (pure utilities)
- Keep presentational components free of API side effects when practical.
- Put endpoint-specific logic inside feature modules, not global app shell.
- Keep shared visual primitives generic: device context tables, epoch-to-UTC formatting, frequency-range formatting, and numeric summary helpers belong in common modules, not in endpoint-specific components.
- Keep the project root lean. Do not accumulate support files at the repo root when they belong to a feature, toolchain, docs area, or script path.
- Place support files near the code or workflow they serve. Do not create a generic central folder unless the files are truly shared across multiple areas.
- For request forms that accept `channel_ids`, document the default black value as indicating all channels.
- Render shared request-form hover hints through a reusable field-label component so the displayed help text and the editable source stay aligned.
- Any non-error instructional/help text for a user should be delivered as a shared hover tip, not as inline helper copy on the form or panel.
- Treat repeated capture-identity request inputs such as `MAC Address`,
  `IP Address`, and `SNMP RW Community` as shared form primitives. Do not
  duplicate their labels, autocomplete behavior, masking, or reveal controls
  inline across request forms.

## UX/Engineering Dashboard Rules (Required)

- Prioritize clarity and traceability over decorative UI.
- Always show request context and backend response metadata (`status`, `message`, `timestamp` when available).
- Provide interpreted technical results in the UI and a visible JSON download
  path for the current payload. Do not print large raw JSON blocks inline
  unless the user explicitly asks for an in-page raw JSON view.
- Include explicit loading, error, and empty states for every data panel.
- For any user-visible fetch or mutation that collects backend data, render a shared thinking/loading indicator with an icon rather than plain loading text.
- Every operation workflow must provide a visible JSON download path so the
  current payload can be inspected outside the UI.
- When presenting dense grouped result sets, prefer collapsible cards or
  sections per group and default them to collapsed unless the workflow has a
  clear reason to expand them on first render.
- In request forms, treat sub-cards as foldable sections by default so users
  can progressively disclose inputs instead of scanning one expanded block.
- Keep pages and forms lean by default: avoid stacking too many expanded
  cards, chips, or helper elements at once when the same outcome can be shown
  with fewer visible controls.
- Prefer progressive disclosure over always-visible detail: advanced metadata,
  secondary counters, and raw diagnostics should live in foldable sections or
  on-demand views.
- Multi-series line graphs must provide shared mute/show controls for
  individual series instead of forcing all lines to remain visible.
- RxMER visuals that support frequency-range drag selection must provide zoom
  controls (`Zoom` and `Reset Zoom`) via the shared selection-action pattern.
- Generic raw-response JSON download actions belong in the `Capture Inputs`
  card as shared request-panel controls, not as floating mid-page actions.
- Shared request-panel JSON controls must remain visually muted and disabled
  until the current operation completes successfully for that workflow.
- Support copy-to-clipboard for identifiers and payloads where useful.
- Default graph lines to thin strokes unless a thicker treatment is required for legibility or a specific visual convention.
- When a graph renders multiple data series, provide user controls to show or hide individual series so the chart can be isolated without removing the others.
- When x-axis labels are large numeric values and horizontal rendering hurts readability, angle the labels so they remain visible and readable.
- Render custom chart y-axis labels as vertical axis text with clear spacing
  from tick labels; do not fall back to top-left caption-style y labels.
- For group-delay visuals with range-selection zoom, when a zoom window is
  applied on x-axis, tighten the y-axis to the zoomed data window with about
  15 percent padding so local variation is easier to inspect.
- FEC summary charts must include a per-chart summary table beneath each graph
  and the table values must recalculate from the active zoom selection window.
- FEC summary x-axis labeling must be explicit time context (`Time (UTC)`), not
  frequency labeling.
- FEC summary line styling uses solid strokes only with fixed semantic colors:
  blue for Total CW, green for Corrected CW, and red for Uncorrected CW.
- For range-selection charts that expose `Zoom` and `Reset Zoom`, place those
  controls in the right-side chart header action area next to export actions
  (`PNG`/`CSV`) instead of placing them as a separate control row below.
- Prefer lazy-loading at route or page boundaries when it reduces initial bundle cost.
- Do not micro-chunk small shared UI pieces; keep lazy-loading focused on meaningful page-level splits.
- For generated modem-specific download artifacts, place the modem identity and
  capture/export timestamp at the end of the filename in this suffix format:
  `MAC-HHMM-YYYYMMDD`
- For that modem-specific filename suffix, remove MAC delimiters so the MAC is
  filename-safe and stable across export types.
- Disabled buttons and other disabled action controls must appear visually
  grayed out.
- Hovering disabled action controls must not imply clickability; keep the
  cursor non-pointer for disabled states.
- Destructive actions (for example `Cancel`) must use a danger visual style
  with red emphasis in both dark and light themes so intent is obvious.
- For cable-modem registration status displays, use a shared chip mapping:
  green only for `operational`, and red for every other status.
- Selected-state summary chips must remain visually pronounced in both themes;
  use stronger theme-aware background and border contrast than neutral chips.
- Chip rows must include consistent vertical breathing room. Keep at least
  10px of separation above and below status/summary chip rows so cards do not
  appear visually crowded in either theme.
- For SG/CM grouped result cards, render density adaptively:
  single-channel groups should occupy a full row and single-CM channel sections
  should use a single-column layout instead of preserving empty two-column
  space.
- When a channel visual contains exactly one cable modem, summarize that as
  `1 CM` in headers/metadata and avoid redundant multi-item row treatment.
- Status-monitoring sections should use a consistent vertical stack rhythm:
  chip row, loading/status text, and messages/errors separated by clear gaps
  (about 8-12px) to keep the layout symmetric and readable.
- Capture-input fields should preserve stable browser autocomplete behavior on
  the same machine when that improves operator workflows.
- Related capture-parameter inputs shown together (for example `TFTP IPv4`,
  `TFTP IPv6`, and `FEC Summary Type`) must use a shared equal-width layout so
  control widths stay visually aligned.
- Sensitive editable request inputs such as `SNMP RW Community` should be
  masked by default and revealed through a shared trailing-eye control rather
  than shown inline by default.
- Use action labels that match the workflow type. Capture-driven request
  panels should prefer a generic label such as `Get Capture` instead of
  repetitive `Run <endpoint>` phrasing when the action is simply collecting
  one capture.
- Keep action rows visually separated from status chips, summaries, and result
  metadata; do not crowd primary buttons directly against chip rows.
- Prefer explicit download labels such as `Download JSON` over short labels
  like `JSON` when the action meaning is not already obvious from placement.
- All docs surfaces and all UI visuals must support both light mode and dark
  mode under explicit user selection.
- Do not ship docs themes, charts, panels, or visual encodings that only work
  in one theme; verify contrast, legibility, and affordances in both modes.

## Environment And Configuration (Required)

- API base URL must be environment-driven (`VITE_PYPNM_API_BASE_URL`), never hardcoded.
- Keep local/dev/prod behavior configurable via environment variables.
- Document all env vars in `docs/env.md` and `.env.example`.
- Keep shared request defaults in `public/config/pypnm-instances.yaml` at the instance level when they vary by configured CMTS agent.
- When config fields are edited interactively, route that behavior through `pypnm-cmts-webui config-menu` instead of inventing parallel config entry points.
- Treat runtime YAML config as startup state, not hot-reload state. If behavior changes there, document that a page reload is required.
- Use `public/config/pypnm-instances.yaml` as the version-controlled template and `public/config/pypnm-instances.local.yaml` as the preserved machine-local override.
- For installer UX, prefer interactive prompts for runtime instance host/port
  configuration and keep CLI flags as optional overrides so default installs
  stay near zero-touch.

## Security And Data Hygiene (Required)

- Do not commit secrets, tokens, or private credentials.
- Use generic/sanitized example values in docs and fixtures.
- Treat generic placeholder metadata such as the shared system description as
  part of sanitization. Do not introduce endpoint-local variants unless the
  change is intentional and documented.
- Avoid embedding real customer/device identifiers in static assets or sample payloads.

## Testing Expectations (Required)

- Any new source file or new non-trivial source module behavior must include a
  companion test in the same change set unless a concrete technical reason is
  documented in the summary.
- Add tests for new behavior where practical:
  - unit tests for helpers/mappers
  - component tests for UI logic
  - API mocking for network behavior
- Maintain at least smoke-level coverage for critical user flows.
- Do not merge changes that break lint/type-check/tests.

## Documentation Requirements (Required)

- Update relevant docs when behavior or architecture changes:
  - `README.md`
  - `docs/architecture.md`
  - `docs/api-integration.md`
  - `docs/env.md`
  - `docs/development/workflow.md`
  - `docs/roadmap.md`

## Version Control And Release Hygiene (Required)

- Review `tools/git/`, `tools/release/`, and `tools/support/bump_version.py`
  before changing version or release behavior.
- `./tools/git/git-save.sh` must run checks first, then bump only the `BUILD`
  segment before staging and commit.
- The `git-save.sh` commit must include the updated `VERSION`,
  `package.json`, and `package-lock.json` files.
- Do not leave build bumps as dirty local changes after a save.
- `tools/release/release.py` remains the release path for committed release
  version updates, tags, and pushes.

## Commit Message Guidance

- If request via chat request starts with `commit-msg`, then preface command `./tools/git/git-save.sh` with `commit-msg "<commit-msg>"`
- One line summary (max 50 characters)
- One line Summary start: `Feature:` , `Bugfix:` , `Docs:` , `Refactor:` , `Test:`
- Detailed description lines (max 72 characters per line); every line after the first must start with `-`
- When the user asks for a commit message, provide plain text for direct paste into the terminal or UI text box.
- Do not wrap commit message suggestions in quotes (`"`), backticks (`` ` ``), or code fences unless the user explicitly asks for that format.
- Prefer detailed commit messages that describe the current change set clearly.
- Do not default to a one-line commit message when the change set is broad; provide a title plus concise bullet points.
- Avoid redundant wording and avoid repeating the exact prior commit message suggestion unless the diff is unchanged and the user explicitly asks to reuse it.
- If the user asks for `in a text box`, return plain text only (no markdown fence).
- If the user asks for `in a markdown text box`, return the commit message inside a fenced code block with `text`.

## Agent Guardrails

- Do not add backend/server code to this repo unless explicitly requested.
- Do not assume endpoint response shapes beyond documented contracts.
- Do not hardcode endpoint-specific behavior into shared generic components.
- Preserve room for future auth/RBAC integration without premature complexity.
- Work in this repo (`PyPNM-CMTS-WebUI`) by default.
- Do not make changes in other repositories unless the user explicitly asks.
- If a task appears to require touching another repository, ask for approval
  first before making any cross-repo changes.
- Before implementing any non-trivial UI or form change, re-read this CA file
  and explicitly align the change to its lean-layout and reuse-first rules.
