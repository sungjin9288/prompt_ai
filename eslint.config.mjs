import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const restrictedUiComponentImports = [
  {
    name: "@/lib/studio/href",
    message:
      "Use normalizeInternalHref from @/lib/navigation/href in UI components. Keep @/lib/studio/href inside the Studio data layer.",
  },
  {
    name: "@/lib/studio/source-registry",
    importNames: ["promptStudioSourceRegistry"],
    message:
      "Use the screen-specific source registry helpers in UI components instead of the raw registry.",
  },
];

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    files: ["src/components/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: restrictedUiComponentImports,
        },
      ],
    },
  },
]);

export default eslintConfig;
