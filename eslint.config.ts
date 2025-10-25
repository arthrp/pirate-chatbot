import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  // Ignore build output
  { ignores: ["dist/**"] },
  // Base config for JS and TS files
  {
    languageOptions: {
      globals: globals.node,
    },
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
    ],
  }
);
