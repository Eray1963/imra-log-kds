import express from 'express';
import { query } from '../database/connection.js';

const router = express.Router();

// Helper: Build WHERE clause for filters
function buildDriverFilters(filters) {
  const conditions = [];
  const params = [];

  if (filters.region) {
    conditions.push('region = ?');
    params.push(filters.region);
  }
  if (filters.status) {
    conditions.push('status = ?');
    params.push(filters.status);
  }
  if (filters.vehicle_id) {
    conditions.push('vehicle_id = ?');
    params.push(filters.vehicle_id);
  }

  return {
    where: conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '',
    params
  };
}

// GET /api/drivers - List all drivers with optional filters
router.get('/', async (req, res) => {
  try {
    const filters = buildDriverFilters(req.query);
    const sql = `SELECT d.*, v.plate as vehicle_plate 
                FROM drivers d 
                LEFT JOIN vehicles v ON d.vehicle_id = v.id 
                ${filters.where} 
                ORDER BY d.id DESC`;
    const drivers = await query(sql, filters.params);
    res.json({ success: true, data: drivers });
  } catch (error) {
    console.error('Error fetching drivers:', error);
    res.status(500).json({ success: false, message: 'Şoförler getirilirken hata oluştu', error: error.message });
  }
});

// GET /api/drivers/:id - Get single driver
router.get('/:id', async (req, res) => {
  try {
    const [drivers] = await query(
      `SELECT d.*, v.plate as vehicle_plate 
       FROM drivers d 
       LEFT JOIN vehicles v ON d.vehicle_id = v.id 
       WHERE d.id = ?`,
      [req.params.id]
    );
    if (drivers.length === 0) {
      return res.status(404).json({ success: false, message: 'Şoför bulunamadı' });
    }
    res.json({ success: true, data: drivers[0] });
  } catch (error) {
    console.error('Error fetching driver:', error);
    res.status(500).json({ success: false, message: 'Şoför getirilirken hata oluştu', error: error.message });
  }
});

// POST /api/drivers - Create new driver
router.post('/', async (req, res) => {
  try {
    const {
      name, phone, email, license_number, license_expiry,
      vehicle_id, region, status, hire_date
    } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'İsim zorunludur' });
    }

    const sql = `INSERT INTO drivers 
      (name, phone, email, license_number, license_expiry, vehicle_id, region, status, hire_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    
    const result = await query(sql, [
      name, phone || null, email || null, license_number || null,
      license_expiry || null, vehicle_id || null, region || null,
      status || 'active', hire_date || null
    ]);

    const [newDriver] = await query(
      `SELECT d.*, v.plate as vehicle_plate 
       FROM drivers d 
       LEFT JOIN vehicles v ON d.vehicle_id = v.id 
       WHERE d.id = ?`,
      [result.insertId]
    );
    res.status(201).json({ success: true, data: newDriver[0] });
  } catch (error) {
    console.error('Error creating driver:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: 'Bu ehliyet numarası zaten kayıtlı' });
    }
    res.status(500).json({ success: false, message: 'Şoför oluşturulurken hata oluştu', error: error.message });
  }
});

// PUT /api/drivers/:id - Update driver
router.put('/:id', async (req, res) => {
  try {
    const {
      name, phone, email, license_number, license_expiry,
      vehicle_id, region, status, hire_date
    } = req.body;

    const sql = `UPDATE drivers SET
      name = ?, phone = ?, email = ?, license_number = ?, license_expiry = ?,
      vehicle_id = ?, region = ?, status = ?, hire_date = ?
      WHERE id = ?`;
    
    await query(sql, [
      name, phone, email, license_number, license_expiry,
      vehicle_id, region, status, hire_date,
      req.params.id
    ]);

    const [updated] = await query(
      `SELECT d.*, v.plate as vehicle_plate 
       FROM drivers d 
       LEFT JOIN vehicles v ON d.vehicle_id = v.id 
       WHERE d.id = ?`,
      [req.params.id]
    );
    if (updated.length === 0) {
      return res.status(404).json({ success: false, message: 'Şoför bulunamadı' });
    }

    res.json({ success: true, data: updated[0] });
  } catch (error) {
    console.error('Error updating driver:', error);
    res.status(500).json({ success: false, message: 'Şoför güncellenirken hata oluştu', error: error.message });
  }
});

// DELETE /api/drivers/:id - Delete driver
router.delete('/:id', async (req, res) => {
  try {
    const result = await query('DELETE FROM drivers WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Şoför bulunamadı' });
    }
    res.json({ success: true, message: 'Şoför silindi' });
  } catch (error) {
    console.error('Error deleting driver:', error);
    res.status(500).json({ success: false, message: 'Şoför silinirken hata oluştu', error: error.message });
  }
});

export default router;



