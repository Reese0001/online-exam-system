/**
 * 考试计时器组件测试
 * 关联需求：FR-05-05(计时提醒) / NFR-14(倒计时自动交卷)
 * 关联用例：UC_Timer
 * 测试用例：TC-COMP-TIMER-001 ~ TC-COMP-TIMER-004
 */
import { render, screen } from '@testing-library/react';
import ExamTimer from '@/components/ExamTimer';

describe('ExamTimer 组件 - TC-COMP-TIMER', () => {
  describe('TC-COMP-TIMER-001 正常倒计时显示（关联 FR-05-05）', () => {
    it('应显示剩余时间', () => {
      render(<ExamTimer remainSeconds={3600} />);
      expect(screen.getByText(/剩余时间/)).toBeInTheDocument();
      // 3600秒 = 01:00:00
      expect(screen.getByText('01:00:00')).toBeInTheDocument();
    });

    it('不足1小时应显示 mm:ss 格式', () => {
      render(<ExamTimer remainSeconds={600} />);
      expect(screen.getByText('10:00')).toBeInTheDocument();
    });
  });

  describe('TC-COMP-TIMER-002 5分钟警告（关联 FR-05-05）', () => {
    it('剩余 <= 300秒应显示警告样式', () => {
      const { container } = render(<ExamTimer remainSeconds={300} />);
      const timerDiv = container.firstChild;
      // jsdom 将 #fffbe6 转为 rgb(255, 251, 230)
      expect(timerDiv.style.background).toMatch(/255.*251.*230/);
    });

    it('剩余 301秒应为正常样式', () => {
      const { container } = render(<ExamTimer remainSeconds={301} />);
      const timerDiv = container.firstChild;
      // #f6ffed = rgb(246, 255, 237)
      expect(timerDiv.style.background).toMatch(/246.*255.*237/);
    });
  });

  describe('TC-COMP-TIMER-003 1分钟危险警告', () => {
    it('剩余 <= 60秒应显示危险样式', () => {
      const { container } = render(<ExamTimer remainSeconds={60} />);
      const timerDiv = container.firstChild;
      // #fff1f0 = rgb(255, 241, 240)
      expect(timerDiv.style.background).toMatch(/255.*241.*240/);
      // #ff4d4f = rgb(255, 77, 79)
      expect(timerDiv.style.color).toMatch(/255.*77.*79/);
    });
  });

  describe('TC-COMP-TIMER-004 时间为0', () => {
    it('应显示 00:00', () => {
      render(<ExamTimer remainSeconds={0} />);
      expect(screen.getByText('00:00')).toBeInTheDocument();
    });
  });
});