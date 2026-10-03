import { Navigate, useLocation } from 'react-router-dom';
import { Spin } from 'antd';
import useAuthStore from '@/store/authStore';

/**
 * 路由守卫组件
 * - 未登录跳转登录页
 * - 基于角色限制可访问路由（admin/teacher/student）
 * - 支持多角色允许访问
 *
 * 用法：<ProtectedRoute roles={['admin']}><Page /></ProtectedRoute>
 */
const ProtectedRoute = ({ children, roles = [] }) => {
  const location = useLocation();
  const { token, user } = useAuthStore();

  // 未登录跳登录页
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 角色校验：若指定 roles 且当前角色不在允许列表，跳转到该角色的默认页
  if (roles.length > 0 && user && !roles.includes(user.role)) {
    const roleHome = {
      admin: '/admin/users',
      teacher: '/teacher/questions',
      student: '/student/exams',
    };
    return <Navigate to={roleHome[user.role] || '/login'} replace />;
  }

  // 已登录且角色匹配，渲染子组件
  return children;
};

export default ProtectedRoute;