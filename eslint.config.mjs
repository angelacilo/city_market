import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

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
    rules: {
      // This repo intentionally uses `any` in a few server-data edges.
      "@typescript-eslint/no-explicit-any": "off",
      // Copy-heavy marketing text often includes quotes/apostrophes.
      "react/no-unescaped-entities": "off",

      // React Compiler / experimental purity rules are too strict for
      // common UI patterns (relative time, greetings, etc.).
      "react-hooks/purity": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/static-components": "off",
      "react-hooks/incompatible-library": "off",
    },
  },
]);

export default eslintConfig;
