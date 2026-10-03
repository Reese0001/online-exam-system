import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Switch,
  message,
  Popconfirm,
  Card,
  Tag,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getPaperList, deletePaper } from '@/api/paper';
import {
  PAPER_STATUS_LABELS,
  DEFAULT_PAGE_SIZE,
} from '@/utils/constants';
import { formatDateTime, getPagination } from '@/utils/helpers';

/**
 * 试卷管理页（教师）
 * - 试卷列表（分页、关键字、状态筛选）
 * - 新增/编辑/删除/预览
 * - 随机组卷入口
 */
const PaperManagement = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [filters, setFilters] = useState({ keyword: undefined, status: undefined });

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getPaperList({ page, pageSize, ...filters });
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
      await deletePaper(id);
      message.success('删除成功');
      loadData();
    } catch {
      // ignore
    }
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: '试卷名称', dataIndex: 'name' },
    { title: '描述', dataIndex: 'description', ellipsis: true, render: (v) => v || '-' },
    { title: '总分', dataIndex: 'total_score', width: 80 },
    { title: '时长(分)', dataIndex: 'duration', width: 90 },
    { title: '及格分', dataIndex: 'pass_score', width: 90 },
    { title: '题目数', dataIndex: 'question_count', width: 80 },
    {
      title: '状态',
      dataIndex: 'status',
      width: 90,
      render: (s) => <Tag color={s === 'published' ? 'green' : 'default'}>{PAPER_STATUS_LABELS[s]}</Tag>,
    },
    { title: '创建人', dataIndex: 'creator_name', width: 100 },
    { title: '创建时间', dataIndex: 'created_at', render: formatDateTime, width: 170 },
    {
      title: '操作',
      width: 260,
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} onClick={() => navigate(`/teacher/papers/edit/${record.id}`)}>编辑/组卷</Button>
          <Popconfirm title="确认删除该试卷？" onConfirm={() => handleDelete(record.id)}>
            <Button size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card title="试卷管理">
      <Space style={{ marginBottom: 16 }} wrap>
        <Select
          placeholder="状态筛选"
          allowClear
          style={{ width: 120 }}
          value={filters.status}
          onChange={(v) => { setFilters({ ...filters, status: v }); setPage(1); }}
          options={Object.entries(PAPER_STATUS_LABELS).map(([value, label]) => ({ value, label }))}
        />
        <Input.Search
          placeholder="搜索试卷名称"
          allowClear
          style={{ width: 200 }}
          onSearch={(v) => { setFilters({ ...filters, keyword: v }); setPage(1); }}
        />
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/teacher/papers/edit')}>新增试卷</Button>
        <Button icon={<ThunderboltOutlined />} onClick={() => navigate('/teacher/papers/auto-generate')}>随机组卷</Button>
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

export default PaperManagement;