import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Avatar, Dropdown, Space, theme } from 'antd';
import {
  UserOutlined,
  TeamOutlined,
  SettingOutlined,
  FileTextOutlined,
  FormOutlined,
  ScheduleOutlined,
  AuditOutlined,
  BarChartOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  ProfileOutlined,

} from '@ant-design/icons';
import useAuthStore from '@/store/authStore';
import { ROLE_LABELS } from '@/utils/constants';

const { Header, Sider, Content } = Layout;

/**
 * 通用后台布局组件
 * - 左侧菜单按角色动态生成
 * - 顶部显示用户信息与登出
 * - 内容区渲染子路由 <Outlet />
 */
const AppLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { token: themeToken } = theme.useToken();

  // 根据角色生成菜单项
  const getMenuItems = () => {
    const role = user?.role;
    if (role === 'admin') {
      return [
        { key: '/admin/users', icon: <UserOutlined />, label: '用户管理' },
        { key: '/admin/classes', icon: <TeamOutlined />, label: '班级管理' },
        { key: '/admin/config', icon: <SettingOutlined />, label: '系统配置' },
      ];
    }
    if (role === 'teacher') {
      return [
        { key: '/teacher/questions', icon: <FileTextOutlined />, label: '题库管理' },
        { key: '/teacher/papers', icon: <FormOutlined />, label: '试卷管理' },
        { key: '/teacher/exams', icon: <ScheduleOutlined />, label: '考试管理' },
        { key: '/teacher/grade', icon: <AuditOutlined />, label: '阅卷中心' },
        { key: '/teacher/scores', icon: <BarChartOutlined />, label: '成绩统计' },
      ];
    }
    if (role === 'student') {
      return [
        { key: '/student/exams', icon: <ProfileOutlined />, label: '考试列表' },
        { key: '/student/scores', icon: <BarChartOutlined />, label: '成绩查询' },
      ];
    }
    return [];
  };

  // 登出处理
  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  // 用户下拉菜单
  const userMenu = {
    items: [
      {
        key: 'profile',
        icon: <UserOutlined />,
        label: '个人信息',
      },
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: '退出登录',
        danger: true,
      },
    ],
    onClick: ({ key }) => {
      if (key === 'logout') handleLogout();
      if (key === 'profile') {
        const role = user?.role;
        if (role === 'admin') navigate('/admin/profile');
        else if (role === 'teacher') navigate('/teacher/profile');
        else if (role === 'student') navigate('/student/profile');
      }
    },
  };

  // 当前选中菜单
  const selectedKey = location.pathname;

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed} theme="dark">
        <div
          style={{
            height: 56,
            margin: 8,
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 600,
            fontSize: collapsed ? 14 : 16,
            background: themeToken.colorPrimary,
          }}
        >
          {collapsed ? '考' : '在线考试系统'}
        </div>
        <Menu
          mode="inline"
          theme="dark"
          selectedKeys={[selectedKey]}
          items={getMenuItems()}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            padding: '0 24px',
            background: themeToken.colorBgContainer,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span
            style={{ fontSize: 18, cursor: 'pointer' }}
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          </span>
          <Dropdown menu={userMenu} placement="bottomRight">
            <Space style={{ cursor: 'pointer' }}>
              <Avatar icon={<UserOutlined />} style={{ background: themeToken.colorPrimary }} />
              <span>{user?.real_name || user?.username}</span>
              <span style={{ color: '#999' }}>({ROLE_LABELS[user?.role] || ''})</span>
            </Space>
          </Dropdown>
        </Header>
        <Content style={{ margin: 16, padding: 24, background: themeToken.colorBgContainer, borderRadius: 8, overflow: 'auto' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default AppLayout;