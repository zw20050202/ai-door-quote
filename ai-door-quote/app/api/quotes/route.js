// 公共函数：保存产品列表
function saveProducts(db, quoteId, products) {
  const stmt = db.prepare(
    "INSERT INTO quote_products (quote_id, product_category, profile_series_id, glass_config_id, color_id, hardware_id, opening_type, width_mm, height_mm, area, quantity, unit_price, subtotal, sort_order, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))"
  );
  for (const p of products) {
    stmt.run(quoteId, p.product_category, p.profile_series_id, p.glass_config_id,
      p.color_id || null, p.hardware_id || null, p.opening_type || 'fixed',
      Number(p.width_mm), Number(p.height_mm), Number(p.area), Number(p.quantity),
      Number(p.unit_price), Number(p.subtotal), p.sort_order);
  }
}

// 公共函数：保存附加费用列表
function saveFees(db, quoteId, fees) {
  const stmt = db.prepare(
    "INSERT INTO quote_fees (quote_id, fee_name, fee_type, amount, remark, sort_order, created_at) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))"
  );
  for (let i = 0; i < fees.length; i++) {
    stmt.run(quoteId, fees[i].fee_name, fees[i].fee_type, Number(fees[i].amount), fees[i].remark || '', i + 1);
  }
}

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

  if (id) {
    const quote = db.prepare(`
      SELECT q.*, c.name as customer_name, c.phone as customer_phone, c.address as customer_address
      FROM quotes q LEFT JOIN customers c ON q.customer_id=c.id WHERE q.id=?
    `).get(id);

    const products = db.prepare(`SELECT qp.*, ps.name as profile_series_name, ps.base_price as profile_base_price, gc.name as glass_name, gc.specification as glass_spec, c.name as color_name, h.name as hardware_name FROM quote_products qp LEFT JOIN profile_series ps ON qp.profile_series_id=ps.id LEFT JOIN glass_configs gc ON qp.glass_config_id=gc.id LEFT JOIN colors c ON qp.color_id=c.id LEFT JOIN hardware h ON qp.hardware_id=h.id WHERE qp.quote_id = ? ORDER BY qp.sort_order`).all(id);
    const fees = db.prepare('SELECT * FROM quote_fees WHERE quote_id = ? ORDER BY sort_order').all(id);
    return new Response(JSON.stringify({ success: true, data: { ...quote, products, fees } }), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
  }

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
  return new Response(JSON.stringify({ success: true, data: rows }), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
}


export async function POST(request) {
  const body = await request.json();
  const userId = body.user_id || 1;

  // 如果 body 中有 source_quote_id，走复制逻辑（保存为新报价）
  if (body.source_quote_id) {
    const sourceQuote = db.prepare("SELECT * FROM quotes WHERE id=?").get(body.source_quote_id);
    if (!sourceQuote) {
      return new Response(JSON.stringify({ success: false, error: '报价不存在' }), { status: 404, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
    }

    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const seqStmt = db.prepare("SELECT seq FROM sqlite_sequence WHERE name='quotes'");
    const seqRow = seqStmt.get();
    const seq = seqRow ? seqRow.seq : 0;
    const quoteNo = 'BJ' + today + String(seq + 1).padStart(4, '0');

    // 优先使用前端传来的编辑后数据；如果前端没传（老客户端），则 fallback 到数据库中的旧数据
    const productsToSave = (body.products && body.products.length > 0)
      ? body.products
      : db.prepare('SELECT * FROM quote_products WHERE quote_id = ? ORDER BY sort_order').all(body.source_quote_id);
    const feesToSave = (body.fees && body.fees.length > 0)
      ? body.fees
      : db.prepare('SELECT * FROM quote_fees WHERE quote_id = ? ORDER BY sort_order').all(body.source_quote_id);

    const quoteResult = db.prepare(
      "INSERT INTO quotes (quote_no, user_id, customer_id, status, product_total, fee_total, discount_amount, grand_total, payment_method, delivery_days, warranty_years, valid_days, remark, created_at, updated_at) VALUES (?, ?, ?, 'draft', ?, ?, 0, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))"
    ).run(
      quoteNo, userId, body.customer_id || sourceQuote.customer_id,
      Number(body.product_total) || Number(sourceQuote.product_total),
      Number(body.fee_total) || Number(sourceQuote.fee_total),
      Number(body.grand_total) || Number(sourceQuote.grand_total),
      body.payment_method || sourceQuote.payment_method || '',
      body.delivery_days || sourceQuote.delivery_days || 15,
      body.warranty_years || sourceQuote.warranty_years || 5,
      body.valid_days || sourceQuote.valid_days || 30,
      body.remark || sourceQuote.remark || ''
    );

    const quoteId = Number(quoteResult.lastInsertRowid);

    if (productsToSave && productsToSave.length > 0) {
      saveProducts(db, quoteId, productsToSave);
    }

    saveFees(db, quoteId, feesToSave);

    db.prepare("UPDATE customers SET total_quotes = total_quotes + 1, last_quote_date = datetime('now') WHERE id = ?").run(body.customer_id || sourceQuote.customer_id);

    const quote = db.prepare('SELECT * FROM quotes WHERE id=?').get(quoteId);
    return new Response(JSON.stringify({ success: true, data: quote }), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
  }

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

  if (body.products && body.products.length > 0) {
    saveProducts(db, quoteId, body.products);
  }

  if (body.fees && body.fees.length > 0) {
    saveFees(db, quoteId, body.fees);
  }

  db.prepare('UPDATE customers SET total_quotes = total_quotes + 1, last_quote_date = datetime(' + "'now'" + ') WHERE id = ?').run(body.customer_id);

  const quote = db.prepare('SELECT * FROM quotes WHERE id=?').get(quoteId);
  return new Response(JSON.stringify({ success: true, data: quote }), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
}


export async function PUT(request) {
  const body = await request.json();

  // 如果 body 中有 products 字段，走覆盖逻辑（编辑后覆盖原报价）
  if (body.products && body.id) {
    db.prepare('DELETE FROM quote_products WHERE quote_id=?').run(body.id);
    db.prepare('DELETE FROM quote_fees WHERE quote_id=?').run(body.id);

    db.prepare(
      "UPDATE quotes SET customer_id=?, status='draft', product_total=?, fee_total=?, discount_amount=?, grand_total=?, payment_method=?, delivery_days=?, warranty_years=?, valid_days=?, remark=?, updated_at=datetime('now') WHERE id=?"
    ).run(
      body.customer_id, Number(body.product_total), Number(body.fee_total),
      Number(body.discount_amount) || 0, Number(body.grand_total),
      body.payment_method || '', body.delivery_days || 15,
      body.warranty_years || 5, body.valid_days || 30, body.remark || '', body.id
    );

    if (body.products && body.products.length > 0) saveProducts(db, body.id, body.products);
    if (body.fees && body.fees.length > 0) saveFees(db, body.id, body.fees);

    const quote = db.prepare('SELECT * FROM quotes WHERE id=?').get(body.id);
    return new Response(JSON.stringify({ success: true, data: quote }), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
  }

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
  return new Response(JSON.stringify({ success: true, data: quote }), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
}

export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  db.prepare('DELETE FROM quote_products WHERE quote_id=?').run(id);
  db.prepare('DELETE FROM quote_fees WHERE quote_id=?').run(id);
  db.prepare('DELETE FROM quotes WHERE id=?').run(id);
  return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
}
