import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Space, Modal, message, Spin, Typography, Tag, Progress } from 'antd';
import { ExclamationCircleOutlined, FullscreenOutlined, FullscreenExitOutlined } from '@ant-design/icons';
import { startExam, saveAnswer, submitExam } from '@/api/exam';
import useExamStore from '@/store/examStore';
import QuestionDisplay from '@/components/QuestionDisplay';
import ExamTimer from '@/components/ExamTimer';
import { ANTI_CHEAT_CONFIG } from '@/utils/constants';
import { throttle } from '@/utils/helpers';

const { Title, Text } = Typography;

/**
 * 在线答题页（学生）
 * 核心功能：
 * 1. 进入考试，加载试卷题目
 * 2. 倒计时（时间到自动交卷）
 * 3. 答案暂存（实时写入 localStorage + 定时同步服务端）
 * 4. 题目导航（已答/未答/当前）
 * 5. 防作弊：
 *    - 切屏检测（visibilitychange），记录次数，超过限制警告/自动交卷
 *    - 禁止复制粘贴（copy/paste 事件拦截）
 *    - 禁止右键菜单（contextmenu 拦截）
 *    - 全屏考试模式
 * 6. 交卷确认
 */
const ExamPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const examId = Number(id);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [warnVisible, setWarnVisible] = useState(false);
  const [warnMessage, setWarnMessage] = useState('');

  const {
    paper,
    remainSeconds,
    answers,
    currentIndex,
    switchCount,
    submitted,
    examRecordId,
    initExam,
    setAnswer,
    setCurrentIndex,
    tick,
    setRemainSeconds,
    addSwitchCount,
    setSubmitted,
    resetExam,
    getAnsweredCount,
    getTotalCount,
  } = useExamStore();

  const timerRef = useRef(null);
  const syncRef = useRef(null);

  // ===== 进入考试 =====
  useEffect(() => {
    const enterExam = async () => {
      setLoading(true);
      try {
        const res = await startExam(examId);
        const { exam_record_id, paper: paperData, remain_seconds } = res.data;
        initExam({ examId, examRecordId: exam_record_id, paper: paperData, remainSeconds: remain_seconds });
      } catch (err) {
        message.error(err?.message || '进入考试失败');
        navigate('/student/exams');
      } finally {
        setLoading(false);
      }
    };
    enterExam();

    return () => {
      // 离开页面清理
      if (timerRef.current) clearInterval(timerRef.current);
      if (syncRef.current) clearInterval(syncRef.current);
    };
  }, [examId]);

  // ===== 倒计时 =====
  useEffect(() => {
    if (loading || submitted) return;
    timerRef.current = setInterval(() => {
      const rs = useExamStore.getState().remainSeconds;
      if (rs <= 1) {
        clearInterval(timerRef.current);
        message.warning('考试时间已到，正在自动交卷...');
        handleSubmit(true);
      } else {
        tick();
      }
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [loading, submitted]);

  // ===== 定时同步答案到服务端（每 30 秒）=====
  useEffect(() => {
    if (loading || submitted) return;
    syncRef.current = setInterval(async () => {
      const state = useExamStore.getState();
      const { answers, examId } = state;
      // 暂存所有有答案的题目
      Object.entries(answers).forEach(async ([qid, ans]) => {
        if (ans !== undefined && ans !== null && ans !== '') {
          try {
            const payload = {
              question_id: Number(qid),
              student_answer: Array.isArray(ans) ? JSON.stringify(ans) : String(ans),
            };
            await saveAnswer(examId, payload);
          } catch {
            // 静默失败，下次重试
          }
        }
      });
    }, 30000);
    return () => {
      if (syncRef.current) clearInterval(syncRef.current);
    };
  }, [loading, submitted]);

  // ===== 防作弊：切屏检测 =====
  useEffect(() => {
    if (loading || submitted) return;
    const handleVisibilityChange = () => {
      if (document.hidden) {
        const count = addSwitchCount();
        if (count >= ANTI_CHEAT_CONFIG.MAX_SWITCH_COUNT) {
          setWarnMessage(`您已切屏 ${count} 次，超过限制 ${ANTI_CHEAT_CONFIG.MAX_SWITCH_COUNT} 次，系统将自动交卷！`);
          setWarnVisible(true);
          if (ANTI_CHEAT_CONFIG.AUTO_SUBMIT_ON_EXCEED) {
            setTimeout(() => handleSubmit(true), 2000);
          }
        } else if (count >= ANTI_CHEAT_CONFIG.WARN_SWITCH_COUNT) {
          message.warning(`检测到切屏行为！已切屏 ${count} 次，最多允许 ${ANTI_CHEAT_CONFIG.MAX_SWITCH_COUNT} 次，超过将自动交卷。`);
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [loading, submitted]);

  // ===== 防作弊：禁止复制/粘贴/右键 =====
  useEffect(() => {
    if (loading || submitted) return;
    const blockEvent = (e) => {
      e.preventDefault();
      message.warning('考试期间禁止复制粘贴操作');
    };
    const blockContextMenu = (e) => {
      e.preventDefault();
    };
    document.addEventListener('copy', blockEvent);
    document.addEventListener('paste', blockEvent);
    document.addEventListener('cut', blockEvent);
    document.addEventListener('contextmenu', blockContextMenu);
    return () => {
      document.removeEventListener('copy', blockEvent);
      document.removeEventListener('paste', blockEvent);
      document.removeEventListener('cut', blockEvent);
      document.removeEventListener('contextmenu', blockContextMenu);
    };
  }, [loading, submitted]);

  // ===== 防作弊：离开页面前提示 =====
  useEffect(() => {
    if (loading || submitted) return;
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = '考试进行中，确定要离开吗？离开可能丢失未提交的答案。';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [loading, submitted]);

  // ===== 暂存答案（节流，避免频繁请求）=====
  const handleAnswerChange = useCallback(
    throttle((questionId, value) => {
      // 写入 store + localStorage
      setAnswer(questionId, value);
      // 同步到服务端（异步，不阻塞）
      const payload = {
        question_id: questionId,
        student_answer: Array.isArray(value) ? JSON.stringify(value) : String(value),
      };
      saveAnswer(examId, payload).catch(() => {
        // 静默失败，定时同步会重试
      });
    }, 2000),
    [examId, setAnswer]
  );

  // ===== 交卷 =====
  const handleSubmit = async (isAuto = false) => {
    if (submitted) return;
    if (!isAuto) {
      const answered = getAnsweredCount();
      const total = getTotalCount();
      if (answered < total) {
        Modal.confirm({
          title: '交卷确认',
          icon: <ExclamationCircleOutlined />,
          content: `您还有 ${total - answered} 道题未作答，确认交卷吗？`,
          okText: '确认交卷',
          cancelText: '继续答题',
          onOk: () => doSubmit(),
        });
        return;
      }
      Modal.confirm({
        title: '交卷确认',
        icon: <ExclamationCircleOutlined />,
        content: '确认交卷吗？交卷后无法修改答案。',
        okText: '确认交卷',
        cancelText: '取消',
        onOk: () => doSubmit(),
      });
      return;
    }
    await doSubmit();
  };

  const doSubmit = async () => {
    setSubmitting(true);
    setSubmitted();
    if (timerRef.current) clearInterval(timerRef.current);
    if (syncRef.current) clearInterval(syncRef.current);
    try {
      await submitExam(examId);
      message.success('交卷成功');
      resetExam();
      navigate('/student/exams', { replace: true });
    } catch (err) {
      message.error(err?.message || '交卷失败');
      // 恢复状态允许重试
      useExamStore.setState({ submitted: false });
    } finally {
      setSubmitting(false);
    }
  };

  // ===== 全屏切换 =====
  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch {
      message.warning('全屏模式切换失败');
    }
  };

  // ===== 渲染 =====
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 100 }}>
        <Spin size="large" tip="正在进入考试..." />
      </div>
    );
  }

  const questions = paper?.questions || [];
  const currentQuestion = questions[currentIndex];
  const answeredCount = getAnsweredCount();
  const totalCount = getTotalCount();

  return (
    <div className="exam-page">
      {/* 顶部信息栏 */}
      <div className="exam-header">
        <Space>
          <Title level={4} style={{ margin: 0 }}>{paper?.name || '在线考试'}</Title>
          <Tag color="orange">切屏次数：{switchCount}/{ANTI_CHEAT_CONFIG.MAX_SWITCH_COUNT}</Tag>
        </Space>
        <Space>
          <ExamTimer remainSeconds={remainSeconds} onTimeout={() => handleSubmit(true)} />
          <Button
            icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
            onClick={toggleFullscreen}
          >
            {isFullscreen ? '退出全屏' : '全屏模式'}
          </Button>
          <Button type="primary" danger loading={submitting} onClick={() => handleSubmit(false)}>
            交卷
          </Button>
        </Space>
      </div>

      {/* 主体区 */}
      <div className="exam-body">
        {/* 左侧答题区 */}
        <div className="exam-content">
          {currentQuestion ? (
            <QuestionDisplay
              question={currentQuestion}
              index={currentIndex + 1}
              value={answers[currentQuestion.question_id || currentQuestion.id]}
              onChange={(val) => handleAnswerChange(currentQuestion.question_id || currentQuestion.id, val)}
            />
          ) : (
            <div style={{ textAlign: 'center', padding: 40 }}>暂无题目</div>
          )}

          {/* 上一题/下一题 */}
          <div style={{ marginTop: 32, textAlign: 'center' }}>
            <Space>
              <Button
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex(currentIndex - 1)}
              >
                上一题
              </Button>
              <Text>第 {currentIndex + 1} / {totalCount} 题</Text>
              <Button
                disabled={currentIndex >= totalCount - 1}
                onClick={() => setCurrentIndex(currentIndex + 1)}
              >
                下一题
              </Button>
            </Space>
          </div>
        </div>

        {/* 右侧导航栏 */}
        <div className="exam-sidebar">
          <div style={{ fontWeight: 600, marginBottom: 8 }}>答题卡</div>
          <Progress
            percent={totalCount ? Math.round((answeredCount / totalCount) * 100) : 0}
            size="small"
            format={() => `${answeredCount}/${totalCount}`}
          />
          <div className="question-nav-grid">
            {questions.map((q, idx) => {
              const qid = q.question_id || q.id;
              const answered = answers[qid] !== undefined && answers[qid] !== null && answers[qid] !== '' &&
                !(Array.isArray(answers[qid]) && answers[qid].length === 0);
              return (
                <div
                  key={qid}
                  className={`question-nav-item ${answered ? 'answered' : ''} ${idx === currentIndex ? 'current' : ''}`}
                  onClick={() => setCurrentIndex(idx)}
                >
                  {idx + 1}
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 16, fontSize: 12, color: '#999' }}>
            <div><span style={{ display: 'inline-block', width: 12, height: 12, background: '#1677ff', marginRight: 4 }} />当前题</div>
            <div><span style={{ display: 'inline-block', width: 12, height: 12, background: '#e6f4ff', border: '1px solid #1677ff', marginRight: 4 }} />已答</div>
            <div><span style={{ display: 'inline-block', width: 12, height: 12, background: '#fff', border: '1px solid #d9d9d9', marginRight: 4 }} />未答</div>
          </div>
        </div>
      </div>

      {/* 切屏警告弹窗 */}
      <Modal
        title="切屏警告"
        open={warnVisible}
        icon={<ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />}
        footer={null}
        closable={false}
      >
        <Text type="danger">{warnMessage}</Text>
      </Modal>
    </div>
  );
};

export default ExamPage;