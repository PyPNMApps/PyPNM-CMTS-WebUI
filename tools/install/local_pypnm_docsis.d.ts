export const LOCAL_PYPNM_INSTANCE_ID: string;
export const LOCAL_PYPNM_INSTANCE_LABEL: string;
export const PYPNM_DEFAULT_PORT: number;
export const WEBUI_DEFAULT_PORT: number;

export interface LocalIpv4Candidate {
  iface: string;
  ip: string;
}

export interface LocalHostChoice {
  label: string;
  host: string;
  detail: string;
}

export interface LocalHostDecision {
  host: string;
  source: string;
  needsPrompt: boolean;
  choices: LocalHostChoice[];
}

export function buildLocalPyPnmInstance(apiHost: string, apiPort?: number): Record<string, unknown>;
export function applyLocalPyPnmAgentConfig(
  templateConfig: Record<string, unknown>,
  localConfig: Record<string, unknown>,
  apiHost: string,
  apiPort?: number,
): Record<string, unknown>;
export function readConfiguredLocalPyPnmHost(config: Record<string, unknown>): string;
export function readConfiguredLocalPyPnmPort(config: Record<string, unknown>): number;
export function parseIpv4Candidates(rawOutput: string): LocalIpv4Candidate[];
export function choosePreferredLocalHost(args?: {
  explicitHost?: string;
  existingHost?: string;
  candidates?: LocalIpv4Candidate[];
  isInteractive?: boolean;
}): LocalHostDecision;
