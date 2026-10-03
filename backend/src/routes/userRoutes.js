/**
 * 用户管理路由 /api/users
 */
const express = require('express');
const router = express.Router();
const { auth } = require('../middlewares/auth');
const { requireAdmin } = require('../middlewares/rbac');
const ctrl = require('../controllers/userController');
const v = require('../utils/validator');

// 所有用户管理接口仅管理员可访问
router.use(auth(), requireAdmin());

// GET /api/users - 用户列表
router.get('/', ctrl.list);

// POST /api/users - 创建用户
router.post('/', v.userCreateRules, v.handleValidationErrors, ctrl.create);

// GET /api/users/:id - 用户详情
router.get('/:id', v.idParamRule, v.handleValidationErrors, ctrl.detail);

// PUT /api/users/:id - 修改用户
router.put('/:id', v.idParamRule, v.handleValidationErrors, ctrl.update);

// DELETE /api/users/:id - 删除用户
router.delete('/:id', v.idParamRule, v.handleValidationErrors, ctrl.remove);

// POST /api/users/:id/reset-password - 重置密码
router.post('/:id/reset-password', v.idParamRule, v.resetPasswordRules, v.handleValidationErrors, ctrl.resetPassword);

module.exports = router;