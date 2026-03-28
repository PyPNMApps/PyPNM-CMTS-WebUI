import { createContext } from "react";

import type { InstanceConfigContextValue } from "@/app/InstanceConfigProvider";

export const InstanceConfigContext = createContext<InstanceConfigContextValue | undefined>(undefined);
