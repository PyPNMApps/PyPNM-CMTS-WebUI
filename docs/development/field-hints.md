# Development Field Hints

Use the shared field-hint registry when request forms need hover help text.

## Edit Location

- Hover-text values live in:
  - `src/features/operations/requestFieldHints.ts`

Current example:

- `channel_ids`: `0 means all channels.`

## Rendering Pattern

- Shared label component:
  - `src/components/common/FieldLabel.tsx`
- Forms should pass the hint with:
  - `hint={requestFieldHints.some_key}`

This keeps help text in one place instead of duplicating inline copy across forms.

## When To Use

- Use a hover hint for short operator guidance tied to a single field.
- Keep the text concise.
- Prefer the shared registry over hardcoded `title` strings inside forms.

## Channel IDs Convention

- For forms that accept `channel_ids`, the default UI value is `0`.
- In the UI, `0` means all channels.
- In the submitted payload, `0` is converted to an empty array.

## Files Commonly Updated Together

- `src/features/operations/requestFieldHints.ts`
- `src/components/common/FieldLabel.tsx`
- the request form using the hint
