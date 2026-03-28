export function mergeRuntimeConfig(
  templateConfig: Record<string, unknown>,
  sourceConfig: Record<string, unknown>,
): Record<string, unknown>;

export function mergeRuntimeConfigFiles(args: {
  templatePath: string;
  sourcePath: string;
  outputPath: string;
}): Record<string, unknown>;
