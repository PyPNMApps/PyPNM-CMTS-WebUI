# Development Logging

## Purpose

PyPNM-WebUI uses a custom client-to-dev-server logging path during `pypnm-webui serve`.

This exists because browser code cannot write directly to files under the repo root.
The dev server accepts selected browser log events and appends them to a local log file.

## Log file

When running the local dev server, logs are written to:

- `logs/console.log`

This directory is local-only and ignored by git.

## Supported levels

Configured levels:

- `DEBUG`
- `INFO`
- `WARN`
- `ERROR`
- `OFF`

Default level:

- `INFO`

Default behavior at `INFO`:

- records `INFO`
- records `WARN`
- records `ERROR`
- does not record `DEBUG`

`DEBUG` is available, but must be enabled explicitly.

## Configure log level

Set the runtime log level in:

- `public/config/pypnm-instances.yaml`
- or `public/config/pypnm-instances.local.yaml`

Example:

```yaml
defaults:
  logging:
    level: DEBUG
```

You can also update it through:

- `pypnm-webui config-menu`

Path in the menu:

- `Edit runtime defaults`
- `Logging level (DEBUG/INFO/WARN/ERROR/OFF)`

After changing runtime YAML, reload the page.

## What is captured

The custom logger captures:

- explicit client logger events
- unhandled browser errors
- unhandled promise rejections
- React render failures through the app error boundary

This is intended for development diagnostics, especially black-screen failures.

## How to use it

1. Start the app with `pypnm-webui serve`
2. Reproduce the issue in the browser
3. Inspect `logs/console.log`

Example:

```bash
tail -f logs/console.log
```

## Important limits

- this file logging path is only available through the local Vite dev server
- it is not a production logging pipeline
- browser `console.*` by itself does not write to `logs/console.log`
- if logging level is `OFF`, no client events are written

## Recommended use

Use `INFO` for normal local work.

Use `DEBUG` only when actively diagnosing:

- render crashes
- unexpected API shapes
- analysis/visual mapping issues
- state-machine transition issues
