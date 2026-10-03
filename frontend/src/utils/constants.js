// 系统常量定义
// 角色枚举（与后端 RBAC 一致）
export const ROLES = {
  ADMIN: 'admin',
  TEACHER: 'teacher',
  STUDENT: 'student',
};

// 角色中文映射
export const ROLE_LABELS = {
  admin: '管理员',
  teacher: '教师',
  student: '学生',
};

// 题目类型枚举（与 API 契约 QuestionInfo.type 一致）
export const QUESTION_TYPES = {
  SINGLE: 'single', // 单选
  MULTIPLE: 'multiple', // 多选
  JUDGE: 'judge', // 判断
  FILL: 'fill', // 填空
  SHORT: 'short', // 简答
};

// 题目类型中文映射
export const QUESTION_TYPE_LABELS = {
  single: '单选题',
  multiple: '多选题',
  judge: '判断题',
  fill: '填空题',
  short: '简答题',
};

// 题目类型颜色（用于标签）
export const QUESTION_TYPE_COLORS = {
  single: 'blue',
  multiple: 'purple',
  judge: 'green',
  fill: 'orange',
  short: 'cyan',
};

// 难度等级
export const DIFFICULTY_LEVELS = [
  { value: 1, label: '简单' },
  { value: 2, label: '较简单' },
  { value: 3, label: '中等' },
  { value: 4, label: '较困难' },
  { value: 5, label: '困难' },
];

export const DIFFICULTY_LABELS = {
  1: '简单',
  2: '较简单',
  3: '中等',
  4: '较困难',
  5: '困难',
};

// 试卷状态
export const PAPER_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
};

export const PAPER_STATUS_LABELS = {
  draft: '草稿',
  published: '已发布',
};

// 考试状态
export const EXAM_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ONGOING: 'ongoing',
  FINISHED: 'finished',
};

export const EXAM_STATUS_LABELS = {
  draft: '草稿',
  published: '已发布',
  ongoing: '进行中',
  finished: '已结束',
};

export const EXAM_STATUS_COLORS = {
  draft: 'default',
  published: 'blue',
  ongoing: 'green',
  finished: 'gray',
};

// 考试记录状态（学生视角）
export const RECORD_STATUS_LABELS = {
  not_started: '未开始',
  ongoing: '答题中',
  submitted: '已交卷',
  graded: '已阅卷',
};

// 阅卷任务状态
export const GRADE_TASK_STATUS_LABELS = {
  pending: '待阅卷',
  ongoing: '阅卷中',
  finished: '已完成',
};

// 用户状态
export const USER_STATUS_LABELS = {
  active: '正常',
  disabled: '已禁用',
};

// 选项标签
export const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

// 本地存储键
export const STORAGE_KEYS = {
  TOKEN: 'exam_token',
  USER: 'exam_user',
  EXAM_DRAFT: 'exam_draft_', // 答案暂存前缀
};

// 防作弊配置
export const ANTI_CHEAT_CONFIG = {
  MAX_SWITCH_COUNT: 3, // 最大切屏次数
  WARN_SWITCH_COUNT: 1, // 警告切屏次数
  AUTO_SUBMIT_ON_EXCEED: true, // 超过限制自动交卷
};

// 分页默认值
export const DEFAULT_PAGE_SIZE = 10;

// API 统一响应 code
export const API_CODE = {
  SUCCESS: 200,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
};

// 分数段（成绩分布）
export const SCORE_RANGES = [
  { range: '0-59', label: '不及格(0-59)' },
  { range: '60-69', label: '及格(60-69)' },
  { range: '70-79', label: '中等(70-79)' },
  { range: '80-89', label: '良好(80-89)' },
  { range: '90-100', label: '优秀(90-100)' },
];