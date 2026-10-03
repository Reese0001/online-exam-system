/**
 * 统一错误处理中间件
 * 捕获控制器/服务层抛出的异常，返回统一错误响应
 */
const config = require('../config/config');

/**
 * 自定义业务错误类
 */
class BizError extends Error {
  constructor(code, message, data = null) {
    super(message);
    this.name = 'BizError';
    this.code = code;
    this.data = data;
  }
}

/**
 * 404 路由未找到处理
 */
function notFoundHandler(req, res) {
  return res.status(404).json({
    code: config.codes.NOT_FOUND,
    message: `接口不存在: ${req.method} ${req.originalUrl}`,
    data: null,
  });
}

/**
 * 统一错误处理
 */
function errorHandler(err, req, res, next) {
  // 已由响应发送则交给 Express 默认处理
  if (res.headersSent) return next(err);

  // 业务错误
  if (err instanceof BizError) {
    const httpStatus = mapHttpStatus(err.code);
    return res.status(httpStatus).json({
      code: err.code,
      message: err.message,
      data: err.data,
    });
  }

  // Sequelize 唯一约束冲突
  if (err.name === 'SequelizeUniqueConstraintError') {
    const field = err.fields ? Object.keys(err.fields).join(',') : '字段';
    return res.status(409).json({
      code: config.codes.CONFLICT,
      message: `${field} 已存在，请勿重复创建`,
      data: null,
    });
  }

  // Sequelize 外键约束冲突
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json({
      code: config.codes.BAD_REQUEST,
      message: '关联资源不存在，请检查外键ID',
      data: null,
    });
  }

  // Sequelize 校验错误
  if (err.name === 'SequelizeValidationError') {
    const msg = err.errors?.map(e => e.message).join('; ') || '数据校验失败';
    return res.status(422).json({
      code: config.codes.UNPROCESSABLE,
      message: msg,
      data: null,
    });
  }

  // JWT 错误
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({
      code: config.codes.UNAUTHORIZED,
      message: '令牌无效或已过期',
      data: null,
    });
  }

  // 其他未知错误
  console.error('💥 未处理错误:', err);
  return res.status(500).json({
    code: config.codes.INTERNAL_ERROR,
    message: config.app.env === 'development' ? err.message : '服务器内部错误',
    data: null,
  });
}

function mapHttpStatus(code) {
  const map = {
    [config.codes.SUCCESS]: 200,
    [config.codes.BAD_REQUEST]: 400,
    [config.codes.UNAUTHORIZED]: 401,
    [config.codes.FORBIDDEN]: 403,
    [config.codes.NOT_FOUND]: 404,
    [config.codes.CONFLICT]: 409,
    [config.codes.UNPROCESSABLE]: 422,
    [config.codes.INTERNAL_ERROR]: 500,
    [config.codes.USERNAME_OR_PASSWORD_ERROR]: 401,
    [config.codes.USERNAME_EXISTS]: 409,
    [config.codes.ACCOUNT_DISABLED]: 403,
    [config.codes.QUESTION_REFERENCED]: 409,
    [config.codes.PAPER_REFERENCED]: 409,
    [config.codes.EXAM_NOT_IN_WINDOW]: 400,
    [config.codes.EXAM_ALREADY_SUBMITTED]: 409,
    [config.codes.EXAM_ONGOING]: 403,
    [config.codes.ANSWER_SAVE_FAILED]: 400,
    [config.codes.GRADE_TASK_NOT_FOUND]: 404,
  };
  return map[code] || 400;
}

module.exports = {
  BizError,
  notFoundHandler,
  errorHandler,
};