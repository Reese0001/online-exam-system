import dayjs from 'dayjs';
import { QUESTION_TYPE_LABELS, DIFFICULTY_LABELS, OPTION_LABELS } from './constants';

/**
 * 工具函数集合
 */

// 格式化日期时间
export const formatDateTime = (value, format = 'YYYY-MM-DD HH:mm:ss') => {
  if (!value) return '-';
  return dayjs(value).format(format);
};

// 格式化日期
export const formatDate = (value) => {
  if (!value) return '-';
  return dayjs(value).format('YYYY-MM-DD');
};

// 秒数转 mm:ss 格式（用于倒计时显示）
export const secondsToTime = (totalSeconds) => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n) => String(n).padStart(2, '0');
  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
};

// 获取题目类型中文
export const getQuestionTypeLabel = (type) => QUESTION_TYPE_LABELS[type] || type;

// 获取难度中文
export const getDifficultyLabel = (difficulty) => DIFFICULTY_LABELS[difficulty] || String(difficulty);

// 生成选项标签 A/B/C/D...
export const getOptionLabel = (index) => OPTION_LABELS[index] || String(index);

// 多选答案数组转字符串显示（['A','C'] => 'A,C'）
export const formatMultipleAnswer = (answer) => {
  if (!answer) return '';
  if (Array.isArray(answer)) return answer.join(',');
  try {
    const arr = JSON.parse(answer);
    return Array.isArray(arr) ? arr.join(',') : String(answer);
  } catch {
    return String(answer);
  }
};

// 将学生答案字符串转为数组（多选题用）
export const parseMultipleAnswer = (answer) => {
  if (!answer) return [];
  if (Array.isArray(answer)) return answer;
  try {
    const arr = JSON.parse(answer);
    if (Array.isArray(arr)) return arr;
  } catch {
    // 忽略
  }
  return String(answer).split(',').filter(Boolean);
};

// 判断答案是否为客观题（可自动阅卷）
export const isObjectiveQuestion = (type) => ['single', 'multiple', 'judge', 'fill'].includes(type);

// 判断答案是否为主观题（需手动阅卷）
export const isSubjectiveQuestion = (type) => type === 'short';

// 防抖
export const debounce = (fn, delay = 300) => {
  let timer = null;
  return (...args) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};

// 节流
export const throttle = (fn, delay = 300) => {
  let last = 0;
  return (...args) => {
    const now = Date.now();
    if (now - last >= delay) {
      last = now;
      fn(...args);
    }
  };
};

// 下载二进制文件（用于 Excel 导出）
export const downloadBlob = (data, filename, mime = 'application/octet-stream') => {
  const blob = new Blob([data], { type: mime });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

// 根据考试时间窗口计算状态
export const calcExamStatus = (startTime, endTime) => {
  const now = dayjs();
  const start = dayjs(startTime);
  const end = dayjs(endTime);
  if (now.isBefore(start)) return 'published';
  if (now.isAfter(end)) return 'finished';
  return 'ongoing';
};

// 计算剩余秒数
export const calcRemainSeconds = (endTime) => {
  const now = dayjs();
  const end = dayjs(endTime);
  const diff = end.diff(now, 'second');
  return Math.max(0, diff);
};

// 表格分页配置生成
export const getPagination = (total, current, pageSize, onChange) => ({
  current,
  pageSize,
  total,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (t) => `共 ${t} 条`,
  onChange: (page, size) => onChange(page, size),
});

// 简单深拷贝
export const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  return JSON.parse(JSON.stringify(obj));
};

// 校验手机号
export const isPhone = (value) => /^1[3-9]\d{9}$/.test(value);

// 校验邮箱
export const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);