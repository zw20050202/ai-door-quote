const db = require('../../../lib/db');

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const userIdStr = searchParams.get('userId');
  const status = searchParams.get('status');
  const idStr = searchParams.get('id');
  const keyword = searchParams.get('keyword') || '';
  const dateFrom = searchParams.get('dateFrom') || '';
  const dateTo = searchParams.get('dateTo') || '';
  const userId = userIdStr ? Number(userIdStr) : 1;
  const id = idStr ? Number(idStr) : null;

  // 如果有 id 参数，返回详情
  if (id) {
    const quote = db.prepare(`
      SELECT q.*, c.name as customer_name, c.phone as customer_phone, c.address as customer_address
      FROM quotes q LEFT JOIN customers c ON q.customer_id=c.id WHERE q.id=?
    `).get(id);

    const products = db.prepare('SELECT * FROM quote_products WHERE quote_id = ? ORDER BY sort_order').all(id);
    const fees = db.prepare('SELECT * FROM quote_fees WHERE quote_id = ? ORDER BY sort_order').all(id);
    return Response.json({ success: true, data: { ...quote, products, fees } });
  }

  // 否则返回列表
  let sql = `
    SELECT q.*, c.name as customer_name, c.phone as customer_phone
    FROM quotes q
    LEFT JOIN customers c ON q.customer_id = c.id
    WHERE q.user_id = ?
  `;
  const params = [userId];

  if (status) {
    sql += ' AND q.status = ?';
    params.push(status);
  }

  if (keyword) {
    sql += ' AND (q.quote_no LIKE ? OR c.name LIKE ? OR c.phone LIKE ?)';
    const lk = '%' + keyword + '%';
    params.push(lk, lk, lk);
  }

  if (dateFrom) {
    sql += ' AND date(q.created_at) >= ?';
    params.push(dateFrom);
  }

  if (dateTo) {
    sql += ' AND date(q.created_at) <= ?';
    params.push(dateTo);
  }

  sql += ' ORDER BY q.created_at DESC';
  const rows = db.prepare(sql).all(...params);
  return Response.json({ success: true, data: rows });
}

export async function POST(request) {
  const body = await request.json();
  const userId = body.user_id || 1;

  const insertQuote = db.prepare(`
    INSERT INTO quotes (quote_no, user_id, customer_id, status, product_total, fee_total, discount_amount, grand_total,
                        payment_method, delivery_days, warranty_years, valid_days, remark, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `);

  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const seqStmt = db.prepare("SELECT seq FROM sqlite_sequence WHERE name='quotes'");
  const seqRow = seqStmt.get();
  const seq = seqRow ? seqRow.seq : 0;
  const quoteNo = 'BJ' + today + String(seq + 1).padStart(4, '0');

  const quoteResult = insertQuote.run(
    quoteNo, userId, body.customer_id, 'draft',
    Number(body.product_total), Number(body.fee_total),
    Number(body.discount_amount) || 0, Number(body.grand_total),
    body.payment_method || '', body.delivery_days || 15,
    body.warranty_years || 5, body.valid_days || 30, body.remark || ''
  );

  const quoteId = Number(quoteResult.lastInsertRowid);

  // 插入产品
  if (body.products && body.products.length > 0) {
    const insertProduct = db.prepare(`
      INSERT INTO quote_products (quote_id, product_category, profile_series_id, glass_config_id, color_id, hardware_id,
                                  opening_type, width_mm, height_mm, area, quantity, unit_price, subtotal, sort_order, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `);
    for (const p of body.products) {
      insertProduct.run(
        quoteId, p.product_category, p.profile_series_id, p.glass_config_id,
        p.color_id || null, p.hardware_id || null, p.opening_type || 'fixed',
        p.width_mm, p.height_mm, p.area, p.quantity, p.unit_price, p.subtotal, p.sort_order
      );
    }
  }

  // 插入费用
  if (body.fees && body.fees.length > 0) {
    const insertFee = db.prepare(`
      INSERT INTO quote_fees (quote_id, fee_name, fee_type, amount, remark, sort_order, created_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `);
    for (let i = 0; i < body.fees.length; i++) {
      const f = body.fees[i];
      insertFee.run(quoteId, f.fee_name, f.fee_type, Number(f.amount), f.remark || '', i + 1);
    }
  }

  db.prepare('UPDATE customers SET total_quotes = total_quotes + 1, last_quote_date = datetime(' + "'now'" + ') WHERE id = ?').run(body.customer_id);

  const quote = db.prepare('SELECT * FROM quotes WHERE id=?').get(quoteId);
  return Response.json({ success: true, data: quote });
}

export async function PUT(request) {
  const body = await request.json();
  let sql = 'UPDATE quotes SET status=?, updated_at=datetime(' + "'now'" + ')';
  const params = [body.status, body.id];
  if (body.status === 'sent') { sql += ', sent_at=datetime(' + "'now'" + ')'; }
  if (body.status === 'deal') { sql += ', deal_at=datetime(' + "'now'" + ')'; }
  sql += ' WHERE id=?';
  db.prepare(sql).run(...params);

  if (body.status === 'deal') {
    db.prepare('UPDATE customers SET total_deals = total_deals + 1, total_amount = total_amount + ? WHERE id = (SELECT customer_id FROM quotes WHERE id = ?)').run(body.grand_total || 0, body.id);
  }

  const quote = db.prepare('SELECT * FROM quotes WHERE id=?').get(body.id);
  return Response.json({ success: true, data: quote });
}

export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  db.prepare('DELETE FROM quote_products WHERE quote_id=?').run(id);
  db.prepare('DELETE FROM quote_fees WHERE quote_id=?').run(id);
  db.prepare('DELETE FROM quotes WHERE id=?').run(id);
  return Response.json({ success: true });
}
