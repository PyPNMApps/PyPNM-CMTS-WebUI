export interface ServeOptions {
  host: string;
  port: number;
  open: boolean;
  strictPort: boolean;
  runBackground: boolean;
  startLocalPyPnmDocsis: boolean;
  logLevel: string;
  mode: string;
  base: string;
}

export function parseServeArgs(args: string[]): { options: ServeOptions } | { exitCode: number };

export function runCli(args: string[], metaUrl: string): Promise<number | null>;
