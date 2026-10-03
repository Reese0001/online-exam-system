# 在线考试系统前端

## 技术栈

- React 18+
- TypeScript 5.x
- Redux Toolkit
- Ant Design 5.x
- React Router v6
- Vite 5.x

## 功能模块

- 用户登录
- 管理端：用户管理（管理员）
- 教师端：题库管理、考试管理
- 学生端：在线考试、答题、提交

## 安装和运行

### 1. 环境要求

- Node.js 18+

### 2. 安装依赖

```bash
cd frontend
npm install
```

### 3. 启动开发服务

```bash
npm run dev
```

服务将在 `http://localhost:3000` 运行

### 4. 构建生产版本

```bash
npm run build
```

## 项目结构

```
frontend/
├── src/
│   ├── components/
│   │   ├── common/           # 通用组件
│   │   ├── layout/           # 布局组件
│   │   │   └── DashboardLayout.tsx
│   │   └── exam/             # 考试相关组件
│   ├── pages/
│   │   ├── LoginPage.tsx     # 登录页
│   │   ├── admin/            # 管理端页面
│   │   ├── teacher/          # 教师端页面
│   │   │   ├── QuestionBankPage.tsx
│   │   │   └── ExamManagementPage.tsx
│   │   └── student/          # 学生端页面
│   │       └── StudentExamPage.tsx
│   ├── services/
│   │   └── api.ts            # API服务层
│   ├── store/
│   │   ├── index.ts          # Redux store配置
│   │   └── slices/
│   │       └── authSlice.ts  # 认证状态
│   ├── hooks/
│   │   └── useApi.ts         # API Hooks
│   ├── utils/
│   ├── constants/
│   ├── assets/
│   ├── App.tsx               # 应用入口
│   └── index.tsx             # 渲染入口
├── package.json
├── vite.config.js            # Vite配置
└── index.html
```

## 功能说明

### 管理员

- 用户管理：创建、编辑、删除用户账号

### 教师

- 题库管理：添加、编辑、删除试题（支持5种题型）
- 考试管理：创建考试、设置考试时间、管理考生

### 学生

- 查看可用考试
- 在线答题（限时考试）
- 查看成绩

## API配置

前端默认代理到后端API服务。修改 `vite.config.js` 中的配置：

```javascript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:8888',
      changeOrigin: true
    }
  }
}
```

## 许可证

MIT