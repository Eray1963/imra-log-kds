import express from 'express';
import { query } from '../database/connection.js';

const router = express.Router();

// Helper: Build WHERE clause for filters
function buildSparePartFilters(filters) {
  const conditions = [];
  const params = [];

  if (filters.category) {
    conditions.push('category = ?');
    params.push(filters.category);
  }
  if (filters.supplier_id) {
    conditions.push('supplier_id = ?');
    params.push(filters.supplier_id);
  }
  if (filters.low_stock === 'true') {
    conditions.push('stock <= min_stock');
  }

  return {
    where: conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '',
    params
  };
}

// GET /api/spare-parts - List all spare parts with optional filters
router.get('/', async (req, res) => {
  try {
    const filters = buildSparePartFilters(req.query);
    const sql = `SELECT sp.*, s.name as supplier_name 
                FROM yedek_parcalar sp
                LEFT JOIN suppliers s ON sp.supplier_id = s.id
                ${filters.where}
                ORDER BY sp.name ASC`;
    const spareParts = await query(sql, filters.params);
    res.json({ success: true, data: spareParts });
  } catch (error) {
    console.error('Error fetching spare parts:', error);
    res.status(500).json({ success: false, message: 'Yedek parçalar getirilirken hata oluştu', error: error.message });
  }
});

// GET /api/spare-parts/:id - Get single spare part
router.get('/:id', async (req, res) => {
  try {
    const [spareParts] = await query(
      `SELECT sp.*, s.name as supplier_name 
       FROM yedek_parcalar sp
       LEFT JOIN suppliers s ON sp.supplier_id = s.id
       WHERE sp.id = ?`,
      [req.params.id]
    );
    if (spareParts.length === 0) {
      return res.status(404).json({ success: false, message: 'Yedek parça bulunamadı' });
    }
    res.json({ success: true, data: spareParts[0] });
  } catch (error) {
    console.error('Error fetching spare part:', error);
    res.status(500).json({ success: false, message: 'Yedek parça getirilirken hata oluştu', error: error.message });
  }
});

// POST /api/spare-parts - Create new spare part
router.post('/', async (req, res) => {
  try {
    const {
      name, category, stock, min_stock, unit_price, supplier_id, part_number
    } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Parça adı zorunludur' });
    }

    const sql = `INSERT INTO yedek_parcalar 
      (name, category, stock, min_stock, unit_price, supplier_id, part_number)
      VALUES (?, ?, ?, ?, ?, ?, ?)`;
    
    const result = await query(sql, [
      name, category || null, stock || 0, min_stock || 0,
      unit_price || 0, supplier_id || null, part_number || null
    ]);

    const [newPart] = await query(
      `SELECT sp.*, s.name as supplier_name 
       FROM yedek_parcalar sp
       LEFT JOIN suppliers s ON sp.supplier_id = s.id
       WHERE sp.id = ?`,
      [result.insertId]
    );
    res.status(201).json({ success: true, data: newPart[0] });
  } catch (error) {
    console.error('Error creating spare part:', error);
    res.status(500).json({ success: false, message: 'Yedek parça oluşturulurken hata oluştu', error: error.message });
  }
});

// PUT /api/spare-parts/:id - Update spare part
router.put('/:id', async (req, res) => {
  try {
    const {
      name, category, stock, min_stock, unit_price, supplier_id, part_number
    } = req.body;

    const sql = `UPDATE yedek_parcalar SET
      name = ?, category = ?, stock = ?, min_stock = ?,
      unit_price = ?, supplier_id = ?, part_number = ?
      WHERE id = ?`;
    
    await query(sql, [
      name, category, stock, min_stock, unit_price, supplier_id, part_number,
      req.params.id
    ]);

    const [updated] = await query(
      `SELECT sp.*, s.name as supplier_name 
       FROM yedek_parcalar sp
       LEFT JOIN suppliers s ON sp.supplier_id = s.id
       WHERE sp.id = ?`,
      [req.params.id]
    );
    if (updated.length === 0) {
      return res.status(404).json({ success: false, message: 'Yedek parça bulunamadı' });
    }

    res.json({ success: true, data: updated[0] });
  } catch (error) {
    console.error('Error updating spare part:', error);
    res.status(500).json({ success: false, message: 'Yedek parça güncellenirken hata oluştu', error: error.message });
  }
});

// DELETE /api/spare-parts/:id - Delete spare part
router.delete('/:id', async (req, res) => {
  try {
    const result = await query('DELETE FROM yedek_parcalar WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Yedek parça bulunamadı' });
    }
    res.json({ success: true, message: 'Yedek parça silindi' });
  } catch (error) {
    console.error('Error deleting spare part:', error);
    res.status(500).json({ success: false, message: 'Yedek parça silinirken hata oluştu', error: error.message });
  }
});

export default router;



