import { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Select,
  Button,
  Space,
  Divider,
  InputNumber,
  message,
} from 'antd';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import {
  QUESTION_TYPES,
  QUESTION_TYPE_LABELS,
  DIFFICULTY_LEVELS,
  OPTION_LABELS,
} from '@/utils/constants';

const { TextArea } = Input;

/**
 * 题目编辑器组件
 * - 用于题库管理的新增/编辑题目
 * - 支持 5 种题型：单选/多选/判断/填空/简答
 * - 选项动态增删
 *
 * Props:
 * - initialValues: 初始值（编辑时传入）
 * - onSubmit: 提交回调 (values) => Promise
 * - onCancel: 取消回调
 */
const QuestionEditor = ({ initialValues, onSubmit, onCancel }) => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const questionType = Form.useWatch('type', form);

  // 初始化表单值
  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue({
        ...initialValues,
        // 多选答案数组转字符串
        answer:
          initialValues.type === 'multiple' && Array.isArray(initialValues.answer)
            ? initialValues.answer.join(',')
            : initialValues.answer,
      });
    } else {
      form.resetFields();
    }
  }, [initialValues, form]);

  // 提交
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      // 多选答案字符串转数组
      if (values.type === 'multiple' && typeof values.answer === 'string') {
        values.answer = values.answer
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
      }
      await onSubmit?.(values);
    } catch (err) {
      // 校验失败
    } finally {
      setSubmitting(false);
    }
  };

  // 是否需要选项（单选/多选）
  const needOptions = [QUESTION_TYPES.SINGLE, QUESTION_TYPES.MULTIPLE].includes(questionType);

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={{
        type: QUESTION_TYPES.SINGLE,
        difficulty: 3,
        score: 5,
        options: [{ label: 'A', text: '' }, { label: 'B', text: '' }, { label: 'C', text: '' }, { label: 'D', text: '' }],
        ...initialValues,
      }}
    >
      <Form.Item name="type" label="题目类型" rules={[{ required: true }]}>
        <Select
          options={Object.entries(QUESTION_TYPE_LABELS).map(([value, label]) => ({
            value,
            label,
          }))}
        />
      </Form.Item>

      <Form.Item name="content" label="题干" rules={[{ required: true, message: '请输入题干' }]}>
        <TextArea rows={4} placeholder="请输入题干内容" maxLength={2000} showCount />
      </Form.Item>

      {/* 选项区（单选/多选） */}
      {needOptions && (
        <Form.List name="options">
          {(fields, { add, remove }) => (
            <div>
              <Divider>选项</Divider>
              {fields.map((field, index) => (
                <Space key={field.key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                  <Form.Item
                    {...field}
                    name={[field.name, 'label']}
                    rules={[{ required: true }]}
                  >
                    <Select
                      style={{ width: 70 }}
                      options={OPTION_LABELS.map((l) => ({ value: l, label: l }))}
                    />
                  </Form.Item>
                  <Form.Item
                    {...field}
                    name={[field.name, 'text']}
                    rules={[{ required: true, message: '请输入选项内容' }]}
                    style={{ flex: 1, minWidth: 400 }}
                  >
                    <Input placeholder={`选项 ${OPTION_LABELS[index] || index + 1} 内容`} />
                  </Form.Item>
                  {fields.length > 2 && (
                    <MinusCircleOutlined onClick={() => remove(field.name)} />
                  )}
                </Space>
              ))}
              <Button
                type="dashed"
                onClick={() => add({ label: OPTION_LABELS[fields.length], text: '' })}
                icon={<PlusOutlined />}
                style={{ width: 200 }}
              >
                添加选项
              </Button>
            </div>
          )}
        </Form.List>
      )}

      {/* 答案 */}
      <Form.Item
        name="answer"
        label="标准答案"
        rules={[{ required: true, message: '请输入标准答案' }]}
        extra={
          questionType === QUESTION_TYPES.MULTIPLE
            ? '多选题答案用英文逗号分隔，如 A,C'
            : questionType === QUESTION_TYPES.JUDGE
            ? '判断题：T 表示正确，F 表示错误'
            : questionType === QUESTION_TYPES.FILL
            ? '填空题：多个空用 ||| 分隔'
            : undefined
        }
      >
        {questionType === QUESTION_TYPES.JUDGE ? (
          <Select
            options={[
              { value: 'T', label: '正确' },
              { value: 'F', label: '错误' },
            ]}
          />
        ) : questionType === QUESTION_TYPES.SHORT ? (
          <TextArea rows={4} placeholder="请输入参考答案" maxLength={2000} showCount />
        ) : (
          <Input placeholder="请输入标准答案" />
        )}
      </Form.Item>

      {/* 解析 */}
      <Form.Item name="analysis" label="答案解析">
        <TextArea rows={3} placeholder="请输入答案解析（选填）" maxLength={1000} showCount />
      </Form.Item>

      {/* 难度与分值 */}
      <Space style={{ display: 'flex' }}>
        <Form.Item name="difficulty" label="难度" rules={[{ required: true }]}>
          <Select options={DIFFICULTY_LEVELS} style={{ width: 120 }} />
        </Form.Item>
        <Form.Item name="score" label="分值" rules={[{ required: true }]}>
          <InputNumber min={0.5} max={100} step={0.5} style={{ width: 120 }} />
        </Form.Item>
        <Form.Item name="knowledge_point" label="知识点">
          <Input placeholder="如：函数极限" style={{ width: 200 }} />
        </Form.Item>
      </Space>

      {/* 操作按钮 */}
      <div style={{ marginTop: 16, textAlign: 'right' }}>
        <Space>
          <Button onClick={onCancel}>取消</Button>
          <Button type="primary" loading={submitting} onClick={handleSubmit}>
            确定
          </Button>
        </Space>
      </div>
    </Form>
  );
};

export default QuestionEditor;