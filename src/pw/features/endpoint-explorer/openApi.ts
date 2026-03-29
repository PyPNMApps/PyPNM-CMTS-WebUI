import type { EndpointDescriptor } from "@/types/api";

interface OpenApiOperation {
  summary?: string;
  operationId?: string;
  tags?: string[];
}

interface OpenApiDocument {
  paths?: Record<string, Record<string, OpenApiOperation>>;
}

const HTTP_METHODS = ["get", "post", "put", "patch", "delete", "options", "head"] as const;

export function parseOpenApiEndpoints(document: OpenApiDocument): EndpointDescriptor[] {
  const endpoints: EndpointDescriptor[] = [];
  const paths = document.paths ?? {};

  for (const [path, operations] of Object.entries(paths)) {
    for (const method of HTTP_METHODS) {
      const operation = operations?.[method];
      if (!operation) {
        continue;
      }

      endpoints.push({
        path,
        method: method.toUpperCase(),
        summary: operation.summary,
        operation_id: operation.operationId,
        tags: operation.tags ?? [],
      });
    }
  }

  endpoints.sort((left, right) => {
    if (left.path === right.path) {
      return left.method.localeCompare(right.method);
    }
    return left.path.localeCompare(right.path);
  });

  return endpoints;
}
