import { useState, useEffect } from 'react';
import { Card, Button, Space, Spin, Descriptions, Tag, Divider, Empty, Statistic, Row, Col } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { getExamRecord } from '@/api/exam';
import QuestionDisplay from '@/components/QuestionDisplay';
import { RECORD_STATUS_LABELS } from '@/utils/constants';
import { formatDateTime } from '@/utils/helpers';

/**
 * 学生答题详情页
 * - 查看本人答题记录与得分
 * - 每题展示：题干、学生答案、标准答案、得分、解析、评语
 */
const AnswerDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [record, setRecord] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getExamRecord(id);
      setRecord(res.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  return (
    <Card
      title={
        <Space>
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/student/scores')} />
          答题详情
        </Space>
      }
    >
      <Spin spinning={loading}>
        {record ? (
          <>
            <Descriptions bordered column={2}>
              <Descriptions.Item label="考试名称">{record.exam_name}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={record.status === 'graded' ? 'green' : 'blue'}>{RECORD_STATUS_LABELS[record.status]}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="总分">{record.total_score ?? '待阅卷'}</Descriptions.Item>
              <Descriptions.Item label="开始时间">{formatDateTime(record.start_time)}</Descriptions.Item>
              <Descriptions.Item label="交卷时间">{formatDateTime(record.submit_time)}</Descriptions.Item>
              <Descriptions.Item label="考试记录ID">{record.exam_record_id}</Descriptions.Item>
            </Descriptions>

            {record.total_score !== null && record.total_score !== undefined && (
              <Row gutter={16} style={{ marginTop: 16, marginBottom: 16 }}>
                <Col span={6}>
                  <Statistic title="最终成绩" value={record.total_score} valueStyle={{ color: '#1677ff' }} />
                </Col>
              </Row>
            )}

            <Divider>答题详情</Divider>

            {(record.answers || []).map((answer, idx) => (
              <div key={answer.id} style={{ marginBottom: 24, padding: 16, background: '#fafafa', borderRadius: 8 }}>
                <QuestionDisplay
                  question={{
                    id: answer.question_id,
                    type: answer.question_type,
                    content: answer.question_content,
                    score: answer.full_score,
                    analysis: answer.analysis,
                  }}
                  index={idx + 1}
                  value={answer.student_answer}
                  readOnly
                  showAnswer
                  showAnalysis
                  actualScore={answer.score}
                  comment={answer.comment}
                />
              </div>
            ))}

            {(!record.answers || record.answers.length === 0) && (
              <Empty description="暂无答题记录" />
            )}
          </>
        ) : (
          <Empty description="暂无数据" />
        )}
      </Spin>
    </Card>
  );
};

export default AnswerDetail;