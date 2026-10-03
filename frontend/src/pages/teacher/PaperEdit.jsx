import { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Space,
  Form,
  Input,
  InputNumber,
  Switch,
  Select,
  message,
  Divider,
  Table,
  Modal,
  Tag,
  Empty,
} from 'antd';
import { ArrowLeftOutlined, PlusOutlined, DeleteOutlined, SaveOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import QuestionDisplay from '@/components/QuestionDisplay';
import {
  getPaperDetail,
  createPaper,
  updatePaper,
  addPaperQuestions,
  removePaperQuestion,
} from '@/api/paper';
import { getQuestionList } from '@/api/question';
import {
  QUESTION_TYPE_LABELS,
  QUESTION_TYPE_COLORS,
  PAPER_STATUS_LABELS,
} from '@/utils/constants';

/**
 * 试卷编辑/组卷页（教师）
 * - 编辑试卷基本信息
 * - 手动组卷：从题库选题添加
 * - 调整题目分值与顺序
 * - 试卷预览
 */
const PaperEdit = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const [form] = Form.useForm();
  const [paper, setPaper] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectVisible, setSelectVisible] = useState(false);
  const [questionList, setQuestionList] = useState([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [questionLoading, setQuestionLoading] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);

  // 加载试卷详情
  const loadPaper = async () => {
    if (!isEdit) return;
    setLoading(true);
    try {
      const res = await getPaperDetail(id);
      setPaper(res.data);
      form.setFieldsValue(res.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPaper();
  }, [id]);

  // 保存试卷基本信息
  const handleSave = async () => {
    const values = await form.validateFields();
    setSaving(true);
    try {
      if (isEdit) {
        await updatePaper(id, values);
        message.success('保存成功');
        loadPaper();
      } else {
        const res = await createPaper(values);
        message.success('创建成功');
        navigate(`/teacher/papers/edit/${res.data.id}`, { replace: true });
      }
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  // 打开选题弹窗
  const handleOpenSelect = async () => {
    setSelectVisible(true);
    setQuestionLoading(true);
    try {
      const res = await getQuestionList({ page: 1, pageSize: 100 });
      setQuestionList(res.data.list || []);
    } catch {
      // ignore
    } finally {
      setQuestionLoading(false);
    }
  };

  // 添加选中题目到试卷
  const handleAddQuestions = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择题目');
      return;
    }
    try {
      const questions = selectedRowKeys.map((qid, idx) => {
        const q = questionList.find((item) => item.id === qid);
        return { question_id: qid, score: q?.score || 5, sort_order: (paper?.questions?.length || 0) + idx + 1 };
      });
      await addPaperQuestions(id, { questions });
      message.success(`已添加 ${questions.length} 道题目`);
      setSelectVisible(false);
      setSelectedRowKeys([]);
      loadPaper();
    } catch {
      // ignore
    }
  };

  // 移除题目
  const handleRemoveQuestion = async (questionId) => {
    try {
      await removePaperQuestion(id, questionId);
      message.success('已移除');
      loadPaper();
    } catch {
      // ignore
    }
  };

  const questionColumns = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    {
      title: '类型',
      dataIndex: 'type',
      width: 90,
      render: (t) => <Tag color={QUESTION_TYPE_COLORS[t]}>{QUESTION_TYPE_LABELS[t]}</Tag>,
    },
    { title: '题干', dataIndex: 'content', ellipsis: true },
    { title: '难度', dataIndex: 'difficulty', width: 80 },
    { title: '默认分值', dataIndex: 'score', width: 90 },
  ];

  const paperQuestionColumns = [
    { title: '序号', dataIndex: 'sort_order', width: 70 },
    {
      title: '类型',
      dataIndex: 'type',
      width: 90,
      render: (t) => <Tag color={QUESTION_TYPE_COLORS[t]}>{QUESTION_TYPE_LABELS[t]}</Tag>,
    },
    { title: '题干', dataIndex: 'content', ellipsis: true },
    { title: '分值', dataIndex: 'score', width: 80 },
    {
      title: '操作',
      width: 100,
      render: (_, record) => (
        <Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleRemoveQuestion(record.question_id)}>移除</Button>
      ),
    },
  ];

  return (
    <Card
      title={
        <Space>
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/teacher/papers')} />
          {isEdit ? '编辑试卷' : '新增试卷'}
        </Space>
      }
      loading={loading}
    >
      <Form form={form} layout="vertical" style={{ maxWidth: 600 }}>
        <Form.Item name="name" label="试卷名称" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="description" label="试卷描述">
          <Input.TextArea rows={2} />
        </Form.Item>
        <Space style={{ display: 'flex' }}>
          <Form.Item name="total_score" label="总分" rules={[{ required: true }]}>
            <InputNumber min={1} max={1000} />
          </Form.Item>
          <Form.Item name="duration" label="考试时长(分钟)" rules={[{ required: true }]}>
            <InputNumber min={1} max={300} />
          </Form.Item>
          <Form.Item name="pass_score" label="及格分" rules={[{ required: true }]}>
            <InputNumber min={0} max={1000} />
          </Form.Item>
        </Space>
        <Space style={{ display: 'flex' }}>
          <Form.Item name="is_random_order" label="题目随机顺序" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select
              options={Object.entries(PAPER_STATUS_LABELS).map(([value, label]) => ({ value, label }))}
              style={{ width: 120 }}
            />
          </Form.Item>
        </Space>
        <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={handleSave}>
          {isEdit ? '保存' : '创建'}
        </Button>
      </Form>

      {isEdit && (
        <>
          <Divider>试卷题目</Divider>
          <Space style={{ marginBottom: 16 }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenSelect}>从题库添加题目</Button>
            <Button onClick={() => setPreviewVisible(true)}>试卷预览</Button>
          </Space>
          <Table
            rowKey="question_id"
            columns={paperQuestionColumns}
            dataSource={paper?.questions || []}
            pagination={false}
            locale={{ emptyText: <Empty description="暂无题目，请从题库添加" /> }}
          />
        </>
      )}

      {/* 选题弹窗 */}
      <Modal
        title="从题库选择题目"
        open={selectVisible}
        onOk={handleAddQuestions}
        onCancel={() => { setSelectVisible(false); setSelectedRowKeys([]); }}
        width={800}
      >
        <Table
          rowKey="id"
          columns={questionColumns}
          dataSource={questionList}
          loading={questionLoading}
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
          }}
          pagination={{ pageSize: 8 }}
        />
      </Modal>

      {/* 试卷预览弹窗 */}
      <Modal
        title={`试卷预览 - ${paper?.name || ''}`}
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        footer={null}
        width={800}
      >
        {(paper?.questions || []).map((q, idx) => (
          <div key={q.question_id || q.id} style={{ marginBottom: 24 }}>
            <QuestionDisplay
              question={q}
              index={idx + 1}
              readOnly
              showAnswer
              showAnalysis
            />
            <Divider />
          </div>
        ))}
        {(paper?.questions || []).length === 0 && <Empty description="暂无题目" />}
      </Modal>
    </Card>
  );
};

export default PaperEdit;