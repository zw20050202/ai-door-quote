// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { Tabs, Table, Button, Input, Modal, Form, message, Typography, Space, InputNumber, Tag, Popconfirm, Card, Switch } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';

const { Title } = Typography;
const { TextArea } = Input;

interface Profile { id: number; name: string; base_price: number; wall_thickness: number; description?: string; sort_order: number; is_enabled?: number; }
interface Glass { id: number; name: string; specification: string; price_add: number; sort_order: number; is_enabled?: number; }
interface ColorOpt { id: number; name: string; color_code: string; price_add: number; sort_order: number; is_enabled?: number; }
interface HW { id: number; name: string; type: string; price_per_unit: number; sort_order: number; is_enabled?: number; }

export default function ProductsPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [glassConfigs, setGlassConfigs] = useState<Glass[]>([]);
  const [colors, setColors] = useState<ColorOpt[]>([]);
  const [hardwares, setHardwares] = useState<HW[]>([]);

  const [profileModal, setProfileModal] = useState({ open: false, editId: null });
  const [glassModal, setGlassModal] = useState({ open: false, editId: null });
  const [colorModal, setColorModal] = useState({ open: false, editId: null });
  const [hwModal, setHwModal] = useState({ open: false, editId: null });

  const [profileForm] = Form.useForm();
  const [glassForm] = Form.useForm();
  const [colorForm] = Form.useForm();
  const [hwForm] = Form.useForm();

  useEffect(() => {
    Promise.all([
      fetch('/api/profiles?userId=1').then(r => r.json()).then(r => setProfiles(r.data || [])),
      fetch('/api/glass-configs?userId=1').then(r => r.json()).then(r => setGlassConfigs(r.data || [])),
      fetch('/api/colors?userId=1').then(r => r.json()).then(r => setColors(r.data || [])),
      fetch('/api/hardware?userId=1').then(r => r.json()).then(r => setHardwares(r.data || [])),
    ]);
  }, []);

  const reload = () => {
    Promise.all([
      fetch('/api/profiles?userId=1').then(r => r.json()).then(r => setProfiles(r.data || [])),
      fetch('/api/glass-configs?userId=1').then(r => r.json()).then(r => setGlassConfigs(r.data || [])),
      fetch('/api/colors?userId=1').then(r => r.json()).then(r => setColors(r.data || [])),
      fetch('/api/hardware?userId=1').then(r => r.json()).then(r => setHardwares(r.data || [])),
    ]);
  };

  // 型材表格
  const profileCols = [
    { title: '名称', dataIndex: 'name', key: 'name', width: 120, render: (v) => <strong>{v}</strong> },
    { title: '基础单价', dataIndex: 'base_price', key: 'base_price', width: 100, render: (v) => '￥' + v + '/㎡' },
    { title: '壁厚', dataIndex: 'wall_thickness', key: 'wall_thickness', width: 80, render: (v) => v + 'mm' },
    { title: '状态', dataIndex: 'is_enabled', key: 'is_enabled', width: 80, render: (v) => v ? <Tag color="green">启用</Tag> : <Tag color="red">禁用</Tag> },
    {
      title: '操作', key: 'action', width: 120, render: (_, r) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => { profileForm.setFieldsValue(r); setProfileModal({ open: true, editId: r.id }); }}>编辑</Button>
          <Popconfirm title="确定删除?" onConfirm={async () => { await fetch('/api/profiles?id=' + r.id, { method: 'DELETE' }); message.success('已删除'); reload(); }}>
            <Button type="link" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 玻璃表格
  const glassCols = [
    { title: '名称', dataIndex: 'name', key: 'name', width: 120, render: (v) => <strong>{v}</strong> },
    { title: '规格', dataIndex: 'specification', key: 'specification', width: 150 },
    { title: '加价', dataIndex: 'price_add', key: 'price_add', width: 80, render: (v) => '￥' + v },
    { title: '状态', dataIndex: 'is_enabled', key: 'is_enabled', width: 80, render: (v) => v ? <Tag color="green">启用</Tag> : <Tag color="red">禁用</Tag> },
    {
      title: '操作', key: 'action', width: 120, render: (_, r) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => { glassForm.setFieldsValue(r); setGlassModal({ open: true, editId: r.id }); }}>编辑</Button>
          <Popconfirm title="确定删除?" onConfirm={async () => { await fetch('/api/glass-configs?id=' + r.id, { method: 'DELETE' }); message.success('已删除'); reload(); }}>
            <Button type="link" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 颜色表格
  const colorCols = [
    { title: '名称', dataIndex: 'name', key: 'name', width: 120, render: (v, r) => <Space><span>{v}</span><span style={{ display: 'inline-block', width: 16, height: 16, background: r.color_code || '#fff', border: '1px solid #ddd', borderRadius: 2, verticalAlign: 'middle' }} /></Space> },
    { title: '色号', dataIndex: 'color_code', key: 'color_code', width: 100 },
    { title: '加价', dataIndex: 'price_add', key: 'price_add', width: 80, render: (v) => '￥' + v },
    { title: '状态', dataIndex: 'is_enabled', key: 'is_enabled', width: 80, render: (v) => v ? <Tag color="green">启用</Tag> : <Tag color="red">禁用</Tag> },
    {
      title: '操作', key: 'action', width: 120, render: (_, r) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => { colorForm.setFieldsValue(r); setColorModal({ open: true, editId: r.id }); }}>编辑</Button>
          <Popconfirm title="确定删除?" onConfirm={async () => { await fetch('/api/colors?id=' + r.id, { method: 'DELETE' }); message.success('已删除'); reload(); }}>
            <Button type="link" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 五金表格
  const hwCols = [
    { title: '名称', dataIndex: 'name', key: 'name', width: 120, render: (v) => <strong>{v}</strong> },
    { title: '类型', dataIndex: 'type', key: 'type', width: 100 },
    { title: '单价', dataIndex: 'price_per_unit', key: 'price_per_unit', width: 100, render: (v) => '￥' + v + '/套' },
    { title: '状态', dataIndex: 'is_enabled', key: 'is_enabled', width: 80, render: (v) => v ? <Tag color="green">启用</Tag> : <Tag color="red">禁用</Tag> },
    {
      title: '操作', key: 'action', width: 120, render: (_, r) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => { hwForm.setFieldsValue(r); setHwModal({ open: true, editId: r.id }); }}>编辑</Button>
          <Popconfirm title="确定删除?" onConfirm={async () => { await fetch('/api/hardware?id=' + r.id, { method: 'DELETE' }); message.success('已删除'); reload(); }}>
            <Button type="link" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const tabItems = [
    { key: 'profiles', label: '型材系列', children: (
      <Card extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => { profileForm.resetFields(); setProfileModal({ open: true, editId: null }); }} size="small">新增</Button>}>
        <Table columns={profileCols} dataSource={profiles} rowKey="id" pagination={false} size="small" scroll={{ x: 600 }} />
      </Card>
    )},
    { key: 'glass', label: '玻璃配置', children: (
      <Card extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => { glassForm.resetFields(); setGlassModal({ open: true, editId: null }); }} size="small">新增</Button>}>
        <Table columns={glassCols} dataSource={glassConfigs} rowKey="id" pagination={false} size="small" scroll={{ x: 600 }} />
      </Card>
    )},
    { key: 'colors', label: '颜色', children: (
      <Card extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => { colorForm.resetFields(); setColorModal({ open: true, editId: null }); }} size="small">新增</Button>}>
        <Table columns={colorCols} dataSource={colors} rowKey="id" pagination={false} size="small" scroll={{ x: 600 }} />
      </Card>
    )},
    { key: 'hardware', label: '五金配件', children: (
      <Card extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => { hwForm.resetFields(); setHwModal({ open: true, editId: null }); }} size="small">新增</Button>}>
        <Table columns={hwCols} dataSource={hardwares} rowKey="id" pagination={false} size="small" scroll={{ x: 600 }} />
      </Card>
    )},
  ];

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <Title level={4} style={{ marginBottom: 24 }}>产品库管理</Title>
      <Tabs items={tabItems} size="large" defaultActiveKey="profiles" />

      {/* 型材弹窗 */}
      <Modal title={profileModal.editId ? '编辑型材' : '新增型材'} open={profileModal.open}
        onCancel={() => setProfileModal({ open: false, editId: null })}
        onOk={async () => {
          const v = await profileForm.validateFields();
          const method = profileModal.editId ? 'PUT' : 'POST';
          await fetch('/api/profiles', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...v, user_id: 1 }) });
          message.success('保存成功'); setProfileModal({ open: false, editId: null }); reload();
        }}>
        <Form form={profileForm} layout="vertical" style={{ marginTop: 24 }}>
          <Form.Item name="name" label="名称" rules={[{ required: true }]}><Input size="large" placeholder="如：断桥70" /></Form.Item>
          <Form.Item name="base_price" label="基础单价(元/㎡)" rules={[{ required: true }]}><InputNumber style={{ width: '100%' }} size="large" placeholder="如：800" /></Form.Item>
          <Form.Item name="wall_thickness" label="壁厚(mm)"><InputNumber style={{ width: '100%' }} size="large" placeholder="如：1.8" /></Form.Item>
          <Form.Item name="description" label="描述"><TextArea rows={2} placeholder="可选" /></Form.Item>
        </Form>
      </Modal>

      {/* 玻璃弹窗 */}
      <Modal title={glassModal.editId ? '编辑玻璃' : '新增玻璃'} open={glassModal.open}
        onCancel={() => setGlassModal({ open: false, editId: null })}
        onOk={async () => {
          const v = await glassForm.validateFields();
          const method = glassModal.editId ? 'PUT' : 'POST';
          await fetch('/api/glass-configs', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...v, user_id: 1 }) });
          message.success('保存成功'); setGlassModal({ open: false, editId: null }); reload();
        }}>
        <Form form={glassForm} layout="vertical" style={{ marginTop: 24 }}>
          <Form.Item name="name" label="名称" rules={[{ required: true }]}><Input size="large" placeholder="如：双层中空玻璃" /></Form.Item>
          <Form.Item name="specification" label="规格" rules={[{ required: true }]}><Input size="large" placeholder="如：5+12A+5" /></Form.Item>
          <Form.Item name="price_add" label="加价(元/㎡)"><InputNumber style={{ width: '100%' }} size="large" placeholder="如：50" /></Form.Item>
        </Form>
      </Modal>

      {/* 颜色弹窗 */}
      <Modal title={colorModal.editId ? '编辑颜色' : '新增颜色'} open={colorModal.open}
        onCancel={() => setColorModal({ open: false, editId: null })}
        onOk={async () => {
          const v = await colorForm.validateFields();
          const method = colorModal.editId ? 'PUT' : 'POST';
          await fetch('/api/colors', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...v, user_id: 1 }) });
          message.success('保存成功'); setColorModal({ open: false, editId: null }); reload();
        }}>
        <Form form={colorForm} layout="vertical" style={{ marginTop: 24 }}>
          <Form.Item name="name" label="名称" rules={[{ required: true }]}><Input size="large" placeholder="如：木纹色" /></Form.Item>
          <Form.Item name="color_code" label="色号"><Input size="large" placeholder="#8B4513" /></Form.Item>
          <Form.Item name="price_add" label="加价(元)"><InputNumber style={{ width: '100%' }} size="large" placeholder="如：30" /></Form.Item>
        </Form>
      </Modal>

      {/* 五金弹窗 */}
      <Modal title={hwModal.editId ? '编辑五金' : '新增五金'} open={hwModal.open}
        onCancel={() => setHwModal({ open: false, editId: null })}
        onOk={async () => {
          const v = await hwForm.validateFields();
          const method = hwModal.editId ? 'PUT' : 'POST';
          await fetch('/api/hardware', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...v, user_id: 1 }) });
          message.success('保存成功'); setHwModal({ open: false, editId: null }); reload();
        }}>
        <Form form={hwForm} layout="vertical" style={{ marginTop: 24 }}>
          <Form.Item name="name" label="名称" rules={[{ required: true }]}><Input size="large" placeholder="如：好博把手" /></Form.Item>
          <Form.Item name="type" label="类型"><Input size="large" placeholder="如：把手/铰链/传动器" /></Form.Item>
          <Form.Item name="price_per_unit" label="单价(元/套)" rules={[{ required: true }]}><InputNumber style={{ width: '100%' }} size="large" placeholder="如：25" /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
