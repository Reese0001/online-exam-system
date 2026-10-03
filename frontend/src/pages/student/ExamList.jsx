import { useState, useEffect } from 'react';
import { Card, Table, Button, Tag, Space, Empty } from 'antd';
import { useNavigate } from 'react-router-dom';
import { getStudentExamList } from '@/api/exam';
import { RECORD_STATUS_LABELS, EXAM_STATUS_LABELS, EXAM_STATUS_COLORS } from '@/utils/constants';
import { formatDateTime } from '@/utils/helpers';

/**
 * 学生考试列表页
 * - 显示该学生可参加的所有考试
 * - 按状态分类：待考/进行中/已结束
 * - 进入考试/查看记录
 */
const ExamList = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getStudentExamList();
      setData(res.data || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const columns = [
    { title: '考试ID', dataIndex: 'exam_id', width: 80 },
    { title: '考试名称', dataIndex: 'name' },
    { title: '开始时间', dataIndex: 'start_time', render: formatDateTime, width: 170 },
    { title: '结束时间', dataIndex: 'end_time', render: formatDateTime, width: 170 },
    {
      title: '考试状态',
      dataIndex: 'status',
      width: 100,
      render: (s) => <Tag color={EXAM_STATUS_COLORS[s]}>{EXAM_STATUS_LABELS[s]}</Tag>,
    },
    {
      title: '答题状态',
      dataIndex: 'record_status',
      width: 100,
      render: (s) => (s ? <Tag>{RECORD_STATUS_LABELS[s]}</Tag> : <Tag>未开始</Tag>),
    },
    { title: '总分', dataIndex: 'total_score', width: 80, render: (v) => v ?? '-' },
    {
      title: '操作',
      width: 200,
      render: (_, record) => {
        // 进行中且未交卷 → 可进入考试
        if (record.status === 'ongoing' && record.record_status !== 'submitted' && record.record_status !== 'graded') {
          return (
            <Button type="primary" onClick={() => navigate(`/student/exam/${record.exam_id}`)}>进入考试</Button>
          );
        }
        // 已交卷或已阅卷 → 查看记录
        if (record.record_status === 'submitted' || record.record_status === 'graded') {
          return (
            <Button onClick={() => navigate(`/student/exam/${record.exam_id}/detail`)}>查看详情</Button>
          );
        }
        return <span style={{ color: '#999' }}>-</span>;
      },
    },
  ];

  // 按状态分组
  const ongoing = data.filter((d) => d.status === 'ongoing');
  const notStarted = data.filter((d) => d.status === 'published');
  const finished = data.filter((d) => d.status === 'finished');

  return (
    <div>
      <Card title="进行中的考试" style={{ marginBottom: 16 }}>
        {ongoing.length > 0 ? (
          <Table rowKey="exam_id" columns={columns} dataSource={ongoing} pagination={false} loading={loading} />
        ) : (
          <Empty description="暂无进行中的考试" />
        )}
      </Card>

      <Card title="待考考试" style={{ marginBottom: 16 }}>
        {notStarted.length > 0 ? (
          <Table rowKey="exam_id" columns={columns} dataSource={notStarted} pagination={false} loading={loading} />
        ) : (
          <Empty description="暂无待考考试" />
        )}
      </Card>

      <Card title="已结束考试">
        {finished.length > 0 ? (
          <Table rowKey="exam_id" columns={columns} dataSource={finished} pagination={false} loading={loading} />
        ) : (
          <Empty description="暂无已结束考试" />
        )}
      </Card>
    </div>
  );
};

export default ExamList;