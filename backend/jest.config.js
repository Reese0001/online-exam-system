/**
 * Jest 配置 - 后端测试
 * 覆盖 unit + integration 测试，使用 sqlite 内存数据库隔离
 */
module.exports = {
  testEnvironment: 'node',
  rootDir: '.',
  testMatch: ['<rootDir>/tests/**/*.test.js'],
  setupFilesAfterEach: ['<rootDir>/tests/setup.js'],
  setupFiles: ['<rootDir>/tests/setup.js'],
  collectCoverageFrom: [
    'src/services/**/*.js',
    'src/middlewares/**/*.js',
    'src/models/**/*.js',
    'src/controllers/**/*.js',
    '!src/models/index.js',
    '!src/models/SysConfig.js',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'text-summary', 'lcov', 'json-summary'],
  testTimeout: 15000,
  forceExit: true,
  detectOpenHandles: true,
  verbose: true,
};