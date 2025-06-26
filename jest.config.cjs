/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  moduleNameMapper: {
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
    "\\.(gif|ttf|eot|svg|png)$": "<rootDir>/mocks/fileMock.cjs",
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  transform: { "^.+\\.tsx?$": "ts-jest" },
  transformIgnorePatterns: ["<rootDir>/node_modules/"],
};
