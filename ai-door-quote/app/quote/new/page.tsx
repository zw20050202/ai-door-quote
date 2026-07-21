'use client'
// @ts-nocheck

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card, Button, Input, Select, Form, Row, Col, Table, InputNumber, Space, message, Typography, Divider, Modal, Tag, Avatar, Dropdown,
} from 'antd';
import {
  ArrowLeftOutlined, PlusOutlined, DeleteOutlined, CheckOutlined, ReloadOutlined, SaveOutlined,
  EditOutlined, UserOutlined, PhoneOutlined, EnvironmentOutlined, ImportOutlined, FileTextOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;

interface Customer {
  id: number;
  name: string;
  phone: string;
  address?: string;
}

interface ProfileSeries {
  id: number;
  name: string;
  base_price: number;
  wall_thickness: number;
}

interface GlassConfig {
  id: number;
  name: string;
  specification: string;
  price_add: number;
}

interface ColorOption {
  id: number;
  name: string;
  color_code: string;
  price_add: number;
}

interface Hardware {
  id: number;
  name: string;
  type: string;
  price_per_unit: number;
}

interface QuoteProduct {
  key: string;
  product_category: string;
  profile_series_id: number | undefined;
  glass_config_id: number | undefined;
  color_id: number | undefined;
  hardware_id: number | undefined;
  opening_type: string;
  width_mm: number | undefined;
  height_mm: number | undefined;
  area: number;
  quantity: number;
  unit_price: number;
  subtotal: number;
  profile_series?: ProfileSeries;
  glass?: GlassConfig;
  color?: ColorOption;
  hardware?: Hardware;
  remark?: string;
}

interface QuoteFee {
  key: string;
  fee_name: string;
  fee_type: string;
  amount: number;
  remark: string;
}


// 金额转中文大写
const numberToChinese = (num: number): string => {
  if (num === 0) return '零';
  const digits = ['零','壹','贰','叁','肆','伍','陆','柒','捌','玖'];
  const units = ['','拾','佰','仟'];
  const bigUnits = ['','万','亿','兆'];
  const intPart = Math.floor(num);
  const decPart = Math.round((num - intPart) * 100);
  let result = '';

  if (intPart === 0) {
    result = '零';
  } else {
    let str = String(intPart);
    let len = str.length;
    let resultInt = '';
    let prevZero = false;
    for (let i = 0; i < len; i++) {
      const d = parseInt(str[i]);
      const pos = len - 1 - i;
      if (d === 0) {
        if (!prevZero) resultInt += '零';
        prevZero = true;
      } else {
        prevZero = false;
        resultInt += digits[d] + units[pos % 4];
      }
      if ((pos % 4) === 0) {
        resultInt += bigUnits[Math.floor(pos / 4)];
      }
    }
    result = resultInt;
  }

  return '人民币 ' + result + '元' + (decPart > 0 ? digits[Math.floor(decPart / 10)] + '角' + (decPart % 10 > 0 ? digits[decPart % 10] + '分' : '') : '整');
};

export default function NewQuotePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [savedQuoteNo, setSavedQuoteNo] = useState('');

  // 表单数据
  const [customerId, setCustomerId] = useState<number | undefined>();
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newCustomerAddress, setNewCustomerAddress] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');

  // 产品列表
  const [products, setProducts] = useState<QuoteProduct[]>([]);
  const [fees, setFees] = useState<QuoteFee[]>([
    { key: 'install', fee_name: '安装费', fee_type: 'per_sqm', amount: 35, remark: '' },
    { key: 'transport', fee_name: '运输费', fee_type: 'fixed', amount: 200, remark: '' },
  ]);

  // 折扣
  const [discountAmount, setDiscountAmount] = useState(0);
  const [discountType, setDiscountType] = useState('fixed'); // 'fixed' or 'percent'
  const [actualDiscount, setActualDiscount] = useState(0);
  const [showAddFeeMenu, setShowAddFeeMenu] = useState(false);


  // 其他信息
  // 其他信息
  const [paymentMethod, setPaymentMethod] = useState('');
  const [deliveryDays, setDeliveryDays] = useState('');
  const [warrantyYears, setWarrantyYears] = useState('');
  const [validDays, setValidDays] = useState(30);
  const [remark, setRemark] = useState('');

  // 下拉选项数据
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [profiles, setProfiles] = useState<ProfileSeries[]>([]);
  const [glassConfigs, setGlassConfigs] = useState<GlassConfig[]>([]);
  const [colors, setColors] = useState<ColorOption[]>([]);
  const [hardwares, setHardwares] = useState<Hardware[]>([]);

  // 统计数据
  const [totalArea, setTotalArea] = useState(0);
  const [productTotal, setProductTotal] = useState(0);
  const [feeTotal, setFeeTotal] = useState(0);
  const [grandTotal, setGrandTotal] = useState(0);

  // 编辑弹窗状态
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  // 加载数据和设置
  useEffect(() => {
    Promise.all([
      fetch('/api/customers?userId=1').then(r => r.json()),
      fetch('/api/profiles?userId=1').then(r => r.json()),
      fetch('/api/glass-configs?userId=1').then(r => r.json()),
      fetch('/api/colors?userId=1').then(r => r.json()),
      fetch('/api/hardware?userId=1').then(r => r.json()),
    ]).then(([custRes, profRes, glassRes, colorRes, hwRes]) => {
      setCustomers(custRes.data || []);
      setProfiles(profRes.data || []);
      setGlassConfigs(glassRes.data || []);
      setColors(colorRes.data || []);
      setHardwares(hwRes.data || []);
    }).catch(err => console.error('加载数据失败:', err));

    try {
      const settings = localStorage.getItem('quote_settings');
      if (settings) {
        const s = JSON.parse(settings);
        if (s.defaultInstallFee) {
          setFees(prev => prev.map(f => f.fee_name === '安装费' ? { ...f, amount: s.defaultInstallFee } : f));
        }
        if (s.defaultTransportFee) {
          setFees(prev => prev.map(f => f.fee_name === '运输费' ? { ...f, amount: s.defaultTransportFee } : f));
        }
        if (s.paymentMethod) setPaymentMethod(s.paymentMethod);
        if (s.deliveryDays) setDeliveryDays(s.deliveryDays);
        if (s.warrantyYears) setWarrantyYears(s.warrantyYears);
        if (s.validDays) setValidDays(s.validDays);
      }
    } catch (e) { /* ignore */ }
  }, []);

  // 选择客户
  const handleSelectCustomer = (id: number) => {
    const c = customers.find(x => x.id === id);
    if (c) {
      setCustomerId(c.id);
      setCustomerName(c.name);
      setCustomerPhone(c.phone);
      setCustomerAddress(c.address || '');
    }
  };

  // 过滤客户
  const filteredCustomers = customers.filter(c => {
    if (!customerSearch) return true;
    const s = customerSearch.toLowerCase();
    return c.name.toLowerCase().includes(s) || c.phone.includes(s) || (c.address && c.address.toLowerCase().includes(s));
  });

  // 计算单价
  const calcUnitPrice = (product: QuoteProduct): number => {
    let price = 0;
    if (product.profile_series) price += product.profile_series.base_price;
    if (product.glass) price += product.glass.price_add;
    if (product.color) price += product.color.price_add;
    if (product.hardware) price += product.hardware.price_per_unit;
    const cnMap = { 固定: 0, 平开: 50, 推拉: 80 };
    price += cnMap[product.opening_type] || 0;
    return Math.round(price * 100) / 100;
  };

  // 添加产品
  const addProduct = () => {
    const key = 'prod_' + Date.now();
    const newProduct: QuoteProduct = {
      key,
      product_category: '平开窗',
      profile_series_id: undefined,
      glass_config_id: undefined,
      color_id: undefined,
      hardware_id: undefined,
      opening_type: '固定',
      width_mm: undefined,
      height_mm: undefined,
      area: 0,
      quantity: 1,
      unit_price: 0,
      subtotal: 0,
    };
    setProducts([...products, newProduct]);
    calculateTotals([...products, newProduct], fees);
  };

  // 删除产品
  const removeProduct = (key: string) => {
    const newProducts = products.filter(p => p.key !== key);
    setProducts(newProducts);
    calculateTotals(newProducts, fees);
  };

  // 更新产品字段
  const updateProduct = (key: string, field: string, value: any) => {
    const newProducts = products.map(p => {
      if (p.key !== key) return p;
      const updated = { ...p, [field]: value };

      if (field === 'width_mm' || field === 'height_mm') {
        const w = updated.width_mm || 0;
        const h = updated.height_mm || 0;
        updated.area = Math.round((w / 1000) * (h / 1000) * 100) / 100;
      }

      if (['profile_series_id', 'glass_config_id', 'color_id', 'hardware_id', 'opening_type'].includes(field)) {
        updated.profile_series = field === 'profile_series_id'
          ? (profiles.find(x => x.id === value) || updated.profile_series)
          : updated.profile_series;
        updated.glass = field === 'glass_config_id'
          ? (glassConfigs.find(x => x.id === value) || updated.glass)
          : updated.glass;
        updated.color = field === 'color_id'
          ? (colors.find(x => x.id === value) || updated.color)
          : updated.color;
        updated.hardware = field === 'hardware_id'
          ? (hardwares.find(x => x.id === value) || updated.hardware)
          : updated.hardware;
        updated.unit_price = calcUnitPrice(updated);
      }

      updated.subtotal = Math.round(updated.area * updated.quantity * updated.unit_price * 100) / 100;
      return updated;
    });
    setProducts(newProducts);
    calculateTotals(newProducts, fees);
  };

  // 计算总计
  const calculateTotals = (prods: QuoteProduct[], currentFees: QuoteFee[], currentDiscountAmount?: number) => {
    let area = 0;
    let prodTotal = 0;
    for (const p of prods) {
      area += p.area * p.quantity;
      prodTotal += p.subtotal;
    }
    setTotalArea(Math.round(area * 100) / 100);
    let feeTotal = 0;
    for (const f of currentFees) feeTotal += f.amount;
    setFeeTotal(Math.round(feeTotal * 100) / 100);
    setProductTotal(Math.round(prodTotal * 100) / 100);
    // 根据优惠方式计算最终金额
    const effectiveDiscountAmount = currentDiscountAmount !== undefined ? currentDiscountAmount : discountAmount;
    let actualDiscount = effectiveDiscountAmount;
    if (discountType === 'percent' && effectiveDiscountAmount > 0) {
      actualDiscount = Math.round(prodTotal * (effectiveDiscountAmount / 100) * 100) / 100;
    }
    const gt = Math.max(0, prodTotal + feeTotal - actualDiscount);
    setGrandTotal(Math.round(gt * 100) / 100);
    setActualDiscount(actualDiscount);   
  };

  // 更新费用
  const updateFee = (key: string, field: string, value: any) => {
    const newFees = fees.map(f => f.key === key ? { ...f, [field]: value } : f);
    setFees(newFees);
    calculateTotals(products, newFees);
  };
  // 添加费用
  const addFee = (type: string) => {
    const key = 'fee_' + Date.now();
    let name = '';
    if (type === 'install') name = '安装费';
    else if (type === 'transport') name = '运输费';
    else if (type === 'upstairs') name = '上楼费';
    setFees([...fees, { key, fee_name: name, fee_type: 'fixed', amount: 0, remark: '' }]);
    calculateTotals(products, [...fees, { key, fee_name: name, fee_type: 'fixed', amount: 0, remark: '' }]);
  };

  // 删除费用
  const removeFee = (key: string) => {
    const newFees = fees.filter(f => f.key !== key);
    setFees(newFees);
    calculateTotals(products, newFees);
  };

  // 打开编辑弹窗
  const openEditModal = (key: string) => {
    setEditingKey(key);
    setShowEditModal(true);
  };

  // 保存编辑
  const saveEdit = () => {
    // updateProduct already updates the product in real-time
    setShowEditModal(false);
    setEditingKey(null);
  };

  // 保存报价
  const handleSubmit = async (isDraft: boolean = false) => {
    if (!customerId) {
      message.warning('请选择或添加客户');
      return;
    }
    if (products.length === 0) {
      message.warning('请至少添加一个产品');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: 1,
          customer_id: customerId,
          product_total: productTotal,
          fee_total: feeTotal,
          discount_amount: discountAmount,
          grand_total: grandTotal,
          payment_method: paymentMethod,
          delivery_days: String(deliveryDays),
          warranty_years: String(warrantyYears),
          valid_days: validDays,
          remark: remark,
          products: products.map(p => ({
            product_category: p.product_category,
            profile_series_id: p.profile_series_id,
            glass_config_id: p.glass_config_id,
            color_id: p.color_id,
            hardware_id: p.hardware_id,
            opening_type: p.opening_type,
            width_mm: p.width_mm,
            height_mm: p.height_mm,
            area: p.area,
            quantity: p.quantity,
            unit_price: p.unit_price,
            subtotal: p.subtotal,
            sort_order: products.indexOf(p) + 1,
          })),
          fees: fees.map((f, i) => ({
            fee_name: f.fee_name,
            fee_type: f.fee_type,
            amount: f.amount,
            remark: f.remark,
            sort_order: i + 1,
          })),
        }),
      });

      const result = await res.json();
      if (result.success) {
        setSavedQuoteNo(result.data.quote_no);
        message.success(isDraft ? '草稿已保存！报价编号：' + result.data.quote_no : '报价创建成功！报价编号：' + result.data.quote_no);
        const custRes = await fetch('/api/customers?userId=1');
        const custData = await custRes.json();
        setCustomers(custData.data);
        setTimeout(() => router.push('/quotes'), 500);
      } else {
        message.error('创建失败');
      }
    } catch (err) {
      message.error('网络错误，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  // 预览报价单
  const handlePreview = () => {
    if (!customerId) {
      message.warning('请选择客户');
      return;
    }
    if (products.length === 0) {
      message.warning('请至少添加一个产品');
      return;
    }
    setShowPreviewModal(true);
  };

  // 导出 PDF
  const handleExportPDF = async () => {
    if (!customerId) {
      message.warning('请选择客户');
      return;
    }
    if (products.length === 0) {
      message.warning('请至少添加一个产品');
      return;
    }
    setPdfLoading(true);
    setShowPreviewModal(true);
    setTimeout(() => {
      const el = document.getElementById('preview-pdf-content');
      if (el) {
        import('html2pdf.js').then(({ default: html2pdf }) => {
          const opt: any = {
            margin: [10, 10, 10, 10],
            filename: '报价单_' + (customerName || '未命名') + '_' + new Date().toISOString().slice(0, 10) + '.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
          };
          html2pdf().set(opt).from(el).save().finally(() => setPdfLoading(false));
        }).catch(() => {
          message.error('PDF 生成失败');
          setPdfLoading(false);
        });
      } else {
        message.error('无法找到预览内容');
        setPdfLoading(false);
      }
    }, 500);
  };

  // ========== 产品表格列（ERP 风格，只读展示）==========
  const displayProductColumns = [
    {
      title: '序号',
      width: 45,
      render: (_: any, __: any, index: number) => (
        <Text strong style={{ color: '#999' }}>{index + 1}</Text>
      ),
    },
    {
      title: '产品',
      width: 120,
      render: (_: any, record: QuoteProduct, index: number) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 4, background: '#f0f5ff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1px solid #d6e4ff', flexShrink: 0,
          }}>
            <FileTextOutlined style={{ fontSize: 18, color: '#1890ff' }} />
          </div>
          <div>
            <Text strong style={{ fontSize: 13 }}>{record.product_category}</Text>
            <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>
              {record.opening_type}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: '尺寸(mm)',
      width: 90,
      render: (_: any, record: QuoteProduct) => (
        <Text style={{ fontSize: 12 }}>
          {(record.width_mm ?? '--') + '×' + (record.height_mm ?? '--')}
        </Text>
      ),
    },
    {
      title: '面积(m²)',
      width: 70,
      render: (_: any, record: QuoteProduct) => (
        <Text strong style={{ fontSize: 12 }}>{(record.area ?? 0).toFixed(2)}</Text>
      ),
    },
    {
      title: '配置',
      width: 180,
      render: (_: any, record: QuoteProduct) => {
        const parts: string[] = [];
        if (record.profile_series) parts.push(record.profile_series.name);
        if (record.glass) parts.push(record.glass.name);
        if (record.color) parts.push(record.color.name);
        return <Text style={{ fontSize: 11, color: '#666' }}>{parts.join(' / ') || '未配置'}</Text>;
      },
    },
    {
      title: '单价(¥)',
      width: 75,
      render: (_: any, record: QuoteProduct) => (
        <Text style={{ fontSize: 12 }}>{(record.unit_price ?? 0).toFixed(2)}</Text>
      ),
    },
    {
      title: '金额(¥)',
      width: 85,
      render: (_: any, record: QuoteProduct) => (
        <Text strong style={{ color: '#cf1322', fontSize: 13 }}>
          {(Number(record.subtotal) || 0).toFixed(2)}
        </Text>
      ),
    },
    {
      title: '操作',
      width: 70,
      fixed: 'right' as const,
      render: (_: any, record: QuoteProduct) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEditModal(record.key)} />
          <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => removeProduct(record.key)} />
        </Space>
      ),
    },
  ];

  // ========== 费用表格列（ERP风格） ==========
  const feeColumns = [
    {
      title: '费用名称',
      dataIndex: 'fee_name',
      key: 'fee_name',
      width: 160,
      render: (v: string, record: QuoteFee) => (
        <Input
          value={v}
          onChange={(e) => updateFee(record.key, 'fee_name', e.target.value)}
          size="middle"
          style={{ width: '100%' }}
          placeholder="请输入费用名称"
        />
      ),    },
    {
      title: '计算方式',
      dataIndex: 'fee_type',
      key: 'fee_type',
      width: 130,
      render: (v: string, record: QuoteFee) => (
        <Select value={v} onChange={(val) => updateFee(record.key, 'fee_type', val)} size="middle" style={{ width: '100%' }}>
          <Option value="fixed">固定金额</Option>
          <Option value="per_sqm">按平方米</Option>
        </Select>
      ),
    },
    {
      title: '金额(¥)',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      render: (v: number, record: QuoteFee) => (
        <InputNumber value={v} onChange={(val) => updateFee(record.key, 'amount', val)} min={0} precision={2} size="middle" style={{ width: '100%' }}  />
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 60,
      render: (_: any, record: QuoteFee) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => {}} />
          <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => removeFee(record.key)} disabled={fees.length <= 1} />
        </Space>
      ),
    },
  ];

  // 右侧汇总区域
  const renderSummary = () => {
    return (    <div style={{
      position: 'sticky',
      top: 16,
      maxHeight: 'calc(100vh - 32px)',
      overflowY: 'auto',
    }}>
      <Card
        style={{
          borderRadius: 8,
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          border: '1px solid #f0f0f0',
        }}
        bodyStyle={{ padding: '16px 20px' }}
      >
        <div style={{
          fontSize: 16, fontWeight: 600, marginBottom: 16,
          paddingBottom: 12, borderBottom: '1px solid #f0f0f0',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span style={{ fontSize: 20 }}>📋</span> 报价汇总
        </div>

        {/* 总面积 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <Text type="secondary">总面积</Text>
          <Text strong style={{ color: '#1890ff' }}>{(totalArea ?? 0).toFixed(2)} m²</Text>
        </div>

        {/* 产品金额 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <Text type="secondary">产品金额</Text>
          <Text strong>¥{(productTotal ?? 0).toFixed(2)}</Text>
        </div>

        {/* 附加费用 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <Text type="secondary">附加费用</Text>
          <Text>¥{(feeTotal ?? 0).toFixed(2)}</Text>
        </div>

        {/* 优惠 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <Text style={{ color: '#52c41a' }}>优惠</Text>
          <Text strong style={{ color: '#52c41a' }}>- ¥{(actualDiscount ?? 0).toFixed(2)}</Text>
        </div>

        {/* 合计金额 */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
          marginBottom: 8,
        }}>
          <Text strong style={{ fontSize: 16 }}>合计金额</Text>
          <Text strong style={{ fontSize: 28, color: '#cf1322' }}>
            ¥{(grandTotal ?? 0).toFixed(2)}
          </Text>
        </div>

        {/* 大写金额 */}
        <div style={{ fontSize: 12, color: '#666', marginBottom: 16, lineHeight: 1.6 }}>
          大写：{numberToChinese(grandTotal ?? 0)}
        </div>

        <Divider style={{ margin: '8px 0' }} />

        {/* 明细 */}
        <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 8 }}>明细</div>
        <div style={{ fontSize: 13, marginBottom: 4, display: 'flex', justifyContent: 'space-between' }}>
          <Text type="secondary">产品金额</Text>
          <Text>¥{(productTotal ?? 0).toFixed(2)}</Text>
        </div>
        <div style={{ fontSize: 13, marginBottom: 4, display: 'flex', justifyContent: 'space-between' }}>
          <Text type="secondary">附加费用</Text>
          <Text>¥{(feeTotal ?? 0).toFixed(2)}</Text>
        </div>
        <div style={{ fontSize: 13, marginBottom: 12, display: 'flex', justifyContent: 'space-between' }}>
          <Text type="secondary" style={{ color: '#52c41a' }}>优惠金额</Text>
          <Text style={{ color: '#52c41a' }}>- ¥{(actualDiscount ?? 0).toFixed(2)}</Text>
        </div>

        <Divider style={{ margin: '12px 0' }} />

        {/* 按钮组 */}
        <Button
          type="primary"
          block
          size="large"
          icon={<SaveOutlined />}
          loading={submitting}
          style={{ height: 42, fontSize: 15, marginBottom: 8 }}
          onClick={() => handleSubmit(false)}
        >
          保存报价
        </Button>
        <Row gutter={8}>
          <Col span={12}>
            <Button block icon={<FileTextOutlined />} style={{ height: 36 }} onClick={handlePreview}>预览报价单</Button>
          </Col>
          <Col span={12}>
            <Button block icon={<ImportOutlined />} loading={pdfLoading} style={{ height: 36 }} onClick={handleExportPDF}>导出报价单</Button>
          </Col>
        </Row>

        <div style={{ marginTop: 12, fontSize: 11, color: '#bbb', textAlign: 'center' }}>
          报价单保存后，可在"报价管理"中查看和跟踪
        </div>
      </Card>
    </div>
  );
};

  // 获取当前编辑的产品
  const editingProduct = editingKey ? products.find(p => p.key === editingKey) : null;

  return (
    <div style={{ padding: '16px 20px', minHeight: '100vh', background: '#f5f7fa' }}>
      {/* 顶部导航 */}
      <div style={{
        marginBottom: 16, display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', background: '#fff',
        padding: '10px 16px', borderRadius: 8,
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => router.back()} size="middle">
            返回首页
          </Button>
          <Title level={5} style={{ margin: 0, lineHeight: '32px' }}>新建报价</Title>
          {savedQuoteNo && <Tag color="green">{savedQuoteNo}</Tag>}
        </Space>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => {
            setProducts([]);
            setFees([
              { key: 'install', fee_name: '安装费', fee_type: 'per_sqm', amount: 35, remark: '' },
              { key: 'transport', fee_name: '运输费', fee_type: 'fixed', amount: 200, remark: '' },
            ]);
            setDiscountAmount(0);
            setCustomerName('');
            setCustomerPhone('');
            setCustomerAddress('');
            setCustomerId(undefined);
            setCustomerSearch('');
            setTotalArea(0);
            setProductTotal(0);
            setFeeTotal(0);
            setGrandTotal(0);
            setSavedQuoteNo('');
            setRemark('');
            setPaymentMethod('');
          }}>清空</Button>
          <Button icon={<SaveOutlined />} onClick={() => handleSubmit(true)}>保存草稿</Button>
          <Button type="primary" icon={<CheckOutlined />} loading={submitting} onClick={() => handleSubmit(false)}>保存报价</Button>
        </Space>
      </div>

      <Row gutter={[16, 16]}>
        {/* 左侧工作区 ~70% */}
        <Col span={16}>

          {/* ===== 客户信息卡片 ===== */}
          <Card
            style={{ marginBottom: 16, borderRadius: 8, border: '1px solid #f0f0f0' }}
            bodyStyle={{ padding: '12px 20px' }}
          >
            {!customerId ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Select
                  placeholder="搜索客户姓名、电话、地址"
                  showSearch
                  filterOption={(input, option) =>
                    ((option?.label ?? '') as string).toLowerCase().includes(input.toLowerCase())
                  }
                  options={filteredCustomers.map(c => ({
                    label: c.name + ' ' + c.phone + (c.address ? ' - ' + c.address : ''),
                    value: c.id,
                  }))}
                  onChange={handleSelectCustomer}
                  style={{ flex: 1 }}
                  size="middle"
                />
                <Button icon={<PlusOutlined />} onClick={() => setShowAddCustomer(true)}>
                  新建客户
                </Button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Space size={24}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Avatar size="default" icon={<UserOutlined />} style={{ background: '#1890ff' }} />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 15 }}>{customerName}</div>
                      <div style={{ fontSize: 12, color: '#666', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                          <PhoneOutlined style={{ fontSize: 11 }} /> {customerPhone}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                          <EnvironmentOutlined style={{ fontSize: 11 }} /> {customerAddress || '暂无地址'}
                        </span>
                      </div>
                    </div>
                  </div>
                </Space>
                <Space>
                  <Button size="small" onClick={() => { setCustomerId(undefined); setCustomerName(''); setCustomerPhone(''); setCustomerAddress(''); }}>更换客户</Button>
                  <Button size="small" type="primary" ghost onClick={() => setShowAddCustomer(true)}>新建客户</Button>
                </Space>
              </div>
            )}
          </Card>

          {/* ===== 产品配置表格 ===== */}
          <Card
            title={
              <span style={{ fontSize: 14, fontWeight: 600 }}>
                <span style={{ marginRight: 8 }}>📦</span>产品配置
              </span>
            }
            extra={
              <Space>
                <Button size="small" disabled title="预留功能">
                  <ImportOutlined /> 导入方案
                </Button>
                <Button size="small" disabled title="预留功能">从模板添加</Button>
                <Button type="primary" icon={<PlusOutlined />} onClick={addProduct}>
                  添加产品
                </Button>
              </Space>
            }
            style={{ marginBottom: 16, borderRadius: 8, border: '1px solid #f0f0f0' }}
            bodyStyle={{ padding: '0' }}
          >
            {products.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 0', color: '#bbb' }}>
                <FileTextOutlined style={{ fontSize: 32, color: '#d9d9d9', marginBottom: 8 }} />
                <div style={{ fontSize: 14 }}>请点击右上角"添加产品"开始配置门窗</div>
              </div>
            ) : (
              <Table
                columns={displayProductColumns}
                dataSource={products}
                size="middle"
                pagination={false}
                rowKey="key"
                scroll={{ x: 1000 }}
                bordered
                style={{ borderRadius: 8, overflow: 'hidden' }}
              />
            )}

            {/* 小计行 */}
            {products.length > 0 && (
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                padding: '10px 16px', background: '#fafafa',
                borderTop: '1px solid #f0f0f0',
                fontSize: 13,
              }}>
                <Text>小计（{products.length} 项）</Text>
                <Text strong style={{ color: '#1890ff' }}>
                  {products.reduce((sum, p) => sum + (p.area * p.quantity), 0).toFixed(2)} m² &nbsp;&nbsp;
                  ¥{products.reduce((sum, p) => sum + (p.subtotal || 0), 0).toFixed(2)}
                </Text>
              </div>
            )}
          </Card>

          {/* ===== 附加费用 ===== */}
          <Card
            title={
              <span style={{ fontSize: 14, fontWeight: 600 }}>
                <span style={{ marginRight: 8 }}>💰</span>附加费用
              </span>
            }
            extra={
              <Dropdown open={showAddFeeMenu} onOpenChange={setShowAddFeeMenu} menu={{
                items: [
                  { key: 'install', label: '安装费' },
                  { key: 'transport', label: '运输费' },
                  { key: 'upstairs', label: '上楼费' },
                  { key: 'custom', label: '自定义费用' },
                ],
                onClick: ({ key }) => {
                  setShowAddFeeMenu(false);
                  addFee(key);
                },
              }}>
                <Button size="small" icon={<PlusOutlined />}>
                  添加费用
                </Button>
              </Dropdown>
            }
            style={{ marginBottom: 16, borderRadius: 8, border: '1px solid #f0f0f0' }}
            bodyStyle={{ padding: '0' }}
          >
            <Table
              columns={feeColumns}
              dataSource={fees}
              size="small"
              pagination={false}
              rowKey="key"
              bordered
            />
          </Card>

          {/* ===== 折扣与备注 ===== */}
          <Card
            title={
              <span style={{ fontSize: 14, fontWeight: 600 }}>
                <span style={{ marginRight: 8 }}>🏷</span>折扣与备注
              </span>
            }
            style={{ marginBottom: 16, borderRadius: 8, border: '1px solid #f0f0f0' }}
          >
            <Row gutter={[12, 12]}>
              <Col span={8}>
                <Form.Item label="优惠方式" style={{ marginBottom: 0 }}>
                  <Select value={discountType} onChange={setDiscountType} style={{ width: '100%' }} size="middle">
                    <Option value="fixed">固定金额</Option>
                    <Option value="percent">百分比折扣</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label={discountType === 'percent' ? '折扣比例' : '优惠金额'} style={{ marginBottom: 0 }}>
                  {discountType === 'percent' ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <InputNumber
                        value={discountAmount}
                        onChange={(val) => {
                          const v = val || 0;
                          setDiscountAmount(v);
                          calculateTotals(products, fees, v);
                        }}
                        min={0} max={100} precision={2}
                        style={{ flex: 1 }}
                       />
                      <Text>%</Text>
                    </div>
                  ) : (
                    <InputNumber
                      value={discountAmount}
                      onChange={(val) => {
                        const v = val || 0;
                        setDiscountAmount(v);
                        calculateTotals(products, fees, v);
                      }}
                      min={0} precision={2}
                      style={{ width: '100%' }}
                     />
                  )}
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="优惠结果" style={{ marginBottom: 0 }}>
                  <div style={{ color: '#52c41a', fontWeight: 600, fontSize: 15 }}>
                    - ¥{(actualDiscount ?? 0).toFixed(2)} 元
                  </div>
                </Form.Item>              </Col>
              <Col span={24}>
                <Form.Item label="备注信息" style={{ marginBottom: 0 }}>
                  <Input.TextArea
                    value={remark}
                    onChange={e => setRemark(e.target.value)}
                    placeholder="如：不含五金配件、纱窗，需客户自备电源等信息..."
                    rows={3}
                    maxLength={200}
                    showCount
                  />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item label="交货周期" style={{ marginBottom: 0 }}>
                  <Input.TextArea
                    value={deliveryDays}
                    onChange={e => setDeliveryDays(e.target.value)}
                    placeholder="如：合同确认并收到预付款后15-20个工作日完成生产"
                    rows={2}
                  />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item label="质保说明" style={{ marginBottom: 0 }}>
                  <Input.TextArea
                    value={warrantyYears}
                    onChange={e => setWarrantyYears(e.target.value)}
                    placeholder="如：型材质保10年；五金配件质保5年"
                    rows={3}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Card>
        </Col>

        {/* 右侧报价汇总 ~30% */}
        <Col span={8}>
          {renderSummary()}
        </Col>
      </Row>

      {/* ===== 产品编辑弹窗 ===== */}
      <Modal
        title="编辑产品"
        open={showEditModal}
        onCancel={() => { setShowEditModal(false); setEditingKey(null); }}
        onOk={saveEdit}
        width={600}
        okText="保存"
        cancelText="取消"
      >
        {editingProduct && (() => {
          const p = editingProduct;
          return (
            <Form layout="vertical" style={{ marginTop: 16 }}>
              <Form.Item label="产品分类">
                <Select
                  value={p.product_category}
                  onChange={(v) => updateProduct(p.key, 'product_category', v)}
                  style={{ width: '100%' }}
                >
                  <Option value="平开窗">平开窗</Option>
                  <Option value="推拉门">推拉门</Option>
                  <Option value="阳光房">阳光房</Option>
                  <Option value="门">门</Option>
                  <Option value="隔断">隔断</Option>
                </Select>
              </Form.Item>

              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item label="型材系列">
                    <Select
                      value={p.profile_series_id}
                      onChange={(val) => updateProduct(p.key, 'profile_series_id', val)}
                      placeholder="选择型材"
                      style={{ width: '100%' }}
                    >
                      {profiles.map(pr => (
                        <Option key={pr.id} value={pr.id}>{pr.name}（¥{pr.base_price}/²）</Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="玻璃">
                    <Select
                      value={p.glass_config_id}
                      onChange={(val) => updateProduct(p.key, 'glass_config_id', val)}
                      placeholder="选择玻璃"
                      style={{ width: '100%' }}
                    >
                      {glassConfigs.map(g => (
                        <Option key={g.id} value={g.id}>{g.name}（+¥{g.price_add}）</Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item label="颜色">
                    <Select
                      value={p.color_id}
                      onChange={(val) => updateProduct(p.key, 'color_id', val)}
                      placeholder="选择颜色"
                      style={{ width: '100%' }}
                    >
                      <Option value={0}>白色（不加价）</Option>
                      {colors.map(c => (
                        <Option key={c.id} value={c.id}>{c.name}（+¥{c.price_add}）</Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="五金件">
                    <Select
                      value={p.hardware_id}
                      onChange={(val) => updateProduct(p.key, 'hardware_id', val)}
                      placeholder="选择五金"
                      style={{ width: '100%' }}
                    >
                      <Option value={0}>无（不加价）</Option>
                      {hardwares.map(h => (
                        <Option key={h.id} value={h.id}>{h.name}（+¥{h.price_per_unit}）</Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Divider style={{ margin: '8px 0' }} />

              <Row gutter={12}>
                <Col span={8}>
                  <Form.Item label="宽(mm)">
                    <InputNumber
                      value={p.width_mm}
                      onChange={(val) => updateProduct(p.key, 'width_mm', val)}
                      min={100} max={6000}
                      style={{ width: '100%' }}
                     />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="高(mm)">
                    <InputNumber
                      value={p.height_mm}
                      onChange={(val) => updateProduct(p.key, 'height_mm', val)}
                      min={100} max={4000}
                      style={{ width: '100%' }}
                     />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="面积(m²)">
                    <Input value={`${(p.area ?? 0).toFixed(2)}`} readOnly />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={12}>
                <Col span={8}>
                  <Form.Item label="开启方式">
                    <Select
                      value={p.opening_type}
                      onChange={(val) => updateProduct(p.key, 'opening_type', val)}
                      style={{ width: '100%' }}
                    >
                      <Option value="固定">固定</Option>
                      <Option value="平开">平开</Option>
                      <Option value="推拉">推拉</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="数量">
                    <InputNumber
                      value={p.quantity}
                      onChange={(val) => updateProduct(p.key, 'quantity', val)}
                      min={1} max={100}
                      style={{ width: '100%' }}
                     />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="单价(¥/²)">
                    <InputNumber
                      value={p.unit_price}
                      onChange={(val) => updateProduct(p.key, 'unit_price', val)}
                      min={0} precision={2}
                      style={{ width: '100%' }}
                     />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={12}>
                <Col span={12}>
                  <div style={{
                    padding: 12, background: '#f6ffed', borderRadius: 6,
                    border: '1px solid #b7eb8f',
                  }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>金额小计：</Text>
                    <div style={{ fontSize: 20, fontWeight: 600, color: '#52c41a' }}>
                      ¥{(Number(p.subtotal) || 0).toFixed(2)}
                    </div>
                  </div>
                </Col>
                <Col span={12}>
                  <Form.Item label="备注">
                    <Input value={p.remark || ""} onChange={e => updateProduct(p.key, "remark", e.target.value)} placeholder="请输入备注信息" />                  </Form.Item>
                </Col>
              </Row>
            </Form>
          );
        })()}
      </Modal>

      {/* ===== 新增客户弹窗 ===== */}
      <Modal
        title="新增客户"
        open={showAddCustomer}
        onCancel={() => setShowAddCustomer(false)}
        onOk={async () => {
          if (!newCustomerName || !newCustomerPhone) {
            message.warning('请填写客户姓名和电话');
            return;
          }
          try {
            const res = await fetch('/api/customers', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                user_id: 1,
                name: newCustomerName,
                phone: newCustomerPhone,
                address: newCustomerAddress,
              }),
            });
            const result = await res.json();
            if (result.success) {
              message.success('客户添加成功');
              setCustomerId(result.data.id);
              setCustomerName(result.data.name);
              setCustomerPhone(result.data.phone);
              setCustomerAddress(result.data.address || '');
              setShowAddCustomer(false);
              const custRes = await fetch('/api/customers?userId=1');
              const custData = await custRes.json();
              setCustomers(custData.data);
              setNewCustomerName('');
              setNewCustomerPhone('');
              setNewCustomerAddress('');
            }
          } catch (err) {
            message.error('添加失败');
          }
        }}
      >
        <Form layout="vertical" style={{ marginTop: 24 }}>
          <Form.Item label="客户姓名"><Input value={newCustomerName} onChange={e => setNewCustomerName(e.target.value)} placeholder="请输入客户姓名" /></Form.Item>
          <Form.Item label="联系电话"><Input value={newCustomerPhone} onChange={e => setNewCustomerPhone(e.target.value)} placeholder="请输入联系电话" /></Form.Item>
          <Form.Item label="安装地址"><Input value={newCustomerAddress} onChange={e => setNewCustomerAddress(e.target.value)} placeholder="请输入安装地址" /></Form.Item>
        </Form>
      </Modal>
        {/* ===== 预览报价单 Modal ===== */}
        <Modal
          title={null}
          open={showPreviewModal}
          onCancel={() => setShowPreviewModal(false)}
          footer={[
            <Button key="print" icon={<SaveOutlined />} onClick={() => window.print()} disabled={pdfLoading}>打印</Button>,
            <Button key="export" icon={<ImportOutlined />} loading={pdfLoading} onClick={handleExportPDF}>导出 PDF</Button>,
            <Button key="close" type="primary" onClick={() => setShowPreviewModal(false)}>关闭</Button>,
          ]}
          width={860}
          style={{ top: 20 }}
          bodyStyle={{ maxHeight: "80vh", overflowY: "auto" }}
        >
          <div id="preview-pdf-content" style={{ padding: "0 8px" }}>
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <Title level={3} style={{ margin: 0, fontWeight: 700 }}>产品报价单</Title>
            </div>

            <Card size="small" title="客户信息" style={{ marginBottom: 16 }}>
              <Row gutter={16}>
                <Col span={8}><Text strong>客户姓名：</Text>{customerName}</Col>
                <Col span={8}><Text strong>联系电话：</Text>{customerPhone}</Col>
                <Col span={8}><Text strong>安装地址：</Text>{customerAddress || "--"}</Col>
              </Row>
            </Card>

            <Card size="small" title="产品明细" style={{ marginBottom: 16 }}>
              <Table
                dataSource={products}
                columns={[
                  { title: "序号", key: "idx", width: 50, render: (_, __, i) => i + 1 },
                  { title: "类别", dataIndex: "product_category", key: "cat", width: 90 },
                  { title: "系列", key: "series", width: 110, render: (r) => r.profile_series?.name || "--" },
                  { title: "玻璃", key: "glass", width: 100, render: (r) => r.glass?.name || "--" },
                  { title: "颜色", key: "color", width: 80, render: (r) => r.color?.name || "--" },
                  { title: "尺寸(mm)", key: "size", width: 110, render: (r) => r.width_mm + "x" + r.height_mm },
                  { title: "面积(m²)", dataIndex: "area", key: "area", width: 80, render: (v) => v?.toFixed(2) },
                  { title: "数量", dataIndex: "quantity", key: "qty", width: 60 },
                  { title: "单价(¥)", dataIndex: "unit_price", key: "price", width: 80, render: (v) => v?.toFixed(2) },
                  { title: "金额(¥)", dataIndex: "subtotal", key: "amount", width: 90, render: (v) => v?.toFixed(2) },
                ]}
                pagination={false}
                size="small"
                rowKey="key"
                summary={() => (
                  <Table.Summary fixed>
                    <Table.Summary.Row style={{ background: "#fafafa", fontWeight: 600 }}>
                      <Table.Summary.Cell index={0} colSpan={8}>合计</Table.Summary.Cell>
                      <Table.Summary.Cell index={1}>{productTotal.toFixed(2)}</Table.Summary.Cell>
                    </Table.Summary.Row>
                  </Table.Summary>
                )}
              />
            </Card>

            <Card size="small" title="附加费用" style={{ marginBottom: 16 }}>
              <Table
                dataSource={fees}
                columns={[
                  { title: "费用名称", dataIndex: "fee_name", key: "name", width: 120 },
                  { title: "类型", dataIndex: "fee_type", key: "type", width: 80, render: (v) => v==="fixed"?"固定":v==="per_sqm"?"按㎡":v },
                  { title: "金额(¥)", dataIndex: "amount", key: "amount", width: 100, render: (v) => v?.toFixed(2) },
                ]}
                pagination={false}
                size="small"
                rowKey="key"
                summary={() => (
                  <Table.Summary fixed>
                    <Table.Summary.Row style={{ background: "#fafafa", fontWeight: 600 }}>
                      <Table.Summary.Cell index={0} colSpan={2}>小计</Table.Summary.Cell>
                      <Table.Summary.Cell index={0} colSpan={2}>{feeTotal.toFixed(2)}</Table.Summary.Cell>
                    </Table.Summary.Row>
                  </Table.Summary>
                )}
              />
            </Card>

            <div style={{ marginBottom: 16, padding: "12px 0", borderTop: "1px solid #f0f0f0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}><Text>产品金额：</Text><Text>¥{productTotal.toFixed(2)}</Text></div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}><Text>附加费用：</Text><Text>¥{feeTotal.toFixed(2)}</Text></div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, color: "#52c41a" }}><Text>优惠：</Text><Text>- ¥{actualDiscount.toFixed(2)}</Text></div>              <Divider style={{ margin: "12px 0" }} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 18, fontWeight: 600, color: "#cf1322" }}><Text>合计金额：</Text><Text>¥{grandTotal.toFixed(2)}</Text></div>
              <div style={{ fontSize: 12, color: "#666", marginTop: 8 }}>大写：{numberToChinese(grandTotal)}</div>
            </div>

            <div style={{ fontSize: 12, color: "#999", lineHeight: 2, padding: "12px 0", borderTop: "1px solid #eee" }}>
              <div>付款方式：{paymentMethod || "--"}</div>
              <div>交货周期：{deliveryDays || "--"}</div>
              <div>质保说明：{warrantyYears || "--"}</div>
            </div>

            {remark && (<Card size="small" title="备注" style={{ marginBottom: 16 }}><Text>{remark}</Text></Card>)}


          </div>
        </Modal>

    </div>
  );
}
