import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist", ".venv", "release-reports"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/features/*", "@/pages/Cmts*", "@/pages/EndpointExplorerPage", "@/pages/AdvancedPage", "@/pages/AnalysisViewerPage"],
              message: "Use namespaced paths under @/pw/* or @/pcw/*.",
            },
            {
              group: ["@/services/servingGroup*", "@/services/singleCaptureService", "@/services/singleRxMerService", "@/services/captureConnectivityService", "@/services/advanced/*", "@/services/advancedRxMerService"],
              message: "Use namespaced paths under @/pw/services/* or @/pcw/services/*.",
            },
          ],
        },
      ],
    },
  },
);
