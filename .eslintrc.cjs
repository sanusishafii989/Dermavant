module.exports = {
  root: true,
  extends: ["next/core-web-vitals", "next/typescript"],
  ignorePatterns: [".next/", "out/", "build/", "next-env.d.ts", "build-output.txt", "mobile/"],
  rules: {
    "@typescript-eslint/no-explicit-any": "warn",
  },
  overrides: [
    {
      files: ["**/*.js"],
      rules: {
        "@typescript-eslint/no-require-imports": "off",
      },
    },
  ],
};
