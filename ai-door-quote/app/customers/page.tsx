'use client';
// @ts-nocheck

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Table, Button, Input, Modal, Form, message, Typography, Space, Popconfirm, Tag, Card } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';

const { Title } = Typography;
const { TextArea } = Input;

interface Customer {
  id: number;
  name: string;
  phone: string;
  address?: string;
  remark?: string;
  total_quotes: number;
  total_deals: number;
  total_amount: number;
  last_quote_date?: string;
  created_at: string;
}

export default function CustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchText, setSearchText] = useState('');
  const [form] = Form.useForm();

  // 加载客户列表
  const loadCustomers = async () => {
    setLoading(true);
    try {
      const url = searchText
        ? '/api/customers?userId=1&keyword=' + encodeURIComponent(searchText)
        : '/api/customers?userId=1';
      const res = await fetch(url);
      const result = await res.json();
      setCustomers(result.data || []);
    } catch (err) {
      message.error('加载客户列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCustomers(); }, []);

  // 打开新增弹窗
  const handleAdd = () => {
    setEditingId(null);
    form.resetFields();
    setModalOpen(true);
  };

  // 打开编辑弹窗
  const handleEdit = (record: Customer) => {
    setEditingId(record.id);
    form.setFieldsValue({
      name: record.name,
      phone: record.phone,
      address: record.address || '',
      remark: record.remark || '',
    });
    setModalOpen(true);
  };

  // 提交表单
  const handleSubmit = async () => {
    const values = await form.validateFields();
    try {
      if (editingId) {
        // 编辑
        const res = await fetch('/api/customers', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...values, id: editingId }),
        });
        const result = await res.json();
        if (result.success) {
          message.success('客户信息已更新');
          setModalOpen(false);
          loadCustomers();
        }
      } else {
        // 新增
        const res = await fetch('/api/customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...values, user_id: 1 }),
        });
        const result = await res.json();
        if (result.success) {
          message.success('客户添加成功');
          setModalOpen(false);
          loadCustomers();
        }
      }
    } catch (err) {
      message.error('操作失败');
    }
  };

  // 删除客户
  const handleDelete = async (id: number) => {
    try {
      const res = await fetch('/api/customers?id=' + id, { method: 'DELETE' });
      const result = await res.json();
      if (result.success) {
        message.success('客户已删除');
        loadCustomers();
      }
    } catch (err) {
      message.error('删除失败');
    }
  };

  // 表格列定义
  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: '客户姓名', dataIndex: 'name', key: 'name', width: 120, render: (v: string) => <strong>{v}</strong> },
    { title: '联系电话', dataIndex: 'phone', key: 'phone', width: 140 },
    { title: '安装地址', dataIndex: 'address', key: 'address', ellipsis: true },
    {
      title: '报价次数',
      dataIndex: 'total_quotes',
      key: 'total_quotes',
      width: 90,
      render: (v: number) => <Tag color="blue">{v}</Tag>,
    },
    {
      title: '成交数',
      dataIndex: 'total_deals',
      key: 'total_deals',
      width: 80,
      render: (v: number) => <Tag color="green">{v}</Tag>,
    },
    {
      title: '总金额',
      dataIndex: 'total_amount',
      key: 'total_amount',
      width: 120,
      render: (v: number) => '¥' + (v || 0).toFixed(0),
    },
    {
      title: '最近报价',
      dataIndex: 'last_quote_date',
      key: 'last_quote_date',
      width: 140,
      render: (v: string) => v ? v.replace('T', ' ').slice(0, 16) : '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right' as const,
      render: (_: any, record: Customer) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          <Popconfirm title="确定删除此客户?" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={4} style={{ margin: 0 }}>客户管理</Title>
        <Space>
          <Button icon={<SearchOutlined />} onClick={loadCustomers}>刷新</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} size="large">
            新增客户
          </Button>
        </Space>
      </div>

      {/* 搜索 */}
      <Card style={{ marginBottom: 16 }}>
        <Input
          placeholder="搜索客户姓名、电话、地址"
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          onPressEnter={loadCustomers}
          allowClear
          size="large"
          style={{ maxWidth: 400 }}
        />
      </Card>

      {/* 客户列表 */}
      <Table
        columns={columns}
        dataSource={customers}
        loading={loading}
        rowKey="id"
        scroll={{ x: 1200 }}
        pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => '共 ' + t + ' 个客户' }}
      />

      {/* 新增/编辑弹窗 */}
      <Modal
        title={editingId ? '编辑客户' : '新增客户'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSubmit}
        width={560}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 24 }}>
          <Form.Item name="name" label="客户姓名" rules={[{ required: true, message: '请输入客户姓名' }]}>
            <Input size="large" placeholder="请输入客户姓名" />
          </Form.Item>
          <Form.Item name="phone" label="联系电话" rules={[{ required: true, message: '请输入联系电话' }]}>
            <Input size="large" placeholder="请输入联系电话" />
          </Form.Item>
          <Form.Item name="address" label="安装地址">
            <Input size="large" placeholder="请输入安装地址" />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <TextArea rows={3} placeholder="可选备注信息" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
