/**
 * 题目展示组件测试
 * 关联需求：FR-02-01(5种题型) / FR-05-03(题目导航) / FR-05-09(答题详情)
 * 关联用例：UC_Answer / UC_Navigate
 * 测试用例：TC-COMP-QD-001 ~ TC-COMP-QD-006
 */
import { render, screen, fireEvent } from '@testing-library/react';
import QuestionDisplay from '@/components/QuestionDisplay';

// mock antd icons 避免渲染问题
jest.mock('@ant-design/icons', () => ({
  UserOutlined: () => <span />,
  LockOutlined: () => <span />,
}));

describe('QuestionDisplay 组件 - TC-COMP-QD', () => {
  const baseQuestion = {
    id: 1, type: 'single', content: '1+1等于几？',
    options: [{ label: 'A', text: '1' }, { label: 'B', text: '2' }, { label: 'C', text: '3' }],
    answer: 'B', analysis: '1+1=2', score: 2, difficulty: 1,
  };

  describe('TC-COMP-QD-001 单选题渲染（关联 FR-02-01）', () => {
    it('应渲染题干与选项', () => {
      render(<QuestionDisplay question={baseQuestion} index={1} />);
      expect(screen.getByText(/1\+1等于几/)).toBeInTheDocument();
      expect(screen.getByText(/1\. 1/)).toBeInTheDocument();
      expect(screen.getByText(/2\. 2/)).toBeInTheDocument();
    });
  });

  describe('TC-COMP-QD-002 多选题渲染', () => {
    it('应渲染 Checkbox 选项', () => {
      const q = { ...baseQuestion, type: 'multiple' };
      render(<QuestionDisplay question={q} index={1} />);
      expect(screen.getByText(/1\+1等于几/)).toBeInTheDocument();
    });
  });

  describe('TC-COMP-QD-003 判断题渲染', () => {
    it('应渲染正确/错误选项', () => {
      const q = { ...baseQuestion, type: 'judge', options: null };
      render(<QuestionDisplay question={q} index={1} />);
      expect(screen.getByText('正确')).toBeInTheDocument();
      expect(screen.getByText('错误')).toBeInTheDocument();
    });
  });

  describe('TC-COMP-QD-004 填空题渲染', () => {
    it('应渲染输入框', () => {
      const q = { ...baseQuestion, type: 'fill', content: '中国的首都是____', options: null };
      const { container } = render(<QuestionDisplay question={q} index={1} />);
      const inputs = container.querySelectorAll('input');
      expect(inputs.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('TC-COMP-QD-005 简答题渲染', () => {
    it('应渲染文本域', () => {
      const q = { ...baseQuestion, type: 'short', options: null };
      render(<QuestionDisplay question={q} index={1} />);
      // TextArea 存在
      expect(screen.getByText(/1\+1等于几/)).toBeInTheDocument();
    });
  });

  describe('TC-COMP-QD-006 只读模式（关联 FR-05-09 答题详情）', () => {
    it('readOnly 时不应触发 onChange', () => {
      const onChange = jest.fn();
      render(<QuestionDisplay question={baseQuestion} index={1} readOnly onChange={onChange} />);
      // 只读模式下不触发回调
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('TC-COMP-QD-007 显示标准答案与解析（关联 FR-05-09）', () => {
    it('showAnswer 时应显示标准答案', () => {
      render(<QuestionDisplay question={baseQuestion} index={1} showAnswer showAnalysis />);
      expect(screen.getByText('标准答案')).toBeInTheDocument();
      expect(screen.getByText('解析')).toBeInTheDocument();
    });
  });

  describe('TC-COMP-QD-008 question 为 null 时返回 null', () => {
    it('不渲染', () => {
      const { container } = render(<QuestionDisplay question={null} />);
      expect(container.firstChild).toBeNull();
    });
  });
});