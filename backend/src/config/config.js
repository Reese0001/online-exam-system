/**
 * 应用配置模块
 * 从环境变量读取配置，提供默认值
 */
require('dotenv').config();

const config = {
  // 应用配置
  app: {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.APP_PORT, 10) || 3000,
    name: process.env.APP_NAME || '在线考试系统',
  },

  // JWT 配置
  jwt: {
    secret: process.env.JWT_SECRET || 'default-jwt-secret-change-me',
    expiresIn: process.env.JWT_EXPIRES_IN || '2h',
  },

  // 数据库配置
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    name: process.env.DB_NAME || 'online_exam',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    pool: {
      min: parseInt(process.env.DB_POOL_MIN, 10) || 5,
      max: parseInt(process.env.DB_POOL_MAX, 10) || 20,
      idle: parseInt(process.env.DB_POOL_IDLE, 10) || 30000,
    },
  },

  // CORS 配置
  cors: {
    origins: (process.env.CORS_ORIGINS || 'http://localhost:5173').split(',').map(s => s.trim()),
  },

  // 文件上传配置
  upload: {
    dir: process.env.UPLOAD_DIR || 'uploads',
    maxSize: parseInt(process.env.UPLOAD_MAX_SIZE, 10) || 10 * 1024 * 1024,
  },

  // 日志配置
  log: {
    level: process.env.LOG_LEVEL || 'dev',
  },

  // 角色常量
  roles: {
    ADMIN: 'admin',
    TEACHER: 'teacher',
    STUDENT: 'student',
  },

  // 业务错误码
  codes: {
    SUCCESS: 200,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE: 422,
    INTERNAL_ERROR: 500,
    // 业务错误码
    USERNAME_OR_PASSWORD_ERROR: 1001,
    USERNAME_EXISTS: 1002,
    ACCOUNT_DISABLED: 1003,
    QUESTION_REFERENCED: 2001,
    PAPER_REFERENCED: 3001,
    EXAM_NOT_IN_WINDOW: 4001,
    EXAM_ALREADY_SUBMITTED: 4002,
    EXAM_ONGOING: 4003,
    ANSWER_SAVE_FAILED: 5001,
    GRADE_TASK_NOT_FOUND: 6001,
  },
};

module.exports = config;