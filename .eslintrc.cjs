module.exports = {
  root: true,
  extends: ["next/core-web-vitals", "next/typescript"],
  ignorePatterns: [".next/", "out/", "build/", "next-env.d.ts", "build-output.txt"],
  rules: {
    // Downgrade to warning — project uses `any` extensively with Mongoose InferSchemaType
    "@typescript-eslint/no-explicit-any": "warn",
  },
};
