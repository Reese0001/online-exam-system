import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  message,
  Popconfirm,
  Card,
  Select,
  Input,
  Tag,
  Modal,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SendOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getExamList, deleteExam, publishExam, updateExamStatus } from '@/api/exam';
import {
  EXAM_STATUS_LABELS,
  EXAM_STATUS_COLORS,
  DEFAULT_PAGE_SIZE,
} from '@/utils/constants';
import { formatDateTime, getPagination } from '@/utils/helpers';

/**
 * 考试管理页（教师）
 * - 考试列表（分页、状态筛选、关键字搜索）
 * - 创建/编辑/删除考试
 * - 发布考试、状态管理
 */
const ExamManagement = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [filters, setFilters] = useState({ status: undefined, keyword: undefined });

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getExamList({ page, pageSize, ...filters });
      const d = res.data;
      setData(d.list || []);
      setTotal(d.total || 0);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, pageSize, filters]);

  const handleDelete = async (id) => {
    try {
      await deleteExam(id);
      message.success('删除成功');
      loadData();
    } catch {
      // ignore
    }
  };

  const handlePublish = async (id) => {
    try {
      await publishExam(id);
      message.success('发布成功');
      loadData();
    } catch {
      // ignore
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await updateExamStatus(id, status);
      message.success('状态更新成功');
      loadData();
    } catch {
      // ignore
    }
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: '考试名称', dataIndex: 'name' },
    { title: '试卷', dataIndex: 'paper_name' },
    { title: '开始时间', dataIndex: 'start_time', render: formatDateTime, width: 170 },
    { title: '结束时间', dataIndex: 'end_time', render: formatDateTime, width: 170 },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (s) => <Tag color={EXAM_STATUS_COLORS[s]}>{EXAM_STATUS_LABELS[s]}</Tag>,
    },
    { title: '班级数', dataIndex: 'class_count', width: 80 },
    { title: '学生数', dataIndex: 'student_count', width: 80 },
    { title: '创建人', dataIndex: 'creator_name', width: 100 },
    {
      title: '操作',
      width: 280,
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => navigate(`/teacher/exams/edit/${record.id}`)}>编辑</Button>
          {record.status === 'draft' && (
            <Popconfirm title="确认发布该考试？" onConfirm={() => handlePublish(record.id)}>
              <Button size="small" type="primary" icon={<SendOutlined />}>发布</Button>
            </Popconfirm>
          )}
          {record.status !== 'ongoing' && record.status !== 'finished' && (
            <Popconfirm title="确认删除该考试？" onConfirm={() => handleDelete(record.id)}>
              <Button size="small" danger icon={<DeleteOutlined />}>删除</Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Card title="考试管理">
      <Space style={{ marginBottom: 16 }} wrap>
        <Select
          placeholder="状态筛选"
          allowClear
          style={{ width: 120 }}
          value={filters.status}
          onChange={(v) => { setFilters({ ...filters, status: v }); setPage(1); }}
          options={Object.entries(EXAM_STATUS_LABELS).map(([value, label]) => ({ value, label }))}
        />
        <Input.Search
          placeholder="搜索考试名称"
          allowClear
          style={{ width: 200 }}
          onSearch={(v) => { setFilters({ ...filters, keyword: v }); setPage(1); }}
        />
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/teacher/exams/edit')}>创建考试</Button>
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

export default ExamManagement;