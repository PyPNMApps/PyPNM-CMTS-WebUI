# Files, Health, Settings, And About

## Files

The `Files` tab is the dedicated PyPNM file-manager surface.

Current behavior:

- browse registered MAC addresses with stored PNM files
- search file entries by MAC address
- group file results for the selected MAC by `PNM Test Type`
- show each file-type group as a collapsible card, collapsed by default
- download a stored file by transaction ID
- download by selected MAC archive, stored filename, or operation ID
- upload a raw PNM file into the PyPNM file ledger
- inspect a transaction with:
  - `Hexdump` in a dedicated browser tab
  - `JSON` inline on the Files page
  - `Analyze` in a dedicated browser tab

Supported file analysis visuals currently route by PNM file type into matching
capture visuals where available.

## Health

The `Health` page includes per-agent `Reload` buttons and a `Reload All Web
Services` action. These send `GET /pypnm/system/webService/reload` to one or
all configured agents and then refresh the health table.

## Settings

`Settings` displays runtime client configuration, including:

- `.env` fallback base URL and timeout
- selected instance label and base URL
- configured instance count
- runtime health path from YAML config
- selected instance request defaults for MAC, IP, and SNMP RW community

## About

`About` displays:

- a brief product description
- the repository link
- the published user docs link:
  `https://pypnmapps.github.io/PyPNM-WebUI/`
- the current local WebUI version
- the latest GitHub tag discovered from the remote repository
