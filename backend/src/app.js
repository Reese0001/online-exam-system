/**
 * Express 应用入口
 * 在线考试系统后端 API
 */
const express = require('express');
const cors = require('cors');
const path = require('path');

const config = require('./config/config');
const { testConnection } = require('./config/database');
const loggerMiddleware = require('./middlewares/logger');
const { notFoundHandler, errorHandler } = require('./middlewares/errorHandler');
const routes = require('./routes');

// 创建 Express 应用
const app = express();

// ============================================================
// 全局中间件
// ============================================================

// CORS 配置
app.use(
  cors({
    origin: (origin, callback) => {
      // 允许无 origin 的请求（如 curl、同源）以及白名单内
      if (!origin || config.cors.origins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('CORS 不允许的来源'));
      }
    },
    allowedHeaders: ['Content-Type', 'Authorization'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  })
);

// 请求体解析
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 安全响应头
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// 请求日志
app.use(loggerMiddleware);

// 静态文件（上传目录）
app.use('/uploads', express.static(path.resolve(process.cwd(), config.upload.dir)));

// ============================================================
// 健康检查
// ============================================================
app.get('/api/health', (req, res) => {
  res.json({ code: 200, message: 'ok', data: { name: config.app.name, env: config.app.env, time: new Date().toISOString() } });
});

// ============================================================
// 业务路由
// ============================================================
app.use('/api', routes);

// ============================================================
// 错误处理
// ============================================================
app.use(notFoundHandler);
app.use(errorHandler);

// ============================================================
// 启动服务
// ============================================================
async function start() {
  // 测试数据库连接
  await testConnection();
  // 启动 HTTP 服务
  const port = config.app.port;
  app.listen(port, () => {
    console.log(`\n🚀 ${config.app.name} 后端服务已启动`);
    console.log(`   环境: ${config.app.env}`);
    console.log(`   地址: http://localhost:${port}`);
    console.log(`   健康检查: http://localhost:${port}/api/health\n`);
  });
}

// 仅在直接运行时启动（避免测试时自动启动）
if (require.main === module) {
  start().catch(err => {
    console.error('💥 启动失败:', err);
    process.exit(1);
  });
}

module.exports = { app, start };