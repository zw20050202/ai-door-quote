const db = require('../../../lib/db');
// GET 获取预设费用模板
export async function GET() {
  const fees = [
    { id: 1, fee_name: '安装费', fee_type: 'per_sqm', default_amount: 35 },
    { id: 2, fee_name: '运输费', fee_type: 'fixed', default_amount: 200 },
    { id: 3, fee_name: '上楼费', fee_type: 'fixed', default_amount: 100 },
  ];
  return Response.json({ success: true, data: fees });
}



