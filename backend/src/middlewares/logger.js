/**
 * 请求日志中间件
 * 基于 morgan 记录 HTTP 请求日志
 */
const morgan = require('morgan');
const config = require('../config/config');

// 自定义日志格式：method url status response-time - user-agent
const logFormat = config.app.env === 'development' ? 'dev' : 'combined';

const loggerMiddleware = morgan(logFormat, {
  skip: (req, res) => {
    // 健康检查不记录日志
    return req.originalUrl === '/api/health';
  },
});

module.exports = loggerMiddleware;