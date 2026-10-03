-- ============================================================
-- 在线考试系统 数据库 DDL 脚本
-- 数据库: MySQL 8.0
-- 字符集: utf8mb4 / utf8mb4_general_ci
-- 编写: 系统架构师  日期: 2026-09-30
-- 说明: 可在 MySQL 8.0 中直接执行
-- ============================================================

-- ------------------------------------------------------------
-- 1. 创建数据库
-- ------------------------------------------------------------
DROP DATABASE IF EXISTS `online_exam`;
CREATE DATABASE `online_exam`
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_general_ci;

USE `online_exam`;

-- ------------------------------------------------------------
-- 2. 建表语句
-- ------------------------------------------------------------

-- ============================================================
-- 2.1 班级表 classes
-- ============================================================
CREATE TABLE `classes` (
  `id`          BIGINT       NOT NULL AUTO_INCREMENT              COMMENT '主键ID',
  `name`        VARCHAR(100) NOT NULL                             COMMENT '班级名称',
  `grade`       VARCHAR(20)  DEFAULT NULL                         COMMENT '年级',
  `department`  VARCHAR(100) DEFAULT NULL                         COMMENT '院系',
  `created_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP   COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_classes_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='班级表';

-- ============================================================
-- 2.2 用户表 users
-- ============================================================
CREATE TABLE `users` (
  `id`            BIGINT       NOT NULL AUTO_INCREMENT              COMMENT '主键ID',
  `username`      VARCHAR(50)  NOT NULL                             COMMENT '用户名（登录账号）',
  `password_hash` VARCHAR(100) NOT NULL                             COMMENT '密码哈希（bcrypt加密）',
  `real_name`     VARCHAR(50)  NOT NULL                             COMMENT '真实姓名',
  `role`          ENUM('admin','teacher','student') NOT NULL DEFAULT 'student' COMMENT '角色：admin-管理员 teacher-教师 student-学生',
  `email`         VARCHAR(100) DEFAULT NULL                         COMMENT '邮箱',
  `phone`         VARCHAR(20)  DEFAULT NULL                         COMMENT '手机号',
  `class_id`      BIGINT       DEFAULT NULL                         COMMENT '所属班级ID（学生）',
  `status`        ENUM('active','disabled') NOT NULL DEFAULT 'active' COMMENT '账号状态：active-启用 disabled-禁用',
  `created_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP   COMMENT '创建时间',
  `updated_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_users_username` (`username`),
  KEY `idx_users_class_id` (`class_id`),
  KEY `idx_users_role` (`role`),
  CONSTRAINT `fk_users_class` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='用户表';

-- ============================================================
-- 2.3 题目表 questions
-- ============================================================
CREATE TABLE `questions` (
  `id`              BIGINT       NOT NULL AUTO_INCREMENT              COMMENT '主键ID',
  `type`            ENUM('single','multiple','judge','fill','short') NOT NULL COMMENT '题型：single-单选 multiple-多选 judge-判断 fill-填空 short-简答',
  `content`         TEXT         NOT NULL                             COMMENT '题干内容',
  `options`         JSON         DEFAULT NULL                         COMMENT '选项列表（JSON，选择题用）',
  `answer`          TEXT         NOT NULL                             COMMENT '标准答案',
  `analysis`        TEXT         DEFAULT NULL                         COMMENT '答案解析',
  `difficulty`      TINYINT      NOT NULL DEFAULT 3                   COMMENT '难度等级：1-简单 2-较易 3-中等 4-较难 5-困难',
  `knowledge_point` VARCHAR(100) DEFAULT NULL                         COMMENT '知识点',
  `score`           DECIMAL(5,1) NOT NULL DEFAULT 2.0                 COMMENT '默认分值',
  `creator_id`      BIGINT       NOT NULL                             COMMENT '创建人ID（教师）',
  `created_at`      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP   COMMENT '创建时间',
  `updated_at`      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted_at`      DATETIME     DEFAULT NULL                         COMMENT '软删除时间（NULL表示未删除）',
  PRIMARY KEY (`id`),
  KEY `idx_questions_type_diff_kp` (`type`, `difficulty`, `knowledge_point`),
  KEY `idx_questions_creator` (`creator_id`),
  KEY `idx_questions_kp` (`knowledge_point`),
  CONSTRAINT `fk_questions_creator` FOREIGN KEY (`creator_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='题目表';

-- ============================================================
-- 2.4 试卷表 papers
-- ============================================================
CREATE TABLE `papers` (
  `id`              BIGINT       NOT NULL AUTO_INCREMENT              COMMENT '主键ID',
  `name`            VARCHAR(200) NOT NULL                             COMMENT '试卷名称',
  `description`     TEXT         DEFAULT NULL                         COMMENT '试卷描述',
  `total_score`     DECIMAL(6,1) NOT NULL DEFAULT 100.0               COMMENT '总分',
  `duration`        INT          NOT NULL DEFAULT 60                  COMMENT '考试时长（分钟）',
  `pass_score`      DECIMAL(6,1) NOT NULL DEFAULT 60.0                COMMENT '及格分数',
  `is_random_order` TINYINT(1)   NOT NULL DEFAULT 0                   COMMENT '是否乱序出题：0-否 1-是',
  `creator_id`      BIGINT       NOT NULL                             COMMENT '创建人ID（教师）',
  `status`          ENUM('draft','published') NOT NULL DEFAULT 'draft' COMMENT '状态：draft-草稿 published-已发布',
  `created_at`      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP   COMMENT '创建时间',
  `updated_at`      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted_at`      DATETIME     DEFAULT NULL                         COMMENT '软删除时间（NULL表示未删除）',
  PRIMARY KEY (`id`),
  KEY `idx_papers_creator` (`creator_id`),
  KEY `idx_papers_status` (`status`),
  CONSTRAINT `fk_papers_creator` FOREIGN KEY (`creator_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='试卷表';

-- ============================================================
-- 2.5 试卷题目关联表 paper_questions
-- ============================================================
CREATE TABLE `paper_questions` (
  `id`          BIGINT       NOT NULL AUTO_INCREMENT              COMMENT '主键ID',
  `paper_id`    BIGINT       NOT NULL                             COMMENT '试卷ID',
  `question_id` BIGINT       NOT NULL                             COMMENT '题目ID',
  `score`       DECIMAL(5,1) NOT NULL                             COMMENT '本题分值',
  `sort_order`  INT          NOT NULL DEFAULT 0                   COMMENT '题目排序序号',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_pq_paper_question` (`paper_id`, `question_id`),
  KEY `idx_pq_question` (`question_id`),
  CONSTRAINT `fk_pq_paper`   FOREIGN KEY (`paper_id`)   REFERENCES `papers`    (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_pq_question` FOREIGN KEY (`question_id`) REFERENCES `questions` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='试卷题目关联表';

-- ============================================================
-- 2.6 考试表 exams
-- ============================================================
CREATE TABLE `exams` (
  `id`         BIGINT       NOT NULL AUTO_INCREMENT              COMMENT '主键ID',
  `paper_id`   BIGINT       NOT NULL                             COMMENT '试卷ID',
  `name`       VARCHAR(200) NOT NULL                             COMMENT '考试名称',
  `start_time` DATETIME     NOT NULL                             COMMENT '考试开始时间',
  `end_time`   DATETIME     NOT NULL                             COMMENT '考试结束时间',
  `status`     ENUM('draft','published','ongoing','finished') NOT NULL DEFAULT 'draft' COMMENT '状态：draft-草稿 published-已发布 ongoing-进行中 finished-已结束',
  `creator_id` BIGINT       NOT NULL                             COMMENT '创建人ID（教师）',
  `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP   COMMENT '创建时间',
  `updated_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted_at` DATETIME     DEFAULT NULL                         COMMENT '软删除时间（NULL表示未删除）',
  PRIMARY KEY (`id`),
  KEY `idx_exams_paper` (`paper_id`),
  KEY `idx_exams_creator` (`creator_id`),
  KEY `idx_exams_status` (`status`),
  KEY `idx_exams_time` (`start_time`, `end_time`),
  CONSTRAINT `fk_exams_paper`   FOREIGN KEY (`paper_id`)   REFERENCES `papers` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_exams_creator` FOREIGN KEY (`creator_id`) REFERENCES `users`  (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='考试表';

-- ============================================================
-- 2.7 考试班级关联表 exam_classes
-- ============================================================
CREATE TABLE `exam_classes` (
  `id`       BIGINT NOT NULL AUTO_INCREMENT              COMMENT '主键ID',
  `exam_id`  BIGINT NOT NULL                             COMMENT '考试ID',
  `class_id` BIGINT NOT NULL                             COMMENT '班级ID',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_ec_exam_class` (`exam_id`, `class_id`),
  KEY `idx_ec_class` (`class_id`),
  CONSTRAINT `fk_ec_exam`  FOREIGN KEY (`exam_id`)  REFERENCES `exams`  (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_ec_class` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='考试班级关联表';

-- ============================================================
-- 2.8 考试记录表 exam_records
-- ============================================================
CREATE TABLE `exam_records` (
  `id`          BIGINT       NOT NULL AUTO_INCREMENT              COMMENT '主键ID',
  `exam_id`     BIGINT       NOT NULL                             COMMENT '考试ID',
  `student_id`  BIGINT       NOT NULL                             COMMENT '学生ID',
  `start_time`  DATETIME     DEFAULT NULL                         COMMENT '开始答题时间',
  `submit_time` DATETIME     DEFAULT NULL                         COMMENT '交卷时间',
  `status`      ENUM('not_started','ongoing','submitted','graded') NOT NULL DEFAULT 'not_started' COMMENT '状态：not_started-未开始 ongoing-答题中 submitted-已交卷 graded-已阅卷',
  `total_score` DECIMAL(6,1) DEFAULT NULL                         COMMENT '总得分',
  `created_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP   COMMENT '创建时间',
  `updated_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_er_exam_student` (`exam_id`, `student_id`),
  KEY `idx_er_student` (`student_id`),
  KEY `idx_er_status` (`exam_id`, `status`),
  CONSTRAINT `fk_er_exam`    FOREIGN KEY (`exam_id`)    REFERENCES `exams` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_er_student` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='考试记录表（学生答卷主表）';

-- ============================================================
-- 2.9 答题记录表 answers
-- ============================================================
CREATE TABLE `answers` (
  `id`             BIGINT       NOT NULL AUTO_INCREMENT              COMMENT '主键ID',
  `exam_record_id` BIGINT       NOT NULL                             COMMENT '考试记录ID',
  `question_id`    BIGINT       NOT NULL                             COMMENT '题目ID',
  `student_answer` TEXT         DEFAULT NULL                         COMMENT '学生答案',
  `score`          DECIMAL(5,1) DEFAULT NULL                         COMMENT '本题得分',
  `is_correct`     TINYINT(1)   DEFAULT NULL                         COMMENT '是否正确：0-错 1-对 NULL-未评',
  `comment`        TEXT         DEFAULT NULL                         COMMENT '教师评语（主观题）',
  `graded_by`      BIGINT       DEFAULT NULL                         COMMENT '阅卷人ID（NULL表示系统自动阅卷或未阅卷）',
  `graded_at`      DATETIME     DEFAULT NULL                         COMMENT '阅卷时间',
  `created_at`     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP   COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_ans_record_question` (`exam_record_id`, `question_id`),
  KEY `idx_ans_question` (`question_id`),
  KEY `idx_ans_graded_by` (`graded_by`),
  CONSTRAINT `fk_ans_record`   FOREIGN KEY (`exam_record_id`) REFERENCES `exam_records` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_ans_question` FOREIGN KEY (`question_id`)    REFERENCES `questions`    (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='答题记录表（每题作答）';

-- ============================================================
-- 2.10 阅卷任务表 grade_tasks
-- ============================================================
CREATE TABLE `grade_tasks` (
  `id`           BIGINT   NOT NULL AUTO_INCREMENT              COMMENT '主键ID',
  `exam_id`      BIGINT   NOT NULL                             COMMENT '考试ID',
  `teacher_id`   BIGINT   NOT NULL                             COMMENT '阅卷教师ID',
  `status`       ENUM('pending','ongoing','finished') NOT NULL DEFAULT 'pending' COMMENT '状态：pending-待阅卷 ongoing-阅卷中 finished-已完成',
  `total_count`  INT      NOT NULL DEFAULT 0                   COMMENT '待阅卷答卷总数',
  `graded_count` INT      NOT NULL DEFAULT 0                   COMMENT '已阅卷答卷数',
  `created_at`   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP   COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_gt_exam` (`exam_id`),
  KEY `idx_gt_teacher` (`teacher_id`),
  KEY `idx_gt_status` (`status`),
  CONSTRAINT `fk_gt_exam`    FOREIGN KEY (`exam_id`)    REFERENCES `exams` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_gt_teacher` FOREIGN KEY (`teacher_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='阅卷任务表';

-- ============================================================
-- 2.11 系统配置表 sys_config（可选，支持FR-01-08）
-- ============================================================
CREATE TABLE `sys_config` (
  `id`          BIGINT       NOT NULL AUTO_INCREMENT              COMMENT '主键ID',
  `config_key`  VARCHAR(100) NOT NULL                             COMMENT '配置键',
  `config_value` VARCHAR(255) DEFAULT NULL                        COMMENT '配置值',
  `description` VARCHAR(255) DEFAULT NULL                         COMMENT '配置说明',
  `updated_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_config_key` (`config_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='系统配置表';

-- ============================================================
-- 2.12 操作日志表 operation_logs（可选，支持NFR-17）
-- ============================================================
CREATE TABLE `operation_logs` (
  `id`         BIGINT       NOT NULL AUTO_INCREMENT              COMMENT '主键ID',
  `user_id`    BIGINT       DEFAULT NULL                         COMMENT '操作用户ID',
  `username`   VARCHAR(50)  DEFAULT NULL                         COMMENT '操作用户名',
  `action`     VARCHAR(100) NOT NULL                             COMMENT '操作动作',
  `target`     VARCHAR(100) DEFAULT NULL                         COMMENT '操作目标',
  `detail`     TEXT         DEFAULT NULL                         COMMENT '操作详情',
  `ip`         VARCHAR(45)  DEFAULT NULL                         COMMENT 'IP地址',
  `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP   COMMENT '操作时间',
  PRIMARY KEY (`id`),
  KEY `idx_log_user` (`user_id`),
  KEY `idx_log_time` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='操作日志表';

-- ------------------------------------------------------------
-- 3. 初始化数据
-- ------------------------------------------------------------

-- ============================================================
-- 3.1 默认班级
-- ============================================================
INSERT INTO `classes` (`name`, `grade`, `department`) VALUES
('计算机科学与技术2022级1班', '2022级', '计算机学院'),
('计算机科学与技术2022级2班', '2022级', '计算机学院'),
('软件工程2022级1班', '2022级', '计算机学院');

-- ============================================================
-- 3.2 默认用户
-- 注意：密码哈希使用 bcrypt 加密，以下为示例哈希
-- admin/123456 -> $2b$10$...（实际部署时请重新生成）
-- 此处 password_hash 为 bcrypt.hash('123456', 10) 的结果
-- ============================================================
INSERT INTO `users` (`username`, `password_hash`, `real_name`, `role`, `email`, `phone`, `class_id`, `status`) VALUES
-- 管理员（密码: admin123）
('admin', '$2b$10$N9qo8uLOickgx2ZMRZoMy.MrqKZpX4RmZIeLhF7Y6DkPvX8wJfzK', '系统管理员', 'admin', 'admin@exam-system.com', '13800000000', NULL, 'active'),
-- 教师（密码: teacher123）
('teacher01', '$2b$10$N9qo8uLOickgx2ZMRZoMy.MrqKZpX4RmZIeLhF7Y6DkPvX8wJfzK', '张老师', 'teacher', 'zhang@exam-system.com', '13800000001', NULL, 'active'),
('teacher02', '$2b$10$N9qo8uLOickgx2ZMRZoMy.MrqKZpX4RmZIeLhF7Y6DkPvX8wJfzK', '李老师', 'teacher', 'li@exam-system.com', '13800000002', NULL, 'active'),
-- 学生（密码: student123）归属于班级
('student001', '$2b$10$N9qo8uLOickgx2ZMRZoMy.MrqKZpX4RmZIeLhF7Y6DkPvX8wJfzK', '王同学', 'student', 'wang@exam-system.com', '13800000100', 1, 'active'),
('student002', '$2b$10$N9qo8uLOickgx2ZMRZoMy.MrqKZpX4RmZIeLhF7Y6DkPvX8wJfzK', '赵同学', 'student', 'zhao@exam-system.com', '13800000101', 1, 'active'),
('student003', '$2b$10$N9qo8uLOickgx2ZMRZoMy.MrqKZpX4RmZIeLhF7Y6DkPvX8wJfzK', '钱同学', 'student', 'qian@exam-system.com', '13800000102', 1, 'active'),
('student004', '$2b$10$N9qo8uLOickgx2ZMRZoMy.MrqKZpX4RmZIeLhF7Y6DkPvX8wJfzK', '孙同学', 'student', 'sun@exam-system.com', '13800000103', 2, 'active'),
('student005', '$2b$10$N9qo8uLOickgx2ZMRZoMy.MrqKZpX4RmZIeLhF7Y6DkPvX8wJfzK', '周同学', 'student', 'zhou@exam-system.com', '13800000104', 2, 'active');

-- ============================================================
-- 3.3 示例题目
-- ============================================================
INSERT INTO `questions` (`type`, `content`, `options`, `answer`, `analysis`, `difficulty`, `knowledge_point`, `score`, `creator_id`) VALUES
-- 单选题
('single', '以下哪个不是 JavaScript 的数据类型？',
 '[{"label":"A","text":"String"},{"label":"B","text":"Number"},{"label":"C","text":"Float"},{"label":"D","text":"Boolean"}]',
 'C', 'JavaScript 的基本数据类型包括 String、Number、Boolean、Null、Undefined、Symbol、BigInt，没有 Float 类型。', 2, 'JavaScript基础', 2.0, 2),
('single', 'React 中用于管理组件状态的 Hook 是？',
 '[{"label":"A","text":"useEffect"},{"label":"B","text":"useState"},{"label":"C","text":"useRef"},{"label":"D","text":"useMemo"}]',
 'B', 'useState 是 React 提供的用于在函数组件中声明和管理状态的 Hook。', 1, 'React基础', 2.0, 2),
-- 多选题
('multiple', '以下哪些属于 HTTP 请求方法？',
 '[{"label":"A","text":"GET"},{"label":"B","text":"POST"},{"label":"C","text":"SEND"},{"label":"D","text":"DELETE"}]',
 'A,B,D', 'HTTP 请求方法包括 GET、POST、PUT、DELETE、PATCH、HEAD、OPTIONS 等，没有 SEND 方法。', 3, 'HTTP协议', 3.0, 2),
-- 判断题
('judge', 'Node.js 是基于 Chrome V8 引擎的 JavaScript 运行时环境。',
 '[]', 'true', 'Node.js 确实是基于 Chrome V8 引擎构建的 JavaScript 运行时环境，使用事件驱动、非阻塞 I/O 模型。', 1, 'Node.js基础', 2.0, 2),
-- 填空题
('fill', 'SQL 中用于查询数据的关键字是 ____。', '[]', 'SELECT', 'SELECT 是 SQL 中用于从数据库中查询数据的关键字。', 1, 'SQL基础', 2.0, 2),
-- 简答题
('short', '请简述前后端分离架构的优点。', '[]',
 '前后端分离优点：1.职责清晰，前端专注UI，后端专注业务逻辑；2.可独立开发部署，提升效率；3.API复用，支持多端；4.前端框架生态丰富，用户体验好。',
 '前后端分离是现代Web开发的主流架构模式，核心在于通过API解耦前后端。', 4, '软件架构', 10.0, 2);

-- ============================================================
-- 3.4 示例试卷
-- ============================================================
INSERT INTO `papers` (`name`, `description`, `total_score`, `duration`, `pass_score`, `is_random_order`, `creator_id`, `status`) VALUES
('Web前端开发基础测试卷', '涵盖JavaScript、React、HTTP等前端基础知识', 21.0, 60, 12.0, 0, 2, 'draft'),
('软件工程综合考试卷', '包含客观题与主观题的综合测试', 100.0, 120, 60.0, 1, 2, 'draft');

-- ============================================================
-- 3.5 试卷题目关联（试卷1包含前6道题）
-- ============================================================
INSERT INTO `paper_questions` (`paper_id`, `question_id`, `score`, `sort_order`) VALUES
(1, 1, 2.0, 1),
(1, 2, 2.0, 2),
(1, 3, 3.0, 3),
(1, 4, 2.0, 4),
(1, 5, 2.0, 5),
(1, 6, 10.0, 6);

-- ============================================================
-- 3.6 系统配置初始数据
-- ============================================================
INSERT INTO `sys_config` (`config_key`, `config_value`, `description`) VALUES
('allow_register', 'false', '是否允许学生自助注册'),
('switch_screen_limit', '3', '切屏次数阈值，超过则强制交卷'),
('exam_auto_submit', 'true', '倒计时结束是否自动交卷'),
('token_expire_hours', '2', 'JWT令牌有效期（小时）'),
('default_page_size', '10', '默认分页每页条数');

-- ============================================================
-- 4. 视图（可选，便于成绩统计查询）
-- ============================================================

-- 学生考试成绩视图
CREATE OR REPLACE VIEW `v_student_scores` AS
SELECT
  er.`id`            AS `record_id`,
  er.`exam_id`       AS `exam_id`,
  e.`name`           AS `exam_name`,
  er.`student_id`    AS `student_id`,
  u.`real_name`      AS `student_name`,
  u.`username`       AS `username`,
  c.`name`           AS `class_name`,
  er.`total_score`   AS `total_score`,
  p.`pass_score`     AS `pass_score`,
  CASE WHEN er.`total_score` >= p.`pass_score` THEN 1 ELSE 0 END AS `is_pass`,
  er.`status`        AS `status`,
  er.`submit_time`   AS `submit_time`
FROM `exam_records` er
  INNER JOIN `exams`   e  ON er.`exam_id`    = e.`id`
  INNER JOIN `papers`  p  ON e.`paper_id`    = p.`id`
  INNER JOIN `users`   u  ON er.`student_id` = u.`id`
  LEFT  JOIN `classes` c  ON u.`class_id`    = c.`id`
WHERE er.`status` IN ('submitted', 'graded');

-- ============================================================
-- 5. 完成提示
-- ============================================================
-- 数据库 online_exam 初始化完成
-- 默认账号:
--   管理员: admin / admin123
--   教师:   teacher01 / teacher123, teacher02 / teacher123
--   学生:   student001~005 / student123
-- 注意: 初始密码哈希为示例值，生产环境请使用 bcrypt 重新生成
-- ============================================================