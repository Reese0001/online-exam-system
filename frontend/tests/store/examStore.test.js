/**
 * 考试状态管理测试
 * 关联需求：FR-05-03(题目导航) / FR-05-04(答案暂存) / FR-05-06(防作弊) / NFR-13(断网续答)
 * 关联用例：UC_Answer / UC_SaveAnswer / UC_Navigate / UC_AntiCheat
 * 测试用例：TC-STORE-EXAM-001 ~ TC-STORE-EXAM-008
 */
import useExamStore from '@/store/examStore';

describe('examStore - TC-STORE-EXAM', () => {
  beforeEach(() => {
    window.localStorage.clear();
    useExamStore.getState().resetExam();
  });

  const mockPaper = {
    id: 1, name: '测试卷',
    questions: [
      { id: 1, question_id: 1, type: 'single', content: 'q1', score: 2 },
      { id: 2, question_id: 2, type: 'judge', content: 'q2', score: 2 },
      { id: 3, question_id: 3, type: 'fill', content: 'q3', score: 2 },
    ],
  };

  describe('TC-STORE-EXAM-001 初始状态', () => {
    it('应为空状态', () => {
      const state = useExamStore.getState();
      expect(state.examId).toBeNull();
      expect(state.paper).toBeNull();
      expect(state.answers).toEqual({});
      expect(state.remainSeconds).toBe(0);
      expect(state.switchCount).toBe(0);
      expect(state.submitted).toBe(false);
    });
  });

  describe('TC-STORE-EXAM-002 initExam 初始化考试（关联 FR-05-02）', () => {
    it('应设置考试信息并从 localStorage 恢复暂存答案（关联 NFR-13）', () => {
      // 预置暂存答案
      window.localStorage.setItem('exam_draft_1', JSON.stringify({ 1: 'A' }));

      useExamStore.getState().initExam({
        examId: 1, examRecordId: 100, paper: mockPaper, remainSeconds: 3600,
      });

      const state = useExamStore.getState();
      expect(state.examId).toBe(1);
      expect(state.examRecordId).toBe(100);
      expect(state.paper).toEqual(mockPaper);
      expect(state.remainSeconds).toBe(3600);
      expect(state.answers).toEqual({ 1: 'A' }); // 从 localStorage 恢复
    });
  });

  describe('TC-STORE-EXAM-003 setAnswer 暂存答案（关联 FR-05-04）', () => {
    it('应更新答案并写入 localStorage', () => {
      useExamStore.getState().initExam({
        examId: 1, examRecordId: 100, paper: mockPaper, remainSeconds: 3600,
      });
      useExamStore.getState().setAnswer(1, 'A');

      expect(useExamStore.getState().answers[1]).toBe('A');
      const saved = JSON.parse(window.localStorage.getItem('exam_draft_1'));
      expect(saved[1]).toBe('A');
    });

    it('多题暂存应保留所有答案', () => {
      useExamStore.getState().initExam({
        examId: 1, examRecordId: 100, paper: mockPaper, remainSeconds: 3600,
      });
      useExamStore.getState().setAnswer(1, 'A');
      useExamStore.getState().setAnswer(2, 'T');
      useExamStore.getState().setAnswer(3, '北京');

      const answers = useExamStore.getState().answers;
      expect(Object.keys(answers)).toHaveLength(3);
    });
  });

  describe('TC-STORE-EXAM-004 setCurrentIndex 切换题目（关联 FR-05-03）', () => {
    it('应更新当前题目序号', () => {
      useExamStore.getState().setCurrentIndex(2);
      expect(useExamStore.getState().currentIndex).toBe(2);
    });
  });

  describe('TC-STORE-EXAM-005 tick 倒计时减秒（关联 FR-05-05）', () => {
    it('应将 remainSeconds 减 1', () => {
      useExamStore.getState().setRemainSeconds(100);
      useExamStore.getState().tick();
      expect(useExamStore.getState().remainSeconds).toBe(99);
    });

    it('remainSeconds 为 0 时不再减少', () => {
      useExamStore.getState().setRemainSeconds(0);
      useExamStore.getState().tick();
      expect(useExamStore.getState().remainSeconds).toBe(0);
    });
  });

  describe('TC-STORE-EXAM-006 addSwitchCount 防作弊计数（关联 FR-05-06）', () => {
    it('应递增切屏次数并返回新值', () => {
      const count1 = useExamStore.getState().addSwitchCount();
      expect(count1).toBe(1);
      const count2 = useExamStore.getState().addSwitchCount();
      expect(count2).toBe(2);
      expect(useExamStore.getState().switchCount).toBe(2);
    });
  });

  describe('TC-STORE-EXAM-007 setSubmitted 标记交卷（关联 FR-05-08）', () => {
    it('应将 submitted 设为 true', () => {
      useExamStore.getState().setSubmitted();
      expect(useExamStore.getState().submitted).toBe(true);
    });
  });

  describe('TC-STORE-EXAM-008 resetExam 重置状态', () => {
    it('应清空所有状态并删除 localStorage', () => {
      useExamStore.getState().initExam({
        examId: 1, examRecordId: 100, paper: mockPaper, remainSeconds: 3600,
      });
      useExamStore.getState().setAnswer(1, 'A');
      useExamStore.getState().resetExam();

      const state = useExamStore.getState();
      expect(state.examId).toBeNull();
      expect(state.paper).toBeNull();
      expect(state.answers).toEqual({});
      expect(window.localStorage.getItem('exam_draft_1')).toBeNull();
    });
  });

  describe('TC-STORE-EXAM-009 getAnsweredCount 已答题数', () => {
    it('应统计非空答案数量', () => {
      useExamStore.getState().initExam({
        examId: 1, examRecordId: 100, paper: mockPaper, remainSeconds: 3600,
      });
      useExamStore.getState().setAnswer(1, 'A');
      useExamStore.getState().setAnswer(2, '');
      useExamStore.getState().setAnswer(3, null);

      expect(useExamStore.getState().getAnsweredCount()).toBe(1);
    });
  });

  describe('TC-STORE-EXAM-010 getTotalCount 总题数', () => {
    it('应返回试卷题目数', () => {
      useExamStore.getState().initExam({
        examId: 1, examRecordId: 100, paper: mockPaper, remainSeconds: 3600,
      });
      expect(useExamStore.getState().getTotalCount()).toBe(3);
    });

    it('无试卷时返回 0', () => {
      expect(useExamStore.getState().getTotalCount()).toBe(0);
    });
  });
});