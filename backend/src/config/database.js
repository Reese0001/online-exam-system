/**
 * Sequelize 数据库连接配置
 * 使用连接池，参数化查询防 SQL 注入
 */
const { Sequelize } = require('sequelize');
const config = require('./config');

const sequelize = new Sequelize(
  config.db.name,
  config.db.user,
  config.db.password,
  {
    host: config.db.host,
    port: config.db.port,
    dialect: 'mysql',
    timezone: '+08:00',
    logQueryParameters: config.app.env === 'development',
    logging: config.app.env === 'development' ? console.log : false,
    pool: {
      min: config.db.pool.min,
      max: config.db.pool.max,
      idle: config.db.pool.idle,
      acquire: 60000,
    },
    define: {
      // 禁用 Sequelize 默认的 createdAt/updatedAt，由各模型自行声明
      timestamps: false,
      // 保留数据库字段下划线命名
      underscored: true,
      // 冻结表名，不自动复数
      freezeTableName: true,
      charset: 'utf8mb4',
      collate: 'utf8mb4_general_ci',
    },
    dialectOptions: {
      charset: 'utf8mb4',
      dateStrings: true,
      typeCast: true,
    },
  }
);

/**
 * 测试数据库连接
 */
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功');
    return true;
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    return false;
  }
}

module.exports = {
  sequelize,
  testConnection,
};