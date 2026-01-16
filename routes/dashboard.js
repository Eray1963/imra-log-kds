import express from 'express'
import { query } from '../database/connection.js'

const router = express.Router()

router.get('/vehicle-by-region', async (req, res) => {
  try {
    const sql = `
      SELECT 
        COALESCE(region, 'Bilinmiyor') AS region,
        COUNT(id) AS vehicleCount
      FROM vehicles
      GROUP BY region
    `
    const rows = await query(sql)

    const regionNames = {
      'marmara': 'Marmara',
      'ege': 'Ege',
      'ic-anadolu': 'İç Anadolu',
      'akdeniz': 'Akdeniz',
      'karadeniz': 'Karadeniz',
      'dogu-anadolu': 'Doğu Anadolu',
      'guneydogu-anadolu': 'Güneydoğu Anadolu'
    }

    const data = rows.map(item => ({
      region: regionNames[item.region] || item.region,
      vehicleCount: Number(item.vehicleCount) || 0
    }))

    return res.json(data)
  } catch (error) {
    console.error('vehicle-by-region error:', error.message)
    return res.status(500).json({ message: 'Sunucu hatası' })
  }
})

export default router



