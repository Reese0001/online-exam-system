/**
 * 参数校验工具
 * 基于 express-validator 的校验规则集合
 */
const { body, query, param } = require('express-validator');

// ============================================================
// 认证模块校验
// ============================================================
const loginRules = [
  body('username').notEmpty().withMessage('用户名不能为空'),
  body('password').notEmpty().withMessage('密码不能为空'),
];

const registerRules = [
  body('username').isLength({ min: 3, max: 50 }).withMessage('用户名长度需3-50'),
  body('password').isLength({ min: 6, max: 50 }).withMessage('密码长度需6-50'),
  body('real_name').notEmpty().withMessage('真实姓名不能为空'),
  body('role').isIn(['admin', 'teacher', 'student']).withMessage('角色非法'),
  body('email').optional().isEmail().withMessage('邮箱格式不正确'),
  body('phone').optional().isMobilePhone('zh-CN').withMessage('手机号格式不正确'),
];

const changePasswordRules = [
  body('old_password').notEmpty().withMessage('旧密码不能为空'),
  body('new_password').isLength({ min: 6, max: 50 }).withMessage('新密码长度需6-50'),
];

// ============================================================
// 用户管理校验
// ============================================================
const userCreateRules = [
  body('username').isLength({ min: 3, max: 50 }).withMessage('用户名长度需3-50'),
  body('password').isLength({ min: 6, max: 50 }).withMessage('密码长度需6-50'),
  body('real_name').notEmpty().withMessage('真实姓名不能为空'),
  body('role').isIn(['admin', 'teacher', 'student']).withMessage('角色非法'),
];

const userUpdateRules = [
  body('real_name').optional().notEmpty(),
  body('role').optional().isIn(['admin', 'teacher', 'student']),
  body('status').optional().isIn(['active', 'disabled']),
];

const resetPasswordRules = [
  body('new_password').isLength({ min: 6, max: 50 }).withMessage('新密码长度需6-50'),
];

// ============================================================
// 班级管理校验
// ============================================================
const classCreateRules = [
  body('name').notEmpty().withMessage('班级名称不能为空'),
];

// ============================================================
// 题库管理校验
// ============================================================
const questionCreateRules = [
  body('type').isIn(['single', 'multiple', 'judge', 'fill', 'short']).withMessage('题型非法'),
  body('content').notEmpty().withMessage('题干不能为空'),
  body('answer').notEmpty().withMessage('答案不能为空'),
  body('difficulty').isInt({ min: 1, max: 5 }).withMessage('难度需为1-5'),
  body('score').isFloat({ min: 0 }).withMessage('分值需为非负数'),
];

// ============================================================
// 试卷管理校验
// ============================================================
const paperCreateRules = [
  body('name').notEmpty().withMessage('试卷名称不能为空'),
  body('total_score').isFloat({ min: 0 }).withMessage('总分需为非负数'),
  body('duration').isInt({ min: 1 }).withMessage('时长需为正整数'),
  body('pass_score').isFloat({ min: 0 }).withMessage('及格分需为非负数'),
];

const addPaperQuestionsRules = [
  body('questions').isArray({ min: 1 }).withMessage('题目列表不能为空'),
  body('questions.*.question_id').isInt({ min: 1 }).withMessage('题目ID非法'),
  body('questions.*.score').isFloat({ min: 0 }).withMessage('分值非法'),
  body('questions.*.sort_order').isInt({ min: 0 }).withMessage('排序序号非法'),
];

const autoGenerateRules = [
  body('name').notEmpty().withMessage('试卷名称不能为空'),
  body('duration').isInt({ min: 1 }).withMessage('时长需为正整数'),
  body('pass_score').isFloat({ min: 0 }).withMessage('及格分需为非负数'),
  body('rules').isArray({ min: 1 }).withMessage('组卷规则不能为空'),
  body('rules.*.type').isIn(['single', 'multiple', 'judge', 'fill', 'short']).withMessage('题型非法'),
  body('rules.*.count').isInt({ min: 1 }).withMessage('数量需为正整数'),
  body('rules.*.score').isFloat({ min: 0 }).withMessage('分值需为非负数'),
];

// ============================================================
// 考试管理校验
// ============================================================
const examCreateRules = [
  body('paper_id').isInt({ min: 1 }).withMessage('试卷ID非法'),
  body('name').notEmpty().withMessage('考试名称不能为空'),
  body('start_time').isISO8601().withMessage('开始时间格式不正确'),
  body('end_time').isISO8601().withMessage('结束时间格式不正确'),
];

const examStatusRules = [
  body('status').isIn(['draft', 'published', 'ongoing', 'finished']).withMessage('状态非法'),
];

const examClassesRules = [
  body('class_ids').isArray({ min: 1 }).withMessage('班级列表不能为空'),
];

// ============================================================
// 阅卷校验
// ============================================================
const gradeAnswerRules = [
  body('exam_record_id').isInt({ min: 1 }).withMessage('考试记录ID非法'),
  body('answers').isArray({ min: 1 }).withMessage('评分列表不能为空'),
  body('answers.*.answer_id').isInt({ min: 1 }).withMessage('答题记录ID非法'),
  body('answers.*.score').isFloat({ min: 0 }).withMessage('评分需为非负数'),
];

// ============================================================
// 答题校验
// ============================================================
const answerSaveRules = [
  body('question_id').isInt({ min: 1 }).withMessage('题目ID非法'),
  body('student_answer').notEmpty().withMessage('学生答案不能为空'),
];

// ============================================================
// ID 参数校验
// ============================================================
const idParamRule = [
  param('id').isInt({ min: 1 }).withMessage('ID必须为正整数'),
];

/**
 * 处理 express-validator 校验结果
 */
function handleValidationErrors(req, res, next) {
  const { validationResult } = require('express-validator');
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map(e => e.msg);
    return res.status(422).json({
      code: 422,
      message: messages[0] || '参数校验失败',
      data: { errors: errors.array() },
    });
  }
  next();
}

module.exports = {
  loginRules,
  registerRules,
  changePasswordRules,
  userCreateRules,
  userUpdateRules,
  resetPasswordRules,
  classCreateRules,
  questionCreateRules,
  paperCreateRules,
  addPaperQuestionsRules,
  autoGenerateRules,
  examCreateRules,
  examStatusRules,
  examClassesRules,
  gradeAnswerRules,
  answerSaveRules,
  idParamRule,
  handleValidationErrors,
};