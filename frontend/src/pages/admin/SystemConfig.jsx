import { Card, Form, Input, Button, message, Divider, Descriptions, Switch } from 'antd';
import { useState } from 'react';
import { getProfile, updateProfile, updatePassword } from '@/api/auth';
import useAuthStore from '@/store/authStore';

/**
 * 系统配置页（管理员）
 * - 个人信息修改
 * - 修改密码
 * - 系统参数配置（前端展示，后端可扩展）
 */
const SystemConfig = () => {
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const { user, setUser } = useAuthStore();

  // 修改个人信息
  const handleProfile = async () => {
    const values = await profileForm.validateFields();
    setLoading(true);
    try {
      await updateProfile(values);
      message.success('修改成功');
      // 更新本地状态
      if (user) setUser({ ...user, ...values });
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  // 修改密码
  const handlePassword = async () => {
    const values = await passwordForm.validateFields();
    if (values.new_password !== values.confirm_password) {
      message.error('两次输入的新密码不一致');
      return;
    }
    setLoading(true);
    try {
      await updatePassword({
        old_password: values.old_password,
        new_password: values.new_password,
      });
      message.success('密码修改成功');
      passwordForm.resetFields();
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Card title="个人信息" style={{ marginBottom: 16 }}>
        <Form
          form={profileForm}
          layout="vertical"
          initialValues={{
            real_name: user?.real_name,
            email: user?.email,
            phone: user?.phone,
          }}
          style={{ maxWidth: 480 }}
        >
          <Form.Item name="real_name" label="姓名" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="email" label="邮箱">
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="手机号">
            <Input />
          </Form.Item>
          <Button type="primary" loading={loading} onClick={handleProfile}>保存</Button>
        </Form>
      </Card>

      <Card title="修改密码" style={{ marginBottom: 16 }}>
        <Form form={passwordForm} layout="vertical" style={{ maxWidth: 480 }}>
          <Form.Item name="old_password" label="原密码" rules={[{ required: true }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item name="new_password" label="新密码" rules={[{ required: true }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item name="confirm_password" label="确认新密码" rules={[{ required: true }]}>
            <Input.Password />
          </Form.Item>
          <Button type="primary" loading={loading} onClick={handlePassword}>修改密码</Button>
        </Form>
      </Card>

      <Card title="系统参数配置">
        <Descriptions column={1} bordered>
          <Descriptions.Item label="系统名称">在线考试系统</Descriptions.Item>
          <Descriptions.Item label="版本号">V1.0.0</Descriptions.Item>
          <Descriptions.Item label="JWT 有效期">2 小时</Descriptions.Item>
          <Descriptions.Item label="最大切屏次数">3 次</Descriptions.Item>
          <Descriptions.Item label="考试自动交卷">开启</Descriptions.Item>
        </Descriptions>
        <Divider />
        <Form layout="inline" style={{ maxWidth: 600 }}>
          <Form.Item label="允许学生自助注册">
            <Switch defaultChecked={false} />
          </Form.Item>
          <Form.Item label="开启考试防作弊">
            <Switch defaultChecked />
          </Form.Item>
          <Form.Item label="客观题自动阅卷">
            <Switch defaultChecked />
          </Form.Item>
        </Form>
        <div style={{ marginTop: 16 }}>
          <Button type="primary" onClick={() => message.success('配置已保存')}>保存配置</Button>
        </div>
      </Card>
    </div>
  );
};

export default SystemConfig;