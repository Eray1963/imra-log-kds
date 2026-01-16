import express from 'express';
import { query } from '../database/connection.js';

const router = express.Router();

// ============================================
// WAREHOUSE VERİLERİ
// ============================================

// Tüm bölgeleri getir
router.get('/regions', async (req, res) => {
  try {
    // Cache'i devre dışı bırak
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    // bolgeler tablosunu kullan (migration sonrası)
    const data = await query('SELECT * FROM bolgeler ORDER BY name');
    res.json({ success: true, data });
  } catch (error) {
    console.error('Regions error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Yıllara göre depo istatistikleri (warehouse_utilization tablosu için)
router.get('/warehouse-yearly-stats/:year?', async (req, res) => {
  try {
    // Cache'i devre dışı bırak
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    const { year } = req.params;
    let sql = `
      SELECT 
        wu.id,
        COALESCE(r.name, wu.region) AS region_name,
        wu.year,
        wu.utilization_percent,
        wu.region_id
      FROM depo_doluluk wu
      LEFT JOIN bolgeler r ON wu.region_id = r.id
    `;
    const params = [];
    
    if (year) {
      sql += ' WHERE wu.year = ?';
      params.push(year);
    }
    
    sql += ' ORDER BY wu.year, COALESCE(r.name, wu.region)';
    const data = await query(sql, params);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Warehouse yearly stats error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Belirli bir bölge için yıllara göre istatistikler
router.get('/warehouse-yearly-stats-by-region/:region/:year?', async (req, res) => {
  try {
    // Cache'i devre dışı bırak
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    const { region, year } = req.params;
    let sql = `
      SELECT 
        wu.id,
        COALESCE(r.name, wu.region) AS region_name,
        wu.year,
        wu.utilization_percent,
        wu.region_id
      FROM depo_doluluk wu
      LEFT JOIN bolgeler r ON wu.region_id = r.id
      WHERE (r.name = ? OR r.code = ? OR wu.region = ?)
    `;
    const params = [region, region, region];
    
    if (year) {
      sql += ' AND wu.year = ?';
      params.push(year);
    }
    
    sql += ' ORDER BY wu.year';
    const data = await query(sql, params);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Warehouse yearly stats by region error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// SPARE PARTS VERİLERİ
// ============================================

// Tüm yedek parçaları getir
router.get('/spare-parts', async (req, res) => {
  try {
    // Cache'i devre dışı bırak
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    const { region } = req.query;
    
    // Hangi tablo adını kullanacağımızı belirle
    let tableName = 'yedek_parcalar';
    let hasTable = false;
    
    // Önce yedek_parcalar tablosunu kontrol et
    try {
      await query('SELECT 1 FROM yedek_parcalar LIMIT 1');
      hasTable = true;
      tableName = 'yedek_parcalar';
    } catch (error) {
      // yedek_parcalar yoksa spare_parts'ı dene
      try {
        await query('SELECT 1 FROM spare_parts LIMIT 1');
        hasTable = true;
        tableName = 'spare_parts';
      } catch (error2) {
        console.log('Neither yedek_parcalar nor spare_parts table exists');
        return res.json({ success: true, data: [] });
      }
    }
    
    // bolgeler tablosunun var olup olmadığını kontrol et
    let hasBolgelerTable = false;
    try {
      await query('SELECT 1 FROM bolgeler LIMIT 1');
      hasBolgelerTable = true;
    } catch (error) {
      // Tablo yoksa hasBolgelerTable false kalacak
      console.log('bolgeler table does not exist, skipping JOIN');
    }
    
    let sql = `
      SELECT 
        sp.id,
        sp.name,
        sp.category,
        sp.supplier,
        sp.stock,
        sp.min_stock,
        sp.unit_price,
        sp.total_value,
        sp.remaining_life_days,
        sp.stock_level,
        ${hasBolgelerTable ? "COALESCE(r.name, 'Tüm Bölgeler') AS region_name," : "'Tüm Bölgeler' AS region_name,"}
        ${hasBolgelerTable ? 'sp.region_id' : 'NULL AS region_id'}
      FROM ${tableName} sp
    `;
    
    if (hasBolgelerTable) {
      sql += ' LEFT JOIN bolgeler r ON sp.region_id = r.id';
    }
    
    const params = [];
    
    if (region && region !== 'all' && hasBolgelerTable) {
      sql += ' WHERE (r.name = ? OR r.code = ?)';
      params.push(region, region);
    }
    
    sql += ' ORDER BY sp.name';
    const data = await query(sql, params);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Spare parts error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Yıllara göre parça kullanım verileri
router.get('/spare-part-yearly-usage/:year?', async (req, res) => {
  try {
    // Cache'i devre dışı bırak
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    const { year } = req.params;
    let sql = `
      SELECT 
        u.id,
        u.part_name,
        u.year,
        u.usage_amount
      FROM yedek_parca_yillik_kullanim u
    `;
    const params = [];
    
    if (year) {
      sql += ' WHERE u.year = ?';
      params.push(year);
    }
    
    sql += ' ORDER BY u.year, u.part_name';
    const data = await query(sql, params);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Spare part yearly usage error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Belirli bir parça için yıllara göre kullanım verileri
router.get('/spare-part-yearly-usage-by-part/:partName/:year?', async (req, res) => {
  try {
    // Cache'i devre dışı bırak
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    const { partName, year } = req.params;
    let sql = `
      SELECT 
        u.id,
        u.part_name,
        u.year,
        u.usage_amount
      FROM yedek_parca_yillik_kullanim u
      WHERE u.part_name = ?
    `;
    const params = [partName];
    
    if (year) {
      sql += ' AND u.year = ?';
      params.push(year);
    }
    
    sql += ' ORDER BY u.year';
    const data = await query(sql, params);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Spare part yearly usage by part error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// SECTOR VOLUME BY REGION VERİLERİ
// ============================================

// Bölge/sektör/yıl bazlı hacim verileri
router.get('/sector-volume-by-region/:region?/:sector?/:year?', async (req, res) => {
  try {
    // Cache'i devre dışı bırak
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    const { region, sector, year } = req.params;
    let sql = `
      SELECT 
        svr.id,
        COALESCE(r.name, svr.region) AS region,
        svr.sector,
        svr.year,
        svr.volume,
        svr.region_id
      FROM bolge_sektor svr
      LEFT JOIN bolgeler r ON svr.region_id = r.id
    `;
    const params = [];
    const conditions = [];
    
    if (region && region !== 'all') {
      // Önce region_id ile dene, yoksa region name ile
      conditions.push('(svr.region_id = (SELECT id FROM bolgeler WHERE name = ? OR code = ?) OR svr.region = ?)');
      params.push(region, region, region);
    }
    
    if (sector && sector !== 'all') {
      conditions.push('svr.sector = ?');
      params.push(sector);
    }
    
    if (year) {
      conditions.push('svr.year = ?');
      params.push(year);
    }
    
    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    
    sql += ' ORDER BY COALESCE(r.name, svr.region), svr.sector, svr.year';
    const data = await query(sql, params);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Sector volume by region error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Tüm bölgeler için yıl bazlı toplam hacim (SUM)
router.get('/sector-volume-total/:year?', async (req, res) => {
  try {
    // Cache'i devre dışı bırak
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    const { year } = req.params;
    let sql = `
      SELECT 
        sector,
        year,
        SUM(volume) as total_volume
      FROM bolge_sektor
    `;
    const params = [];
    
    if (year) {
      sql += ' WHERE year = ?';
      params.push(year);
    }
    
    sql += ' GROUP BY sector, year ORDER BY year, sector';
    const data = await query(sql, params);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Sector volume total error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// SCENARIO RATES VERİLERİ
// ============================================

// Enflasyon oranları
router.get('/inflation-rates', async (req, res) => {
  try {
    // Cache'i devre dışı bırak
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    const { year } = req.query;
    let sql = 'SELECT * FROM enflasyon_oranlari';
    const params = [];
    
    if (year) {
      sql += ' WHERE year = ?';
      params.push(year);
    }
    
    sql += ' ORDER BY year';
    const data = await query(sql, params);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Inflation rates error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/inflation-rates/:year', async (req, res) => {
  try {
    // Cache'i devre dışı bırak
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    const { year } = req.params;
    const sql = 'SELECT * FROM enflasyon_oranlari WHERE year = ? ORDER BY year';
    const data = await query(sql, [year]);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Inflation rates error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Dolar kurları
router.get('/dollar-rates', async (req, res) => {
  try {
    // Cache'i devre dışı bırak
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    const { year } = req.query;
    let sql = 'SELECT * FROM dolar_kurlari';
    const params = [];
    
    if (year) {
      sql += ' WHERE year = ?';
      params.push(year);
    }
    
    sql += ' ORDER BY year';
    const data = await query(sql, params);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Dollar rates error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/dollar-rates/:year', async (req, res) => {
  try {
    // Cache'i devre dışı bırak
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    const { year } = req.params;
    const sql = 'SELECT * FROM dolar_kurlari WHERE year = ? ORDER BY year';
    const data = await query(sql, [year]);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Dollar rates error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Euro kurları
router.get('/euro-rates', async (req, res) => {
  try {
    // Cache'i devre dışı bırak
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    const { year } = req.query;
    let sql = 'SELECT * FROM euro_kurlari';
    const params = [];
    
    if (year) {
      sql += ' WHERE year = ?';
      params.push(year);
    }
    
    sql += ' ORDER BY year';
    const data = await query(sql, params);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Euro rates error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/euro-rates/:year', async (req, res) => {
  try {
    // Cache'i devre dışı bırak
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    const { year } = req.params;
    const sql = 'SELECT * FROM euro_kurlari WHERE year = ? ORDER BY year';
    const data = await query(sql, [year]);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Euro rates error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
