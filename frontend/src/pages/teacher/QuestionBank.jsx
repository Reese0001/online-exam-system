import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Modal,
  message,
  Popconfirm,
  Card,
  Select,
  Input,
  Upload,
  Tag,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ImportOutlined,
  ExportOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import {
  getQuestionList,
  deleteQuestion,
  importQuestions,
  exportQuestions,
} from '@/api/question';
import {
  QUESTION_TYPE_LABELS,
  QUESTION_TYPE_COLORS,
  DIFFICULTY_LEVELS,
  DIFFICULTY_LABELS,
  DEFAULT_PAGE_SIZE,
} from '@/utils/constants';
import { formatDateTime, getPagination, downloadBlob } from '@/utils/helpers';

/**
 * 题库管理页（教师）
 * - 题目列表（分页、按类型/难度/知识点筛选、关键字搜索）
 * - 新增/编辑（跳转题目编辑页）/删除
 * - Excel 批量导入/导出
 */
const QuestionBank = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [filters, setFilters] = useState({ type: undefined, difficulty: undefined, knowledge_point: undefined, keyword: undefined });

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getQuestionList({ page, pageSize, ...filters });
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

  // 删除
  const handleDelete = async (id) => {
    try {
      await deleteQuestion(id);
      message.success('删除成功');
      loadData();
    } catch {
      // ignore
    }
  };

  // 导入
  const handleImport = async (file) => {
    try {
      const res = await importQuestions(file);
      const { success_count, fail_count } = res.data;
      message.success(`导入完成：成功 ${success_count} 条，失败 ${fail_count} 条`);
      loadData();
    } catch {
      // ignore
    }
    return false; // 阻止 antd 默认上传
  };

  // 导出
  const handleExport = async () => {
    try {
      const res = await exportQuestions({ type: filters.type, difficulty: filters.difficulty });
      downloadBlob(res.data, `题目导出_${Date.now()}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      message.success('导出成功');
    } catch {
      // ignore
    }
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    {
      title: '类型',
      dataIndex: 'type',
      width: 90,
      render: (t) => <Tag color={QUESTION_TYPE_COLORS[t]}>{QUESTION_TYPE_LABELS[t]}</Tag>,
    },
    { title: '题干', dataIndex: 'content', ellipsis: true, render: (v) => v?.slice(0, 60) },
    { title: '知识点', dataIndex: 'knowledge_point', render: (v) => v || '-', width: 120 },
    {
      title: '难度',
      dataIndex: 'difficulty',
      width: 90,
      render: (d) => <Tag>{DIFFICULTY_LABELS[d]}</Tag>,
    },
    { title: '分值', dataIndex: 'score', width: 80 },
    { title: '创建人', dataIndex: 'creator_name', width: 100 },
    { title: '创建时间', dataIndex: 'created_at', render: formatDateTime, width: 170 },
    {
      title: '操作',
      width: 160,
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => navigate(`/teacher/questions/edit/${record.id}`)}>编辑</Button>
          <Popconfirm title="确认删除该题目？" onConfirm={() => handleDelete(record.id)}>
            <Button size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card title="题库管理">
      <Space style={{ marginBottom: 16 }} wrap>
        <Select
          placeholder="题型筛选"
          allowClear
          style={{ width: 120 }}
          value={filters.type}
          onChange={(v) => { setFilters({ ...filters, type: v }); setPage(1); }}
          options={Object.entries(QUESTION_TYPE_LABELS).map(([value, label]) => ({ value, label }))}
        />
        <Select
          placeholder="难度筛选"
          allowClear
          style={{ width: 120 }}
          value={filters.difficulty}
          onChange={(v) => { setFilters({ ...filters, difficulty: v }); setPage(1); }}
          options={DIFFICULTY_LEVELS}
        />
        <Input
          placeholder="知识点筛选"
          allowClear
          style={{ width: 160 }}
          value={filters.knowledge_point}
          onChange={(e) => setFilters({ ...filters, knowledge_point: e.target.value || undefined })}
        />
        <Input.Search
          placeholder="搜索题干"
          allowClear
          style={{ width: 200 }}
          onSearch={(v) => { setFilters({ ...filters, keyword: v }); setPage(1); }}
          enterButton={<SearchOutlined />}
        />
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/teacher/questions/edit')}>新增题目</Button>
        <Upload accept=".xlsx,.xls" beforeUpload={handleImport} showUploadList={false}>
          <Button icon={<ImportOutlined />}>批量导入</Button>
        </Upload>
        <Button icon={<ExportOutlined />} onClick={handleExport}>批量导出</Button>
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

export default QuestionBank;