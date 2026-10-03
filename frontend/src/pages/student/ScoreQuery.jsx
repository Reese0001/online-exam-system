import { useState, useEffect } from 'react';
import { Card, Table, Tag, Button, Empty } from 'antd';
import { useNavigate } from 'react-router-dom';
import { getPersonalScores, getWrongQuestions } from '@/api/score';
import { formatDateTime } from '@/utils/helpers';
import { Tabs } from 'antd';

/**
 * 学生成绩查询页
 * - 个人成绩列表
 * - 错题统计
 */
const ScoreQuery = () => {
  const navigate = useNavigate();
  const [scores, setScores] = useState([]);
  const [wrongQuestions, setWrongQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [wrongLoading, setWrongLoading] = useState(false);

  const loadScores = async () => {
    setLoading(true);
    try {
      const res = await getPersonalScores();
      setScores(res.data || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const loadWrongQuestions = async () => {
    setWrongLoading(true);
    try {
      const res = await getWrongQuestions();
      setWrongQuestions(res.data || []);
    } catch {
      // ignore
    } finally {
      setWrongLoading(false);
    }
  };

  useEffect(() => {
    loadScores();
    loadWrongQuestions();
  }, []);

  const scoreColumns = [
    { title: '考试ID', dataIndex: 'exam_id', width: 80 },
    { title: '考试名称', dataIndex: 'exam_name' },
    {
      title: '成绩',
      dataIndex: 'total_score',
      render: (v) => (v === null || v === undefined ? <Tag>待阅卷</Tag> : <span style={{ fontWeight: 600, fontSize: 16 }}>{v}</span>),
      width: 100,
    },
    { title: '及格分', dataIndex: 'pass_score', width: 100 },
    {
      title: '是否及格',
      dataIndex: 'is_pass',
      render: (v) => {
        if (v === null || v === undefined) return '-';
        return <Tag color={v ? 'green' : 'red'}>{v ? '及格' : '不及格'}</Tag>;
      },
      width: 100,
    },
    { title: '交卷时间', dataIndex: 'submit_time', render: formatDateTime, width: 180 },
    {
      title: '操作',
      width: 120,
      render: (_, record) => (
        <Button size="small" onClick={() => navigate(`/student/exam/${record.exam_id}/detail`)}>
          查看详情
        </Button>
      ),
    },
  ];

  const wrongColumns = [
    { title: '考试名称', dataIndex: 'exam_name' },
    { title: '题干', dataIndex: 'content', ellipsis: true },
    { title: '你的答案', dataIndex: 'student_answer', ellipsis: true, width: 160 },
    { title: '正确答案', dataIndex: 'correct_answer', ellipsis: true, width: 160 },
    { title: '解析', dataIndex: 'analysis', ellipsis: true },
  ];

  return (
    <Card title="成绩查询">
      <Tabs
        items={[
          {
            key: 'scores',
            label: '我的成绩',
            children: (
              <Table
                rowKey="exam_id"
                columns={scoreColumns}
                dataSource={scores}
                loading={loading}
                pagination={false}
                locale={{ emptyText: <Empty description="暂无考试记录" /> }}
              />
            ),
          },
          {
            key: 'wrong',
            label: '错题本',
            children: (
              <Table
                rowKey={(r) => `${r.exam_id}_${r.question_id}`}
                columns={wrongColumns}
                dataSource={wrongQuestions}
                loading={wrongLoading}
                pagination={{ pageSize: 10 }}
                locale={{ emptyText: <Empty description="暂无错题" /> }}
              />
            ),
          },
        ]}
      />
    </Card>
  );
};

export default ScoreQuery;