module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
    jest: true,
  },
  extends: ["eslint:recommended", "prettier", "plugin:import/typescript"],
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint", "import"],
  overrides: [
    {
      files: "**/*.ts",
      parserOptions: {
        project: ["./tsconfig.json"],
        sourceType: "module",
      },
      extends: [
        "plugin:import/errors",
        "plugin:import/warnings",
        "plugin:import/typescript",
        "plugin:@typescript-eslint/recommended",
      ],
      rules: {
        "import/namespace": "off",
        "@typescript-eslint/no-empty-function": "off",
        "@typescript-eslint/no-empty-interface": "off",
        "no-constant-condition": "off",
        "@typescript-eslint/no-explicit-any": "off",
        "prefer-const": "off",
        "@typescript-eslint/no-non-null-assertion": "off",
        "@typescript-eslint/ban-ts-ignore": "off",
        "@typescript-eslint/no-loss-of-precision": "off",
        "@typescript-eslint/ban-types": "off",
        "@typescript-eslint/ban-ts-comment": "off",
        "@typescript-eslint/no-non-null-asserted-optional-chain": "off",
        "@typescript-eslint/no-var-requires": "off",
        "import/export": "off",
        "no-fallthrough": "off",
        "@typescript-eslint/explicit-module-boundary-types": "off",
        "@typescript-eslint/no-floating-promises": ["error"],
        "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      },
    },
  ],
  ignorePatterns: [
    "**/dist/**/*", // Ignore built files.
    "esbuild.config.js",
    "jest.config.js",
    "Config.js",
    "commitLint.config.ts",
  ],
  settings: {
    "import/resolver": {
      typescript: {},
    },
  },
};
