import { useEffect, useMemo, useState, type ReactNode } from "react";

import { InstanceConfigContext } from "@/app/InstanceConfigContext";
import { loadInstanceConfig } from "@/lib/instanceConfig";
import { setRuntimeLogLevel, logError } from "@/lib/logger";
import type { PypnmInstance, PypnmInstanceConfig } from "@/types/config";

export interface InstanceConfigContextValue {
  config: PypnmInstanceConfig | null;
  instances: PypnmInstance[];
  selectedInstance: PypnmInstance | null;
  isLoading: boolean;
  error: string | null;
  setSelectedInstanceId: (instanceId: string) => void;
}

interface InstanceConfigProviderProps {
  children: ReactNode;
}

export function InstanceConfigProvider({ children }: InstanceConfigProviderProps) {
  const [config, setConfig] = useState<PypnmInstanceConfig | null>(null);
  const [selectedInstanceId, setSelectedInstanceIdState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    loadInstanceConfig()
      .then((loadedConfig) => {
        if (!isMounted) {
          return;
        }

        const preferredId = loadedConfig.defaults.selectedInstance;
        const preferredInstance = loadedConfig.instances.find((instance) => instance.id === preferredId) ?? loadedConfig.instances[0] ?? null;

        setConfig(loadedConfig);
        setRuntimeLogLevel(loadedConfig.defaults.logging.level);
        setSelectedInstanceIdState(preferredInstance?.id ?? null);
        setError(null);
      })
      .catch((loadError) => {
        if (!isMounted) {
          return;
        }

        const message = loadError instanceof Error ? loadError.message : "Failed to load instance configuration.";
        logError("Failed to load instance configuration", { error: message });
        setError(message);
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const value = useMemo<InstanceConfigContextValue>(() => {
    const instances = config?.instances ?? [];
    const selectedInstance = instances.find((instance) => instance.id === selectedInstanceId) ?? instances[0] ?? null;

    return {
      config,
      instances,
      selectedInstance,
      isLoading,
      error,
      setSelectedInstanceId: (instanceId: string) => {
        setSelectedInstanceIdState(instanceId);
      },
    };
  }, [config, error, isLoading, selectedInstanceId]);

  return <InstanceConfigContext.Provider value={value}>{children}</InstanceConfigContext.Provider>;
}
