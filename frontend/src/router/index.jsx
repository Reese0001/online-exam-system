import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Spin } from 'antd';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppLayout from '@/components/Layout';
import { ROLES } from '@/utils/constants';

// 懒加载页面组件，优化首屏加载
const Login = lazy(() => import('@/pages/Login'));

// 管理员页面
const UserManagement = lazy(() => import('@/pages/admin/UserManagement'));
const ClassManagement = lazy(() => import('@/pages/admin/ClassManagement'));
const SystemConfig = lazy(() => import('@/pages/admin/SystemConfig'));

// 教师页面
const QuestionBank = lazy(() => import('@/pages/teacher/QuestionBank'));
const QuestionEdit = lazy(() => import('@/pages/teacher/QuestionEdit'));
const PaperManagement = lazy(() => import('@/pages/teacher/PaperManagement'));
const PaperEdit = lazy(() => import('@/pages/teacher/PaperEdit'));
const PaperAutoGenerate = lazy(() => import('@/pages/teacher/PaperAutoGenerate'));
const ExamManagement = lazy(() => import('@/pages/teacher/ExamManagement'));
const ExamEdit = lazy(() => import('@/pages/teacher/ExamEdit'));
const GradeCenter = lazy(() => import('@/pages/teacher/GradeCenter'));
const ManualGrade = lazy(() => import('@/pages/teacher/ManualGrade'));
const ScoreStatistics = lazy(() => import('@/pages/teacher/ScoreStatistics'));

// 学生页面
const ExamList = lazy(() => import('@/pages/student/ExamList'));
const ExamPage = lazy(() => import('@/pages/student/ExamPage'));
const ScoreQuery = lazy(() => import('@/pages/student/ScoreQuery'));
const AnswerDetail = lazy(() => import('@/pages/student/AnswerDetail'));

// 懒加载 Suspense 兜底
const LazyFallback = () => (
  <div style={{ textAlign: 'center', padding: 100 }}>
    <Spin size="large" tip="加载中..." />
  </div>
);

/**
 * 路由配置
 * - 登录页无需权限
 * - admin/teacher/student 各自路由由 ProtectedRoute 守卫
 * - 使用 AppLayout 作为后台布局（含侧边栏、头部）
 * - 学生在线答题页不使用后台布局（全屏考试）
 */
const AppRoutes = () => (
  <Suspense fallback={<LazyFallback />}>
    <Routes>
      {/* 登录页 */}
      <Route path="/login" element={<Login />} />

      {/* 管理员路由 */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute roles={[ROLES.ADMIN]}>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/admin/users" replace />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="classes" element={<ClassManagement />} />
        <Route path="config" element={<SystemConfig />} />
        <Route path="profile" element={<SystemConfig />} />
      </Route>

      {/* 教师路由 */}
      <Route
        path="/teacher"
        element={
          <ProtectedRoute roles={[ROLES.TEACHER]}>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/teacher/questions" replace />} />
        <Route path="questions" element={<QuestionBank />} />
        <Route path="questions/edit" element={<QuestionEdit />} />
        <Route path="questions/edit/:id" element={<QuestionEdit />} />
        <Route path="papers" element={<PaperManagement />} />
        <Route path="papers/edit" element={<PaperEdit />} />
        <Route path="papers/edit/:id" element={<PaperEdit />} />
        <Route path="papers/auto-generate" element={<PaperAutoGenerate />} />
        <Route path="exams" element={<ExamManagement />} />
        <Route path="exams/edit" element={<ExamEdit />} />
        <Route path="exams/edit/:id" element={<ExamEdit />} />
        <Route path="grade" element={<GradeCenter />} />
        <Route path="grade/manual/:id" element={<ManualGrade />} />
        <Route path="scores" element={<ScoreStatistics />} />
        <Route path="profile" element={<SystemConfig />} />
      </Route>

      {/* 学生路由 - 后台布局页 */}
      <Route
        path="/student"
        element={
          <ProtectedRoute roles={[ROLES.STUDENT]}>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/student/exams" replace />} />
        <Route path="exams" element={<ExamList />} />
        <Route path="scores" element={<ScoreQuery />} />
        <Route path="profile" element={<SystemConfig />} />
      </Route>

      {/* 学生在线答题页 - 独立全屏，不使用后台布局 */}
      <Route
        path="/student/exam/:id"
        element={
          <ProtectedRoute roles={[ROLES.STUDENT]}>
            <ExamPage />
          </ProtectedRoute>
        }
      />
      {/* 学生答题详情页 - 独立页面 */}
      <Route
        path="/student/exam/:id/detail"
        element={
          <ProtectedRoute roles={[ROLES.STUDENT]}>
            <AnswerDetail />
          </ProtectedRoute>
        }
      />

      {/* 默认重定向到登录页 */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  </Suspense>
);

export default AppRoutes;