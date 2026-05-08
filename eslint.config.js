import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "docs/assets/**",
      "docs/vendor/**",
      "docs/sw.js",
      "coverage/**",
      "node_modules/**",
      "scripts/*.mjs",
      "public/sw.js",
      "public/vendor/**",
      "*.config.cjs"
    ]
  },
  js.configs.recommended,
  ...tseslint.configs.strict,
  {
    files: ["src/**/*.ts", "scripts/**/*.mjs", "test/**/*.ts", "*.ts"],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname
      }
    },
    rules: {
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/no-misused-promises": [
        "error",
        {
          checksVoidReturn: false
        }
      ]
    }
  }
);
