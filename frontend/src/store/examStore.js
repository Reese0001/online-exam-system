import { create } from 'zustand';
import { STORAGE_KEYS } from '@/utils/constants';

/**
 * 考试状态管理（Zustand）
 * 管理：当前考试信息、试卷题目、学生答案暂存、计时、防作弊计数
 * 答案暂存同时写入 localStorage，支持断网续答
 */
export const useExamStore = create((set, get) => ({
  // ===== 状态 =====
  examId: null, // 当前考试 ID
  examRecordId: null, // 考试记录 ID
  paper: null, // 试卷详情（含题目列表）
  remainSeconds: 0, // 剩余秒数
  answers: {}, // { [questionId]: studentAnswer } 学生答案
  currentIndex: 0, // 当前题目序号
  switchCount: 0, // 切屏次数（防作弊）
  submitted: false, // 是否已交卷
  startTime: null, // 进入考试时间戳

  // ===== 动作 =====

  // 初始化考试（进入考试后调用）
  initExam: ({ examId, examRecordId, paper, remainSeconds }) => {
    // 尝试从 localStorage 恢复暂存答案
    const draftKey = `${STORAGE_KEYS.EXAM_DRAFT}${examId}`;
    const savedAnswers = JSON.parse(localStorage.getItem(draftKey) || '{}');
    set({
      examId,
      examRecordId,
      paper,
      remainSeconds,
      answers: savedAnswers,
      currentIndex: 0,
      switchCount: 0,
      submitted: false,
      startTime: Date.now(),
    });
  },

  // 暂存单题答案（同时写入 localStorage）
  setAnswer: (questionId, answer) => {
    const { examId, answers } = get();
    const newAnswers = { ...answers, [questionId]: answer };
    localStorage.setItem(
      `${STORAGE_KEYS.EXAM_DRAFT}${examId}`,
      JSON.stringify(newAnswers)
    );
    set({ answers: newAnswers });
  },

  // 批量设置答案（从服务端恢复续答时用）
  setAnswers: (answers) => set({ answers }),

  // 切换当前题目
  setCurrentIndex: (index) => set({ currentIndex: index }),

  // 倒计时减秒
  tick: () => {
    const { remainSeconds } = get();
    if (remainSeconds > 0) {
      set({ remainSeconds: remainSeconds - 1 });
    }
  },

  // 设置剩余秒数
  setRemainSeconds: (seconds) => set({ remainSeconds: seconds }),

  // 增加切屏次数（防作弊）
  addSwitchCount: () => {
    const { switchCount } = get();
    set({ switchCount: switchCount + 1 });
    return switchCount + 1;
  },

  // 标记已交卷
  setSubmitted: () => set({ submitted: true }),

  // 重置考试状态（退出考试时调用）
  resetExam: () => {
    const { examId } = get();
    if (examId) {
      localStorage.removeItem(`${STORAGE_KEYS.EXAM_DRAFT}${examId}`);
    }
    set({
      examId: null,
      examRecordId: null,
      paper: null,
      remainSeconds: 0,
      answers: {},
      currentIndex: 0,
      switchCount: 0,
      submitted: false,
      startTime: null,
    });
  },

  // 获取已答题数量
  getAnsweredCount: () => {
    const { answers } = get();
    return Object.keys(answers).filter((k) => {
      const v = answers[k];
      return v !== undefined && v !== null && v !== '' &&
        !(Array.isArray(v) && v.length === 0);
    }).length;
  },

  // 获取总题数
  getTotalCount: () => {
    const { paper } = get();
    return paper?.questions?.length || 0;
  },
}));

export default useExamStore;