const db = require('../../../lib/db');

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const userId = Number(searchParams.get('userId') || 1);
  const rows = db.prepare('SELECT * FROM profile_series WHERE user_id = ? ORDER BY sort_order, id').all(userId);
  return Response.json({ success: true, data: rows });
}

export async function POST(request) {
  const body = await request.json();
  const uid = body.user_id || 1;
  const stmt = db.prepare(`INSERT INTO profile_series (user_id, name, base_price, wall_thickness, description, is_default, is_enabled, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 0, 1, ?, datetime('now'), datetime('now'))`);
  const info = stmt.run(uid, body.name, Number(body.base_price), Number(body.wall_thickness) || 1.4, body.description || '', body.sort_order || 0);
  const row = db.prepare('SELECT * FROM profile_series WHERE id = ?').get(Number(info.lastInsertRowid));
  return Response.json({ success: true, data: row });
}

export async function PUT(request) {
  const body = await request.json();
  db.prepare('UPDATE profile_series SET name=?, base_price=?, wall_thickness=?, description=?, is_enabled=?, updated_at=datetime(' + "'now'" + ') WHERE id=?').run(
    body.name, Number(body.base_price), Number(body.wall_thickness), body.description, body.is_enabled !== undefined ? body.is_enabled : 1, body.id
  );
  const row = db.prepare('SELECT * FROM profile_series WHERE id=?').get(body.id);
  return Response.json({ success: true, data: row });
}

export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  db.prepare('DELETE FROM profile_series WHERE id=?').run(searchParams.get('id'));
  return Response.json({ success: true });
}
