'use client';
// @ts-nocheck

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Table, Button, Tag, Space, Card, Typography, Select, message, Popconfirm, Modal, Divider, Input, DatePicker } from 'antd';
import { EyeOutlined, CopyOutlined, SendOutlined, CheckCircleOutlined, DeleteOutlined, FilePdfOutlined, SearchOutlined, EditOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

interface Quote {
  id: number;
  quote_no: string;
  customer_name: string;
  customer_phone?: string;
  grand_total: number;
  status: string;
  product_total: number;
  fee_total: number;
  discount_amount: number;
  payment_method?: string;
  delivery_days?: number;
  warranty_years?: number;
  valid_days?: number;
  remark?: string;
  created_at: string;
  sent_at?: string;
  deal_at?: string;
  products?: any[];
  fees?: any[];
}

const statusMap = {
  draft: { color: 'default', text: '草稿' },
  sent: { color: 'blue', text: '已发送' },
  deal: { color: 'green', text: '成交' },
  rejected: { color: 'red', text: '已拒绝' },
  expired: { color: 'orange', text: '已过期' },
};

export default function QuotesPage() {
  const router = useRouter();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [dateRange, setDateRange] = useState(null);
  const [detailModal, setDetailModal] = useState({ open: false, quote: null });

  const loadQuotes = async () => {
    setLoading(true);
    try {
      let url = '/api/quotes?userId=1';
      const params = [];
      if (filterStatus) params.push('status=' + filterStatus);
      if (searchKeyword) params.push('keyword=' + encodeURIComponent(searchKeyword));
      if (dateRange && dateRange.length === 2) {
        params.push('dateFrom=' + dateRange[0].format('YYYY-MM-DD'));
        params.push('dateTo=' + dateRange[1].format('YYYY-MM-DD'));
      }
      if (params.length > 0) url += '&' + params.join('&');
      
      const res = await fetch(url);
      const result = await res.json();
      setQuotes(result.data || []);
    } catch (err) {
      message.error('加载报价列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadQuotes(); }, []);

  // 更新状态
  const updateStatus = async (id, status, grandTotal) => {
    try {
      const res = await fetch('/api/quotes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status, grand_total: grandTotal }),
      });
      const result = await res.json();
      if (result.success) {
        message.success('状态已更新');
        loadQuotes();
      }
    } catch (err) {
      message.error('更新失败');
    }
  };

  // 复制报价
  const copyQuote = async (quote) => {
    try {
      const detailRes = await fetch('/api/quotes?userId=1&id=' + quote.id);
      const detail = await detailRes.json();

      const newRes = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: 1,
          customer_id: detail.data.customer_id,
          product_total: detail.data.product_total,
          fee_total: detail.data.fee_total,
          discount_amount: detail.data.discount_amount,
          grand_total: detail.data.grand_total,
          payment_method: detail.data.payment_method,
          delivery_days: detail.data.delivery_days,
          warranty_years: detail.data.warranty_years,
          valid_days: detail.data.valid_days,
          remark: (detail.data.remark || '') + ' (复制)',
          products: detail.data.products || [],
          fees: detail.data.fees || [],
        }),
      });
      const newQuote = await newRes.json();
      if (newQuote.success) {
        message.success('报价已复制，编号: ' + newQuote.data.quote_no);
        loadQuotes();
      }
    } catch (err) {
      message.error('复制失败');
    }
  };


  // 编辑报价
  const editQuote = async (quote) => {
    router.push('/quote/edit?id=' + quote.id);
  };

  // 删除报价
  const deleteQuote = async (id) => {
    try {
      await fetch('/api/quotes?id=' + id, { method: 'DELETE' });
      message.success('已删除');
      loadQuotes();
    } catch (err) {
      message.error('删除失败');
    }
  };

  // 查看详情
  const viewDetail = async (quote) => {
    try {
      const res = await fetch('/api/quotes?userId=1&id=' + quote.id);
      const result = await res.json();
      setDetailModal({ open: true, quote: result.data });
    } catch (err) {
      message.error('加载详情失败');
    }
  };

  // 查看详情并导出PDF
  const viewAndExportPDF = (quote) => {
    router.push('/quote/preview?id=' + quote.id);
  };

  const columns = [
    { title: '报价编号', dataIndex: 'quote_no', key: 'quote_no', width: 160, render: (v) => <Text strong style={{ color: '#1890ff' }}>{v}</Text> },
    { title: '客户', dataIndex: 'customer_name', key: 'customer_name', width: 120, render: (v) => <strong>{v || '-'}</strong> },
    { title: '电话', dataIndex: 'customer_phone', key: 'customer_phone', width: 130 },
    {
      title: '金额', dataIndex: 'grand_total', key: 'grand_total', width: 120,
      render: (v) => '￥' + Number(v || 0).toLocaleString(),
    },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 80,
      render: (v) => <Tag color={(statusMap[v] || statusMap.draft).color}>{(statusMap[v] || statusMap.draft).text}</Tag>,
    },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at', width: 160,
      render: (v) => v ? v.replace('T', ' ').slice(0, 16) : '-',
    },
    {
      title: '操作', key: 'action', width: 260, fixed: 'right' as const,
      render: (_, r) => (
        <Space size="small">
          <Button type="link" icon={<EyeOutlined />} onClick={() => viewDetail(r)}>详情</Button>
          <Button type="link" icon={<CopyOutlined />} onClick={() => copyQuote(r)}>复制</Button>
          <Button type="link" icon={<EditOutlined />} onClick={() => editQuote(r)}>编辑</Button>
          {r.status === 'draft' && (
            <>
              <Button type="link" icon={<SendOutlined />} onClick={() => updateStatus(r.id, 'sent', r.grand_total)}>发送</Button>
              <Button type="link" icon={<CheckCircleOutlined />} onClick={() => updateStatus(r.id, 'deal', r.grand_total)}>成交</Button>
            </>
          )}
          <Button type="link" icon={<FilePdfOutlined />} onClick={() => viewAndExportPDF(r)} size="small">导出</Button>
          <Popconfirm title="确定删除?" onConfirm={() => deleteQuote(r.id)}>
            <Button type="link" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>报价历史</Title>
        <Button type="primary" size="large" onClick={() => router.push('/quote/new')}>
          新建报价
        </Button>
      </div>

      {/* 筛选区 */}
      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <Input
            placeholder="搜索编号、客户名、电话"
            value={searchKeyword}
            onChange={e => setSearchKeyword(e.target.value)}
            onPressEnter={loadQuotes}
            allowClear
            style={{ width: 240 }}
            size="large"
            prefix={<SearchOutlined />}
          />
          <RangePicker
            value={dateRange}
            onChange={dates => setDateRange(dates)}
            style={{ width: 240 }}
            size="large"
          />
          <Select
            value={filterStatus}
            onChange={setFilterStatus}
            placeholder="筛选状态"
            allowClear
            style={{ width: 120 }}
            size="large"
          >
            <Option value="draft">草稿</Option>
            <Option value="sent">已发送</Option>
            <Option value="deal">成交</Option>
            <Option value="rejected">已拒绝</Option>
            <Option value="expired">已过期</Option>
          </Select>
          <Button size="large" onClick={loadQuotes}>搜索</Button>
          <Button size="large" onClick={() => { setSearchKeyword(''); setFilterStatus(''); setDateRange(null); loadQuotes(); }}>重置</Button>
        </Space>
      </Card>

      <Table
        columns={columns}
        dataSource={quotes}
        loading={loading}
        rowKey="id"
        scroll={{ x: 1400 }}
        pagination={{ pageSize: 10, showTotal: (t) => '共 ' + t + ' 条报价' }}
      />

      {/* 详情弹窗 */}
      <Modal
        title={'报价详情 - ' + (detailModal.quote?.quote_no || '')}
        open={detailModal.open}
        onCancel={() => setDetailModal({ open: false, quote: null })}
        footer={null}
        width={800}
      >
        {detailModal.quote && (() => {
          const q = detailModal.quote;
          return (
            <div>
              <Divider plain>客户信息</Divider>
              <Space direction="vertical" style={{ width: '100%' }} size={4}>
                <Text><strong>客户:</strong> {q.customer_name || '-'}</Text>
                <Text><strong>电话:</strong> {q.customer_phone || '-'}</Text>
                <Text><strong>报价编号:</strong> {q.quote_no}</Text>
                <Text><strong>状态:</strong> {statusMap[q.status]?.text || q.status}</Text>
                <Text><strong>创建时间:</strong> {q.created_at ? q.created_at.replace('T', ' ').slice(0, 16) : '-'}</Text>
              </Space>

              <Divider plain>产品明细</Divider>
              {(q.products || []).map((p, i) => (
                <div key={p.id} style={{ padding: 12, background: '#fafafa', marginBottom: 8, borderRadius: 4 }}>
                  <Text strong>{i + 1}. {p.product_category}</Text>
                  <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                    {p.width_mm}×{p.height_mm}mm · {p.opening_type} · {p.area}㎡ × {p.quantity}
                  </div>
                  <div style={{ fontSize: 12, color: '#666' }}>
                    单价: ￥{(Number(p.unit_price) || 0).toFixed(2)}/㎡
                  </div>
                  <div style={{ color: '#1890ff', fontWeight: 'bold', marginTop: 4 }}>
                    ￥{(Number(p.subtotal) || 0).toFixed(2)}
                  </div>
                </div>
              ))}

              {(q.fees && q.fees.length > 0) && (
                <>
                  <Divider plain>费用</Divider>
                  {q.fees.map((f) => (
                    <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13 }}>
                      <Text type="secondary">{f.fee_name}</Text>
                      <Text>￥{(Number(f.amount) || 0).toFixed(2)}</Text>
                    </div>
                  ))}
                </>
              )}

              {q.remark && (
                <>
                  <Divider plain>备注</Divider>
                  <Text type="secondary">{q.remark}</Text>
                </>
              )}

              <Divider />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text strong style={{ fontSize: 16 }}>合计金额：</Text>
                <Text strong style={{ fontSize: 24, color: '#cf1322' }}>￥{Number(q.grand_total).toLocaleString()}</Text>
              </div>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}
