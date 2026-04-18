module.exports = {
  testEnvironment: "node",
  roots: ["<rootDir>/src/tests"],
  testMatch: ["**/*.test.js"],
  transform: {
    "^.+\\.[jt]sx?$": [
      "@swc/jest",
      {
        jsc: {
          target: "es2022",
        },
        module: {
          type: "commonjs",
        },
      },
    ],
  },
};
