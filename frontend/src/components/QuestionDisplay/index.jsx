import { Radio, Checkbox, Input, Tag, Space, Divider } from 'antd';
import {
  QUESTION_TYPE_LABELS,
  QUESTION_TYPE_COLORS,
  DIFFICULTY_LABELS,
} from '@/utils/constants';
import {
  getOptionLabel,
  parseMultipleAnswer,
  formatMultipleAnswer,
} from '@/utils/helpers';

const { TextArea } = Input;

/**
 * 题目展示组件
 * - 用于考试答题页、答题详情页、试卷预览页
 * - 根据题型渲染不同作答控件
 * - 支持只读模式（查看答题详情时）
 *
 * Props:
 * - question: 题目对象 { id, type, content, options, score, ... }
 * - index: 题目序号（从 1 开始）
 * - value: 学生答案
 * - onChange: 答案变更回调
 * - readOnly: 只读模式
 * - showAnswer: 显示标准答案（阅卷/详情时）
 * - showAnalysis: 显示解析
 * - score: 实际得分（详情时展示）
 * - comment: 教师评语
 */
const QuestionDisplay = ({
  question,
  index,
  value,
  onChange,
  readOnly = false,
  showAnswer = false,
  showAnalysis = false,
  actualScore,
  comment,
}) => {
  if (!question) return null;

  const { type, content, options = [], answer, analysis, score, difficulty } = question;

  // 渲染题干
  const renderHeader = () => (
    <div style={{ marginBottom: 16 }}>
      <Space>
        <Tag color={QUESTION_TYPE_COLORS[type]}>
          {QUESTION_TYPE_LABELS[type]}
        </Tag>
        <Tag>{DIFFICULTY_LABELS[difficulty] || `难度${difficulty}`}</Tag>
        <span style={{ color: '#999' }}>{score} 分</span>
        {actualScore !== undefined && actualScore !== null && (
          <Tag color={actualScore >= score * 0.6 ? 'green' : 'red'}>
            得分：{actualScore}
          </Tag>
        )}
      </Space>
      <div style={{ marginTop: 8, fontSize: 16, lineHeight: 1.8 }}>
        {index !== undefined && <strong>{index}. </strong>}
        {content}
      </div>
    </div>
  );

  // 渲染作答区
  const renderAnswerArea = () => {
    switch (type) {
      case 'single':
        // 单选
        return (
          <Radio.Group
            value={value}
            onChange={(e) => !readOnly && onChange?.(e.target.value)}
            disabled={readOnly}
          >
            <Space direction="vertical">
              {options.map((opt, i) => (
                <Radio key={opt.label || i} value={opt.label || getOptionLabel(i)}>
                  {getOptionLabel(i)}. {opt.text}
                </Radio>
              ))}
            </Space>
          </Radio.Group>
        );
      case 'multiple':
        // 多选
        return (
          <Checkbox.Group
            value={parseMultipleAnswer(value)}
            onChange={(vals) => !readOnly && onChange?.(vals)}
            disabled={readOnly}
          >
            <Space direction="vertical">
              {options.map((opt, i) => (
                <Checkbox key={opt.label || i} value={opt.label || getOptionLabel(i)}>
                  {getOptionLabel(i)}. {opt.text}
                </Checkbox>
              ))}
            </Space>
          </Checkbox.Group>
        );
      case 'judge':
        // 判断
        return (
          <Radio.Group
            value={value}
            onChange={(e) => !readOnly && onChange?.(e.target.value)}
            disabled={readOnly}
          >
            <Space direction="vertical">
              <Radio value="T">正确</Radio>
              <Radio value="F">错误</Radio>
            </Space>
          </Radio.Group>
        );
      case 'fill':
        // 填空（支持多个空，用 ||| 分隔）
        const fillCount = (content.match(/_{2,}/g) || []).length || 1;
        const fillValues = value ? String(value).split('|||') : [];
        return (
          <Space direction="vertical" style={{ width: '100%' }}>
            {Array.from({ length: fillCount }).map((_, i) => (
              <Input
                key={i}
                placeholder={`第 ${i + 1} 空`}
                value={fillValues[i] || ''}
                onChange={(e) => {
                  if (readOnly) return;
                  const newVals = [...fillValues];
                  newVals[i] = e.target.value;
                  onChange?.(newVals.join('|||'));
                }}
                disabled={readOnly}
                style={{ maxWidth: 300 }}
              />
            ))}
          </Space>
        );
      case 'short':
        // 简答
        return (
          <TextArea
            value={value || ''}
            onChange={(e) => !readOnly && onChange?.(e.target.value)}
            disabled={readOnly}
            rows={6}
            placeholder="请输入答案"
            maxLength={2000}
            showCount
          />
        );
      default:
        return null;
    }
  };

  // 渲染标准答案与解析
  const renderAnswerAndAnalysis = () => {
    if (!showAnswer && !showAnalysis) return null;
    return (
      <>
        <Divider />
        {showAnswer && (
          <div style={{ marginBottom: 8 }}>
            <Tag color="green">标准答案</Tag>
            <span>{type === 'multiple' ? formatMultipleAnswer(answer) : answer}</span>
          </div>
        )}
        {showAnalysis && analysis && (
          <div>
            <Tag color="blue">解析</Tag>
            <span>{analysis}</span>
          </div>
        )}
        {comment && (
          <div style={{ marginTop: 8 }}>
            <Tag color="orange">教师评语</Tag>
            <span>{comment}</span>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="question-display">
      {renderHeader()}
      {renderAnswerArea()}
      {renderAnswerAndAnalysis()}
    </div>
  );
};

export default QuestionDisplay;