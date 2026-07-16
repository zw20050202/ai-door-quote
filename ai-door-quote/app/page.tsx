'use client';
// @ts-nocheck

import React from 'react';

import { useState, useEffect } from 'react';
import {
  Layout, Card, Button, Row, Col, Statistic, Typography, Empty, Tag, Space, Avatar,
} from 'antd';
import {
  PlusOutlined,
  FileTextOutlined,
  TeamOutlined,
  SettingOutlined,
  RocketOutlined,
  CalendarOutlined,
  DollarOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

export default function HomePage() {
  const [greeting, setGreeting] = useState('');
  const [recentQuotes, setRecentQuotes] = useState([]);
  const [todayQuotes, setTodayQuotes] = useState(0);
  const [stats, setStats] = useState({ quotes: 0, deals: 0, amount: 0, rate: 0 });
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('张老板');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('早上好');
    else if (hour < 18) setGreeting('下午好');
    else setGreeting('晚上好');
    try {
      const settings = localStorage.getItem('quote_settings');
      if (settings) {
        const s = JSON.parse(settings);
        if (s.contactName) setUserName(s.contactName);
      }
    } catch (e) {}
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [quotesRes] = await Promise.all([
        fetch('/api/quotes?userId=1'),
      ]);
      const quotesData = await quotesRes.json();
      const allQuotes = quotesData.data || [];
      setRecentQuotes(allQuotes.slice(0, 5));
      const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const todayCount = allQuotes.filter(q => q.quote_no && q.quote_no.startsWith('BJ' + today)).length;
      setTodayQuotes(todayCount);
      const deals = allQuotes.filter(q => q.status === 'deal');
      const totalAmount = deals.reduce((sum, q) => sum + (Number(q.grand_total) || 0), 0);
      setStats({
        quotes: allQuotes.length,
        deals: deals.length,
        amount: totalAmount,
        rate: allQuotes.length > 0 ? Math.round((deals.length / allQuotes.length) * 100) : 0,
      });
    } catch (err) {
      console.error('加载数据失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusTag = (status) => {
    const map = {
      draft: { color: 'default', text: '草稿' },
      sent: { color: 'blue', text: '已发送' },
      deal: { color: 'green', text: '成交' },
      rejected: { color: 'red', text: '已拒绝' },
      expired: { color: 'orange', text: '已过期' },
    };
    const s = map[status] || map.draft;
    return <Tag color={s.color}>{s.text}</Tag>;
  };

  return (
    <Layout className="min-h-screen">
      <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f0f0f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <RocketOutlined style={{ fontSize: 28, color: '#1890ff' }} />
          <Title level={4} style={{ margin: 0 }}>AI 门窗报价助手</Title>
        </div>
        <Avatar style={{ background: '#1890ff' }}>{userName}</Avatar>
      </Header>
      <Content style={{ padding: 0, maxWidth: 1200, margin: '0 auto', width: '100%' }}>
        <div style={{ background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)', padding: '40px 24px 32px', color: '#fff' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ marginBottom: 8, opacity: 0.9 }}>
              <CalendarOutlined style={{ fontSize: 16, marginRight: 6 }} />
              {greeting}，{userName}
            </div>
            <Title level={2} style={{ color: '#fff', margin: '8px 0 16px', fontSize: 28 }}>快速生成专业门窗报价</Title>
            <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 15 }}>智能计算 · 一键导出 · 让客户放心下单</Text>
          </div>
        </div>

        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 24px 40px' }}>
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12} md={6}>
              <Card loading={loading} hoverable style={{ borderRadius: 8, textAlign: 'center' }}>
                <Statistic title={<span style={{ fontSize: 14 }}>报价总数</span>} value={stats.quotes} prefix={<FileTextOutlined />} styles={{ content: { fontSize: 32, fontWeight: 600, color: '#1890ff' } }} />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card loading={loading} hoverable style={{ borderRadius: 8, textAlign: 'center' }}>
                <Statistic title={<span style={{ fontSize: 14 }}>成交数</span>} value={stats.deals} prefix={<CheckCircleOutlined />} styles={{ content: { fontSize: 32, fontWeight: 600, color: '#52c41a' } }} />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card loading={loading} hoverable style={{ borderRadius: 8, textAlign: 'center' }}>
                <Statistic title={<span style={{ fontSize: 14 }}>总金额</span>} prefix="¥" value={stats.amount} precision={0} styles={{ content: { fontSize: 32, fontWeight: 600, color: '#722ed1' } }} />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card loading={loading} hoverable style={{ borderRadius: 8, textAlign: 'center' }}>
                <Statistic title={<span style={{ fontSize: 14 }}>成交率</span>} value={stats.rate} suffix="%" styles={{ content: { fontSize: 32, fontWeight: 600, color: '#faad14' } }} />
              </Card>
            </Col>
          </Row>

          <Card style={{ marginBottom: 24, borderRadius: 8 }}>
            <Row gutter={16} align="middle">
              <Col span={8}>
                <Statistic title="今日报价" value={todayQuotes} prefix={<CalendarOutlined />} styles={{ content: { color: '#1890ff', fontSize: 28, fontWeight: 600 } }} />
              </Col>
              <Col span={8}>
                <Statistic title="成交金额" value={stats.amount} prefix="¥" styles={{ content: { color: '#52c41a', fontSize: 28, fontWeight: 600 } }} />
              </Col>
              <Col span={8}>
                <Button type="primary" size="large" icon={<PlusOutlined />} onClick={() => (window.location.href = '/quote/new')} style={{ height: 48, fontSize: 16, borderRadius: 8, width: '100%' }}>新建报价</Button>
              </Col>
            </Row>
          </Card>

          <div style={{ marginBottom: 32 }}>
            <Title level={5} style={{ marginBottom: 16, fontSize: 16 }}>最近报价</Title>
            {recentQuotes.length === 0 ? (
              <Card style={{ borderRadius: 8, textAlign: 'center', padding: '32px 0' }}>
                <Empty description={<Space direction="vertical" size={4}><Text type="secondary">还没有报价记录</Text><Text type="secondary" style={{ fontSize: 13 }}>点击「新建报价」按钮创建您的第一份报价</Text></Space>} />
              </Card>
            ) : (
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                {recentQuotes.map((q) => (
                  <Card key={q.id} hoverable onClick={() => (window.location.href = '/quotes')} style={{ cursor: 'pointer', borderRadius: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <Text strong>{q.quote_no}</Text><br />
                        <Text type="secondary">{q.customer_name || '未知客户'}</Text>
                      </div>
                      <Space>
                        <Text strong style={{ fontSize: 18, color: '#cf1322' }}>¥{Number(q.grand_total || 0).toLocaleString()}</Text>
                        {getStatusTag(q.status)}
                      </Space>
                    </div>
                  </Card>
                ))}
              </Space>
            )}
          </div>

          <Row gutter={16}>
            {[
              { href: '/quotes', icon: <FileTextOutlined />, title: '报价历史', desc: '查看和管理所有报价', color: '#1890ff' },
              { href: '/customers', icon: <TeamOutlined />, title: '客户管理', desc: '维护客户信息', color: '#52c41a' },
              { href: '/settings', icon: <SettingOutlined />, title: '系统设置', desc: '自定义报价参数', color: '#faad14' },
            ].map((item, i) => (
              <Col xs={24} sm={8} key={i}>
                <Card hoverable onClick={() => (window.location.href = item.href)} style={{ cursor: 'pointer', borderRadius: 8, textAlign: 'center', border: '1px solid #f0f0f0', transition: 'all 0.3s' }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = item.color; e.currentTarget.style.boxShadow = `0 2px 8px ${item.color}26`; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#f0f0f0'; e.currentTarget.style.boxShadow = 'none'; }}>
                  {React.cloneElement(item.icon, { style: { fontSize: 32, color: item.color, marginBottom: 8, display: 'block' } })}
                  <div style={{ fontSize: 15, fontWeight: 500 }}>{item.title}</div>
                  <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>{item.desc}</div>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      </Content>
    </Layout>
  );
}
