import eslint from "@eslint/js";
import stylistic from "@stylistic/eslint-plugin";

export default [
  {
    ignores: ["coverage/**", "node_modules/**", "worker-configuration.d.ts"],
  },
  eslint.configs.recommended,
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        Response: "readonly",
        URL: "readonly",
        process: "readonly",
      },
    },
    plugins: {
      "@stylistic": stylistic,
    },
    rules: {
      "@stylistic/array-bracket-spacing": ["error", "never"],
      "@stylistic/comma-dangle": ["error", "always-multiline"],
      "@stylistic/indent": ["error", 2],
      "@stylistic/key-spacing": "error",
      "@stylistic/object-curly-spacing": ["error", "always"],
      "@stylistic/quotes": ["error", "double"],
      "@stylistic/semi": ["error", "always"],
      "@stylistic/space-infix-ops": "error",
    },
  },
];