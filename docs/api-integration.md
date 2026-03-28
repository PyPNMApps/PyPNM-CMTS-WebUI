# API Integration Notes

## API Contract
The WebUI consumes existing PyPNM REST endpoints only.

Expected response envelope fields are typically:
- `status`
- `message`
- `timestamp` (when provided)
- endpoint-specific data payload

## Client Pattern
- Single Axios instance (`api-client`) with base URL + timeout.
- Endpoint-specific service modules call `api-client`.
- TanStack Query for fetching, caching, invalidation, and polling.

## Error Handling
- Normalize transport and API errors to a common UI shape.
- Always show endpoint path and request context with failures.
- Keep raw response available for engineering troubleshooting.

## Operational Flows
- Trigger endpoints via mutations (POST/PUT).
- Poll status endpoints where operation IDs are returned.
- Render results using cards/tables/charts + raw JSON view.
