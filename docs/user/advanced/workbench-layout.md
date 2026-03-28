# Advanced Workbench Layout

Each advanced workbench includes:

![Advanced Workbench Layout](../../images/ui-previews/advanced-rxmer.png)

- `Capture Inputs`
  - start a multi-capture operation
  - `Start Capture` remains disabled until the modem reports `Online`
  - `SNMP RW Community` is masked by default and can be revealed with the eye
    button inside the field
- `Run`
  - live status polling
  - collected count
  - time remaining
  - stop control while capture is active
- `Results`
  - operation and group identifiers
  - ZIP download for collected captures
- `Analysis`
  - run multiple analysis types against the same `operation_id`
  - no need to restart capture for a different analysis type

## Analysis Exports

- SVG-backed charts expose per-panel `PNG` and `CSV` actions
- table-backed analysis views expose per-panel `CSV` actions
- chart CSV exports are derived from the same plotted series shown in the UI
- table CSV exports are derived from the typed rows used to render the table
- RxMER heat-map analysis currently exposes `CSV` export for source values; PNG
  export is currently limited to SVG-backed charts
