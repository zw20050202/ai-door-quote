'use client';
// @ts-nocheck

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card, Button, Input, Select, Form, Row, Col, Table, InputNumber, Space, message, Typography, Divider, Modal, Tag,
} from 'antd';
import {
  ArrowLeftOutlined, PlusOutlined, DeleteOutlined, CheckOutlined, ReloadOutlined, SaveOutlined,
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
}

interface QuoteFee {
  key: string;
  fee_name: string;
  fee_type: string;
  amount: number;
  remark: string;
}

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

  // 其他信息
  const [paymentMethod, setPaymentMethod] = useState('');
  const [deliveryDays, setDeliveryDays] = useState(15);
  const [warrantyYears, setWarrantyYears] = useState(5);
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

    // 加载设置
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
    } catch (e) {
      // ignore
    }
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

  // 过滤客户（用于搜索）
  const filteredCustomers = customers.filter(c => {
    if (!customerSearch) return true;
    const s = customerSearch.toLowerCase();
    return c.name.toLowerCase().includes(s) || c.phone.includes(s) || (c.address && c.address.toLowerCase().includes(s));
  });

  // 计算单价
  const calcUnitPrice = (product: QuoteProduct): number => {
    let price = 0;
    if (product.profile_series) {
      price += product.profile_series.base_price;
    }
    if (product.glass) {
      price += product.glass.price_add;
    }
    if (product.color) {
      price += product.color.price_add;
    }
    if (product.hardware) {
      price += product.hardware.price_per_unit;
    }
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

      // 自动计算面积
      if (field === 'width_mm' || field === 'height_mm') {
        const w = updated.width_mm || 0;
        const h = updated.height_mm || 0;
        updated.area = Math.round((w / 1000) * (h / 1000) * 100) / 100;
      }

      // 自动计算单价
      if (['profile_series_id', 'glass_config_id', 'color_id', 'hardware_id'].includes(field)) {
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

      // 自动计算小计
      updated.subtotal = Math.round(updated.area * updated.quantity * updated.unit_price * 100) / 100;

      return updated;
    });
    setProducts(newProducts);
    calculateTotals(newProducts, fees);
  };

  // 计算总计
  const calculateTotals = (prods: QuoteProduct[], currentFees: QuoteFee[]) => {
    let area = 0;
    let prodTotal = 0;
    for (const p of prods) {
      area += p.area * p.quantity;
      prodTotal += p.subtotal;
    }
    setTotalArea(Math.round(area * 100) / 100);

    let feeTotal = 0;
    for (const f of currentFees) {
      feeTotal += f.amount;
    }
    setFeeTotal(Math.round(feeTotal * 100) / 100);

    setProductTotal(Math.round(prodTotal * 100) / 100);
    const gt = Math.max(0, prodTotal + feeTotal - discountAmount);
    setGrandTotal(Math.round(gt * 100) / 100);
  };

  // 更新费用
  const updateFee = (key: string, field: string, value: any) => {
    const newFees = fees.map(f => ({ ...f, [field]: value }));
    setFees(newFees);
    calculateTotals(products, newFees);
  };

  // 添加费用
  const addFee = () => {
    const key = 'fee_' + Date.now();
    setFees([...fees, { key, fee_name: '新费用', fee_type: 'fixed', amount: 0, remark: '' }]);
    calculateTotals(products, [...fees, { key, fee_name: '新费用', fee_type: 'fixed', amount: 0, remark: '' }]);
  };

  // 删除费用
  const removeFee = (key: string) => {
    const newFees = fees.filter(f => f.key !== key);
    setFees(newFees);
    calculateTotals(products, newFees);
  };

  // 保存报价（草稿或正式）
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
          delivery_days: deliveryDays,
          warranty_years: warrantyYears,
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
        if (isDraft) {
          message.success('草稿已保存！报价编号：' + result.data.quote_no);
        } else {
          message.success('报价创建成功！报价编号：' + result.data.quote_no);
        }
        // 刷新客户列表
        const custRes = await fetch('/api/customers?userId=1');
        const custData = await custRes.json();
        setCustomers(custData.data);
        // 跳转到报价历史
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

  // 产品表格列定义
  const productColumns = [
    {
      title: '产品分类',
      dataIndex: 'product_category',
      key: 'product_category',
      width: 100,
      render: (_: any, __: any, index: number) => (
        <Select
          value={products[index]?.product_category}
          onChange={(v) => updateProduct(products[index]?.key, 'product_category', v)}
          size="small"
          style={{ width: '100%' }}
        >
          <Option value="平开窗">平开窗</Option>
          <Option value="推拉门">推拉门</Option>
          <Option value="阳光房">阳光房</Option>
          <Option value="门">门</Option>
          <Option value="隔断">隔断</Option>
        </Select>
      ),
    },
    {
      title: '型材系列',
      dataIndex: 'profile_series_id',
      key: 'profile_series_id',
      width: 130,
      render: (v: number, record: QuoteProduct) => (
        <Select
          value={v}
          onChange={(val) => updateProduct(record.key, 'profile_series_id', val)}
          placeholder="选择型材"
          size="small"
          style={{ width: '100%' }}
        >
          {profiles.map(p => (
            <Option key={p.id} value={p.id}>{p.name}（￥{p.base_price}/㎡）</Option>
          ))}
        </Select>
      ),
    },
    {
      title: '玻璃',
      dataIndex: 'glass_config_id',
      key: 'glass_config_id',
      width: 140,
      render: (v: number, record: QuoteProduct) => (
        <Select
          value={v}
          onChange={(val) => updateProduct(record.key, 'glass_config_id', val)}
          placeholder="选择玻璃"
          size="small"
          style={{ width: '100%' }}
        >
          {glassConfigs.map(g => (
            <Option key={g.id} value={g.id}>{g.name}（+￥{g.price_add}）</Option>
          ))}
        </Select>
      ),
    },
    {
      title: '颜色',
      dataIndex: 'color_id',
      key: 'color_id',
      width: 120,
      render: (v: number, record: QuoteProduct) => (
        <Select
          value={v}
          onChange={(val) => updateProduct(record.key, 'color_id', val)}
          placeholder="选择颜色"
          size="small"
          style={{ width: '100%' }}
        >
          <Option value={0}>白色（不加价）</Option>
          {colors.map(c => (
            <Option key={c.id} value={c.id}>{c.name}（+￥{c.price_add}）</Option>
          ))}
        </Select>
      ),
    },
    {
      title: '五金件',
      dataIndex: 'hardware_id',
      key: 'hardware_id',
      width: 120,
      render: (v: number, record: QuoteProduct) => (
        <Select
          value={v}
          onChange={(val) => updateProduct(record.key, 'hardware_id', val)}
          placeholder="选择五金"
          size="small"
          style={{ width: '100%' }}
        >
          <Option value={0}>无（不加价）</Option>
          {hardwares.map(h => (
            <Option key={h.id} value={h.id}>{h.name}（+￥{h.price_per_unit}）</Option>
          ))}
        </Select>
      ),
    },
    {
      title: '开启方式',
      dataIndex: 'opening_type',
      key: 'opening_type',
      width: 100,
      render: (v: string, record: QuoteProduct) => (
        <Select
          value={v}
          onChange={(val) => updateProduct(record.key, 'opening_type', val)}
          size="small"
          style={{ width: '100%' }}
        >
          <Option value="固定">固定</Option>
          <Option value="平开">平开</Option>
          <Option value="推拉">推拉</Option>
        </Select>
      ),
    },
    {
      title: '宽(mm)',
      dataIndex: 'width_mm',
      key: 'width_mm',
      width: 90,
      render: (v: number, record: QuoteProduct) => (
        <InputNumber
          value={v}
          onChange={(val) => updateProduct(record.key, 'width_mm', val)}
          min={100}
          max={6000}
          size="small"
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: '高(mm)',
      dataIndex: 'height_mm',
      key: 'height_mm',
      width: 90,
      render: (v: number, record: QuoteProduct) => (
        <InputNumber
          value={v}
          onChange={(val) => updateProduct(record.key, 'height_mm', val)}
          min={100}
          max={4000}
          size="small"
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: '面积(㎡)',
      dataIndex: 'area',
      key: 'area',
      width: 80,
      render: (v: number) => <Text strong>{v.toFixed(2)}</Text>,
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 70,
      render: (v: number, record: QuoteProduct) => (
        <InputNumber
          value={v}
          onChange={(val) => updateProduct(record.key, 'quantity', val)}
          min={1}
          max={100}
          size="small"
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: '单价(￥)',
      dataIndex: 'unit_price',
      key: 'unit_price',
      width: 90,
      render: (v: number, record: QuoteProduct) => (
        <InputNumber
          value={v}
          onChange={(val) => updateProduct(record.key, 'unit_price', val)}
          min={0}
          precision={2}
          size="small"
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: '小计(￥)',
      dataIndex: 'subtotal',
      key: 'subtotal',
      width: 90,
      render: (v: number) => <Text strong style={{ color: '#1890ff' }}>{v.toFixed(2)}</Text>,
    },
    {
      title: '操作',
      key: 'action',
      width: 60,
      render: (_: any, record: QuoteProduct) => (
        <Button type="link" danger icon={<DeleteOutlined />} size="small" onClick={() => removeProduct(record.key)} />
      ),
    },
  ];

  // 费用表格列
  const feeColumns = [
    {
      title: '费用名称',
      dataIndex: 'fee_name',
      key: 'fee_name',
      width: 120,
      render: (v: string, record: QuoteFee) => (
        <Input value={v} onChange={e => updateFee(record.key, 'fee_name', e.target.value)} size="small" style={{ width: 120 }} />
      ),
    },
    {
      title: '计费方式',
      dataIndex: 'fee_type',
      key: 'fee_type',
      width: 110,
      render: (v: string, record: QuoteFee) => (
        <Select value={v} onChange={(val) => updateFee(record.key, 'fee_type', val)} size="small" style={{ width: 110 }}>
          <Option value="fixed">固定金额</Option>
          <Option value="per_sqm">按平方米</Option>
        </Select>
      ),
    },
    {
      title: '金额(￥)',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      render: (v: number, record: QuoteFee) => (
        <InputNumber value={v} onChange={(val) => updateFee(record.key, 'amount', val)} min={0} precision={2} size="small" style={{ width: 120 }} />
      ),
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      render: (v: string, record: QuoteFee) => (
        <Input value={v} onChange={e => updateFee(record.key, 'remark', e.target.value)} size="small" placeholder="可选" />
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 60,
      render: (_: any, record: QuoteFee) => (
        <Button type="link" danger icon={<DeleteOutlined />} size="small" onClick={() => removeFee(record.key)} disabled={fees.length <= 1} />
      ),
    },
  ];

  // 预览区域
  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
      {/* 顶部导航 */}
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => router.back()}>
            返回首页
          </Button>
          <Title level={4} style={{ margin: 0 }}>新建报价</Title>
          {savedQuoteNo && <Tag color="green">已生成编号：{savedQuoteNo}</Tag>}
        </Space>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => {
            setProducts([]);
            setFees([{ key: 'install', fee_name: '安装费', fee_type: 'per_sqm', amount: 35, remark: '' },
                     { key: 'transport', fee_name: '运输费', fee_type: 'fixed', amount: 200, remark: '' }]);
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
          }}>
            清空
          </Button>
          <Button icon={<SaveOutlined />} onClick={() => handleSubmit(true)} size="large">
            保存草稿
          </Button>
          <Button type="primary" icon={<CheckOutlined />} loading={submitting} onClick={() => handleSubmit(false)} size="large">
            保存报价
          </Button>
        </Space>
      </div>

      <Row gutter={[24, 24]}>
        {/* 左侧：表单 */}
        <Col span={16}>
          {/* 客户选择 */}
          <Card title="1. 选择客户" style={{ marginBottom: 24 }}>
            <Space style={{ marginBottom: 16, width: '100%', display: 'flex' }}>
              <Select
                placeholder="搜索客户姓名、电话、地址"
                style={{ flex: 1 }}
                showSearch
                filterOption={(input, option) =>
                  ((option?.label ?? '') as string).toLowerCase().includes(input.toLowerCase())
                }
                options={filteredCustomers.map(c => ({
                  label: c.name + ' ' + c.phone + (c.address ? ' - ' + c.address : ''),
                  value: c.id,
                }))}
                onChange={handleSelectCustomer}
                size="large"
                value={customerId}
              />
              <Button icon={<PlusOutlined />} onClick={() => setShowAddCustomer(true)} size="large">
                新客户
              </Button>
            </Space>

            {customerName && (
              <Form layout="vertical">
                <Row gutter={16}>
                  <Col span={8}><Form.Item label="客户姓名"><Input value={customerName} size="large" readOnly /></Form.Item></Col>
                  <Col span={8}><Form.Item label="联系电话"><Input value={customerPhone} size="large" readOnly /></Form.Item></Col>
                  <Col span={8}><Form.Item label="安装地址"><Input value={customerAddress} size="large" readOnly /></Form.Item></Col>
                </Row>
              </Form>
            )}
          </Card>

          {/* 产品列表 */}
          <Card title="2. 产品配置" extra={
            <Button type="primary" icon={<PlusOutlined />} onClick={addProduct} size="large">
              添加产品
            </Button>
          } style={{ marginBottom: 24 }}>
            {products.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
                <Text>请点击右上角"添加产品"开始配置门窗</Text>
              </div>
            ) : (
              <Table
                columns={productColumns}
                dataSource={products}
                scroll={{ x: 2000 }}
                pagination={false}
                size="small"
                bordered
              />
            )}
          </Card>

          {/* 费用配置 */}
          <Card title="3. 附加费用" extra={
            <Button icon={<PlusOutlined />} onClick={addFee} size="small">
              添加费用
            </Button>
          } style={{ marginBottom: 24 }}>
            <Table
              columns={feeColumns}
              dataSource={fees}
              pagination={false}
              size="small"
              bordered
            />
          </Card>

          {/* 折扣和其他信息 */}
          <Card title="4. 折扣与备注" style={{ marginBottom: 24 }}>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item label="优惠金额(￥)">
                  <InputNumber
                    value={discountAmount}
                    onChange={(v) => setDiscountAmount(v || 0)}
                    min={0}
                    max={grandTotal + productTotal}
                    style={{ width: '100%' }}
                    size="large"
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="付款方式">
                  <Input value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} placeholder="如：50%预付" size="large" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="交货天数">
                  <InputNumber
                    value={deliveryDays}
                    onChange={(v) => setDeliveryDays(v || 15)}
                    min={1}
                    max={90}
                    style={{ width: '100%' }}
                    size="large"
                  />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item label="质保年限">
                  <InputNumber
                    value={warrantyYears}
                    onChange={(v) => setWarrantyYears(v || 5)}
                    min={0}
                    max={20}
                    style={{ width: '100%' }}
                    size="large"
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="报价有效期(天)">
                  <InputNumber
                    value={validDays}
                    onChange={(v) => setValidDays(v || 30)}
                    min={1}
                    max={90}
                    style={{ width: '100%' }}
                    size="large"
                  />
                </Form.Item>
              </Col>
              <Col span={8}></Col>
            </Row>
            <Form.Item label="备注">
              <Input.TextArea
                value={remark}
                onChange={e => setRemark(e.target.value)}
                rows={3}
                placeholder="如：不含高空作业费、需客户自备辅料等"
              />
            </Form.Item>
          </Card>
        </Col>

        {/* 右侧：实时预览 */}
        <Col span={8}>
          <Card title="报价预览" style={{ position: 'sticky', top: 24 }}>
            <Divider plain>合计</Divider>
            <div style={{ marginBottom: 16 }}>
              <Text type="secondary">总面积：</Text>
              <Text strong style={{ fontSize: 16 }}>{totalArea.toFixed(2)} ㎡</Text>
            </div>
            <div style={{ marginBottom: 16 }}>
              <Text type="secondary">产品总价：</Text>
              <Text strong style={{ fontSize: 16 }}>￥{productTotal.toFixed(2)}</Text>
            </div>
            <div style={{ marginBottom: 16 }}>
              <Text type="secondary">费用合计：</Text>
              <Text strong style={{ fontSize: 16 }}>￥{feeTotal.toFixed(2)}</Text>
            </div>
            {discountAmount > 0 && (
              <div style={{ marginBottom: 16 }}>
                <Text type="secondary">优惠金额：</Text>
                <Text strong style={{ color: '#ff4d4f', fontSize: 16 }}>- ￥{discountAmount.toFixed(2)}</Text>
              </div>
            )}
            <Divider />
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text strong style={{ fontSize: 18 }}>合计金额：</Text>
              <Text strong style={{ fontSize: 28, color: '#cf1322' }}>￥{grandTotal.toFixed(2)}</Text>
            </div>

            <Divider plain>明细</Divider>
            {products.map((p, i) => (
              <div key={p.key} style={{ marginBottom: 12, padding: 8, background: '#fafafa', borderRadius: 4 }}>
                <Text strong>{i + 1}. {p.product_category}</Text>
                <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                  {p.profile_series?.name || '未选型材'} · {p.glass?.name || '未选玻璃'}
                  {p.color ? ` · ${p.color.name}` : ''}
                </div>
                <div style={{ fontSize: 12, color: '#666' }}>
                  {p.width_mm}×{p.height_mm}mm · {p.opening_type}
                </div>
                <div style={{ fontSize: 12, color: '#666' }}>
                  {p.area}㎡ × {p.quantity} · ￥{p.unit_price}/㎡
                </div>
                <div style={{ fontSize: 14, color: '#1890ff', fontWeight: 'bold', marginTop: 4 }}>
                  ￥{p.subtotal.toFixed(2)}
                </div>
              </div>
            ))}

            {fees.length > 0 && (
              <>
                <Divider plain>费用</Divider>
                {fees.map(f => (
                  <div key={f.key} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13 }}>
                    <Text type="secondary">{f.fee_name}</Text>
                    <Text>￥{f.amount.toFixed(2)}</Text>
                  </div>
                ))}
              </>
            )}

            <Divider />
            <Button type="primary" block size="large" style={{ height: 48, fontSize: 16, marginBottom: 8 }} onClick={() => handleSubmit(false)}>
              保存报价
            </Button>
          </Card>
        </Col>
      </Row>

      {/* 新增客户弹窗 */}
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
              // 刷新客户列表
              const custRes = await fetch('/api/customers?userId=1');
              const custData = await custRes.json();
              setCustomers(custData.data);
              // 清空表单
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
          <Form.Item label="客户姓名"><Input value={newCustomerName} onChange={e => setNewCustomerName(e.target.value)} placeholder="请输入客户姓名" size="large" /></Form.Item>
          <Form.Item label="联系电话"><Input value={newCustomerPhone} onChange={e => setNewCustomerPhone(e.target.value)} placeholder="请输入联系电话" size="large" /></Form.Item>
          <Form.Item label="安装地址"><Input value={newCustomerAddress} onChange={e => setNewCustomerAddress(e.target.value)} placeholder="请输入安装地址" size="large" /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
