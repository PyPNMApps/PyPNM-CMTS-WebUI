import { useContext } from "react";

import { InstanceConfigContext } from "@/app/InstanceConfigContext";

export function useInstanceConfig() {
  const context = useContext(InstanceConfigContext);

  if (!context) {
    throw new Error("useInstanceConfig must be used within InstanceConfigProvider");
  }

  return context;
}
