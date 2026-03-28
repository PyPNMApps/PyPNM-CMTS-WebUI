# Input Validation

Request forms validate common network fields in the browser before submit.

## Validated Fields

- `MAC Address`
- `IP Address`
- `TFTP IPv4`
- `TFTP IPv6`

## Rules

- MAC address may use any common delimiter
- the MAC must still resolve to exactly 12 hex characters
- IP address accepts either IPv4 or IPv6 where that field allows it
- TFTP IPv4 requires valid IPv4 when present
- TFTP IPv6 requires valid IPv6 when present
