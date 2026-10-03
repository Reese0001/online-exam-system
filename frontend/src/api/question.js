import request from './request';

/**
 * 题库管理 API（教师）
 * 对应 api-contract.yaml: /api/questions/*
 */

// 题目列表查询
export const getQuestionList = (params) =>
  request.get('/questions', { params });

// 新增题目
export const createQuestion = (data) => request.post('/questions', data);

// 题目详情
export const getQuestionDetail = (id) => request.get(`/questions/${id}`);

// 修改题目
export const updateQuestion = (id, data) =>
  request.put(`/questions/${id}`, data);

// 删除题目
export const deleteQuestion = (id) => request.delete(`/questions/${id}`);

// 批量导入题目（Excel）- multipart/form-data
export const importQuestions = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return request.post('/questions/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

// 批量导出题目（Excel）- 返回二进制流
export const exportQuestions = (params) =>
  request.get('/questions/export', {
    params,
    responseType: 'blob',
  });