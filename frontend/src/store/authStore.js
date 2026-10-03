import { create } from 'zustand';
import { STORAGE_KEYS } from '@/utils/constants';

/**
 * 认证状态管理（Zustand）
 * 管理：token、用户信息、登录/登出动作
 * 持久化：localStorage 同步 token 与用户信息
 */
const initialToken = localStorage.getItem(STORAGE_KEYS.TOKEN) || '';
const initialUser = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER) || 'null');

export const useAuthStore = create((set) => ({
  // 状态
  token: initialToken,
  user: initialUser, // { id, username, real_name, role, email, phone, class_id, ... }
  loading: false,

  // 计算属性：是否已登录
  isAuthenticated: () => !!initialToken,

  // 设置登录信息（登录成功后调用）
  setAuth: (token, user) => {
    localStorage.setItem(STORAGE_KEYS.TOKEN, token);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    set({ token, user });
  },

  // 更新用户信息（修改个人信息后调用）
  setUser: (user) => {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    set({ user });
  },

  // 登出
  logout: () => {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
    set({ token: '', user: null });
  },

  // 获取当前角色
  getRole: () => {
    const { user } = useAuthStore.getState();
    return user?.role || '';
  },
}));

export default useAuthStore;