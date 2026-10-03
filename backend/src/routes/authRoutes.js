/**
 * 认证路由
 * /api/auth/login、/api/auth/register、/api/auth/profile、/api/auth/password
 */
const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { auth } = require('../middlewares/auth');
const ctrl = require('../controllers/authController');
const v = require('../utils/validator');

// 登录接口限流：5次/分钟
const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { code: 429, message: '登录尝试过于频繁，请稍后再试', data: null },
});

// POST /api/auth/login - 用户登录（无需认证）
router.post('/login', loginLimiter, v.loginRules, v.handleValidationErrors, ctrl.login);

// POST /api/auth/register - 用户注册（无需认证）
router.post('/register', v.registerRules, v.handleValidationErrors, ctrl.register);

// GET /api/auth/profile - 获取当前用户信息（需认证）
router.get('/profile', auth(), ctrl.getProfile);

// PUT /api/auth/profile - 修改个人信息
router.put('/profile', auth(), ctrl.updateProfile);

// PUT /api/auth/password - 修改密码
router.put('/password', auth(), v.changePasswordRules, v.handleValidationErrors, ctrl.changePassword);

module.exports = router;