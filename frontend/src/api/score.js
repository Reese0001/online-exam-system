import request from './request';

/**
 * 成绩统计 API
 * 对应 api-contract.yaml: /api/scores/*
 */

// 个人成绩查询（学生）
export const getPersonalScores = () =>
  request.get('/scores/personal');

// 班级成绩查看（教师）
export const getClassScores = (classId, examId) =>
  request.get(`/scores/class/${classId}`, {
    params: { exam_id: examId },
  });

// 成绩分布统计与分析指标（教师）
export const getScoreStatistics = (examId) =>
  request.get('/scores/statistics', {
    params: { exam_id: examId },
  });

// 成绩单导出（Excel）- 返回二进制流
export const exportScores = (examId, classId) =>
  request.get('/scores/export', {
    params: { exam_id: examId, class_id: classId },
    responseType: 'blob',
  });

// 错题统计（学生）
export const getWrongQuestions = (examId) =>
  request.get('/scores/wrong-questions', {
    params: { exam_id: examId },
  });