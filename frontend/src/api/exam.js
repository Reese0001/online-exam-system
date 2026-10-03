import request from './request';

/**
 * 考试管理 + 在线答题 API
 * 对应 api-contract.yaml: /api/exams/*
 */

// ===== 考试管理（教师）=====

// 考试列表查询
export const getExamList = (params) => request.get('/exams', { params });

// 创建考试
export const createExam = (data) => request.post('/exams', data);

// 考试详情
export const getExamDetail = (id) => request.get(`/exams/${id}`);

// 修改考试
export const updateExam = (id, data) => request.put(`/exams/${id}`, data);

// 删除考试
export const deleteExam = (id) => request.delete(`/exams/${id}`);

// 发布考试
export const publishExam = (id) => request.post(`/exams/${id}/publish`);

// 考试状态管理
export const updateExamStatus = (id, status) =>
  request.put(`/exams/${id}/status`, { status });

// 指定参考班级
export const setExamClasses = (id, classIds) =>
  request.post(`/exams/${id}/classes`, { class_ids: classIds });

// 查询考试参考学生列表
export const getExamStudents = (id) =>
  request.get(`/exams/${id}/students`);

// ===== 在线答题（学生）=====

// 学生考试列表
export const getStudentExamList = () => request.get('/exams/student/list');

// 进入考试（返回试卷题目 + 剩余时间）
export const startExam = (id) => request.get(`/exams/${id}/start`);

// 答案暂存
export const saveAnswer = (id, data) =>
  request.post(`/exams/${id}/answers`, data);

// 交卷
export const submitExam = (id) => request.post(`/exams/${id}/submit`);

// 查看答题记录
export const getExamRecord = (id) => request.get(`/exams/${id}/record`);