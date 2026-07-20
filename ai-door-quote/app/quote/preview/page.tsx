'use client';
// @ts-nocheck

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Typography, Spin, message, Divider, Space, Tag, Row, Col } from 'antd';
import { ArrowLeftOutlined, PrinterOutlined, ImportOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

export default function QuotePreviewPage() {
  const router = useRouter();
    let quoteId = null;
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [companyName, setCompanyName] = useState('AI 门窗报价助手');
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    quoteId = urlParams.get("id") || null;
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

  // 导出 PDF
  const handleExportPDF = async () => {
    if (!quote) return;
    setPdfLoading(true);
    setTimeout(() => {
      const el = document.querySelector('.quote-print-area');
      if (el) {
        import('html2pdf.js').then(({ default: html2pdf }) => {
          const opt: any = {
            margin: [10, 10, 10, 10],
            filename: (quote.quote_no || '报价单') + '.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
          };
          html2pdf().set(opt).from(el as any).save().finally(() => setPdfLoading(false));
        }).catch(() => {
          message.error('PDF 生成失败');
          setPdfLoading(false);
        });
      } else {
        message.error('无法找到报价内容');
        setPdfLoading(false);
      }
    }, 300);
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
          <Button type="primary" icon={<PrinterOutlined />} onClick={handlePrint}>打印</Button>
          <Button icon={<ImportOutlined />} loading={pdfLoading} onClick={handleExportPDF}>导出 PDF</Button>
        </Space>
      </div>

      {/* 报价单内容 */}
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 32px', position: 'relative' }}>
        {/* 状态水印 */}
        <div className="status-watermark" style={{ color: watermarkColor }}>{watermarkText}</div>

        {/* 公司头部 */}
        <div style={{ textAlign: 'center', marginBottom: 32, position: 'relative', zIndex: 1 }}>
          <Title level={3} style={{ margin: 0, fontWeight: 700 }}>{companyName}</Title>
          <Title level={4} style={{ color: '#666', marginTop: 8, fontWeight: 400 }}>产品报价单</Title>
        </div>

        {/* 报价信息 */}
        <div style={{ background: '#fafafa', padding: 16, borderRadius: 8, marginBottom: 24, position: 'relative', zIndex: 1 }}>
          <Row gutter={[16, 8]}>
            <Col span={8}><Text strong>报价编号：</Text><span style={{ fontFamily: 'monospace', fontSize: 14 }}>{quote.quote_no || '-'}</span></Col>
            <Col span={8}><Text strong>客户名称：</Text>{quote.customer_name || '-'}</Col>
            <Col span={8}><Text strong>日期：</Text>{quote.created_at ? quote.created_at.split('T')[0] : '-'}</Col>
          </Row>
          <Row style={{ marginTop: 8 }}>
            <Col span={8}><Text strong>联系人：</Text>{quote.contact_name || '-'}</Col>
            <Col span={8}><Text strong>联系电话：</Text>{quote.contact_phone || '-'}</Col>
            <Col span={8}>
              <Text strong>状态：</Text>
              <Tag color={getStatusColor(quote.status)}>{statusText(quote.status)}</Tag>
            </Col>
          </Row>
          {quote.shipping_address && (
            <Row style={{ marginTop: 8 }}>
              <Col span={24}><Text strong>安装地址：</Text>{quote.shipping_address}</Col>
            </Row>
          )}
        </div>

        {/* 产品明细表格 */}
        <Title level={5} style={{ marginTop: 20, position: 'relative', zIndex: 1 }}>产品明细</Title>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20, fontSize: 11, position: 'relative', zIndex: 1 }}>
          <thead>
            <tr style={{ background: '#f0f0f0' }}>
              <th style={{ padding: '6px 4px', textAlign: 'left', borderBottom: '2px solid #ddd', width: 40 }}>序号</th>
              <th style={{ padding: '6px 4px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>产品名称</th>
              <th style={{ padding: '6px 4px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>型号系列</th>
              <th style={{ padding: '6px 4px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>玻璃</th>
              <th style={{ padding: '6px 4px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>颜色</th>
              <th style={{ padding: '6px 4px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>五金</th>
              <th style={{ padding: '6px 4px', textAlign: 'center', borderBottom: '2px solid #ddd' }}>尺寸(mm)</th>
              <th style={{ padding: '6px 4px', textAlign: 'right', borderBottom: '2px solid #ddd', width: 60 }}>面积(㎡)</th>
              <th style={{ padding: '6px 4px', textAlign: 'right', borderBottom: '2px solid #ddd', width: 50 }}>数量</th>
              <th style={{ padding: '6px 4px', textAlign: 'right', borderBottom: '2px solid #ddd', width: 80 }}>单价(元)</th>
              <th style={{ padding: '6px 4px', textAlign: 'right', borderBottom: '2px solid #ddd', width: 90 }}>金额(元)</th>
            </tr>
          </thead>
          <tbody>
            {(quote.products || []).map((item, index) => (
              <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '6px 4px' }}>{index + 1}</td>
                <td style={{ padding: '6px 4px' }}>{item.product_category || '-'}</td>
                <td style={{ padding: '6px 4px' }}>{item.profile_series_name || '-'}</td>
                <td style={{ padding: '6px 4px' }}>{item.glass_name ? item.glass_name + (item.glass_spec ? '(' + item.glass_spec + ')' : '') : '-'}</td>
                <td style={{ padding: '6px 4px' }}>{item.color_name || '-'}</td>
                <td style={{ padding: '6px 4px' }}>{item.hardware_name || '-'}</td>
                <td style={{ padding: '6px 4px', textAlign: 'center' }}>{item.width_mm}×{item.height_mm}</td>
                <td style={{ padding: '6px 4px', textAlign: 'right' }}>{Number(item.area || 0).toFixed(2)}</td>
                <td style={{ padding: '6px 4px', textAlign: 'right' }}>{Number(item.quantity || 0).toLocaleString()}</td>
                <td style={{ padding: '6px 4px', textAlign: 'right' }}>¥{Number(item.unit_price || 0).toFixed(2)}</td>
                <td style={{ padding: '6px 4px', textAlign: 'right', fontWeight: 'bold' }}>¥{Number(item.subtotal || 0).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* 费用汇总 */}
        <div style={{ textAlign: 'right', marginBottom: 32, position: 'relative', zIndex: 1 }}>
          {/* 附加费用列表 */}
          {(quote.fees && quote.fees.length > 0) && (
            <div style={{ marginBottom: 12, textAlign: 'left', fontSize: 12 }}>
              <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 6 }}>附加费用：</Text>
              {quote.fees.map((f, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3, fontSize: 12 }}>
                  <span>{f.fee_name}{f.fee_type ? ' (' + (f.fee_type === 'per_sqm' ? '按㎡' : f.fee_type === 'per_unit' ? '按件' : '固定') + ')' : ''}</span>
                  <span>¥{Number(f.amount || 0).toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
          <div style={{ marginBottom: 4, fontSize: 13 }}>
            <span style={{ marginRight: 40 }}>产品小计：¥{Number(quote.product_total || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
          <div style={{ marginBottom: 4, fontSize: 13 }}>
            <span style={{ marginRight: 40 }}>附加费用：¥{Number(quote.fee_total || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
          {Number(quote.discount_amount) > 0 && (
            <div style={{ marginBottom: 4, fontSize: 13 }}>
              <span style={{ marginRight: 40 }}>优惠金额：-¥{Number(quote.discount_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          )}
          <Divider style={{ margin: '8px 0' }} />
          <div style={{ fontSize: 18, fontWeight: 700, color: '#cf1322' }}>
            最终合计：¥{Number(quote.grand_total || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
        </div>
        {/* 交货周期与质保说明 */}
        <div style={{ marginBottom: 24, padding: 12, background: '#f5f5f5', borderRadius: 6, position: 'relative', zIndex: 1 }}>
          <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 8 }}>交货周期：</Text>
          <Text style={{ fontSize: 12, lineHeight: 1.8, display: 'block', marginBottom: 12 }}>合同确认并收到预付款后15-20个工作日完成生产，具体交付时间以双方确认订单及现场实际情况为准。</Text>
          <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 8 }}>质保说明：</Text>
          <Text style={{ fontSize: 12, lineHeight: 1.8, display: 'block' }}>1、型材质保10年；2、五金配件质保5年；3、中空玻璃质保10年；4、免费提供一次上门调试服务；5、非人为损坏提供终身维护服务。</Text>
        </div>

        {/* 备注 */}
        {quote.remark && (
          <div style={{ marginBottom: 32, padding: 12, background: '#fffbe6', borderRadius: 6, position: 'relative', zIndex: 1 }}>
            <Text strong style={{ fontSize: 13 }}>备注：</Text>
            <Text style={{ fontSize: 13 }}>{quote.remark}</Text>
          </div>
        )}

        {/* 底部说明 */}
        <div style={{ borderTop: '1px solid #eee', paddingTop: 16, fontSize: 11, color: '#999', position: 'relative', zIndex: 1 }}>
          <p style={{ margin: '4px 0' }}>本报价单由 {companyName} 自动生成，有效期为 {quote.valid_days || 7} 天。</p>
          <p style={{ margin: '4px 0' }}>如需修改或取消，请及时联系您的客户经理。</p>
        </div>

        {/* 签字区域 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 48, position: 'relative', zIndex: 1 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ borderBottom: '1px solid #333', width: 160, paddingBottom: 4, marginBottom: 4 }}>客户签字</div>
            <Text type="secondary" style={{ fontSize: 11 }}>日期：</Text>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ borderBottom: '1px solid #333', width: 160, paddingBottom: 4, marginBottom: 4 }}>公司盖章</div>
            <Text type="secondary" style={{ fontSize: 11 }}>日期：</Text>
          </div>
        </div>
      </div>

      {/* 打印按钮 - 桌面端显示 */}
      <div style={{ textAlign: 'center', padding: '24px 0', background: '#f5f5f5', position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000, display: 'none' }} data-no-print>
        <Button type="primary" size="large" icon={<PrinterOutlined />} onClick={handlePrint} style={{ height: 48, fontSize: 16, borderRadius: 8, width: '80%', maxWidth: 320, marginBottom: 8 }}>
          打印
        </Button>
        <Button size="large" icon={<ImportOutlined />} loading={pdfLoading} onClick={handleExportPDF} style={{ height: 48, fontSize: 16, borderRadius: 8, width: '80%', maxWidth: 320 }}>
          导出 PDF
        </Button>
      </div>
    </div>
  );
}

