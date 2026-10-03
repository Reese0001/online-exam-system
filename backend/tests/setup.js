/**
 * 测试环境全局配置
 * - 设置 NODE_ENV=test
 * - mock 数据库连接（避免依赖真实 MySQL）
 * - 提供通用 mock 工厂
 */
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_EXPIRES_IN = '2h';
process.env.DB_HOST = 'localhost';
process.env.DB_NAME = 'online_exam_test';
process.env.APP_PORT = '3001';

// 全局 mock：禁止 console.log 噪音（保留 error/warn）
if (!process.env.JEST_VERBOSE) {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: console.warn,
    error: console.error,
  };
}

/**
 * 创建 Sequelize 模型实例的 mock（含 toJSON、update 等方法）
 * @param {object} data - 实例数据
 * @param {object} methods - 额外方法
 */
global.createModelInstance = function (data, methods = {}) {
  return {
    ...data,
    toJSON: () => ({ ...data }),
    update: jest.fn(async (updates) => {
      Object.assign(data, updates);
      return this;
    }),
    save: jest.fn(async () => this),
    destroy: jest.fn(async () => 1),
    reload: jest.fn(async () => this),
    ...methods,
  };
};

/**
 * 创建 Express mock 响应对象
 */
global.createMockResponse = function () {
  const res = {
    statusCode: 200,
    body: null,
    headers: {},
    status: jest.fn(function (code) {
      this.statusCode = code;
      return this;
    }),
    json: jest.fn(function (data) {
      this.body = data;
      return this;
    }),
    setHeader: jest.fn(function (k, v) {
      this.headers[k] = v;
      return this;
    }),
    end: jest.fn(),
    headersSent: false,
  };
  return res;
};

/**
 * 创建 Express mock 请求对象
 */
global.createMockRequest = function (overrides = {}) {
  return {
    headers: {},
    body: {},
    params: {},
    query: {},
    user: null,
    ...overrides,
  };
};

/**
 * 创建 mock next 函数
 */
global.createMockNext = function () {
  const next = jest.fn();
  next.mockImplementation((err) => {
    if (err) throw err;
  });
  return next;
};