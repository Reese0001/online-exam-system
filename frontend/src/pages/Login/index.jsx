import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, message, Spin } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { login } from '@/api/auth';
import useAuthStore from '@/store/authStore';
import { ROLES } from '@/utils/constants';

/**
 * 登录页
 * - 表单验证（用户名/密码必填）
 * - 调用 JWT 登录接口
 * - 登录成功后根据角色跳转到对应首页
 */
const Login = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  // 角色首页映射
  const roleHomeMap = {
    [ROLES.ADMIN]: '/admin/users',
    [ROLES.TEACHER]: '/teacher/questions',
    [ROLES.STUDENT]: '/student/exams',
  };

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const res = await login(values);
      const { token, userInfo } = res.data;
      // 写入状态与 localStorage
      setAuth(token, userInfo);
      message.success('登录成功');
      // 根据角色跳转
      const home = roleHomeMap[userInfo.role] || '/login';
      navigate(home, { replace: true });
    } catch (err) {
      // 错误已在拦截器统一提示
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-title">在线考试系统</div>
        <Spin spinning={loading}>
          <Form
            form={form}
            onFinish={handleSubmit}
            autoComplete="off"
            size="large"
          >
            <Form.Item
              name="username"
              rules={[{ required: true, message: '请输入用户名' }]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="用户名"
                autoFocus
              />
            </Form.Item>
            <Form.Item
              name="password"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="密码"
              />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" block loading={loading}>
                登录
              </Button>
            </Form.Item>
          </Form>
        </Spin>
        <div style={{ textAlign: 'center', color: '#999', fontSize: 12, marginTop: 16 }}>
          毕业设计 · 在线考试系统 © 2026
        </div>
      </div>
    </div>
  );
};

export default Login;