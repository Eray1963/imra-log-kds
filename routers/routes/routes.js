import express from 'express';
import { query } from '../database/connection.js';

const router = express.Router();

// Helper: Build WHERE clause for filters
function buildRouteFilters(filters) {
  const conditions = [];
  const params = [];

  if (filters.vehicle_id) {
    conditions.push('r.vehicle_id = ?');
    params.push(filters.vehicle_id);
  }
  if (filters.driver_id) {
    conditions.push('r.driver_id = ?');
    params.push(filters.driver_id);
  }
  if (filters.load_type) {
    conditions.push('r.load_type = ?');
    params.push(filters.load_type);
  }
  if (filters.status) {
    conditions.push('r.status = ?');
    params.push(filters.status);
  }
  if (filters.start_date && filters.end_date) {
    conditions.push('r.route_date BETWEEN ? AND ?');
    params.push(filters.start_date, filters.end_date);
  } else if (filters.start_date) {
    conditions.push('r.route_date >= ?');
    params.push(filters.start_date);
  } else if (filters.end_date) {
    conditions.push('r.route_date <= ?');
    params.push(filters.end_date);
  }

  return {
    where: conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '',
    params
  };
}

// GET /api/routes - List all routes with optional filters
router.get('/', async (req, res) => {
  try {
    const filters = buildRouteFilters(req.query);
    const sql = `SELECT r.*, 
                v.plate as vehicle_plate, v.brand as vehicle_brand, v.model as vehicle_model,
                d.name as driver_name, d.phone as driver_phone
                FROM routes r
                LEFT JOIN vehicles v ON r.vehicle_id = v.id
                LEFT JOIN drivers d ON r.driver_id = d.id
                ${filters.where}
                ORDER BY r.route_date DESC, r.id DESC`;
    const routes = await query(sql, filters.params);
    res.json({ success: true, data: routes });
  } catch (error) {
    console.error('Error fetching routes:', error);
    res.status(500).json({ success: false, message: 'Rotalar getirilirken hata oluştu', error: error.message });
  }
});

// GET /api/routes/:id - Get single route
router.get('/:id', async (req, res) => {
  try {
    const [routes] = await query(
      `SELECT r.*, 
       v.plate as vehicle_plate, v.brand as vehicle_brand, v.model as vehicle_model,
       d.name as driver_name, d.phone as driver_phone
       FROM routes r
       LEFT JOIN vehicles v ON r.vehicle_id = v.id
       LEFT JOIN drivers d ON r.driver_id = d.id
       WHERE r.id = ?`,
      [req.params.id]
    );
    if (routes.length === 0) {
      return res.status(404).json({ success: false, message: 'Rota bulunamadı' });
    }
    res.json({ success: true, data: routes[0] });
  } catch (error) {
    console.error('Error fetching route:', error);
    res.status(500).json({ success: false, message: 'Rota getirilirken hata oluştu', error: error.message });
  }
});

// POST /api/routes - Create new route
router.post('/', async (req, res) => {
  try {
    const {
      vehicle_id, driver_id, start_city, end_city,
      start_coords_lat, start_coords_lng, end_coords_lat, end_coords_lng,
      distance_km, estimated_time_hours, load_type, route_date, status
    } = req.body;

    if (!start_city || !end_city || !route_date) {
      return res.status(400).json({ success: false, message: 'Başlangıç şehri, bitiş şehri ve tarih zorunludur' });
    }

    const sql = `INSERT INTO routes 
      (vehicle_id, driver_id, start_city, end_city, start_coords_lat, start_coords_lng,
       end_coords_lat, end_coords_lng, distance_km, estimated_time_hours, load_type, route_date, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    
    const result = await query(sql, [
      vehicle_id || null, driver_id || null, start_city, end_city,
      start_coords_lat || null, start_coords_lng || null,
      end_coords_lat || null, end_coords_lng || null,
      distance_km || null, estimated_time_hours || null,
      load_type || null, route_date, status || 'planned'
    ]);

    const [newRoute] = await query(
      `SELECT r.*, 
       v.plate as vehicle_plate, v.brand as vehicle_brand, v.model as vehicle_model,
       d.name as driver_name, d.phone as driver_phone
       FROM routes r
       LEFT JOIN vehicles v ON r.vehicle_id = v.id
       LEFT JOIN drivers d ON r.driver_id = d.id
       WHERE r.id = ?`,
      [result.insertId]
    );
    res.status(201).json({ success: true, data: newRoute[0] });
  } catch (error) {
    console.error('Error creating route:', error);
    res.status(500).json({ success: false, message: 'Rota oluşturulurken hata oluştu', error: error.message });
  }
});

// PUT /api/routes/:id - Update route
router.put('/:id', async (req, res) => {
  try {
    const {
      vehicle_id, driver_id, start_city, end_city,
      start_coords_lat, start_coords_lng, end_coords_lat, end_coords_lng,
      distance_km, estimated_time_hours, load_type, route_date, status
    } = req.body;

    const sql = `UPDATE routes SET
      vehicle_id = ?, driver_id = ?, start_city = ?, end_city = ?,
      start_coords_lat = ?, start_coords_lng = ?, end_coords_lat = ?, end_coords_lng = ?,
      distance_km = ?, estimated_time_hours = ?, load_type = ?, route_date = ?, status = ?
      WHERE id = ?`;
    
    await query(sql, [
      vehicle_id, driver_id, start_city, end_city,
      start_coords_lat, start_coords_lng, end_coords_lat, end_coords_lng,
      distance_km, estimated_time_hours, load_type, route_date, status,
      req.params.id
    ]);

    const [updated] = await query(
      `SELECT r.*, 
       v.plate as vehicle_plate, v.brand as vehicle_brand, v.model as vehicle_model,
       d.name as driver_name, d.phone as driver_phone
       FROM routes r
       LEFT JOIN vehicles v ON r.vehicle_id = v.id
       LEFT JOIN drivers d ON r.driver_id = d.id
       WHERE r.id = ?`,
      [req.params.id]
    );
    if (updated.length === 0) {
      return res.status(404).json({ success: false, message: 'Rota bulunamadı' });
    }

    res.json({ success: true, data: updated[0] });
  } catch (error) {
    console.error('Error updating route:', error);
    res.status(500).json({ success: false, message: 'Rota güncellenirken hata oluştu', error: error.message });
  }
});

// DELETE /api/routes/:id - Delete route
router.delete('/:id', async (req, res) => {
  try {
    const result = await query('DELETE FROM routes WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Rota bulunamadı' });
    }
    res.json({ success: true, message: 'Rota silindi' });
  } catch (error) {
    console.error('Error deleting route:', error);
    res.status(500).json({ success: false, message: 'Rota silinirken hata oluştu', error: error.message });
  }
});

export default router;



