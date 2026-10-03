/**
 * 数据库初始化脚本
 * 用法：npm run init-db
 * 功能：
 *   1. 执行 design/database-ddl.sql 创建数据库与表
 *   2. 创建默认管理员账号（admin / admin123）
 */
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const config = require('../config/config');

async function initDatabase() {
  console.log('🔧 开始初始化数据库...\n');

  // 1. 读取 DDL 脚本
  const ddlPath = path.resolve(__dirname, '../../../design/database-ddl.sql');
  if (!fs.existsSync(ddlPath)) {
    console.error('❌ 未找到 DDL 脚本:', ddlPath);
    process.exit(1);
  }
  const ddlContent = fs.readFileSync(ddlPath, 'utf8');

  // 2. 连接 MySQL（不指定数据库）执行 DDL
  const connection = await mysql.createConnection({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    multipleStatements: true,
  });

  console.log('📝 执行 DDL 脚本...');
  await connection.query(ddlContent);
  console.log('✅ 数据库与表创建完成\n');

  // 3. 创建默认管理员账号
  console.log('👤 创建默认管理员账号...');
  const adminHash = await bcrypt.hash('admin123', 10);
  const teacherHash = await bcrypt.hash('teacher123', 10);
  const studentHash = await bcrypt.hash('student123', 10);

  // 检查是否已存在
  const [adminRows] = await connection.query('SELECT id FROM online_exam.users WHERE username = ?', ['admin']);
  if (adminRows.length === 0) {
    await connection.query(
      'INSERT INTO online_exam.users (username, password_hash, real_name, role, status) VALUES (?, ?, ?, ?, ?)',
      ['admin', adminHash, '系统管理员', 'admin', 'active']
    );
    console.log('   ✅ 管理员: admin / admin123');
  } else {
    console.log('   ⏭️  管理员已存在，跳过');
  }

  const [teacherRows] = await connection.query('SELECT id FROM online_exam.users WHERE username = ?', ['teacher']);
  if (teacherRows.length === 0) {
    await connection.query(
      'INSERT INTO online_exam.users (username, password_hash, real_name, role, status) VALUES (?, ?, ?, ?, ?)',
      ['teacher', teacherHash, '张老师', 'teacher', 'active']
    );
    console.log('   ✅ 教师: teacher / teacher123');
  } else {
    console.log('   ⏭️  教师已存在，跳过');
  }

  const [studentRows] = await connection.query('SELECT id FROM online_exam.users WHERE username = ?', ['student']);
  if (studentRows.length === 0) {
    await connection.query(
      'INSERT INTO online_exam.users (username, password_hash, real_name, role, status) VALUES (?, ?, ?, ?, ?)',
      ['student', studentHash, '李同学', 'student', 'active']
    );
    console.log('   ✅ 学生: student / student123');

  } else {
    console.log('   ⏭️  学生已存在，跳过');
  }

  await connection.end();
  console.log('\n🎉 数据库初始化完成！');
  console.log('\n默认账号：');
  console.log('  管理员: admin / admin123');
  console.log('  教师:   teacher / teacher123');
  console.log('  学生:   student / student123');
}

initDatabase().catch(err => {
  console.error('💥 初始化失败:', err.message);
  process.exit(1);
});