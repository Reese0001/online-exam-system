import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Card,
  Select,
  Tag,
  Progress,
  message,
  Popconfirm,
} from 'antd';
import { EditOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getGradeTaskList, autoGrade, getGradeProgress } from '@/api/grade';
import { GRADE_TASK_STATUS_LABELS, DEFAULT_PAGE_SIZE } from '@/utils/constants';
import { formatDateTime, getPagination } from '@/utils/helpers';

/**
 * 阅卷中心页（教师）
 * - 阅卷任务列表（分页、状态筛选）
 * - 触发客观题自动阅卷
 * - 查看阅卷进度
 * - 进入手动阅卷
 */
const GradeCenter = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [status, setStatus] = useState(undefined);
  const [progressMap, setProgressMap] = useState({});

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getGradeTaskList({ page, pageSize, status });
      const d = res.data;
      setData(d.list || []);
      setTotal(d.total || 0);
      // 加载每条任务的进度
      d.list?.forEach(async (item) => {
        try {
          const pRes = await getGradeProgress(item.exam_id);
          setProgressMap((prev) => ({ ...prev, [item.id]: pRes.data }));
        } catch {
          // ignore
        }
      });
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, pageSize, status]);

  const handleAutoGrade = async (examId) => {
    try {
      const res = await autoGrade(examId);
      message.success(`自动阅卷完成，共阅卷 ${res.data.graded_count} 份`);
      loadData();
    } catch {
      // ignore
    }
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: '考试ID', dataIndex: 'exam_id', width: 80 },
    { title: '考试名称', dataIndex: 'exam_name' },
    { title: '负责教师', dataIndex: 'teacher_name', width: 100 },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (s) => <Tag color={s === 'finished' ? 'green' : s === 'ongoing' ? 'blue' : 'default'}>{GRADE_TASK_STATUS_LABELS[s]}</Tag>,
    },
    { title: '总数', dataIndex: 'total_count', width: 80 },
    { title: '已阅', dataIndex: 'graded_count', width: 80 },
    {
      title: '进度',
      width: 140,
      render: (_, record) => {
        const p = progressMap[record.id];
        const percent = p?.progress ? Math.round(p.progress * 100) : (record.total_count ? Math.round((record.graded_count / record.total_count) * 100) : 0);
        return <Progress percent={percent} size="small" />;
      },
    },
    { title: '创建时间', dataIndex: 'created_at', render: formatDateTime, width: 170 },
    {
      title: '操作',
      width: 240,
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => navigate(`/teacher/grade/manual/${record.id}`)}>手动阅卷</Button>
          <Popconfirm title="确认触发客观题自动阅卷？" onConfirm={() => handleAutoGrade(record.exam_id)}>
            <Button size="small" icon={<ThunderboltOutlined />}>自动阅卷</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card title="阅卷中心">
      <Space style={{ marginBottom: 16 }}>
        <Select
          placeholder="状态筛选"
          allowClear
          style={{ width: 120 }}
          value={status}
          onChange={(v) => { setStatus(v); setPage(1); }}
          options={Object.entries(GRADE_TASK_STATUS_LABELS).map(([value, label]) => ({ value, label }))}
        />
      </Space>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={getPagination(total, page, pageSize, (p, s) => { setPage(p); setPageSize(s); })}
      />
    </Card>
  );
};

export default GradeCenter;