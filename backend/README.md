# 在线考试系统 后端 API

> 基于 Node.js 18 + Express 4 + Sequelize 6 + MySQL 8.0 + JWT + bcrypt 实现的在线考试系统后端服务。

## 技术栈

| 层次 | 技术 | 版本 |
|------|------|------|
| 运行时 | Node.js | 18.x LTS |
| Web 框架 | Express | 4.x |
| ORM | Sequelize | 6.x |
| 数据库 | MySQL | 8.0 |
| 认证 | jsonwebtoken | 9.x |
| 密码加密 | bcryptjs | 2.x |
| 参数校验 | express-validator | 7.x |
| Excel 处理 | xlsx | 0.18.x |
| 文件上传 | multer | 1.4.x |
| 日志 | morgan | 1.10.x |
| 限流 | express-rate-limit | 7.x |

## 项目结构（分层架构）

```
backend/
├── src/
│   ├── config/              # 配置层
│   │   ├── config.js        # 应用配置（JWT、端口、错误码）
│   │   └── database.js      # Sequelize 数据库连接
│   ├── models/              # 数据模型层（11 个模型 + 关联）
│   │   ├── index.js         # 模型初始化与关联定义
│   │   ├── Class.js / User.js / Question.js / Paper.js
│   │   ├── PaperQuestion.js / Exam.js / ExamClass.js
│   │   ├── ExamRecord.js / Answer.js / GradeTask.js / SysConfig.js
│   ├── middlewares/         # 中间件层
│   │   ├── auth.js          # JWT 认证
│   │   ├── rbac.js          # 角色权限控制
│   │   ├── errorHandler.js  # 统一错误处理
│   │   └── logger.js        # 请求日志
│   ├── routes/              # 路由层（8 个路由模块）
│   │   ├── index.js         # 路由聚合
│   │   ├── authRoutes.js / userRoutes.js / classRoutes.js
│   │   ├── questionRoutes.js / paperRoutes.js / examRoutes.js
│   │   ├── gradeRoutes.js / scoreRoutes.js
│   ├── controllers/         # 控制器层（8 个控制器）
│   ├── services/            # 服务层（8 个服务，业务逻辑）
│   ├── utils/               # 工具层
│   │   ├── response.js      # 统一响应格式
│   │   ├── validator.js     # 参数校验规则
│   │   └── excelHelper.js   # Excel 导入导出
│   ├── scripts/
│   │   └── init-db.js       # 数据库初始化脚本
│   └── app.js               # Express 应用入口
├── uploads/                 # 上传文件目录
├── .env                     # 环境变量
├── package.json
└── README.md
```

## 快速开始

### 1. 环境要求

- Node.js >= 18
- MySQL >= 8.0

### 2. 安装依赖

```bash
cd backend
npm install
```

### 3. 配置环境变量

编辑 `.env` 文件，按需修改数据库连接、JWT 密钥等：

```env
NODE_ENV=development
APP_PORT=3000
JWT_SECRET=your-secret-key
DB_HOST=localhost
DB_PORT=3306
DB_NAME=online_exam
DB_USER=root
DB_PASSWORD=your-password
```

### 4. 初始化数据库

执行 DDL 脚本并创建默认账号：

```bash
npm run init-db
```

该脚本会：
- 执行 `design/database-ddl.sql` 创建数据库与 12 张表
- 创建默认账号：
  - 管理员：`admin / admin123`
  - 教师：`teacher / teacher123`
  - 学生：`student / student123`

### 5. 启动服务

```bash
# 开发模式（热重载）
npm run dev

# 生产模式
npm start
```

服务默认监听 `http://localhost:3000`。

### 6. 健康检查

```bash
curl http://localhost:3000/api/health
```

## API 概览

统一响应格式：`{ code, message, data }`
认证方式：`Authorization: Bearer <token>`（除登录/注册外所有接口需认证）

### 认证模块 `/api/auth`

| 方法 | 路径 | 说明 | 角色 |
|------|------|------|------|
| POST | /api/auth/login | 用户登录 | 公开 |
| POST | /api/auth/register | 用户注册 | 公开 |
| GET  | /api/auth/profile | 获取个人信息 | 已认证 |
| PUT  | /api/auth/profile | 修改个人信息 | 已认证 |
| PUT  | /api/auth/password | 修改密码 | 已认证 |

### 用户管理 `/api/users`（管理员）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/users | 用户列表（分页、按角色/班级/关键词筛选） |
| POST | /api/users | 创建用户 |
| GET | /api/users/:id | 用户详情 |
| PUT | /api/users/:id | 修改用户 |
| DELETE | /api/users/:id | 删除用户 |
| POST | /api/users/:id/reset-password | 重置密码 |

### 班级管理 `/api/classes`（管理员）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/classes | 班级列表 |
| POST | /api/classes | 创建班级 |
| PUT | /api/classes/:id | 修改班级 |
| DELETE | /api/classes/:id | 删除班级 |
| GET | /api/classes/:id/students | 班级学生列表 |

### 题库管理 `/api/questions`（教师）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/questions | 题目列表（按题型/难度/知识点筛选） |
| POST | /api/questions | 新增题目 |
| GET | /api/questions/:id | 题目详情 |
| PUT | /api/questions/:id | 修改题目 |
| DELETE | /api/questions/:id | 删除题目（被引用时禁止） |
| POST | /api/questions/import | 批量导入（Excel） |
| GET | /api/questions/export | 批量导出（Excel） |

### 试卷管理 `/api/papers`（教师）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/papers | 试卷列表 |
| POST | /api/papers | 创建试卷 |
| GET | /api/papers/:id | 试卷详情（含题目） |
| PUT | /api/papers/:id | 修改试卷 |
| DELETE | /api/papers/:id | 删除试卷（被引用时禁止） |
| POST | /api/papers/:id/questions | 添加题目到试卷 |
| DELETE | /api/papers/:id/questions | 移除试卷题目 |
| POST | /api/papers/auto-generate | 随机组卷 |

### 考试管理 + 在线答题 `/api/exams`

| 方法 | 路径 | 说明 | 角色 |
|------|------|------|------|
| GET | /api/exams | 考试列表 | 教师 |
| POST | /api/exams | 创建考试 | 教师 |
| GET | /api/exams/:id | 考试详情 | 教师 |
| PUT | /api/exams/:id | 修改考试 | 教师 |
| DELETE | /api/exams/:id | 删除考试 | 教师 |
| POST | /api/exams/:id/publish | 发布考试 | 教师 |
| PUT | /api/exams/:id/status | 状态管理 | 教师 |
| POST | /api/exams/:id/classes | 指定班级 | 教师 |
| GET | /api/exams/:id/students | 参考学生 | 教师 |
| POST | /api/exams/:id/auto-grade | 自动阅卷 | 教师 |
| GET | /api/exams/:id/grade-progress | 阅卷进度 | 教师 |
| GET | /api/exams/student/list | 学生考试列表 | 学生 |
| GET | /api/exams/:id/start | 进入考试 | 学生 |
| POST | /api/exams/:id/answers | 答案暂存 | 学生 |
| POST | /api/exams/:id/submit | 交卷 | 学生 |
| GET | /api/exams/:id/record | 答题记录 | 学生 |

### 阅卷 `/api/grade-tasks`（教师）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/grade-tasks | 阅卷任务列表 |
| GET | /api/grade-tasks/:id | 阅卷任务详情 |
| POST | /api/grade-tasks/:id/grade | 手动评分 |

### 成绩统计 `/api/scores`

| 方法 | 路径 | 说明 | 角色 |
|------|------|------|------|
| GET | /api/scores/personal | 个人成绩 | 学生 |
| GET | /api/scores/wrong-questions | 错题统计 | 学生 |
| GET | /api/scores/class/:classId | 班级成绩 | 教师 |
| GET | /api/scores/statistics | 分布统计 | 教师 |
| GET | /api/scores/export | 成绩单导出 | 教师 |

## 错误码体系

| 错误码 | HTTP | 含义 |
|--------|------|------|
| 200 | 200 | 成功 |
| 400 | 400 | 请求参数错误 |
| 401 | 401 | 未认证/令牌失效 |
| 403 | 403 | 无权限 |
| 404 | 404 | 资源不存在 |
| 409 | 409 | 资源冲突 |
| 422 | 422 | 参数校验失败 |
| 500 | 500 | 服务器内部错误 |
| 1001 | 401 | 用户名或密码错误 |
| 1002 | 409 | 用户名已存在 |
| 1003 | 403 | 账号已禁用 |
| 2001 | 409 | 题目已被试卷引用 |
| 3001 | 409 | 试卷已被考试引用 |
| 4001 | 400 | 考试未在时间窗口内 |
| 4002 | 409 | 已交卷，不可重复提交 |
| 4003 | 403 | 考试进行中，不允许删除 |
| 6001 | 404 | 阅卷任务不存在 |

## 安全设计

- **JWT 认证**：有效期 2h，payload 含 userId/role
- **bcrypt 加密**：saltRounds = 10，密码不明文存储
- **RBAC 权限**：admin/teacher/student 三角色，路由级控制
- **SQL 注入防护**：全量 Sequelize 参数化查询
- **CORS 配置**：白名单来源
- **登录限流**：10 次/分钟
- **安全响应头**：X-Content-Type-Options、X-XSS-Protection
- **软删除**：题目/试卷/考试使用 deleted_at 软删除

## 测试

```bash
npm test
```

## 许可证

MIT