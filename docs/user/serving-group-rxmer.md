# Serving Group RxMER

## Scope

Current MVP workflow:

- `Serving Group` top-level page
- `RxMER` option
- `Capture Request` panel

## Capture Request workflow

1. Select one or more Serving Groups.
2. WebUI loads SG-scoped cable modems using light refresh.
3. Filter/select cable modems from the table.
4. Set capture parameters:
   - SNMP v2c community
   - channel IDs
   - TFTP IPv4 / TFTP IPv6
   - execution settings (foldable section)
5. Inspect payload using `Request JSON` popup.
6. Run `Start Capture`.

## Endpoints used by the form

- `GET /ops/servingGroupWorker/process`
  - source for active serving-group IDs
- `POST /cmts/servingGroup/operations/get/cableModems`
  - SG-scoped modem list
  - WebUI requests `refresh.mode: light`

## Cable modem selection behavior

- table supports row checkbox selection
- `Select All` and `Unselect All` apply to visible rows
- filter tabs:
  - `All`
  - `Operational Only`
- registration status chip mapping:
  - `operational` => green
  - any other status => red
- sortable columns:
  - registration status
  - vendor
  - model

## Payload mapping

Selected values map to:

- `cmts.serving_group.id`
- `cmts.cable_modem.mac_address`
- `cmts.cable_modem.pnm_parameters.capture.channel_ids`
- `cmts.cable_modem.pnm_parameters.tftp.ipv4`
- `cmts.cable_modem.pnm_parameters.tftp.ipv6`
- `cmts.cable_modem.snmp.snmpV2C.community`
- `execution.*`
