'use client';
// @ts-nocheck

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button, Typography, Spin, message, Divider, Space } from 'antd';
import { ArrowLeftOutlined, PrinterOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

export default function QuotePreviewPage() {
  const router = useRouter();
  const params = useParams();
  const quoteId = typeof params?.id === 'string' ? params.id : (Array.isArray(params?.id) ? params.id[0] : undefined);
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [companyName, setCompanyName] = useState('AI 门窗报价助手');

  useEffect(() => {
    if (!quoteId) {
      message.error('缺少报价ID');
      router.push('/quotes');
      return;
    }
    // 读取公司名称设置
    try {
      const settings = localStorage.getItem('quote_settings');
      if (settings) {
        const s = JSON.parse(settings);
        if (s.companyName) setCompanyName(s.companyName);
      }
    } catch (e) {}
    
    fetch('/api/quotes?userId=1&id=' + quoteId)
      .then(r => r.json())
      .then(result => {
        setQuote(result.data);
        setLoading(false);
      })
      .catch(err => {
        message.error('加载失败');
        setLoading(false);
      });
  }, [quoteId, router]);

  const handlePrint = () => {
    window.print();
  };

  const statusText = (s) => {
    const map = { draft: '草稿', sent: '已发送', deal: '成交', rejected: '已拒绝', expired: '已过期' };
    return map[s] || s;
  };

  const getStatusColor = (s) => {
    const map = { draft: '#d9d9d9', sent: '#1890ff', deal: '#52c41a', rejected: '#ff4d4f', expired: '#faad14' };
    return map[s] || '#d9d9d9';
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 100 }}><Spin size="large" /></div>;
  if (!quote) return <div style={{ textAlign: 'center', padding: 100 }}>报价不存在</div>;

  // 水印文本
  const watermarkText = quote.status === 'deal' ? '已确认' : quote.status === 'draft' ? '草稿' : statusText(quote.status);
  const watermarkColor = getStatusColor(quote.status);

  return (
    <div className="quote-print-area">
      {/* 操作栏 - 打印时隐藏 */}
      <div style={{ padding: '16px 24px', background: '#f5f5f5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} data-no-print>
        <Button icon={<ArrowLeftOutlined />} onClick={() => router.back()}>返回</Button>
        <Space>
          <Button onClick={() => router.push('/quotes')}>报价列表</Button>
          <Button type="primary" icon={<PrinterOutlined />} onClick={handlePrint} size="large">打印 / 导出PDF</Button>
        </Space>
      </div>

      {/* 报价单内容 */}
      <div style={{ padding: 40, maxWidth: 800, margin: '0 auto', background: '#fff', minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
        
        {/* 状态水印 */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(-30deg)',
          fontSize: 80, fontWeight: 'bold', color: watermarkColor, opacity: 0.06,
          pointerEvents: 'none', whiteSpace: 'nowrap', zIndex: 0, letterSpacing: 12,
        }}>{watermarkText}</div>

        {/* 公司头部 - 品牌色条 */}
        <div style={{ textAlign: 'center', marginBottom: 30, paddingBottom: 20, borderBottom: '4px solid #1890ff', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{ width: 48, height: 48, borderRadius: 8, background: 'linear-gradient(135deg, #1890ff, #096dd9)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 24 }}>门</div>
            <Title level={3} style={{ margin: 0, color: '#1890ff', fontSize: 24, fontWeight: 700 }}>{companyName}</Title>
          </div>
          <Divider style={{ margin: '12px 0 16px', borderColor: '#e8e8e8' }} />
          <Title level={4} style={{ color: '#333', margin: 0, fontSize: 22, fontWeight: 600, letterSpacing: 8 }}>报 价 单</Title>
        </div>

        {/* 报价编号 + 基本信息 */}
        <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', fontSize: 14, position: 'relative', zIndex: 1 }}>
          <div>
            <div style={{ marginBottom: 8 }}>
              <Text type="secondary">客户：</Text>
              <Text strong style={{ fontSize: 16 }}>{quote.customer_name || '-'}</Text>
            </div>
            <div style={{ marginBottom: 4 }}>
              <Text type="secondary">电话：</Text>{quote.customer_phone || '-'}
            </div>
            <div>
              <Text type="secondary">地址：</Text>{quote.customer_address || '-'}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ 
              fontSize: 22, fontWeight: 700, color: '#1890ff', 
              background: '#f0f5ff', padding: '8px 16px', borderRadius: 6, marginBottom: 8,
              fontFamily: 'monospace', letterSpacing: 1,
            }}>{quote.quote_no}</div>
            <div><Text type="secondary">日期：</Text>{quote.created_at ? quote.created_at.split('T')[0] : '-'}</div>
            <div><Text type="secondary">状态：</Text>
              <Tag color={getStatusColor(quote.status)} style={{ fontSize: 12 }}>{statusText(quote.status)}</Tag>
            </div>
          </div>
        </div>

        {/* 产品明细表格 */}
        <Title level={5} style={{ marginTop: 20, position: 'relative', zIndex: 1 }}>产品明细</Title>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20, fontSize: 12, position: 'relative', zIndex: 1 }}>
          <thead>
            <tr style={{ background: '#f0f0f0' }}>
              <th style={{ border: '1px solid #ddd', padding: 8, textAlign: 'center', width: 40 }}>序号</th>
              <th style={{ border: '1px solid #ddd', padding: 8, textAlign: 'center' }}>分类</th>
              <th style={{ border: '1px solid #ddd', padding: 8, textAlign: 'center' }}>规格(mm)</th>
              <th style={{ border: '1px solid #ddd', padding: 8, textAlign: 'center' }}>开启方式</th>
              <th style={{ border: '1px solid #ddd', padding: 8, textAlign: 'center', width: 60 }}>面积(㎡)</th>
              <th style={{ border: '1px solid #ddd', padding: 8, textAlign: 'center', width: 50 }}>数量</th>
              <th style={{ border: '1px solid #ddd', padding: 8, textAlign: 'right', width: 80 }}>单价(￥)</th>
              <th style={{ border: '1px solid #ddd', padding: 8, textAlign: 'right', width: 90 }}>小计(￥)</th>
            </tr>
          </thead>
          <tbody>
            {quote.products && quote.products.map((p, i) => (
              <tr key={p.id}>
                <td style={{ border: '1px solid #ddd', padding: 8, textAlign: 'center' }}>{i + 1}</td>
                <td style={{ border: '1px solid #ddd', padding: 8, textAlign: 'center' }}>{p.product_category}</td>
                <td style={{ border: '1px solid #ddd', padding: 8, textAlign: 'center' }}>{p.width_mm}×{p.height_mm}</td>
                <td style={{ border: '1px solid #ddd', padding: 8, textAlign: 'center' }}>{p.opening_type}</td>
                <td style={{ border: '1px solid #ddd', padding: 8, textAlign: 'right' }}>{p.area}</td>
                <td style={{ border: '1px solid #ddd', padding: 8, textAlign: 'center' }}>{p.quantity}</td>
                <td style={{ border: '1px solid #ddd', padding: 8, textAlign: 'right' }}>{Number(p.unit_price).toFixed(2)}</td>
                <td style={{ border: '1px solid #ddd', padding: 8, textAlign: 'right', fontWeight: 'bold' }}>{Number(p.subtotal).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* 费用明细 */}
        {quote.fees && quote.fees.length > 0 && (
          <>
            <Title level={5} style={{ position: 'relative', zIndex: 1 }}>费用明细</Title>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20, fontSize: 12, position: 'relative', zIndex: 1 }}>
              <thead>
                <tr style={{ background: '#f0f0f0' }}>
                  <th style={{ border: '1px solid #ddd', padding: 8, textAlign: 'center' }}>费用名称</th>
                  <th style={{ border: '1px solid #ddd', padding: 8, textAlign: 'center' }}>计费方式</th>
                  <th style={{ border: '1px solid #ddd', padding: 8, textAlign: 'right' }}>金额(￥)</th>
                </tr>
              </thead>
              <tbody>
                {quote.fees.map((f) => (
                  <tr key={f.id}>
                    <td style={{ border: '1px solid #ddd', padding: 8 }}>{f.fee_name}</td>
                    <td style={{ border: '1px solid #ddd', padding: 8, textAlign: 'center' }}>{f.fee_type === 'per_sqm' ? '按平米' : '固定金额'}</td>
                    <td style={{ border: '1px solid #ddd', padding: 8, textAlign: 'right' }}>{Number(f.amount).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {/* 合计区域 */}
        <div style={{ textAlign: 'right', marginBottom: 30, padding: 16, background: '#fafafa', borderRadius: 4, border: '1px solid #e8e8e8', position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 13, marginBottom: 4 }}>产品总价: <Text strong>￥{Number(quote.product_total).toFixed(2)}</Text></div>
          <div style={{ fontSize: 13, marginBottom: 4 }}>费用合计: <Text strong>￥{Number(quote.fee_total).toFixed(2)}</Text></div>
          {quote.discount_amount > 0 && (
            <div style={{ fontSize: 13, marginBottom: 4 }}>优惠: <Text strong style={{ color: '#ff4d4f' }}>-￥{Number(quote.discount_amount).toFixed(2)}</Text></div>
          )}
          <Divider style={{ margin: '8px 0' }} />
          <div style={{ fontSize: 22, color: '#cf1322', marginTop: 4, fontWeight: 700 }}>
            合计金额: <strong>￥{Number(quote.grand_total).toLocaleString()}</strong>
          </div>
        </div>

        {/* 其他信息 */}
        <div style={{ display: 'flex', gap: 30, fontSize: 13, marginBottom: 24, padding: 12, background: '#fafafa', borderRadius: 4, border: '1px solid #e8e8e8', position: 'relative', zIndex: 1 }}>
          <div><Text strong>付款方式：</Text>{quote.payment_method || '-'}</div>
          <div><Text strong>交货天数：</Text>{quote.delivery_days || 15}天</div>
          <div><Text strong>质保年限：</Text>{quote.warranty_years || 5}年</div>
          <div><Text strong>报价有效期：</Text>{quote.valid_days || 30}天</div>
        </div>

        {quote.remark && (
          <div style={{ fontSize: 13, marginBottom: 24, position: 'relative', zIndex: 1 }}>
            <Text strong>备注：</Text>{quote.remark}
          </div>
        )}

        {/* 签字区域 */}
        <div style={{ marginTop: 60, display: 'flex', justifyContent: 'space-between', fontSize: 13, position: 'relative', zIndex: 1 }}>
          <div>
            <div style={{ marginBottom: 40 }}><Text type="secondary">甲方（盖章）：</Text></div>
            <div>经办人签字：_________________</div>
            <div>日  期：_________________</div>
          </div>
          <div>
            <div style={{ marginBottom: 40 }}><Text type="secondary">乙方（盖章）：</Text></div>
            <div>经办人签字：_________________</div>
            <div>日  期：_________________</div>
          </div>
        </div>

        {/* 底部 */}
        <div style={{ textAlign: 'center', fontSize: 11, color: '#999', marginTop: 40, paddingTop: 16, borderTop: '1px solid #eee', position: 'relative', zIndex: 1 }}>
          本报价单由 {companyName} 生成 · 本报价单仅供参考，最终以双方确认为准
        </div>
      </div>
    </div>
  );
}
