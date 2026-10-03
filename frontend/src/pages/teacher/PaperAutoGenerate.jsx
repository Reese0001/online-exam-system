import { useState } from 'react';
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
} from 'antd';
import { ArrowLeftOutlined, ThunderboltOutlined, PlusOutlined, MinusCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { autoGeneratePaper } from '@/api/paper';
import { QUESTION_TYPE_LABELS, DIFFICULTY_LEVELS } from '@/utils/constants';

/**
 * 随机组卷页（教师）
 * - 按题型/知识点/难度/数量从题库随机抽题
 * - 多条组卷规则
 */
const PaperAutoGenerate = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const values = await form.validateFields();
    setLoading(true);
    try {
      const res = await autoGeneratePaper(values);
      message.success('随机组卷成功');
      navigate(`/teacher/papers/edit/${res.data.id}`);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card
      title={
        <Space>
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/teacher/papers')} />
          随机组卷
        </Space>
      }
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{ is_random_order: true, rules: [{}] }}
        style={{ maxWidth: 700 }}
      >
        <Form.Item name="name" label="试卷名称" rules={[{ required: true }]}>
          <Input placeholder="如：随机组卷-期末模拟" />
        </Form.Item>
        <Space style={{ display: 'flex' }}>
          <Form.Item name="duration" label="考试时长(分钟)" rules={[{ required: true }]}>
            <InputNumber min={1} max={300} />
          </Form.Item>
          <Form.Item name="pass_score" label="及格分" rules={[{ required: true }]}>
            <InputNumber min={0} max={1000} />
          </Form.Item>
          <Form.Item name="is_random_order" label="题目随机顺序" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Space>

        <Divider>组卷规则</Divider>
        <Form.List name="rules">
          {(fields, { add, remove }) => (
            <div>
              {fields.map((field) => (
                <Space key={field.key} style={{ display: 'flex', marginBottom: 8 }} wrap>
                  <Form.Item
                    {...field}
                    name={[field.name, 'type']}
                    label="题型"
                    rules={[{ required: true }]}
                  >
                    <Select
                      style={{ width: 120 }}
                      options={Object.entries(QUESTION_TYPE_LABELS).map(([value, label]) => ({ value, label }))}
                    />
                  </Form.Item>
                  <Form.Item
                    {...field}
                    name={[field.name, 'count']}
                    label="数量"
                    rules={[{ required: true }]}
                  >
                    <InputNumber min={1} max={50} />
                  </Form.Item>
                  <Form.Item
                    {...field}
                    name={[field.name, 'score']}
                    label="每题分值"
                    rules={[{ required: true }]}
                  >
                    <InputNumber min={0.5} max={100} step={0.5} />
                  </Form.Item>
                  <Form.Item {...field} name={[field.name, 'difficulty']} label="难度">
                    <Select style={{ width: 120 }} allowClear options={DIFFICULTY_LEVELS} />
                  </Form.Item>
                  <Form.Item {...field} name={[field.name, 'knowledge_point']} label="知识点">
                    <Input style={{ width: 150 }} />
                  </Form.Item>
                  <MinusCircleOutlined onClick={() => remove(field.name)} style={{ marginTop: 32 }} />
                </Space>
              ))}
              <Button type="dashed" onClick={() => add()} icon={<PlusOutlined />} style={{ width: 200 }}>
                添加规则
              </Button>
            </div>
          )}
        </Form.List>

        <div style={{ marginTop: 24 }}>
          <Space>
            <Button type="primary" icon={<ThunderboltOutlined />} loading={loading} onClick={handleSubmit}>
              生成试卷
            </Button>
            <Button onClick={() => navigate('/teacher/papers')}>取消</Button>
          </Space>
        </div>
      </Form>
    </Card>
  );
};

export default PaperAutoGenerate;