import { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Space,
  Form,
  Input,
  DatePicker,
  Select,
  message,
  Divider,
  Table,
  Tag,
} from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { getExamDetail, createExam, updateExam, setExamClasses } from '@/api/exam';
import { getPaperList } from '@/api/paper';
import { getClassList } from '@/api/user';
import { EXAM_STATUS_LABELS } from '@/utils/constants';

const { RangePicker } = DatePicker;

/**
 * 考试编辑页（教师）
 * - 编辑考试基本信息（试卷、时间窗口、状态）
 * - 指定参考班级
 */
const ExamEdit = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [papers, setPapers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedClasses, setSelectedClasses] = useState([]);
  const [exam, setExam] = useState(null);

  // 加载试卷与班级选项
  const loadOptions = async () => {
    try {
      const [paperRes, classRes] = await Promise.all([
        getPaperList({ page: 1, pageSize: 100, status: 'published' }),
        getClassList({ page: 1, pageSize: 100 }),
      ]);
      setPapers(paperRes.data.list || []);
      setClasses(classRes.data.list || []);
    } catch {
      // ignore
    }
  };

  // 加载考试详情
  const loadExam = async () => {
    if (!isEdit) return;
    setLoading(true);
    try {
      const res = await getExamDetail(id);
      const d = res.data;
      setExam(d);
      form.setFieldsValue({
        paper_id: d.paper_id,
        name: d.name,
        time_range: [dayjs(d.start_time), dayjs(d.end_time)],
        status: d.status,
      });
      setSelectedClasses((d.classes || []).map((c) => c.id));
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOptions();
    loadExam();
  }, [id]);

  const handleSave = async () => {
    const values = await form.validateFields();
    const payload = {
      paper_id: values.paper_id,
      name: values.name,
      start_time: values.time_range[0].toISOString(),
      end_time: values.time_range[1].toISOString(),
      status: values.status,
      class_ids: selectedClasses,
    };
    setSaving(true);
    try {
      if (isEdit) {
        await updateExam(id, payload);
        if (selectedClasses.length > 0) {
          await setExamClasses(id, selectedClasses);
        }
        message.success('保存成功');
        loadExam();
      } else {
        const res = await createExam(payload);
        const newId = res.data.id;
        if (selectedClasses.length > 0) {
          await setExamClasses(newId, selectedClasses);
        }
        message.success('创建成功');
        navigate(`/teacher/exams/edit/${newId}`, { replace: true });
      }
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
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/teacher/exams')} />
          {isEdit ? '编辑考试' : '创建考试'}
        </Space>
      }
      loading={loading}
    >
      <Form form={form} layout="vertical" style={{ maxWidth: 600 }}>
        <Form.Item name="name" label="考试名称" rules={[{ required: true }]}>
          <Input placeholder="如：2026春季期末考试" />
        </Form.Item>
        <Form.Item name="paper_id" label="选择试卷" rules={[{ required: true }]}>
          <Select
            placeholder="选择已发布的试卷"
            options={papers.map((p) => ({ value: p.id, label: `${p.name}（总分${p.total_score}分/时长${p.duration}分钟）` }))}
          />
        </Form.Item>
        <Form.Item name="time_range" label="考试时间窗口" rules={[{ required: true }]}>
          <RangePicker
            showTime
            format="YYYY-MM-DD HH:mm"
            style={{ width: '100%' }}
          />
        </Form.Item>
        <Form.Item name="status" label="状态">
          <Select
            options={Object.entries(EXAM_STATUS_LABELS).map(([value, label]) => ({ value, label }))}
            style={{ width: 160 }}
          />
        </Form.Item>

        <Divider>指定参考班级</Divider>
        <Select
          mode="multiple"
          placeholder="选择参考班级"
          style={{ width: '100%' }}
          value={selectedClasses}
          onChange={setSelectedClasses}
          options={classes.map((c) => ({ value: c.id, label: c.name }))}
        />

        <div style={{ marginTop: 24 }}>
          <Space>
            <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={handleSave}>
              {isEdit ? '保存' : '创建'}
            </Button>
            <Button onClick={() => navigate('/teacher/exams')}>取消</Button>
          </Space>
        </div>
      </Form>

      {isEdit && exam?.classes?.length > 0 && (
        <>
          <Divider>已指定班级</Divider>
          <Space wrap>
            {exam.classes.map((c) => (
              <Tag key={c.id} color="blue">{c.name}</Tag>
            ))}
          </Space>
        </>
      )}
    </Card>
  );
};

export default ExamEdit;