const db = require('../../../lib/db');

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const userId = Number(searchParams.get('userId') || 1);
  const keyword = searchParams.get('keyword') || '';

  let sql = 'SELECT * FROM customers WHERE user_id = ?';
  const params = [userId];

  if (keyword) {
    sql += ' AND (name LIKE ? OR phone LIKE ? OR address LIKE ?)';
    const lk = '%' + keyword + '%';
    params.push(lk, lk, lk);
  }

  sql += ' ORDER BY created_at DESC';
  const rows = db.prepare(sql).all(...params);
  return new Response(JSON.stringify({ success: true, data: rows }), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
}

export async function POST(request) {
  const body = await request.json();
  const userId = body.user_id || 1;

  const stmt = db.prepare(`
    INSERT INTO customers (user_id, name, phone, address, remark, total_quotes, total_deals, total_amount, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 0, 0, 0, datetime('now'), datetime('now'))
  `);
  const info = stmt.run(userId, body.name, body.phone, body.address || '', body.remark || '');
  const row = db.prepare('SELECT * FROM customers WHERE id = ?').get(Number(info.lastInsertRowid));
  return new Response(JSON.stringify({ success: true, data: row }), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
}

export async function PUT(request) {
  const body = await request.json();
  db.prepare('UPDATE customers SET name=?, phone=?, address=?, remark=?, updated_at=datetime(\'now\') WHERE id=?').run(
    body.name, body.phone, body.address || '', body.remark || '', body.id
  );
  const row = db.prepare('SELECT * FROM customers WHERE id = ?').get(body.id);
  return new Response(JSON.stringify({ success: true, data: row }), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
}

export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  db.prepare('DELETE FROM customers WHERE id = ?').run(id);
  return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
}
