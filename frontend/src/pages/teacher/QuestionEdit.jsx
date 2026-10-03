import { useState, useEffect } from 'react';
import { Card, Button, Space, message, Spin } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeftOutlined } from '@ant-design/icons';
import QuestionEditor from '@/components/QuestionEditor';
import { getQuestionDetail, createQuestion, updateQuestion } from '@/api/question';

/**
 * 题目编辑页（教师）
 * - 新增/编辑题目
 * - 使用 QuestionEditor 组件
 */
const QuestionEdit = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const [initialValues, setInitialValues] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEdit) {
      const load = async () => {
        setLoading(true);
        try {
          const res = await getQuestionDetail(id);
          setInitialValues(res.data);
        } catch {
          // ignore
        } finally {
          setLoading(false);
        }
      };
      load();
    }
  }, [id, isEdit]);

  const handleSubmit = async (values) => {
    try {
      if (isEdit) {
        await updateQuestion(id, values);
        message.success('修改成功');
      } else {
        await createQuestion(values);
        message.success('新增成功');
      }
      navigate('/teacher/questions');
    } catch {
      // ignore
    }
  };

  return (
    <Card
      title={
        <Space>
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/teacher/questions')} />
          {isEdit ? '编辑题目' : '新增题目'}
        </Space>
      }
    >
      <Spin spinning={loading}>
        <QuestionEditor
          initialValues={initialValues}
          onSubmit={handleSubmit}
          onCancel={() => navigate('/teacher/questions')}
        />
      </Spin>
    </Card>
  );
};

export default QuestionEdit;