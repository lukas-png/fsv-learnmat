/* eslint-disable */
export default {
  displayName: 'api',
  preset: '../../jest.preset.js',
  globals: {},
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
      },
    ],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  // Path aliases from tsconfig.json (the Nx resolver only knows tsconfig.base.json)
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@(controllers|dtos|exceptions|interfaces|middlewares|models|routes|services|utils)/(.*)$': '<rootDir>/src/$1/$2',
  },
  setupFiles: ['reflect-metadata'],
  coverageDirectory: '../../coverage/apps/api',
};
