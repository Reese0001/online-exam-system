/**
 * JWT 认证中间件
 * 解析并校验 Authorization: Bearer <token>
 */
const jwt = require('jsonwebtoken');
const config = require('../config/config');
const { fail } = require('../utils/response');

/**
 * 认证中间件：校验 JWT，挂载 req.user = { userId, role }
 * @param {boolean} required - 是否必须认证（默认 true）
 */
function auth(required = true) {
  return (req, res, next) => {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      if (!required) return next();
      return fail(res, config.codes.UNAUTHORIZED, '未认证或令牌缺失', null, 401);
    }

    try {
      const payload = jwt.verify(token, config.jwt.secret);
      req.user = { userId: payload.userId, role: payload.role };
      next();
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return fail(res, config.codes.UNAUTHORIZED, '令牌已过期，请重新登录', null, 401);
      }
      return fail(res, config.codes.UNAUTHORIZED, '令牌无效', null, 401);
    }
  };
}

/**
 * 可选认证：未携带 token 不报错，携带则解析
 */
function optionalAuth() {
  return auth(false);
}

module.exports = {
  auth,
  optionalAuth,
};