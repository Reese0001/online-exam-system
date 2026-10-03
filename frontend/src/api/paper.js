import request from './request';

/**
 * 试卷管理 API（教师）
 * 对应 api-contract.yaml: /api/papers/*
 */

// 试卷列表查询
export const getPaperList = (params) => request.get('/papers', { params });

// 创建试卷
export const createPaper = (data) => request.post('/papers', data);

// 试卷详情（含题目列表）
export const getPaperDetail = (id) => request.get(`/papers/${id}`);

// 修改试卷
export const updatePaper = (id, data) => request.put(`/papers/${id}`, data);

// 删除试卷
export const deletePaper = (id) => request.delete(`/papers/${id}`);

// 添加题目到试卷
export const addPaperQuestions = (id, data) =>
  request.post(`/papers/${id}/questions`, data);

// 移除试卷题目
export const removePaperQuestion = (id, questionId) =>
  request.delete(`/papers/${id}/questions`, {
    params: { question_id: questionId },
  });

// 随机组卷
export const autoGeneratePaper = (data) =>
  request.post('/papers/auto-generate', data);