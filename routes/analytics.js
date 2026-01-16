import express from 'express';
import { query } from '../database/connection.js';

const router = express.Router();

// GET /api/analytics/dashboard - Executive Dashboard with comprehensive KPIs
router.get('/dashboard', async (req, res) => {
  try {
    const { start_date, end_date, region, city, vehicle_type, load_type, driver_id, supplier_id } = req.query;

    // Build WHERE clauses with proper parameter handling
    let vehicleWhere = '1=1';
    let routeWhere = '1=1';
    let vehicleParams = [];
    let routeParams = [];

    if (region && region !== 'all') {
      vehicleWhere += ' AND region = ?';
      vehicleParams.push(region);
    }
    if (vehicle_type && vehicle_type !== 'all') {
      vehicleWhere += ' AND type = ?';
      vehicleParams.push(vehicle_type);
    }
    if (start_date) {
      routeWhere += ' AND route_date >= ?';
      routeParams.push(start_date);
    }
    if (end_date) {
      routeWhere += ' AND route_date <= ?';
      routeParams.push(end_date);
    }
    if (load_type && load_type !== 'all') {
      routeWhere += ' AND load_type = ?';
      routeParams.push(load_type);
    }
    if (driver_id && driver_id !== 'all') {
      routeWhere += ' AND driver_id = ?';
      routeParams.push(parseInt(driver_id));
    }

    // Total vehicles (filtered)
    const [totalVehiclesResult] = await query(
      `SELECT COUNT(*) as count FROM vehicles WHERE ${vehicleWhere}`,
      vehicleParams
    );
    const totalVehicles = totalVehiclesResult[0]?.count || 0;

    // Active vehicles
    const [activeVehiclesResult] = await query(
      `SELECT COUNT(*) as count FROM vehicles WHERE ${vehicleWhere} AND status = 'active'`,
      vehicleParams
    );
    const activeVehicles = activeVehiclesResult[0]?.count || 0;

    // Total routes (filtered)
    const [totalRoutesResult] = await query(
      `SELECT COUNT(*) as count FROM routes WHERE ${routeWhere}`,
      routeParams
    );
    const totalRoutes = totalRoutesResult[0]?.count || 0;

    // Total distance (km)
    const [totalKmResult] = await query(
      `SELECT COALESCE(SUM(distance_km), 0) as total_km FROM routes WHERE ${routeWhere}`,
      routeParams
    );
    const totalKm = parseFloat(totalKmResult[0]?.total_km || 0);

    // Total load (mock - using route count * average load)
    const totalLoad = totalRoutes * 15; // Mock: 15 ton average per route

    // Average cost per km (mock calculation)
    const avgCostPerKm = totalKm > 0 ? (totalRoutes * 2500 / totalKm).toFixed(2) : 0; // Mock: 2500 TL per route

    // Utilization rate (active vehicles / total vehicles)
    const utilizationRate = totalVehicles > 0 ? ((activeVehicles / totalVehicles) * 100).toFixed(1) : 0;

    // Vehicles by type
    const vehiclesByType = await query(
      `SELECT type, COUNT(*) as count FROM vehicles WHERE ${vehicleWhere} GROUP BY type`,
      vehicleParams
    );

    // Vehicles by region
    const vehiclesByRegion = await query(
      `SELECT region, COUNT(*) as count FROM vehicles WHERE ${vehicleWhere} AND region IS NOT NULL GROUP BY region`,
      vehicleParams
    );

    // Routes by load type
    const routesByLoadType = await query(
      `SELECT load_type, COUNT(*) as count FROM routes WHERE ${routeWhere} AND load_type IS NOT NULL GROUP BY load_type`,
      routeParams
    );

    // Routes by month (time series)
    const routesByMonth = await query(
      `SELECT 
        DATE_FORMAT(route_date, '%Y-%m') as month,
        COUNT(*) as count,
        COALESCE(SUM(distance_km), 0) as total_km
       FROM routes 
       WHERE ${routeWhere}
       GROUP BY DATE_FORMAT(route_date, '%Y-%m')
       ORDER BY month ASC`,
      routeParams
    );

    // Regional intensity data for map (combine vehicles and routes)
    const regionalIntensity = await query(
      `SELECT 
        COALESCE(v.region, 'unknown') as region,
        COUNT(DISTINCT v.id) as vehicle_count,
        COUNT(DISTINCT r.id) as route_count,
        COALESCE(SUM(r.distance_km), 0) as total_km,
        COALESCE(SUM(r.distance_km) / NULLIF(COUNT(DISTINCT r.id), 0), 0) as avg_km_per_route
       FROM vehicles v
       LEFT JOIN routes r ON v.id = r.vehicle_id AND ${routeWhere.replace('1=1', '1=1')}
       WHERE ${vehicleWhere} AND v.region IS NOT NULL
       GROUP BY v.region`,
      [...vehicleParams, ...routeParams]
    );

    // Get cities for filter
    const cities = await query(
      `SELECT DISTINCT region as city FROM vehicles WHERE region IS NOT NULL ORDER BY region`
    );

    // Get drivers for filter
    const drivers = await query(
      `SELECT id, name FROM drivers WHERE status = 'active' ORDER BY name`
    );

    // Get suppliers for filter
    const suppliers = await query(
      `SELECT id, name FROM suppliers WHERE status = 'active' ORDER BY name`
    );

    res.json({
      success: true,
      data: {
        // Main KPIs
        totalVehicles,
        activeVehicles,
        totalRoutes,
        totalKm: parseFloat(totalKm),
        totalLoad: parseFloat(totalLoad),
        avgCostPerKm: parseFloat(avgCostPerKm),
        utilizationRate: parseFloat(utilizationRate),
        
        // Breakdowns
        vehiclesByType: vehiclesByType.reduce((acc, item) => {
          acc[item.type] = item.count;
          return acc;
        }, {}),
        vehiclesByRegion: vehiclesByRegion.reduce((acc, item) => {
          acc[item.region] = item.count;
          return acc;
        }, {}),
        routesByLoadType: routesByLoadType.reduce((acc, item) => {
          acc[item.load_type] = item.count;
          return acc;
        }, {}),
        routesByMonth: routesByMonth.map(item => ({
          month: item.month,
          count: item.count,
          totalKm: parseFloat(item.total_km || 0)
        })),
        regionalIntensity: regionalIntensity.map(item => ({
          region: item.region,
          vehicleCount: item.vehicle_count,
          routeCount: item.route_count,
          totalKm: parseFloat(item.total_km || 0),
          avgKmPerRoute: parseFloat(item.avg_km_per_route || 0)
        })),
        
        // Filter options
        cities: cities.map(c => c.city),
        drivers: drivers,
        suppliers: suppliers
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    // Fallback to mock data if DB error
    res.json({
      success: true,
      data: {
        totalVehicles: 0,
        activeVehicles: 0,
        totalRoutes: 0,
        totalKm: 0,
        totalLoad: 0,
        avgCostPerKm: 0,
        utilizationRate: 0,
        vehiclesByType: {},
        vehiclesByRegion: {},
        routesByLoadType: {},
        routesByMonth: [],
        regionalIntensity: [],
        cities: [],
        drivers: [],
        suppliers: []
      }
    });
  }
});

export default router;



