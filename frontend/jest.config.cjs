/**
 * Jest 配置 - 前端测试
 * 使用 jsdom 环境测试 React 组件
 */
module.exports = {
  testEnvironment: 'jsdom',
  rootDir: '.',
  testMatch: ['<rootDir>/tests/**/*.test.{js,jsx}'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss)$': '<rootDir>/tests/__mocks__/styleMock.js',
  },
  transform: {
    '^.+\\.(js|jsx)$': ['babel-jest', {
      presets: [
        ['@babel/preset-env', { targets: { node: 'current' } }],
        ['@babel/preset-react', { runtime: 'automatic' }],
      ],
    }],
  },
  transformIgnorePatterns: ['node_modules/(?!(antd|@ant-design|rc-.*|@babel/runtime))'],
  collectCoverageFrom: [
    'src/components/**/*.{js,jsx}',
    'src/store/**/*.{js,jsx}',
    'src/utils/**/*.{js,jsx}',
    '!src/**/*.d.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'text-summary', 'lcov', 'json-summary'],
  testTimeout: 15000,
  verbose: true,
};