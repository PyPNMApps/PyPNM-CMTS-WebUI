import { useQuery } from "@tanstack/react-query";

import { useInstanceConfig } from "@/app/useInstanceConfig";
import { listEndpoints } from "@/services/endpointsService";

export function useEndpoints() {
  const { selectedInstance } = useInstanceConfig();

  return useQuery({
    queryKey: ["endpoints", selectedInstance?.id],
    queryFn: () => listEndpoints(selectedInstance?.baseUrl ?? ""),
    enabled: Boolean(selectedInstance),
  });
}
