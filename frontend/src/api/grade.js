import request from './request';

/**
 * 阅卷 API（教师）
 * 对应 api-contract.yaml: /api/grade-tasks/*、/api/exams/:id/auto-grade、grade-progress
 */

// 阅卷任务列表
export const getGradeTaskList = (params) =>
  request.get('/grade-tasks', { params });

// 阅卷任务详情（含待阅卷学生答卷）
export const getGradeTaskDetail = (id) =>
  request.get(`/grade-tasks/${id}`);

// 手动评分（对主观题逐题评分）
export const manualGrade = (id, data) =>
  request.post(`/grade-tasks/${id}/grade`, data);

// 触发客观题自动阅卷
export const autoGrade = (examId) =>
  request.post(`/exams/${examId}/auto-grade`);

// 阅卷进度查看
export const getGradeProgress = (examId) =>
  request.get(`/exams/${examId}/grade-progress`);