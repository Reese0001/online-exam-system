/**
 * 路由守卫组件测试
 * 关联需求：FR-01-03(角色权限控制) / NFR-06(RBAC鉴权)
 * 关联用例：UC_RBAC
 * 测试用例：TC-COMP-PR-001 ~ TC-COMP-PR-005
 */
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from '@/components/ProtectedRoute';

// mock authStore
jest.mock('@/store/authStore', () => ({
  __esModule: true,
  default: jest.fn(),
}));

import useAuthStore from '@/store/authStore';

function renderWithRouter(ui, initialPath = '/admin') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/login" element={<div data-testid="login-page">登录页</div>} />
        <Route path="/admin/users" element={<div data-testid="admin-home">管理员首页</div>} />
        <Route path="/teacher/questions" element={<div data-testid="teacher-home">教师首页</div>} />
        <Route path="/student/exams" element={<div data-testid="student-home">学生首页</div>} />
        <Route path="*" element={ui} />
      </Routes>
    </MemoryRouter>
  );
}

describe('ProtectedRoute 组件 - TC-COMP-PR', () => {
  beforeEach(() => {
    useAuthStore.mockReturnValue({ token: '', user: null });
  });

  describe('TC-COMP-PR-001 未登录跳转登录页（关联 FR-01-03）', () => {
    it('无 token 应重定向到 /login', () => {
      useAuthStore.mockReturnValue({ token: '', user: null });
      renderWithRouter(
        <ProtectedRoute><div data-testid="protected">受保护内容</div></ProtectedRoute>
      );
      expect(screen.getByTestId('login-page')).toBeInTheDocument();
      expect(screen.queryByTestId('protected')).not.toBeInTheDocument();
    });
  });

  describe('TC-COMP-PR-002 已登录且角色匹配应渲染子组件', () => {
    it('admin 访问 admin 路由', () => {
      useAuthStore.mockReturnValue({
        token: 'fake-token',
        user: { id: 1, role: 'admin' },
      });
      renderWithRouter(
        <ProtectedRoute roles={['admin']}><div data-testid="protected">管理员内容</div></ProtectedRoute>
      );
      expect(screen.getByTestId('protected')).toBeInTheDocument();
    });
  });

  describe('TC-COMP-PR-003 角色不匹配应跳转对应首页（关联 FR-01-03）', () => {
    it('student 访问 admin 路由应跳转学生首页', () => {
      useAuthStore.mockReturnValue({
        token: 'fake-token',
        user: { id: 10, role: 'student' },
      });
      renderWithRouter(
        <ProtectedRoute roles={['admin']}><div data-testid="protected">管理员内容</div></ProtectedRoute>
      );
      expect(screen.getByTestId('student-home')).toBeInTheDocument();
      expect(screen.queryByTestId('protected')).not.toBeInTheDocument();
    });

    it('teacher 访问 student 路由应跳转教师首页', () => {
      useAuthStore.mockReturnValue({
        token: 'fake-token',
        user: { id: 2, role: 'teacher' },
      });
      renderWithRouter(
        <ProtectedRoute roles={['student']}><div data-testid="protected">学生内容</div></ProtectedRoute>
      );
      expect(screen.getByTestId('teacher-home')).toBeInTheDocument();
    });
  });

  describe('TC-COMP-PR-004 未指定 roles 时已登录即可访问', () => {
    it('任意角色均可访问', () => {
      useAuthStore.mockReturnValue({
        token: 'fake-token',
        user: { id: 1, role: 'student' },
      });
      renderWithRouter(
        <ProtectedRoute><div data-testid="protected">公共内容</div></ProtectedRoute>
      );
      expect(screen.getByTestId('protected')).toBeInTheDocument();
    });
  });

  describe('TC-COMP-PR-005 多角色允许访问', () => {
    it('admin 或 teacher 均可访问', () => {
      useAuthStore.mockReturnValue({
        token: 'fake-token',
        user: { id: 2, role: 'teacher' },
      });
      renderWithRouter(
        <ProtectedRoute roles={['admin', 'teacher']}><div data-testid="protected">内容</div></ProtectedRoute>
      );
      expect(screen.getByTestId('protected')).toBeInTheDocument();
    });
  });
});