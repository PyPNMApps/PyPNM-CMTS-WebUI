export interface AppEnv {
  productProfile: "pypnm-webui" | "pypnm-cmts-webui";
  productProfileLabel: string;
  apiBaseUrl: string;
  pwWebUiBaseUrl: string;
  requestTimeoutMs: number;
}
