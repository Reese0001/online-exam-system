import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  message,
  Popconfirm,
  Card,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, TeamOutlined } from '@ant-design/icons';
import { getClassList, createClass, updateClass, deleteClass, getClassStudents } from '@/api/user';
import { DEFAULT_PAGE_SIZE } from '@/utils/constants';
import { formatDateTime, getPagination } from '@/utils/helpers';

/**
 * 班级管理页（管理员）
 * - 班级列表（分页、关键字搜索）
 * - 新增/编辑/删除班级
 * - 查看班级学生
 */
const ClassManagement = () => {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [keyword, setKeyword] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState(null);
  const [studentVisible, setStudentVisible] = useState(false);
  const [students, setStudents] = useState([]);
  const [form] = Form.useForm();

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getClassList({ page, pageSize, keyword });
      const d = res.data;
      setData(d.list || []);
      setTotal(d.total || 0);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, pageSize, keyword]);

  const handleAdd = () => {
    setEditing(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditing(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    try {
      if (editing) {
        await updateClass(editing.id, values);
        message.success('修改成功');
      } else {
        await createClass(values);
        message.success('新增成功');
      }
      setModalVisible(false);
      loadData();
    } catch {
      // ignore
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteClass(id);
      message.success('删除成功');
      loadData();
    } catch {
      // ignore
    }
  };

  const handleViewStudents = async (id) => {
    try {
      const res = await getClassStudents(id);
      setStudents(res.data || []);
      setStudentVisible(true);
    } catch {
      // ignore
    }
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: '班级名称', dataIndex: 'name' },
    { title: '年级', dataIndex: 'grade', render: (v) => v || '-' },
    { title: '院系', dataIndex: 'department', render: (v) => v || '-' },
    { title: '学生数', dataIndex: 'student_count', render: (v) => v || 0 },
    { title: '创建时间', dataIndex: 'created_at', render: formatDateTime, width: 180 },
    {
      title: '操作',
      width: 280,
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<TeamOutlined />} onClick={() => handleViewStudents(record.id)}>查看学生</Button>
          <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          <Popconfirm title="确认删除该班级？" onConfirm={() => handleDelete(record.id)}>
            <Button size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card title="班级管理">
      <Space style={{ marginBottom: 16 }}>
        <Input.Search
          placeholder="搜索班级名称"
          allowClear
          style={{ width: 240 }}
          onSearch={(v) => { setKeyword(v); setPage(1); }}
        />
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新增班级</Button>
      </Space>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={getPagination(total, page, pageSize, (p, s) => { setPage(p); setPageSize(s); })}
      />

      <Modal
        title={editing ? '编辑班级' : '新增班级'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item name="name" label="班级名称" rules={[{ required: true, message: '请输入班级名称' }]}>
            <Input placeholder="如：计算机2101班" />
          </Form.Item>
          <Form.Item name="grade" label="年级">
            <Input placeholder="如：2021级" />
          </Form.Item>
          <Form.Item name="department" label="院系">
            <Input placeholder="如：计算机学院" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="班级学生列表"
        open={studentVisible}
        onCancel={() => setStudentVisible(false)}
        footer={null}
        width={640}
      >
        <Table
          rowKey="id"
          size="small"
          dataSource={students}
          columns={[
            { title: 'ID', dataIndex: 'id', width: 60 },
            { title: '用户名', dataIndex: 'username' },
            { title: '姓名', dataIndex: 'real_name' },
            { title: '邮箱', dataIndex: 'email', render: (v) => v || '-' },
            { title: '手机', dataIndex: 'phone', render: (v) => v || '-' },
          ]}
          pagination={{ pageSize: 10 }}
        />
      </Modal>
    </Card>
  );
};

export default ClassManagement;