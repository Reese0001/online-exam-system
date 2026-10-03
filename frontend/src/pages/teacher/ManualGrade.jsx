import { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Space,
  Select,
  Avatar,
  List,
  Divider,
  InputNumber,
  Input,
  message,
  Spin,
  Tag,
} from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { getGradeTaskDetail, manualGrade } from '@/api/grade';
import { QUESTION_TYPE_LABELS } from '@/utils/constants';
import QuestionDisplay from '@/components/QuestionDisplay';

/**
 * 手动阅卷页（教师）
 * - 左侧学生列表
 * - 右侧主观题逐题评分
 * - 填写评语
 */
const ManualGrade = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [task, setTask] = useState(null);
  const [records, setRecords] = useState([]);
  const [currentRecordId, setCurrentRecordId] = useState(null);
  const [scores, setScores] = useState({}); // { [answerId]: { score, comment } }
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getGradeTaskDetail(id);
      const d = res.data;
      setTask(d.task);
      setRecords(d.records || []);
      if (d.records?.length > 0) {
        setCurrentRecordId(d.records[0].exam_record_id);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  // 当前选中的学生答卷
  const currentRecord = records.find((r) => r.exam_record_id === currentRecordId);

  // 初始化当前学生的评分
  useEffect(() => {
    if (currentRecord) {
      const init = {};
      currentRecord.answers?.forEach((a) => {
        init[a.id] = { score: a.score ?? 0, comment: a.comment || '' };
      });
      setScores(init);
    }
  }, [currentRecordId]);

  // 保存评分
  const handleSave = async () => {
    if (!currentRecordId) return;
    const answers = Object.entries(scores).map(([answerId, v]) => ({
      answer_id: Number(answerId),
      score: v.score,
      comment: v.comment,
    }));
    setSaving(true);
    try {
      await manualGrade(id, { exam_record_id: currentRecordId, answers });
      message.success('评分已保存');
      loadData();
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card
      title={
        <Space>
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/teacher/grade')} />
          手动阅卷 - {task?.exam_name || ''}
        </Space>
      }
    >
      <Spin spinning={loading}>
        <div style={{ display: 'flex', gap: 16 }}>
          {/* 左侧学生列表 */}
          <div style={{ width: 240 }}>
            <List
              size="small"
              bordered
              dataSource={records}
              renderItem={(item) => (
                <List.Item
                  onClick={() => setCurrentRecordId(item.exam_record_id)}
                  style={{
                    cursor: 'pointer',
                    background: item.exam_record_id === currentRecordId ? '#e6f4ff' : undefined,
                  }}
                >
                  <List.Item.Meta
                    avatar={<Avatar>{item.student_name?.[0]}</Avatar>}
                    title={item.student_name}
                  />
                </List.Item>
              )}
            />
          </div>

          {/* 右侧评分区 */}
          <div style={{ flex: 1 }}>
            {currentRecord ? (
              <>
                {currentRecord.answers?.map((answer, idx) => (
                  <div key={answer.id} style={{ marginBottom: 24, padding: 16, background: '#fafafa', borderRadius: 8 }}>
                    <QuestionDisplay
                      question={{
                        id: answer.question_id,
                        type: answer.question_type,
                        content: answer.question_content,
                        score: answer.full_score,
                      }}
                      index={idx + 1}
                      value={answer.student_answer}
                      readOnly
                      showAnswer
                    />
                    <Divider style={{ margin: '12px 0' }} />
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <Space>
                        <span>评分：</span>
                        <InputNumber
                          min={0}
                          max={answer.full_score}
                          step={0.5}
                          value={scores[answer.id]?.score}
                          onChange={(v) => setScores((prev) => ({
                            ...prev,
                            [answer.id]: { ...prev[answer.id], score: v },
                          }))}
                        />
                        <span style={{ color: '#999' }}>满分 {answer.full_score}</span>
                      </Space>
                      <Input
                        placeholder="评语（选填）"
                        value={scores[answer.id]?.comment}
                        onChange={(e) => setScores((prev) => ({
                          ...prev,
                          [answer.id]: { ...prev[answer.id], comment: e.target.value },
                        }))}
                      />
                    </Space>
                  </div>
                ))}
                <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={handleSave}>
                  保存评分
                </Button>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>请选择左侧学生进行阅卷</div>
            )}
          </div>
        </div>
      </Spin>
    </Card>
  );
};

export default ManualGrade;