/**
 * 路由聚合
 * 挂载所有业务路由到 /api 前缀
 */
const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const classRoutes = require('./classRoutes');
const questionRoutes = require('./questionRoutes');
const paperRoutes = require('./paperRoutes');
const examRoutes = require('./examRoutes');
const gradeRoutes = require('./gradeRoutes');
const scoreRoutes = require('./scoreRoutes');

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/classes', classRoutes);
router.use('/questions', questionRoutes);
router.use('/papers', paperRoutes);
router.use('/exams', examRoutes);
router.use('/grade-tasks', gradeRoutes);
router.use('/scores', scoreRoutes);

module.exports = router;