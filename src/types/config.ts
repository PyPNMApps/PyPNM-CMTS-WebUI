export interface InstancePollingConfig {
  enabled: boolean;
  intervalMs: number;
}

export type PypnmLogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR" | "OFF";

export interface PypnmLoggingConfig {
  level: PypnmLogLevel;
}

export interface PypnmRequestDefaults {
  cableModemMacAddress: string;
  cableModemIpAddress: string;
  tftpIpv4: string;
  tftpIpv6: string;
  channelIds: string;
  snmpRwCommunity: string;
}

export interface PypnmInstance {
  id: string;
  label: string;
  baseUrl: string;
  enabled: boolean;
  tags: string[];
  capabilities: string[];
  polling: InstancePollingConfig;
  requestDefaults: PypnmRequestDefaults;
}

export interface PypnmInstanceDefaults {
  selectedInstance: string;
  pollIntervalMs: number;
  requestTimeoutMs: number;
  healthPath: string;
  logging: PypnmLoggingConfig;
}

export interface PypnmInstanceConfig {
  version: number;
  defaults: PypnmInstanceDefaults;
  instances: PypnmInstance[];
}
