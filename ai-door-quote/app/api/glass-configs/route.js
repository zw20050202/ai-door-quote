const db = require('../../../lib/db');

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const userId = Number(searchParams.get('userId') || 1);
  const rows = db.prepare('SELECT * FROM glass_configs WHERE user_id=? ORDER BY sort_order').all(userId);
  return Response.json({ success: true, data: rows });
}

export async function POST(request) {
  const body = await request.json();
  const uid = body.user_id || 1;
  const stmt = db.prepare(`INSERT INTO glass_configs (user_id, name, specification, price_add, is_default, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, 0, ?, datetime('now'), datetime('now'))`);
  const info = stmt.run(uid, body.name, body.specification, Number(body.price_add) || 0, body.sort_order || 0);
  const row = db.prepare('SELECT * FROM glass_configs WHERE id=?').get(Number(info.lastInsertRowid));
  return Response.json({ success: true, data: row });
}

export async function PUT(request) {
  const body = await request.json();
  db.prepare('UPDATE glass_configs SET name=?, specification=?, price_add=?, updated_at=datetime(\'now\') WHERE id=?').run(
    body.name, body.specification, Number(body.price_add), body.id
  );
  return Response.json({ success: true });
}

export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  db.prepare('DELETE FROM glass_configs WHERE id=?').run(searchParams.get('id'));
  return Response.json({ success: true });
}
