import { BrowserRouter } from 'react-router-dom';
import { App as AntdApp } from 'antd';
import AppRoutes from '@/router';

/**
 * 应用根组件
 * - BrowserRouter 路由
 * - AntdApp 提供全局 message/modal 上下文
 * - AppRoutes 路由配置
 */
const App = () => (
  <BrowserRouter>
    <AntdApp>
      <AppRoutes />
    </AntdApp>
  </BrowserRouter>
);

export default App;