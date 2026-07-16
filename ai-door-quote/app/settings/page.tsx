'use client';
// @ts-nocheck

import { useState, useEffect } from 'react';
import { Card, Form, Input, InputNumber, Button, message, Typography, Divider, Space, Select, Row, Col } from 'antd';
import { SaveOutlined, ReloadOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

export default function SettingsPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // 加载默认设置（从本地存储或预设值）
    const saved = localStorage.getItem('quote_settings');
    if (saved) {
      form.setFieldsValue(JSON.parse(saved));
    } else {
      form.setFieldsValue({
        companyName: '示例门窗公司',
        contactName: '张老板',
        contactPhone: '13800000000',
        address: '',
        paymentMethod: '3-3-4',
        deliveryDays: 15,
        warrantyYears: 5,
        validDays: 30,
        defaultInstallFee: 35,
        defaultTransportFee: 200,
      });
    }
  }, [form]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const values = await form.validateFields();
      localStorage.setItem('quote_settings', JSON.stringify(values));
      message.success('设置已保存');
    } catch (err) {
      message.error('保存失败');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    form.setFieldsValue({
      companyName: '示例门窗公司',
      contactName: '张老板',
      contactPhone: '13800000000',
      address: '',
      paymentMethod: '3-3-4',
      deliveryDays: 15,
      warrantyYears: 5,
      validDays: 30,
      defaultInstallFee: 35,
      defaultTransportFee: 200,
    });
    localStorage.removeItem('quote_settings');
    message.success('已恢复默认设置');
  };

  return (
    <div style={{ padding: 24, maxWidth: 800, margin: '0 auto' }}>
      <Title level={4} style={{ marginBottom: 24 }}>系统设置</Title>

      {/* 公司信息 */}
      <Card title="公司信息" style={{ marginBottom: 24 }}>
        <Form form={form} layout="vertical">
          <Form.Item name="companyName" label="公司名称" rules={[{ required: true, message: '请输入公司名称' }]}>
            <Input size="large" placeholder="请输入公司名称" />
          </Form.Item>
          <Form.Item name="contactName" label="联系人">
            <Input size="large" placeholder="请输入联系人姓名" />
          </Form.Item>
          <Form.Item name="contactPhone" label="联系电话">
            <Input size="large" placeholder="请输入联系电话" />
          </Form.Item>
          <Form.Item name="address" label="公司地址">
            <Input size="large" placeholder="请输入公司地址" />
          </Form.Item>
        </Form>
      </Card>

      {/* 默认报价设置 */}
      <Card title="默认报价设置" style={{ marginBottom: 24 }}>
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="paymentMethod" label="付款方式">
                <Select size="large">
                  <Select.Option value="3-3-4">3-3-4（定金30%、发货30%、安装40%）</Select.Option>
                  <Select.Option value="5-5">5-5（定金50%、尾款50%）</Select.Option>
                  <Select.Option value="1-9">1-9（定金10%、尾款90%）</Select.Option>
                  <Select.Option value="other">其他</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="deliveryDays" label="默认交货天数" rules={[{ required: true }]}>
                <InputNumber size="large" min={1} max={90} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="warrantyYears" label="默认质保年限" rules={[{ required: true }]}>
                <InputNumber size="large" min={1} max={20} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="validDays" label="报价有效期（天）" rules={[{ required: true }]}>
                <InputNumber size="large" min={1} max={90} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>

      {/* 默认费用设置 */}
      <Card title="默认费用设置" style={{ marginBottom: 24 }}>
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="defaultInstallFee" label="默认安装费（元/㎡）">
                <InputNumber size="large" min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="defaultTransportFee" label="默认运输费（元）">
                <InputNumber size="large" min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>

      {/* 操作按钮 */}
      <Space>
        <Button type="primary" icon={<SaveOutlined />} size="large" onClick={handleSave} loading={loading}>
          保存设置
        </Button>
        <Button icon={<ReloadOutlined />} size="large" onClick={handleReset}>
          恢复默认
        </Button>
      </Space>
    </div>
  );
}
