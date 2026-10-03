/**
 * 统一响应格式工具
 * 格式：{ code, message, data }
 */
const config = require('../config/config');

/**
 * 成功响应
 * @param {Object} res - Express response
 * @param {*} data - 业务数据
 * @param {string} message - 提示信息
 */
function success(res, data = null, message = '操作成功') {
  return res.json({
    code: config.codes.SUCCESS,
    message,
    data,
  });
}

/**
 * 失败响应
 * @param {Object} res - Express response
 * @param {number} code - 业务错误码
 * @param {string} message - 错误信息
 * @param {*} data - 附加数据
 * @param {number} [httpStatus] - HTTP 状态码（默认与 code 一致或 400）
 */
function fail(res, code, message, data = null, httpStatus) {
  const status = httpStatus || mapHttpStatus(code);
  return res.status(status).json({
    code,
    message,
    data,
  });
}

/**
 * 业务错误码到 HTTP 状态码的映射
 */
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

/**
 * 构建分页响应数据
 * @param {Array} list - 列表
 * @param {number} total - 总数
 * @param {number} page - 当前页
 * @param {number} pageSize - 每页条数
 */
function pageData(list, total, page, pageSize) {
  return { list, total, page, pageSize };
}

/**
 * 解析分页参数
 */
function parsePage(query) {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const pageSize = Math.min(Math.max(parseInt(query.pageSize, 10) || 10, 1), 100);
  const offset = (page - 1) * pageSize;
  return { page, pageSize, offset, limit: pageSize };
}

module.exports = {
  success,
  fail,
  pageData,
  parsePage,
};