const db = require('../../../lib/db');

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const userId = Number(searchParams.get('userId') || 1);
  const rows = db.prepare('SELECT * FROM hardware WHERE user_id=? ORDER BY sort_order').all(userId);
  return new Response(JSON.stringify({ success: true, data: rows }), { headers: { "Content-Type": "application/json; charset=utf-8" } });
}

export async function POST(request) {
  const body = await request.json();
  const uid = body.user_id || 1;
  const stmt = db.prepare(`INSERT INTO hardware (user_id, name, type, price_per_unit, is_default, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, 0, ?, datetime('now'), datetime('now'))`);
  const info = stmt.run(uid, body.name, body.type || '把手', Number(body.price_per_unit) || 25, body.sort_order || 0);
  const row = db.prepare('SELECT * FROM hardware WHERE id=?').get(Number(info.lastInsertRowid));
  return new Response(JSON.stringify({ success: true, data: row }), { headers: { "Content-Type": "application/json; charset=utf-8" } });
}

export async function PUT(request) {
  const body = await request.json();
  db.prepare('UPDATE hardware SET name=?, type=?, price_per_unit=?, updated_at=datetime(\'now\') WHERE id=?').run(
    body.name, body.type, Number(body.price_per_unit), body.id
  );
  return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json; charset=utf-8" } });
}

export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  db.prepare('DELETE FROM hardware WHERE id=?').run(searchParams.get('id'));
  return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json; charset=utf-8" } });
}
