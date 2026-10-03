/**
 * 前端测试环境配置
 * - jsdom 环境补充
 * - mock localStorage
 * - mock matchMedia（Ant Design 依赖）
 */

// 先设置 window mock，再加载 jest-dom（jest-dom 加载时需要 window）
if (typeof window !== 'undefined') {
  window.matchMedia = window.matchMedia || function (query) {
    return {
      matches: false,
      media: query,
      onchange: null,
      addListener: function () {},
      removeListener: function () {},
      addEventListener: function () {},
      removeEventListener: function () {},
      dispatchEvent: function () { return false; },
    };
  };

  window.IntersectionObserver = window.IntersectionObserver || class {
    observe = function () {};
    unobserve = function () {};
    disconnect = function () {};
  };

  window.ResizeObserver = window.ResizeObserver || class {
    observe = function () {};
    unobserve = function () {};
    disconnect = function () {};
  };
}

// 加载 jest-dom 扩展（提供 toBeInTheDocument 等匹配器）
try {
  require('@testing-library/jest-dom');
} catch (e) {
  // 如果 jest-dom 加载失败，忽略
}

// 如果 beforeEach 可用（在 setupFilesAfterEach 中），注册清理逻辑
if (typeof beforeEach === 'function') {
  beforeEach(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.clear();
    }
  });
}