/**
 * Excel 导入导出工具
 * 基于 xlsx 库实现题目批量导入导出与成绩单导出
 */
const XLSX = require('xlsx');

/**
 * 题型中文映射
 */
const TYPE_LABEL = {
  single: '单选题',
  multiple: '多选题',
  judge: '判断题',
  fill: '填空题',
  short: '简答题',
};
const LABEL_TYPE = Object.fromEntries(
  Object.entries(TYPE_LABEL).map(([k, v]) => [v, k])
);

/**
 * 从 Buffer 解析 Excel 题目数据
 * 约定列：题型|题干|选项A|选项B|选项C|选项D|答案|分值|难度|知识点|解析
 * 多选题答案用逗号分隔，如 "A,B"
 * @param {Buffer} buffer
 * @returns {Array<{row: number, data: Object}>}
 */
function parseQuestionExcel(buffer) {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  const result = [];
  rows.forEach((row, index) => {
    const typeLabel = String(row['题型'] || '').trim();
    const type = LABEL_TYPE[typeLabel];
    const content = String(row['题干'] || '').trim();
    const answer = String(row['答案'] || '').trim();
    const score = parseFloat(row['分值']) || 2;
    const difficulty = parseInt(row['难度'], 10) || 3;
    const knowledgePoint = String(row['知识点'] || '').trim();
    const analysis = String(row['解析'] || '').trim();

    // 构建选项数组
    const options = [];
    ['A', 'B', 'C', 'D', 'E', 'F'].forEach(label => {
      const text = row[`选项${label}`];
      if (text !== undefined && String(text).trim() !== '') {
        options.push({ label, text: String(text).trim() });
      }
    });

    result.push({
      row: index + 2, // Excel 行号（含表头）
      data: {
        type,
        content,
        options: options.length ? options : null,
        answer,
        score,
        difficulty,
        knowledge_point: knowledgePoint,
        analysis,
      },
    });
  });
  return result;
}

/**
 * 校验单行题目数据
 * @returns {string|null} 错误信息，null 表示通过
 */
function validateQuestionRow(data) {
  if (!data.type) return '题型不能为空或非法';
  if (!data.content) return '题干不能为空';
  if (!data.answer) return '答案不能为空';
  if (data.difficulty < 1 || data.difficulty > 5) return '难度需为1-5';
  if (data.score < 0) return '分值需为非负数';
  if (['single', 'multiple', 'judge'].includes(data.type) && (!data.options || data.options.length === 0)) {
    return '选择题必须提供选项';
  }
  return null;
}

/**
 * 将题目列表导出为 Excel Buffer
 */
function buildQuestionExcel(questions) {
  const data = questions.map(q => ({
    '题型': TYPE_LABEL[q.type] || q.type,
    '题干': q.content,
    '选项A': q.options?.[0]?.text || '',
    '选项B': q.options?.[1]?.text || '',
    '选项C': q.options?.[2]?.text || '',
    '选项D': q.options?.[3]?.text || '',
    '答案': q.answer,
    '分值': q.score,
    '难度': q.difficulty,
    '知识点': q.knowledge_point || '',
    '解析': q.analysis || '',
  }));
  const sheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, '题目列表');
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

/**
 * 将成绩单导出为 Excel Buffer
 */
function buildScoreExcel(records, examName) {
  const data = records.map(r => ({
    '学号/用户名': r.username,
    '姓名': r.student_name,
    '班级': r.class_name || '',
    '总分': r.total_score ?? '',
    '是否及格': r.is_pass ? '是' : '否',
    '提交时间': r.submit_time || '',
  }));
  const sheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, examName || '成绩单');
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

module.exports = {
  TYPE_LABEL,
  LABEL_TYPE,
  parseQuestionExcel,
  validateQuestionRow,
  buildQuestionExcel,
  buildScoreExcel,
};