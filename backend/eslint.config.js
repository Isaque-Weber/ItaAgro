import js from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

/** @type {import('eslint').Linter.FlatConfig} */
const config = [
  js,
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    ignores: ["node_modules/**", "dist/**", "build/**", "coverage/**"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2021,
        sourceType: "module",
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
];

export default config;
