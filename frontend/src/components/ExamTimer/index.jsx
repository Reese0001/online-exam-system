import { secondsToTime } from '@/utils/helpers';

/**
 * 考试计时器组件
 * - 倒计时显示
 * - 时间到自动触发交卷回调
 * - 剩余时间少于 5 分钟红色警告
 *
 * Props:
 * - remainSeconds: 剩余秒数
 * - onTimeout: 时间到回调
 */
const ExamTimer = ({ remainSeconds, onTimeout }) => {
  const isWarning = remainSeconds <= 300; // 5 分钟警告
  const isDanger = remainSeconds <= 60; // 1 分钟危险

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 16px',
        borderRadius: 6,
        fontWeight: 600,
        fontSize: 18,
        fontFamily: 'Consolas, Monaco, monospace',
        background: isDanger ? '#fff1f0' : isWarning ? '#fffbe6' : '#f6ffed',
        border: `1px solid ${isDanger ? '#ffccc7' : isWarning ? '#ffe58f' : '#b7eb8f'}`,
        color: isDanger ? '#ff4d4f' : isWarning ? '#faad14' : '#52c41a',
      }}
    >
      <span>⏱ 剩余时间</span>
      <span>{secondsToTime(remainSeconds)}</span>
    </div>
  );
};

export default ExamTimer;