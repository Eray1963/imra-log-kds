const db = require('../db/mysql_connect');

const createReservation = async (req, res) => {
  try {
    const { customer_name, phone, email, party_size, reservation_time, notes } = req.body;
    if (!customer_name || !party_size || !reservation_time) return res.status(400).json({ error: 'Eksik alan' });
    const sql = 'INSERT INTO reservations (customer_name, phone, email, party_size, reservation_time, notes) VALUES (?, ?, ?, ?, ?, ?)';
    const [result] = await db.execute(sql, [customer_name, phone || null, email || null, party_size, reservation_time, notes || null]);
    const [rows] = await db.execute('SELECT * FROM reservations WHERE id = ?', [result.insertId]);
    return res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Sunucu hatası' });
  }
};

const listReservations = async (req, res) => {
  try {
    const { date, status } = req.query;
    let sql = 'SELECT * FROM reservations';
    const params = [];
    const conditions = [];
    if (date) {
      conditions.push('DATE(reservation_time) = ?');
      params.push(date);
    }
    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }
    if (conditions.length) sql += ' WHERE ' + conditions.join(' AND ');
    sql += ' ORDER BY reservation_time ASC';
    const [rows] = await db.execute(sql, params);
    return res.status(200).json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Sunucu hatası' });
  }
};

const getReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.execute('SELECT * FROM reservations WHERE id = ?', [id]);
    if (!rows.length) return res.status(404).json({ error: 'Rezervasyon bulunamadı' });
    return res.json(rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Sunucu hatası' });
  }
};

const updateReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const fields = [];
    const params = [];
    const allowed = ['customer_name', 'phone', 'email', 'party_size', 'reservation_time', 'notes', 'status'];
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        fields.push(`${key} = ?`);
        params.push(req.body[key]);
      }
    }
    if (!fields.length) return res.status(400).json({ error: 'Güncellenecek alan yok' });
    params.push(id);
    const sql = `UPDATE reservations SET ${fields.join(', ')} WHERE id = ?`;
    await db.execute(sql, params);
    const [rows] = await db.execute('SELECT * FROM reservations WHERE id = ?', [id]);
    return res.json(rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Sunucu hatası' });
  }
};

const cancelReservation = async (req, res) => {
  try {
    const { id } = req.params;
    // Fiziksel silme yerine status güncellemesi önerilir
    await db.execute('UPDATE reservations SET status = ? WHERE id = ?', ['cancelled', id]);
    return res.json({ message: 'Rezervasyon iptal edildi' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Sunucu hatası' });
  }
};

module.exports = { createReservation, listReservations, getReservation, updateReservation, cancelReservation };
