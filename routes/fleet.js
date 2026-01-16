import express from 'express';
import { query } from '../database/connection.js';

const router = express.Router();

// ============================================
// FLEET SUMMARY
// ============================================

router.get('/summary', async (req, res) => {
  try {
    // Cache'i devre dışı bırak
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    // Toplam çekici sayısı
    const trucksResult = await query(`
      SELECT SUM(total_count) as total FROM cekiciler
    `);
    const totalTrucks = trucksResult[0]?.total || 0;

    // Toplam dorse sayısı
    const trailersResult = await query(`
      SELECT SUM(total_count) as total FROM dorseler
    `);
    const totalTrailers = trailersResult[0]?.total || 0;

    res.json({ 
      success: true, 
      data: {
        totalTrucks: Number(totalTrucks),
        totalTrailers: Number(totalTrailers)
      }
    });
  } catch (error) {
    console.error('Fleet summary error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// FLEET SECTORS
// ============================================

router.get('/sectors', async (req, res) => {
  try {
    // Cache'i devre dışı bırak
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    const data = await query(`
      SELECT * FROM filo_sektorleri ORDER BY sort_order
    `);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Fleet sectors error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// FLEET TRUCKS
// ============================================

router.get('/trucks', async (req, res) => {
  try {
    // Cache'i devre dışı bırak
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    const { sector, region } = req.query;
    let sql = `
      SELECT 
        t.id,
        s.sector_key,
        s.sector_name,
        COALESCE(r.name, 'Tüm Bölgeler') AS region_name,
        t.brand,
        t.model,
        t.total_count,
        t.sector_id,
        t.region_id
      FROM cekiciler t
      INNER JOIN filo_sektorleri s ON t.sector_id = s.id
      LEFT JOIN bolgeler r ON t.region_id = r.id
    `;
    const params = [];
    const conditions = [];
    
    if (sector && ['gida', 'standart', 'agir'].includes(sector)) {
      conditions.push('s.sector_key = ?');
      params.push(sector);
    }
    
    if (region && region !== 'all') {
      conditions.push('(r.name = ? OR r.code = ?)');
      params.push(region, region);
    }
    
    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    
    sql += ` ORDER BY s.sort_order, COALESCE(r.name, ''), t.brand, t.model`;
    const data = await query(sql, params);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Fleet trucks error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// FLEET TRAILERS
// ============================================

router.get('/trailers', async (req, res) => {
  try {
    // Cache'i devre dışı bırak
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    const { sector } = req.query;
    let sql = `
      SELECT 
        t.id,
        s.sector_key,
        s.sector_name,
        t.trailer_type,
        t.total_count
      FROM dorseler t
      INNER JOIN filo_sektorleri s ON t.sector_id = s.id
    `;
    const params = [];
    
    if (sector && ['gida', 'standart', 'agir'].includes(sector)) {
      sql += ' WHERE s.sector_key = ?';
      params.push(sector);
    }
    
    sql += ' ORDER BY s.sort_order, t.trailer_type';
    const data = await query(sql, params);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Fleet trailers error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// FLEET BY SECTOR (Tüm verileri bir arada)
// ============================================

router.get('/by-sector/:sector?', async (req, res) => {
  try {
    // Cache'i devre dışı bırak
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    const { sector } = req.params;
    let sql = `
      SELECT 
        s.id as sector_id,
        s.sector_key,
        s.sector_name,
        s.sort_order
      FROM filo_sektorleri s
    `;
    const params = [];
    
    if (sector && ['gida', 'standart', 'agir'].includes(sector)) {
      sql += ' WHERE s.sector_key = ?';
      params.push(sector);
    }
    
    sql += ' ORDER BY s.sort_order';
    const sectors = await query(sql, params);
    
    // Her sektör için çekici ve dorse verilerini getir
    const result = await Promise.all(sectors.map(async (sec) => {
      const trucks = await query(`
        SELECT brand, model, total_count
        FROM cekiciler
        WHERE sector_id = ?
        ORDER BY brand, model
      `, [sec.sector_id]);
      
      const trailers = await query(`
        SELECT trailer_type, total_count
        FROM dorseler
        WHERE sector_id = ?
        ORDER BY trailer_type
      `, [sec.sector_id]);
      
      return {
        ...sec,
        tractors: trucks,
        trailers: trailers
      };
    }));
    
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Fleet by sector error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// FLEET REGION DISTRIBUTION
// Bölgeye göre filo dağılımı (donut grafiği için)
// fleet_trucks tablosundan region_id ile çekiliyor
// ============================================

router.get('/region-distribution', async (req, res) => {
  try {
    // Cache'i devre dışı bırak
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    const { region } = req.query;
    
    // Önce bölgeye göre toplam sayıları al
    let sql = `
      SELECT 
        r.name AS region_name,
        r.code AS region_code,
        ft.brand,
        ft.model,
        SUM(ft.total_count) AS total_count
      FROM cekiciler ft
      JOIN bolgeler r ON ft.region_id = r.id
      WHERE ft.region_id IS NOT NULL
    `;
    const params = [];
    
    if (region && region !== 'all') {
      sql += ' AND (r.name = ? OR r.code = ?)';
      params.push(region, region);
    } else {
      // Tüm bölgeler için, her bölgeyi ayrı ayrı grupla
    }
    
    sql += ' GROUP BY r.name, r.code, ft.brand, ft.model ORDER BY r.name, ft.brand, ft.model';
    const data = await query(sql, params);
    
    // Her bölge için toplam sayıyı hesapla ve yüzde hesapla
    const regionTotals = {};
    data.forEach(item => {
      if (!regionTotals[item.region_name]) {
        regionTotals[item.region_name] = 0;
      }
      regionTotals[item.region_name] += Number(item.total_count);
    });
    
    // Frontend formatına dönüştür (donut grafiği için)
    const formatted = data.map(item => {
      const total = regionTotals[item.region_name] || 1;
      const percentage = (Number(item.total_count) / total) * 100;
      
      return {
        name: `${item.brand} ${item.model}`,
        value: Math.round(percentage * 100) / 100, // 2 ondalık
        count: Number(item.total_count),
        region: item.region_name
      };
    });
    
    res.json({ success: true, data: formatted });
  } catch (error) {
    console.error('Fleet region distribution error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;

