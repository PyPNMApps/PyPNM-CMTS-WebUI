# Troubleshooting

## CLI command not found

If `pypnm-cmts-webui` is not found:

```bash
./install.sh --with-pypnm-cmts-webui
source ~/.bashrc
pypnm-cmts-webui --help
```

## UI starts but backend calls fail

Check selected runtime instance and base URL:

- `public/config/pypnm-instances.local.yaml`
- `public/config/pypnm-instances.yaml`

Then verify backend health directly:

```bash
curl -s http://<cmts-api-host>:<port>/health
```

## Serving Group list is empty

The form reads SG IDs from:

- `GET /ops/servingGroupWorker/process`

If empty:

- verify SG worker is running on backend
- verify selected instance points to the intended CMTS API

## Cable modem table does not populate

The form requests:

- `POST /cmts/servingGroup/operations/get/cableModems` with `refresh.mode=light`

If empty:

- confirm selected SG IDs exist in cache
- confirm backend returns groups/items for those SG IDs

## Build errors

Use Node 22 and reinstall:

```bash
node -v
./install.sh --with-pypnm-cmts-webui
npm run build
```
