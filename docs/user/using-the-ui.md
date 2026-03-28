# Using The UI

Use this section as the operator-facing entrypoint for the WebUI.

## UI Sections

- [Navigation And Agent Selection](ui-navigation.md)
- [Signal Capture](signal-capture/overview.md)
- [Operations](operations/overview.md)
- [Advanced Analysis](advanced/overview.md)
- [Files, Health, Settings, And About](supporting-pages.md)
- [Input Validation](input-validation.md)

## Recommended Workflow

1. Open [Files, Health, Settings, And About](supporting-pages.md) and verify the active agent on `Health`.
2. Use [Navigation And Agent Selection](ui-navigation.md) to switch to the correct `PyPNM Agent`.
3. Run either:
   - [Signal Capture](signal-capture/overview.md)
   - [Operations](operations/overview.md)
   - [Advanced Analysis](advanced/overview.md)
4. Confirm the `Capture Inputs` panel reports the modem as `Online` before running a capture.

## Runtime Config Changes

If you use:

```bash
pypnm-webui config-menu
```

reload the browser page after saving changes. The UI reads the runtime YAML
config at startup and does not hot-reload those files.
