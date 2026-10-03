import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  Tag,
  message,
  Popconfirm,
  Card,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  KeyOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import {
  getUserList,
  createUser,
  updateUser,
  deleteUser,
  resetPassword,
  getClassList,
} from '@/api/user';
import {
  ROLES,
  ROLE_LABELS,
  USER_STATUS_LABELS,
  DEFAULT_PAGE_SIZE,
} from '@/utils/constants';
import { formatDateTime, getPagination } from '@/utils/helpers';

/**
 * 用户管理页（管理员）
 * - 用户列表（分页、角色筛选、关键字搜索、班级筛选）
 * - 新增/编辑/删除用户
 * - 重置密码
 */
const UserManagement = () => {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [filters, setFilters] = useState({ role: undefined, keyword: undefined, class_id: undefined });
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [resetVisible, setResetVisible] = useState(false);
  const [resetUser, setResetUser] = useState(null);
  const [classes, setClasses] = useState([]);
  const [form] = Form.useForm();
  const [resetForm] = Form.useForm();

  // 加载用户列表
  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getUserList({ page, pageSize, ...filters });
      const d = res.data;
      setData(d.list || []);
      setTotal(d.total || 0);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  // 加载班级列表（用于筛选与表单选择）
  const loadClasses = async () => {
    try {
      const res = await getClassList({ page: 1, pageSize: 100 });
      setClasses(res.data.list || []);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadData();
  }, [page, pageSize, filters]);

  useEffect(() => {
    loadClasses();
  }, []);

  // 新增
  const handleAdd = () => {
    setEditingUser(null);
    form.resetFields();
    setModalVisible(true);
  };

  // 编辑
  const handleEdit = (record) => {
    setEditingUser(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  // 提交表单
  const handleSubmit = async () => {
    const values = await form.validateFields();
    try {
      if (editingUser) {
        await updateUser(editingUser.id, values);
        message.success('修改成功');
      } else {
        await createUser(values);
        message.success('新增成功');
      }
      setModalVisible(false);
      loadData();
    } catch {
      // ignore
    }
  };

  // 删除
  const handleDelete = async (id) => {
    try {
      await deleteUser(id);
      message.success('删除成功');
      loadData();
    } catch {
      // ignore
    }
  };

  // 重置密码
  const handleReset = async () => {
    const values = await resetForm.validateFields();
    try {
      await resetPassword(resetUser.id, values);
      message.success('重置成功');
      setResetVisible(false);
      resetForm.resetFields();
    } catch {
      // ignore
    }
  };

  // 表格列
  const columns = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: '用户名', dataIndex: 'username' },
    { title: '姓名', dataIndex: 'real_name' },
    {
      title: '角色',
      dataIndex: 'role',
      render: (role) => <Tag color={role === 'admin' ? 'red' : role === 'teacher' ? 'blue' : 'green'}>{ROLE_LABELS[role]}</Tag>,
    },
    { title: '班级', dataIndex: 'class_name', render: (v) => v || '-' },
    { title: '邮箱', dataIndex: 'email', render: (v) => v || '-' },
    { title: '手机', dataIndex: 'phone', render: (v) => v || '-' },
    {
      title: '状态',
      dataIndex: 'status',
      render: (s) => <Tag color={s === 'active' ? 'green' : 'default'}>{USER_STATUS_LABELS[s]}</Tag>,
    },
    { title: '创建时间', dataIndex: 'created_at', render: formatDateTime, width: 180 },
    {
      title: '操作',
      width: 240,
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          <Button size="small" icon={<KeyOutlined />} onClick={() => { setResetUser(record); setResetVisible(true); }}>重置密码</Button>
          <Popconfirm title="确认删除该用户？" onConfirm={() => handleDelete(record.id)}>
            <Button size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card title="用户管理">
      <Space style={{ marginBottom: 16 }} wrap>
        <Select
          placeholder="角色筛选"
          allowClear
          style={{ width: 120 }}
          value={filters.role}
          onChange={(v) => { setFilters({ ...filters, role: v }); setPage(1); }}
          options={Object.entries(ROLE_LABELS).map(([value, label]) => ({ value, label }))}
        />
        <Select
          placeholder="班级筛选"
          allowClear
          style={{ width: 160 }}
          value={filters.class_id}
          onChange={(v) => { setFilters({ ...filters, class_id: v }); setPage(1); }}
          options={classes.map((c) => ({ value: c.id, label: c.name }))}
        />
        <Input.Search
          placeholder="搜索用户名/姓名"
          allowClear
          style={{ width: 200 }}
          onSearch={(v) => { setFilters({ ...filters, keyword: v }); setPage(1); }}
          enterButton={<SearchOutlined />}
        />
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新增用户</Button>
      </Space>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={getPagination(total, page, pageSize, (p, s) => { setPage(p); setPageSize(s); })}
      />

      {/* 新增/编辑弹窗 */}
      <Modal
        title={editingUser ? '编辑用户' : '新增用户'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={560}
        destroyOnClose
      >
        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item name="username" label="用户名" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input disabled={!!editingUser} />
          </Form.Item>
          {!editingUser && (
            <Form.Item name="password" label="密码" rules={[{ required: true, message: '请输入密码' }]}>
              <Input.Password />
            </Form.Item>
          )}
          <Form.Item name="real_name" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="role" label="角色" rules={[{ required: true }]}>
            <Select
              options={Object.entries(ROLE_LABELS).map(([value, label]) => ({ value, label }))}
              disabled={!!editingUser}
            />
          </Form.Item>
          <Form.Item name="class_id" label="班级">
            <Select
              allowClear
              placeholder="选择班级（学生必选）"
              options={classes.map((c) => ({ value: c.id, label: c.name }))}
            />
          </Form.Item>
          <Form.Item name="email" label="邮箱">
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="手机号">
            <Input />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select
              options={Object.entries(USER_STATUS_LABELS).map(([value, label]) => ({ value, label }))}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 重置密码弹窗 */}
      <Modal
        title={`重置密码 - ${resetUser?.username || ''}`}
        open={resetVisible}
        onOk={handleReset}
        onCancel={() => setResetVisible(false)}
        destroyOnClose
      >
        <Form form={resetForm} layout="vertical" preserve={false}>
          <Form.Item name="new_password" label="新密码" rules={[{ required: true, message: '请输入新密码' }]}>
            <Input.Password />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default UserManagement;