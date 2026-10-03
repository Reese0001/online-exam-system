/**
 * 基础工具单元测试
 * 覆盖 response、validator、excelHelper 工具函数
 */
const response = require('../src/utils/response');
const excelHelper = require('../src/utils/excelHelper');

// ============================================================
// response 工具测试
// ============================================================
describe('utils/response', () => {
  describe('parsePage', () => {
    it('应使用默认值当未传参时', () => {
      const r = response.parsePage({});
      expect(r.page).toBe(1);
      expect(r.pageSize).toBe(10);
      expect(r.offset).toBe(0);
      expect(r.limit).toBe(10);
    });

    it('应正确解析合法分页参数', () => {
      const r = response.parsePage({ page: '3', pageSize: '20' });
      expect(r.page).toBe(3);
      expect(r.pageSize).toBe(20);
      expect(r.offset).toBe(40);
      expect(r.limit).toBe(20);
    });

    it('应限制 pageSize 最大 100', () => {
      const r = response.parsePage({ pageSize: '500' });
      expect(r.pageSize).toBe(100);
    });

    it('应保证 page 最小为 1', () => {
      const r = response.parsePage({ page: '-5' });
      expect(r.page).toBe(1);
    });
  });

  describe('pageData', () => {
    it('应构建分页响应结构', () => {
      const d = response.pageData([1, 2, 3], 100, 1, 10);
      expect(d).toEqual({ list: [1, 2, 3], total: 100, page: 1, pageSize: 10 });
    });
  });

  describe('success / fail', () => {
    it('success 应返回 200 业务码', () => {
      const res = { json: jest.fn() };
      response.success(res, { a: 1 }, 'ok');
      expect(res.json).toHaveBeenCalledWith({ code: 200, message: 'ok', data: { a: 1 } });
    });

    it('fail 应映射 HTTP 状态码', () => {
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      response.fail(res, 1001, '用户名或密码错误');
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ code: 1001, message: '用户名或密码错误', data: null });
    });
  });
});

// ============================================================
// excelHelper 工具测试
// ============================================================
describe('utils/excelHelper', () => {
  describe('TYPE_LABEL / LABEL_TYPE', () => {
    it('题型映射应正确', () => {
      expect(excelHelper.TYPE_LABEL.single).toBe('单选题');
      expect(excelHelper.TYPE_LABEL.multiple).toBe('多选题');
      expect(excelHelper.TYPE_LABEL.judge).toBe('判断题');
      expect(excelHelper.TYPE_LABEL.fill).toBe('填空题');
      expect(excelHelper.TYPE_LABEL.short).toBe('简答题');
      expect(excelHelper.LABEL_TYPE['单选题']).toBe('single');
    });
  });

  describe('validateQuestionRow', () => {
    it('合法题目应返回 null', () => {
      const err = excelHelper.validateQuestionRow({
        type: 'single',
        content: '题干',
        options: [{ label: 'A', text: '选项A' }],
        answer: 'A',
        score: 2,
        difficulty: 3,
      });
      expect(err).toBeNull();
    });

    it('题型缺失应报错', () => {
      const err = excelHelper.validateQuestionRow({ type: '', content: 'x', answer: 'A' });
      expect(err).toBe('题型不能为空或非法');
    });

    it('选择题无选项应报错', () => {
      const err = excelHelper.validateQuestionRow({
        type: 'single',
        content: 'x',
        options: null,
        answer: 'A',
        score: 2,
        difficulty: 3,
      });
      expect(err).toBe('选择题必须提供选项');
    });
  });
});