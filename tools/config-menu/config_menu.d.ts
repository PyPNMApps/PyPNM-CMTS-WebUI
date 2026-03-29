export function normalizeChannelIds(value: unknown): number[];
export function parseProductProfile(value: unknown): "pypnm-webui" | "pypnm-cmts-webui" | "";
export function resolveProductProfileFromEnv(repoRoot?: string): "pypnm-webui" | "pypnm-cmts-webui";
export function resolveProfileContext(repoRoot?: string): {
  productProfile: "pypnm-webui" | "pypnm-cmts-webui";
  productLabel: string;
  agentBrand: string;
  agentLabelSingular: string;
  agentLabelPlural: string;
  includeCableModemDefaults: boolean;
};
export function tryNormalizeBaseUrl(value: unknown): {
  ok: true;
  value: string;
} | {
  ok: false;
  value: string;
  error: string;
};
export function normalizeBaseUrl(value: unknown, fallback?: string): string;
export function isReservedLocalAgentInstance(instance: unknown): boolean;
export function hasReservedLocalAgent(config: unknown): boolean;

export function configPathFromRepoRoot(repoRoot: string): string;

export function templateConfigPathFromRepoRoot(repoRoot: string): string;

export function buildRuntimeConfigSchemaExample(profileContext?: {
  productProfile: "pypnm-webui" | "pypnm-cmts-webui";
  productLabel: string;
  agentBrand: string;
  agentLabelSingular: string;
  agentLabelPlural: string;
  includeCableModemDefaults: boolean;
}): {
  version: number;
  defaults: {
    selected_instance: string;
    poll_interval_ms: number;
    request_timeout_ms: number;
    health_path: string;
    logging: {
      level: "DEBUG" | "INFO" | "WARN" | "ERROR" | "OFF";
    };
  };
  instances: Array<{
    id: string;
    label: string;
    base_url: string;
    enabled: boolean;
    tags: string[];
    capabilities: string[];
    polling: {
      enabled: boolean;
      interval_ms: number;
    };
    request_defaults: {
      cable_modem?: {
        mac_address: string;
        ip_address: string;
      };
      tftp: {
        ipv4: string;
        ipv6: string;
      };
      capture: {
        channel_ids: number[];
      };
      snmp: {
        rw_community: string;
      };
    };
  }>;
};

export function normalizeConfig(raw: unknown, profileContext?: {
  productProfile: "pypnm-webui" | "pypnm-cmts-webui";
  productLabel: string;
  agentBrand: string;
  agentLabelSingular: string;
  agentLabelPlural: string;
  includeCableModemDefaults: boolean;
}): {
  version: number;
  defaults: {
    selected_instance: string;
    poll_interval_ms: number;
    request_timeout_ms: number;
    health_path: string;
    logging: {
      level: "DEBUG" | "INFO" | "WARN" | "ERROR" | "OFF";
    };
  };
  instances: Array<{
    id: string;
    label: string;
    base_url: string;
    enabled: boolean;
    tags: string[];
    capabilities: string[];
    polling: {
      enabled: boolean;
      interval_ms: number;
    };
    request_defaults: {
      cable_modem?: {
        mac_address: string;
        ip_address: string;
      };
      tftp: {
        ipv4: string;
        ipv6: string;
      };
      capture: {
        channel_ids: number[];
      };
      snmp: {
        rw_community: string;
      };
    };
  }>;
};

export function promptSelectedInstance(
  rl: { question(prompt: string): Promise<string> },
  instances: Array<{ id: string; label: string }>,
  currentInstanceId: string,
): Promise<string>;

export function saveConfig(
  configPath: string,
  config: {
    version: number;
    defaults: {
      selected_instance: string;
      poll_interval_ms: number;
      request_timeout_ms: number;
      health_path: string;
      logging: {
        level: "DEBUG" | "INFO" | "WARN" | "ERROR" | "OFF";
      };
    };
    instances: Array<{
      id: string;
      label: string;
      base_url: string;
      enabled: boolean;
      tags: string[];
      capabilities: string[];
      polling: {
        enabled: boolean;
        interval_ms: number;
      };
      request_defaults: {
        cable_modem?: {
          mac_address: string;
          ip_address: string;
        };
        tftp: {
          ipv4: string;
          ipv6: string;
        };
        capture: {
          channel_ids: number[];
        };
        snmp: {
          rw_community: string;
        };
      };
    }>;
  },
  profileContext?: {
    productProfile: "pypnm-webui" | "pypnm-cmts-webui";
    productLabel: string;
    agentBrand: string;
    agentLabelSingular: string;
    agentLabelPlural: string;
    includeCableModemDefaults: boolean;
  },
): void;

export function ensureLocalRuntimeConfig(
  configPath: string,
  fallbackPath?: string,
  profileContext?: {
    productProfile: "pypnm-webui" | "pypnm-cmts-webui";
    productLabel: string;
    agentBrand: string;
    agentLabelSingular: string;
    agentLabelPlural: string;
    includeCableModemDefaults: boolean;
  },
): {
  config: {
    version: number;
    defaults: {
      selected_instance: string;
      poll_interval_ms: number;
      request_timeout_ms: number;
      health_path: string;
      logging: {
        level: "DEBUG" | "INFO" | "WARN" | "ERROR" | "OFF";
      };
    };
    instances: Array<{
      id: string;
      label: string;
      base_url: string;
      enabled: boolean;
      tags: string[];
      capabilities: string[];
      polling: {
        enabled: boolean;
        interval_ms: number;
      };
      request_defaults: {
        cable_modem?: {
          mac_address: string;
          ip_address: string;
        };
        tftp: {
          ipv4: string;
          ipv6: string;
        };
        capture: {
          channel_ids: number[];
        };
        snmp: {
          rw_community: string;
        };
      };
    }>;
  };
  generated: boolean;
};

export function validateConfigForProfile(
  config: unknown,
  profileContext?: {
    productProfile: "pypnm-webui" | "pypnm-cmts-webui";
    productLabel: string;
    agentBrand: string;
    agentLabelSingular: string;
    agentLabelPlural: string;
    includeCableModemDefaults: boolean;
  },
): string | null;

export function runConfigMenu(metaUrl: string): Promise<number>;
