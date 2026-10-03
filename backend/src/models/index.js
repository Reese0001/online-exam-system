/**
 * 模型初始化与关联定义
 * 汇总所有 Sequelize 模型并建立关联关系
 */
const { sequelize, testConnection } = require('../config/database');

// 引入所有模型
const Class = require('./Class');
const User = require('./User');
const Question = require('./Question');
const Paper = require('./Paper');
const PaperQuestion = require('./PaperQuestion');
const Exam = require('./Exam');
const ExamClass = require('./ExamClass');
const ExamRecord = require('./ExamRecord');
const Answer = require('./Answer');
const GradeTask = require('./GradeTask');
const SysConfig = require('./SysConfig');

// ============================================================
// 关联关系定义
// ============================================================

// classes 1—N users（一个班级多名学生）
Class.hasMany(User, { foreignKey: 'class_id', as: 'students' });
User.belongsTo(Class, { foreignKey: 'class_id', as: 'class' });

// users 1—N questions（教师创建多道题目）
User.hasMany(Question, { foreignKey: 'creator_id', as: 'createdQuestions' });
Question.belongsTo(User, { foreignKey: 'creator_id', as: 'creator' });

// users 1—N papers（教师创建多份试卷）
User.hasMany(Paper, { foreignKey: 'creator_id', as: 'createdPapers' });
Paper.belongsTo(User, { foreignKey: 'creator_id', as: 'creator' });

// papers N—M questions（通过 paper_questions 关联）
Paper.belongsToMany(Question, {
  through: PaperQuestion,
  foreignKey: 'paper_id',
  otherKey: 'question_id',
  as: 'questions',
});
Question.belongsToMany(Paper, {
  through: PaperQuestion,
  foreignKey: 'question_id',
  otherKey: 'paper_id',
  as: 'papers',
});

// PaperQuestion 直接关联（便于查询分值与排序）
PaperQuestion.belongsTo(Paper, { foreignKey: 'paper_id', as: 'paper' });
PaperQuestion.belongsTo(Question, { foreignKey: 'question_id', as: 'question' });
Paper.hasMany(PaperQuestion, { foreignKey: 'paper_id', as: 'paperQuestions' });
Question.hasMany(PaperQuestion, { foreignKey: 'question_id', as: 'paperQuestions' });

// users 1—N exams（教师创建多场考试）
User.hasMany(Exam, { foreignKey: 'creator_id', as: 'createdExams' });
Exam.belongsTo(User, { foreignKey: 'creator_id', as: 'creator' });

// papers 1—N exams（一份试卷可被多场考试引用）
Paper.hasMany(Exam, { foreignKey: 'paper_id', as: 'exams' });
Exam.belongsTo(Paper, { foreignKey: 'paper_id', as: 'paper' });

// exams N—M classes（通过 exam_classes 关联）
Exam.belongsToMany(Class, {
  through: ExamClass,
  foreignKey: 'exam_id',
  otherKey: 'class_id',
  as: 'classes',
});
Class.belongsToMany(Exam, {
  through: ExamClass,
  foreignKey: 'class_id',
  otherKey: 'exam_id',
  as: 'exams',
});

// ExamClass 直接关联
ExamClass.belongsTo(Exam, { foreignKey: 'exam_id', as: 'exam' });
ExamClass.belongsTo(Class, { foreignKey: 'class_id', as: 'class' });
Exam.hasMany(ExamClass, { foreignKey: 'exam_id', as: 'examClasses' });
Class.hasMany(ExamClass, { foreignKey: 'class_id', as: 'examClasses' });

// exams 1—N exam_records（一场考试多名学生答卷）
Exam.hasMany(ExamRecord, { foreignKey: 'exam_id', as: 'examRecords' });
ExamRecord.belongsTo(Exam, { foreignKey: 'exam_id', as: 'exam' });

// users 1—N exam_records（学生多条考试记录）
User.hasMany(ExamRecord, { foreignKey: 'student_id', as: 'examRecords' });
ExamRecord.belongsTo(User, { foreignKey: 'student_id', as: 'student' });

// exam_records 1—N answers（一份答卷含多题作答）
ExamRecord.hasMany(Answer, { foreignKey: 'exam_record_id', as: 'answers' });
Answer.belongsTo(ExamRecord, { foreignKey: 'exam_record_id', as: 'examRecord' });

// questions 1—N answers（一道题目被多次作答）
Question.hasMany(Answer, { foreignKey: 'question_id', as: 'answers' });
Answer.belongsTo(Question, { foreignKey: 'question_id', as: 'question' });

// exams 1—N grade_tasks（一场考试多个阅卷任务）
Exam.hasMany(GradeTask, { foreignKey: 'exam_id', as: 'gradeTasks' });
GradeTask.belongsTo(Exam, { foreignKey: 'exam_id', as: 'exam' });

// users 1—N grade_tasks（教师多个阅卷任务）
User.hasMany(GradeTask, { foreignKey: 'teacher_id', as: 'gradeTasks' });
GradeTask.belongsTo(User, { foreignKey: 'teacher_id', as: 'teacher' });

// ============================================================
// 同步数据库（开发环境可用）
// ============================================================
async function syncDatabase(force = false) {
  await sequelize.sync({ force, alter: !force });
  console.log('✅ 数据库表同步完成');
}

module.exports = {
  sequelize,
  testConnection,
  syncDatabase,
  // 模型导出
  Class,
  User,
  Question,
  Paper,
  PaperQuestion,
  Exam,
  ExamClass,
  ExamRecord,
  Answer,
  GradeTask,
  SysConfig,
};