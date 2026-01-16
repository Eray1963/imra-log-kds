import express from 'express';
import { query } from '../database/connection.js';

const router = express.Router();

// Helper: Build WHERE clause for filters
function buildSupplierFilters(filters) {
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

  return {
    where: conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '',
    params
  };
}

// GET /api/suppliers - List all suppliers with optional filters
router.get('/', async (req, res) => {
  try {
    const filters = buildSupplierFilters(req.query);
    const sql = `SELECT * FROM suppliers ${filters.where} ORDER BY name ASC`;
    const suppliers = await query(sql, filters.params);
    res.json({ success: true, data: suppliers });
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    res.status(500).json({ success: false, message: 'Tedarikçiler getirilirken hata oluştu', error: error.message });
  }
});

// GET /api/suppliers/:id - Get single supplier
router.get('/:id', async (req, res) => {
  try {
    const [suppliers] = await query('SELECT * FROM suppliers WHERE id = ?', [req.params.id]);
    if (suppliers.length === 0) {
      return res.status(404).json({ success: false, message: 'Tedarikçi bulunamadı' });
    }
    res.json({ success: true, data: suppliers[0] });
  } catch (error) {
    console.error('Error fetching supplier:', error);
    res.status(500).json({ success: false, message: 'Tedarikçi getirilirken hata oluştu', error: error.message });
  }
});

// POST /api/suppliers - Create new supplier
router.post('/', async (req, res) => {
  try {
    const {
      name, contact_person, phone, email, address, region, status
    } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Tedarikçi adı zorunludur' });
    }

    const sql = `INSERT INTO suppliers 
      (name, contact_person, phone, email, address, region, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)`;
    
    const result = await query(sql, [
      name, contact_person || null, phone || null, email || null,
      address || null, region || null, status || 'active'
    ]);

    const [newSupplier] = await query('SELECT * FROM suppliers WHERE id = ?', [result.insertId]);
    res.status(201).json({ success: true, data: newSupplier[0] });
  } catch (error) {
    console.error('Error creating supplier:', error);
    res.status(500).json({ success: false, message: 'Tedarikçi oluşturulurken hata oluştu', error: error.message });
  }
});

// PUT /api/suppliers/:id - Update supplier
router.put('/:id', async (req, res) => {
  try {
    const {
      name, contact_person, phone, email, address, region, status
    } = req.body;

    const sql = `UPDATE suppliers SET
      name = ?, contact_person = ?, phone = ?, email = ?,
      address = ?, region = ?, status = ?
      WHERE id = ?`;
    
    await query(sql, [
      name, contact_person, phone, email, address, region, status,
      req.params.id
    ]);

    const [updated] = await query('SELECT * FROM suppliers WHERE id = ?', [req.params.id]);
    if (updated.length === 0) {
      return res.status(404).json({ success: false, message: 'Tedarikçi bulunamadı' });
    }

    res.json({ success: true, data: updated[0] });
  } catch (error) {
    console.error('Error updating supplier:', error);
    res.status(500).json({ success: false, message: 'Tedarikçi güncellenirken hata oluştu', error: error.message });
  }
});

// DELETE /api/suppliers/:id - Delete supplier
router.delete('/:id', async (req, res) => {
  try {
    const result = await query('DELETE FROM suppliers WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Tedarikçi bulunamadı' });
    }
    res.json({ success: true, message: 'Tedarikçi silindi' });
  } catch (error) {
    console.error('Error deleting supplier:', error);
    res.status(500).json({ success: false, message: 'Tedarikçi silinirken hata oluştu', error: error.message });
  }
});

export default router;



