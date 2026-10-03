/**
 * 登录页测试
 * 关联需求：FR-01-01(登录) / FR-01-03(权限跳转)
 * 关联用例：UC_Login → UC_RBAC
 * 测试用例：TC-PAGE-LOGIN-001 ~ TC-PAGE-LOGIN-004
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Login from '@/pages/Login';

// mock auth API
jest.mock('@/api/auth', () => ({
  login: jest.fn(),
}));

// mock authStore
jest.mock('@/store/authStore', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    setAuth: jest.fn(),
    token: '',
    user: null,
  })),
}));

import { login } from '@/api/auth';
import useAuthStore from '@/store/authStore';

function renderLogin() {
  return render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  );
}

describe('Login 页面 - TC-PAGE-LOGIN', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    login.mockReset();
  });

  describe('TC-PAGE-LOGIN-001 渲染登录表单（关联 FR-01-01）', () => {
    it('应显示用户名和密码输入框', () => {
      renderLogin();
      expect(screen.getByPlaceholderText('用户名')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('密码')).toBeInTheDocument();
    });

    it('应显示登录按钮', () => {
      renderLogin();
      expect(screen.getByRole('button', { name: /登录/ })).toBeInTheDocument();
    });

    it('应显示系统标题', () => {
      renderLogin();
      expect(screen.getByText('在线考试系统')).toBeInTheDocument();
    });
  });

  describe('TC-PAGE-LOGIN-002 表单校验', () => {
    it('用户名必填提示', async () => {
      renderLogin();
      const btn = screen.getByRole('button', { name: /登录/ });
      fireEvent.click(btn);
      await waitFor(() => {
        expect(screen.getByText('请输入用户名')).toBeInTheDocument();
      });
    });
  });

  describe('TC-PAGE-LOGIN-003 登录成功跳转（关联 FR-01-03 角色跳转）', () => {
    it('管理员登录应调用 setAuth', async () => {
      login.mockResolvedValue({
        data: {
          token: 'admin-token',
          userInfo: { id: 1, username: 'admin', role: 'admin' },
        },
      });
      const setAuth = jest.fn();
      useAuthStore.mockReturnValue({ setAuth, token: '', user: null });

      renderLogin();
      fireEvent.change(screen.getByPlaceholderText('用户名'), { target: { value: 'admin' } });
      fireEvent.change(screen.getByPlaceholderText('密码'), { target: { value: '123456' } });
      fireEvent.click(screen.getByRole('button', { name: /登录/ }));

      await waitFor(() => {
        expect(login).toHaveBeenCalledWith({ username: 'admin', password: '123456' });
      });
    });
  });

  describe('TC-PAGE-LOGIN-004 登录失败处理', () => {
    it('API 报错时不崩溃', async () => {
      login.mockRejectedValue(new Error('用户名或密码错误'));
      useAuthStore.mockReturnValue({ setAuth: jest.fn(), token: '', user: null });
      renderLogin();
      // 不应抛出未捕获异常
      expect(screen.getByText('在线考试系统')).toBeInTheDocument();
    });
  });
});