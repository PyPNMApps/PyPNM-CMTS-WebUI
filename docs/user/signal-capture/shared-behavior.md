# Signal Capture Shared Behavior

Signal capture pages use shared request-panel behavior:

![Signal Capture Shared Panel Behavior](../../images/ui-previews/single-capture-rxmer.png)

- request form
- `Capture Inputs` online/offline chip driven by `/system/sysDescr`
- immediate status check on page load, then a 3 second debounce after MAC, IP,
  or SNMP community changes
- execution button stays disabled until the modem reports `Online`
- `Download JSON` stays inside the `Capture Inputs` card and remains disabled
  until the current operation completes successfully
- visible waiting indicator while data is being collected
- rendered visual below the form
- browser autocomplete enabled for `MAC Address`, `IP Address`, and
  `SNMP RW Community`
- `SNMP RW Community` masked by default with an eye toggle inside the field

## Chart Range Selection And Zoom

Where line-chart visuals are available, selection-based chart controls are
available in the chart header:

- drag a region to select the frequency range
- select `Zoom` to focus on that region
- select `Reset Zoom` to return to the full range
