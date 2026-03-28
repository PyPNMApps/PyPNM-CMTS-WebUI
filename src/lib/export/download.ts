export function downloadBlob(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function sanitizeExportBaseName(value: string): string {
  const normalized = value.trim().toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/-+/g, "-");
  return normalized.replace(/^-|-$/g, "") || "export";
}

export function withExtension(baseName: string, extension: string): string {
  const sanitizedBaseName = sanitizeExportBaseName(baseName);
  return `${sanitizedBaseName}.${extension.replace(/^\./, "")}`;
}
