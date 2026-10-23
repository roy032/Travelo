import js from "@eslint/js";
import globals from "globals";
import prettier from "eslint-config-prettier";

export default [
  { ignores: ["node_modules/", "coverage/", "src/uploads/"] },
  js.configs.recommended,
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: { ...globals.node },
    },
    rules: {
      "no-unused-vars": ["error", { args: "none", caughtErrors: "none" }],
      // Many services wrap calls in try { } catch (e) { throw e }; harmless, so warn only.
      "no-useless-catch": "warn",
    },
  },
  {
    files: ["**/*.test.js"],
    languageOptions: { globals: { ...globals.vitest } },
  },
  prettier,
];
