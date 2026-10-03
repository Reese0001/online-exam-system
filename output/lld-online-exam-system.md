# LLD: 在线考试系统数据库设计

## 1. 文档信息

- **文档类型**：LLD（Low-Level Design）
- **项目名称**：在线考试系统
- **版本**：v1.0
- **创建日期**：2026-09-30
- **作者**：Agent Team
- **状态**：草稿

## 2. 模块概述

本文档详细描述在线考试系统的数据库设计，包括：
- 数据库表结构设计
- 字段定义和约束
- 索引设计
- 关系图
- 核心SQL查询

## 3. 数据模型/数据库设计

### 3.1 数据库ER图

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│     users       │       │    courses      │       │   questions     │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id (PK)         │       │ id (PK)         │       │ id (PK)         │
│ username        │       │ name            │       │ course_id (FK)  │
│ password        │       │ description     │       │ type            │
│ role            │       │ created_by (FK) │       │ content         │
│ name            │       └─────────────────┘       │ options         │
│ email           │                                   │ answer          │
│ phone           │                                   │ difficulty      │
│ avatar          │                                   │ explanation     │
│ created_at      │                                   │ created_by (FK) │
│ updated_at      │                                   │ created_at      │
└─────────────────┘                                   │ updated_at      │
                                                      └─────────────────┘
                                                              │
                                                              │
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│     papers      │       │  paper_questions│       │     exams       │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id (PK)         │       │ paper_id (FK)   │       │ id (PK)         │
│ title           │       │ question_id(FK) │       │ title           │
│ course_id (FK)  │       │ score           │       │ paper_id (FK)   │
│ total_score     │       │ order_num       │       │ duration        │
│ pass_score      │       └─────────────────┘       │ start_time      │
│ created_by (FK) │                                   │ end_time        │
│ status          │                                   │ created_by (FK) │
│ created_at      │                                   │ status          │
│ updated_at      │                                   │ created_at      │
└─────────────────┘                                   │ updated_at      │
                                                      └─────────────────┘
                                                              │
                                                              │
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│   exam_records  │       │  answer_records │       │     scores      │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id (PK)         │       │ id (PK)         │       │ id (PK)         │
│ exam_id (FK)    │       │ record_id (FK)  │       │ record_id (FK)  │
│ student_id (FK) │       │ question_id(FK) │       │ total_score     │
│ start_time      │       │ answer          │       │ objective_score │
│ end_time        │       │ is_correct      │       │ subjective_score│
│ status          │       │ score           │       │ pass_status     │
│ duration_used   │       └─────────────────┘       │ reviewed_by(FK) │
│ created_at      │                                   │ reviewed_at     │
└─────────────────┘                                   │ created_at      │
                                                      └─────────────────┘
```

### 3.2 详细表结构设计

#### 3.2.1 用户表 (users)

```sql
CREATE TABLE `users` (
  `id` INT PRIMARY KEY AUTO_INCREMENT COMMENT '用户ID',
  `username` VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名/学号/工号',
  `password` VARCHAR(255) NOT NULL COMMENT '密码（bcrypt加密）',
  `role` ENUM('admin', 'teacher', 'student') NOT NULL COMMENT '角色：admin-管理员, teacher-教师, student-学生',
  `name` VARCHAR(100) NOT NULL COMMENT '真实姓名',
  `email` VARCHAR(100) COMMENT '邮箱',
  `phone` VARCHAR(20) COMMENT '手机号',
  `avatar` VARCHAR(255) COMMENT '头像URL',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX `idx_username` (`username`),
  INDEX `idx_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';
```

**字段说明：**
- `username`：学号/工号，用于登录
- `role`：用户角色，决定权限
- `password`：使用bcrypt加密，存储60位字符串

#### 3.2.2 课程表 (courses)

```sql
CREATE TABLE `courses` (
  `id` INT PRIMARY KEY AUTO_INCREMENT COMMENT '课程ID',
  `name` VARCHAR(100) NOT NULL COMMENT '课程名称',
  `description` TEXT COMMENT '课程描述',
  `created_by` INT NOT NULL COMMENT '创建者ID',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='课程表';
```

#### 3.2.3 试题表 (questions)

```sql
CREATE TABLE `questions` (
  `id` INT PRIMARY KEY AUTO_INCREMENT COMMENT '试题ID',
  `course_id` INT NOT NULL COMMENT '所属课程ID',
  `type` ENUM('single', 'multiple', 'true_false', 'fill', 'short_answer') NOT NULL COMMENT '题型：single-单选, multiple-多选, true_false-判断, fill-填空, short_answer-简答',
  `content` TEXT NOT NULL COMMENT '题干内容',
  `options` JSON COMMENT '选项（JSON格式，仅单选/多选使用）',
  `answer` TEXT NOT NULL COMMENT '标准答案',
  `difficulty` ENUM('easy', 'medium', 'hard') DEFAULT 'medium' COMMENT '难度：easy-简单, medium-中等, hard-困难',
  `explanation` TEXT COMMENT '答案解析',
  `created_by` INT NOT NULL COMMENT '创建者ID',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_course_id` (`course_id`),
  INDEX `idx_type` (`type`),
  INDEX `idx_difficulty` (`difficulty`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='试题表';
```

**字段说明：**
- `options`：JSON格式存储选项，例如：
  ```json
  {
    "A": "选项A内容",
    "B": "选项B内容",
    "C": "选项C内容",
    "D": "选项D内容"
  }
  ```
- `answer`：
  - 单选题：存储选项字母，如 "A"
  - 多选题：存储选项数组，如 "[\"A\", \"B\"]"
  - 判断题：存储 "true" 或 "false"
  - 填空题：存储答案字符串
  - 简答题：存储标准答案文本

#### 3.2.4 试卷表 (papers)

```sql
CREATE TABLE `papers` (
  `id` INT PRIMARY KEY AUTO_INCREMENT COMMENT '试卷ID',
  `title` VARCHAR(200) NOT NULL COMMENT '试卷标题',
  `course_id` INT NOT NULL COMMENT '所属课程ID',
  `total_score` DECIMAL(5,2) NOT NULL DEFAULT 100.00 COMMENT '总分',
  `pass_score` DECIMAL(5,2) NOT NULL DEFAULT 60.00 COMMENT '及格分数',
  `created_by` INT NOT NULL COMMENT '创建者ID',
  `status` ENUM('draft', 'published') DEFAULT 'draft' COMMENT '状态：draft-草稿, published-已发布',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_course_id` (`course_id`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='试卷表';
```

#### 3.2.5 试卷试题关联表 (paper_questions)

```sql
CREATE TABLE `paper_questions` (
  `id` INT PRIMARY KEY AUTO_INCREMENT COMMENT '关联ID',
  `paper_id` INT NOT NULL COMMENT '试卷ID',
  `question_id` INT NOT NULL COMMENT '试题ID',
  `score` DECIMAL(5,2) NOT NULL COMMENT '该题分值',
  `order_num` INT NOT NULL COMMENT '题目顺序',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  FOREIGN KEY (`paper_id`) REFERENCES `papers`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `uk_paper_question` (`paper_id`, `question_id`),
  INDEX `idx_paper_id` (`paper_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='试卷试题关联表';
```

#### 3.2.6 考试表 (exams)

```sql
CREATE TABLE `exams` (
  `id` INT PRIMARY KEY AUTO_INCREMENT COMMENT '考试ID',
  `title` VARCHAR(200) NOT NULL COMMENT '考试标题',
  `paper_id` INT NOT NULL COMMENT '试卷ID',
  `duration` INT NOT NULL COMMENT '考试时长（分钟）',
  `start_time` DATETIME NOT NULL COMMENT '开始时间',
  `end_time` DATETIME NOT NULL COMMENT '结束时间',
  `created_by` INT NOT NULL COMMENT '创建者ID',
  `status` ENUM('pending', 'ongoing', 'finished', 'cancelled') DEFAULT 'pending' COMMENT '状态：pending-未开始, ongoing-进行中, finished-已结束, cancelled-已取消',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  FOREIGN KEY (`paper_id`) REFERENCES `papers`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_paper_id` (`paper_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_start_time` (`start_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='考试表';
```

#### 3.2.7 考试参与表 (exam_participants)

```sql
CREATE TABLE `exam_participants` (
  `id` INT PRIMARY KEY AUTO_INCREMENT COMMENT '关联ID',
  `exam_id` INT NOT NULL COMMENT '考试ID',
  `student_id` INT NOT NULL COMMENT '学生ID',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  FOREIGN KEY (`exam_id`) REFERENCES `exams`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `uk_exam_student` (`exam_id`, `student_id`),
  INDEX `idx_exam_id` (`exam_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='考试参与表';
```

#### 3.2.8 考试记录表 (exam_records)

```sql
CREATE TABLE `exam_records` (
  `id` INT PRIMARY KEY AUTO_INCREMENT COMMENT '记录ID',
  `exam_id` INT NOT NULL COMMENT '考试ID',
  `student_id` INT NOT NULL COMMENT '学生ID',
  `start_time` DATETIME COMMENT '开始时间',
  `end_time` DATETIME COMMENT '结束时间',
  `status` ENUM('not_started', 'in_progress', 'submitted', 'graded') DEFAULT 'not_started' COMMENT '状态：not_started-未开始, in_progress-答题中, submitted-已提交, graded-已批阅',
  `duration_used` INT COMMENT '已用时长（分钟）',
  `score` DECIMAL(5,2) COMMENT '总分',
  `objective_score` DECIMAL(5,2) COMMENT '客观题得分',
  `subjective_score` DECIMAL(5,2) DEFAULT 0.00 COMMENT '主观题得分',
  `pass_status` ENUM('passed', 'failed') COMMENT '是否及格',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  FOREIGN KEY (`exam_id`) REFERENCES `exams`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `uk_exam_student` (`exam_id`, `student_id`),
  INDEX `idx_exam_id` (`exam_id`),
  INDEX `idx_student_id` (`student_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='考试记录表';
```

#### 3.2.9 答题记录表 (answer_records)

```sql
CREATE TABLE `answer_records` (
  `id` INT PRIMARY KEY AUTO_INCREMENT COMMENT '记录ID',
  `record_id` INT NOT NULL COMMENT '考试记录ID',
  `question_id` INT NOT NULL COMMENT '试题ID',
  `answer` TEXT COMMENT '学生答案',
  `is_correct` TINYINT(1) COMMENT '是否正确：0-错误, 1-正确',
  `score` DECIMAL(5,2) COMMENT '得分',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  FOREIGN KEY (`record_id`) REFERENCES `exam_records`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON DELETE CASCADE,
  INDEX `idx_record_id` (`record_id`),
  INDEX `idx_question_id` (`question_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='答题记录表';
```

#### 3.2.10 成绩表 (scores)

```sql
CREATE TABLE `scores` (
  `id` INT PRIMARY KEY AUTO_INCREMENT COMMENT '成绩ID',
  `record_id` INT NOT NULL COMMENT '考试记录ID',
  `student_id` INT NOT NULL COMMENT '学生ID',
  `exam_id` INT NOT NULL COMMENT '考试ID',
  `total_score` DECIMAL(5,2) NOT NULL COMMENT '总分',
  `objective_score` DECIMAL(5,2) NOT NULL COMMENT '客观题得分',
  `subjective_score` DECIMAL(5,2) DEFAULT 0.00 COMMENT '主观题得分',
  `pass_status` ENUM('passed', 'failed') NOT NULL COMMENT '是否及格',
  `reviewed_by` INT COMMENT '阅卷人ID',
  `reviewed_at` DATETIME COMMENT '阅卷时间',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  FOREIGN KEY (`record_id`) REFERENCES `exam_records`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`exam_id`) REFERENCES `exams`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`reviewed_by`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  UNIQUE KEY `uk_record_id` (`record_id`),
  INDEX `idx_exam_id` (`exam_id`),
  INDEX `idx_student_id` (`student_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='成绩表';
```

### 3.3 数据库初始化SQL

```sql
-- 创建数据库
CREATE DATABASE IF NOT EXISTS `online_exam_db`
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

-- 使用数据库
USE `online_exam_db`;

-- 初始化管理员账户
INSERT INTO `users` (`username`, `password`, `role`, `name`, `email`, `phone`) VALUES
  ('admin', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', '系统管理员', 'admin@example.com', '13800138000'),
  ('teacher1', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'teacher', '张老师', 'teacher@example.com', '13800138001'),
  ('student1', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student', '李明', 'student@example.com', '13800138002');

-- 初始密码为：123456（实际应用中应修改）
```

## 4. 核心类/接口定义

### 4.1 数据模型类

**User Model**
```javascript
class User {
  constructor(data) {
    this.id = data.id;
    this.username = data.username;
    this.password = data.password;
    this.role = data.role; // 'admin' | 'teacher' | 'student'
    this.name = data.name;
    this.email = data.email;
    this.phone = data.phone;
    this.avatar = data.avatar;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
  }
}
```

**Question Model**
```javascript
class Question {
  constructor(data) {
    this.id = data.id;
    this.courseId = data.course_id;
    this.type = data.type; // 'single' | 'multiple' | 'true_false' | 'fill' | 'short_answer'
    this.content = data.content;
    this.options = data.options ? JSON.parse(data.options) : null;
    this.answer = data.answer;
    this.difficulty = data.difficulty; // 'easy' | 'medium' | 'hard'
    this.explanation = data.explanation;
    this.createdBy = data.created_by;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
  }
}
```

**ExamRecord Model**
```javascript
class ExamRecord {
  constructor(data) {
    this.id = data.id;
    this.examId = data.exam_id;
    this.studentId = data.student_id;
    this.startTime = data.start_time;
    this.endTime = data.end_time;
    this.status = data.status; // 'not_started' | 'in_progress' | 'submitted' | 'graded'
    this.durationUsed = data.duration_used;
    this.score = data.score;
    this.objectiveScore = data.objective_score;
    this.subjectiveScore = data.subjective_score;
    this.passStatus = data.pass_status;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
  }
}
```

### 4.2 核心接口定义

**AuthController**
```javascript
// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  // 验证用户
  const user = await userService.findByUsername(username);
  if (!user) {
    return res.status(401).json({ error: '用户不存在' });
  }
  // 验证密码
  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    return res.status(401).json({ error: '密码错误' });
  }
  // 生成JWT Token
  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '2h' }
  );
  res.json({ token, user: { id: user.id, username: user.username, role: user.role, name: user.name } });
});
```

**QuestionController**
```javascript
// GET /api/questions
router.get('/', async (req, res) => {
  const { page = 1, limit = 10, courseId, type, difficulty } = req.query;
  const result = await questionService.getQuestions({ page, limit, courseId, type, difficulty });
  res.json(result);
});

// POST /api/questions
router.post('/', async (req, res) => {
  const questionData = req.body;
  const question = await questionService.createQuestion(questionData);
  res.status(201).json(question);
});
```

## 5. 详细流程图

### 5.1 自动评分流程（时序图）

```
┌─────────┐     ┌──────────┐     ┌───────────┐     ┌──────────┐
|  Client |     |  Server  |     |  Service  |     |  MySQL   |
└────┬────┘     └────┬─────┘     └─────┬─────┘     └────┬─────┘
     │               │                 │                │
     │  提交答案       │                 │                │
     │──────────────>│                 │                │
     │               │                 │                │
     │               │  解析答题数据     │                │
     │               │────────────────>│                │
     │               │                 │                │
     │               │                 │  查询试题       │
     │               │                 │───────────────>│
     │               │                 │                │
     │               │                 │  返回试题       │
     │               │                 │<───────────────│
     │               │                 │                │
     │               │                 │  自动评分       │
     │               │                 │  (客观题)       │
     │               │                 │                │
     │               │                 │  保存成绩       │
     │               │                 │───────────────>│
     │               │                 │                │
     │  返回成绩       │                 │                │
     │<──────────────│                 │                │
     │               │                 │                │
```

### 5.2 限时考试流程（活动图）

```
开始
  │
  ▼
学生进入考试
  │
  ▼
系统创建考试记录
  │
  ▼
开始倒计时（duration分钟）
  │
  ├──────────────────┐
  ▼                  ▼
加载试题         定时保存答题进度
  │                  │
  ▼                  ▼
学生答题          每30秒自动保存
  │                  │
  ▼                  ▼
标记题目状态       倒计时结束？
（已完成/当前/未完成）  │
  │              是  │     否
  ▼<─────────────────┘
点击提交或自动提交
  │
  ▼
系统自动评分（客观题）
  │
  ▼
保存成绩
  │
  ▼
显示成绩（客观题部分）
  │
  ▼
结束
```

## 6. 错误处理和边界情况

### 6.1 常见错误场景

| 错误场景 | 错误码 | 错误信息 | 处理方式 |
|---------|--------|---------|---------|
| 用户不存在 | 40101 | '用户不存在' | 提示用户检查用户名 |
| 密码错误 | 40102 | '密码错误' | 提示用户重新输入 |
| Token过期 | 40103 | 'Token已过期' | 提示重新登录 |
| 权限不足 | 40301 | '权限不足' | 提示用户无权限访问 |
| 试题不存在 | 40401 | '试题不存在' | 返回404页面 |
| 试卷不存在 | 40402 | '试卷不存在' | 返回404页面 |
| 考试已结束 | 40001 | '考试已结束' | 禁止进入考试 |
| 重复提交 | 40002 | '已提交过试卷' | 禁止重复提交 |

### 6.2 数据库约束

- **外键约束**：删除用户时级联删除相关数据
- **唯一约束**：考试记录中，每个学生每场考试只能有一条记录
- **非空约束**：必填字段不能为空
- **枚举约束**：角色、题型、状态等字段使用枚举值

## 7. 性能和资源预估

### 7.1 数据库性能优化

**索引策略：**
- 用户表：`username`（登录查询）、`role`（角色筛选）
- 试题表：`course_id`（课程筛选）、`type`（题型筛选）、`difficulty`（难度筛选）
- 考试表：`paper_id`（试卷关联）、`status`（状态筛选）、`start_time`（时间范围查询）
- 答题记录表：`record_id`（考试记录关联）

**查询优化：**
- 列表查询使用分页，避免大数据量查询
- 使用JOIN查询替代多次查询
- 合理使用索引，避免全表扫描

### 7.2 资源预估

**存储空间：**
- 用户表：1000条 × 1KB ≈ 1MB
- 试题表：10000条 × 5KB ≈ 50MB
- 试卷表：1000条 × 2KB ≈ 2MB
- 考试记录表：5000条 × 3KB ≈ 15MB
- 答题记录表：500000条 × 1KB ≈ 500MB
- **总计：约550MB**

**并发量：**
- 支持100人以下并发考试
- 常规操作响应时间 < 2秒
- 考试提交响应时间 < 5秒

## 8. 测试要点

### 8.1 单元测试

- 用户认证逻辑测试
- 自动评分逻辑测试（5种题型）
- 权限控制测试
- 数据库CRUD操作测试

### 8.2 集成测试

- 登录 → 创建考试 → 参加考试 → 提交 → 阅卷 → 查看成绩
- 题库管理 → 组卷 → 发布考试
- 批量导入试题

### 8.3 性能测试

- 100人同时在线考试的并发测试
- 大数据量（10000道试题）查询性能测试
- 自动评分性能测试

---

**文档版本**：v1.0  
**创建日期**：2026-09-30  
**最后更新**：2026-09-30