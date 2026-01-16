// Mock data for Overview KDS Dashboard (2019-2025)

const years = [2019, 2020, 2021, 2022, 2023, 2024, 2025]

// CHART 1: Demand & Operation Trend
const demandTrendData = {
  2019: [
    { month: 'Ocak', totalDemand: 3200, completedRoutes: 2980 },
    { month: 'Şubat', totalDemand: 3100, completedRoutes: 2920 },
    { month: 'Mart', totalDemand: 3400, completedRoutes: 3180 },
    { month: 'Nisan', totalDemand: 3600, completedRoutes: 3420 },
    { month: 'Mayıs', totalDemand: 3800, completedRoutes: 3650 },
    { month: 'Haziran', totalDemand: 3700, completedRoutes: 3520 },
    { month: 'Temmuz', totalDemand: 3500, completedRoutes: 3380 },
    { month: 'Ağustos', totalDemand: 3400, completedRoutes: 3280 },
    { month: 'Eylül', totalDemand: 3600, completedRoutes: 3480 },
    { month: 'Ekim', totalDemand: 3800, completedRoutes: 3650 },
    { month: 'Kasım', totalDemand: 3900, completedRoutes: 3780 },
    { month: 'Aralık', totalDemand: 4000, completedRoutes: 3880 }
  ],
  2020: [
    { month: 'Ocak', totalDemand: 4200, completedRoutes: 3980 },
    { month: 'Şubat', totalDemand: 4100, completedRoutes: 3920 },
    { month: 'Mart', totalDemand: 4400, completedRoutes: 4180 },
    { month: 'Nisan', totalDemand: 4600, completedRoutes: 4420 },
    { month: 'Mayıs', totalDemand: 4800, completedRoutes: 4650 },
    { month: 'Haziran', totalDemand: 4700, completedRoutes: 4520 },
    { month: 'Temmuz', totalDemand: 4500, completedRoutes: 4380 },
    { month: 'Ağustos', totalDemand: 4400, completedRoutes: 4280 },
    { month: 'Eylül', totalDemand: 4600, completedRoutes: 4480 },
    { month: 'Ekim', totalDemand: 4800, completedRoutes: 4650 },
    { month: 'Kasım', totalDemand: 4900, completedRoutes: 4780 },
    { month: 'Aralık', totalDemand: 5000, completedRoutes: 4880 }
  ],
  2021: [
    { month: 'Ocak', totalDemand: 5200, completedRoutes: 4980 },
    { month: 'Şubat', totalDemand: 5100, completedRoutes: 4920 },
    { month: 'Mart', totalDemand: 5400, completedRoutes: 5180 },
    { month: 'Nisan', totalDemand: 5600, completedRoutes: 5420 },
    { month: 'Mayıs', totalDemand: 5800, completedRoutes: 5650 },
    { month: 'Haziran', totalDemand: 5700, completedRoutes: 5520 },
    { month: 'Temmuz', totalDemand: 5500, completedRoutes: 5380 },
    { month: 'Ağustos', totalDemand: 5400, completedRoutes: 5280 },
    { month: 'Eylül', totalDemand: 5600, completedRoutes: 5480 },
    { month: 'Ekim', totalDemand: 5800, completedRoutes: 5650 },
    { month: 'Kasım', totalDemand: 5900, completedRoutes: 5780 },
    { month: 'Aralık', totalDemand: 6000, completedRoutes: 5880 }
  ],
  2022: [
    { month: 'Ocak', totalDemand: 6200, completedRoutes: 5980 },
    { month: 'Şubat', totalDemand: 6100, completedRoutes: 5920 },
    { month: 'Mart', totalDemand: 6400, completedRoutes: 6180 },
    { month: 'Nisan', totalDemand: 6600, completedRoutes: 6420 },
    { month: 'Mayıs', totalDemand: 6800, completedRoutes: 6650 },
    { month: 'Haziran', totalDemand: 6700, completedRoutes: 6520 },
    { month: 'Temmuz', totalDemand: 6500, completedRoutes: 6380 },
    { month: 'Ağustos', totalDemand: 6400, completedRoutes: 6280 },
    { month: 'Eylül', totalDemand: 6600, completedRoutes: 6480 },
    { month: 'Ekim', totalDemand: 6800, completedRoutes: 6650 },
    { month: 'Kasım', totalDemand: 6900, completedRoutes: 6780 },
    { month: 'Aralık', totalDemand: 7000, completedRoutes: 6880 }
  ],
  2023: [
    { month: 'Ocak', totalDemand: 7200, completedRoutes: 6980 },
    { month: 'Şubat', totalDemand: 7100, completedRoutes: 6920 },
    { month: 'Mart', totalDemand: 7400, completedRoutes: 7180 },
    { month: 'Nisan', totalDemand: 7600, completedRoutes: 7420 },
    { month: 'Mayıs', totalDemand: 7800, completedRoutes: 7650 },
    { month: 'Haziran', totalDemand: 7700, completedRoutes: 7520 },
    { month: 'Temmuz', totalDemand: 7500, completedRoutes: 7380 },
    { month: 'Ağustos', totalDemand: 7400, completedRoutes: 7280 },
    { month: 'Eylül', totalDemand: 7600, completedRoutes: 7480 },
    { month: 'Ekim', totalDemand: 7800, completedRoutes: 7650 },
    { month: 'Kasım', totalDemand: 7900, completedRoutes: 7780 },
    { month: 'Aralık', totalDemand: 8000, completedRoutes: 7880 }
  ],
  2024: [
    { month: 'Ocak', totalDemand: 8200, completedRoutes: 7980 },
    { month: 'Şubat', totalDemand: 8100, completedRoutes: 7920 },
    { month: 'Mart', totalDemand: 8400, completedRoutes: 8180 },
    { month: 'Nisan', totalDemand: 8600, completedRoutes: 8420 },
    { month: 'Mayıs', totalDemand: 8800, completedRoutes: 8650 },
    { month: 'Haziran', totalDemand: 8700, completedRoutes: 8520 },
    { month: 'Temmuz', totalDemand: 8500, completedRoutes: 8380 },
    { month: 'Ağustos', totalDemand: 8400, completedRoutes: 8280 },
    { month: 'Eylül', totalDemand: 8600, completedRoutes: 8480 },
    { month: 'Ekim', totalDemand: 8800, completedRoutes: 8650 },
    { month: 'Kasım', totalDemand: 8900, completedRoutes: 8780 },
    { month: 'Aralık', totalDemand: 9000, completedRoutes: 8880 }
  ],
  2025: [
    { month: 'Ocak', totalDemand: 9200, completedRoutes: 8980 },
    { month: 'Şubat', totalDemand: 9100, completedRoutes: 8920 },
    { month: 'Mart', totalDemand: 9400, completedRoutes: 9180 },
    { month: 'Nisan', totalDemand: 9600, completedRoutes: 9420 },
    { month: 'Mayıs', totalDemand: 9800, completedRoutes: 9650 },
    { month: 'Haziran', totalDemand: 9700, completedRoutes: 9520 },
    { month: 'Temmuz', totalDemand: 9500, completedRoutes: 9380 },
    { month: 'Ağustos', totalDemand: 9400, completedRoutes: 9280 },
    { month: 'Eylül', totalDemand: 9600, completedRoutes: 9480 },
    { month: 'Ekim', totalDemand: 9800, completedRoutes: 9650 },
    { month: 'Kasım', totalDemand: 9900, completedRoutes: 9780 },
    { month: 'Aralık', totalDemand: 10000, completedRoutes: 9880 }
  ]
}

// CHART 2: Fleet Status & Capacity Analysis
const fleetStatusData = {
  2019: { activeVehicles: 85, requiredVehicles: 95, capacityGap: 10 },
  2020: { activeVehicles: 92, requiredVehicles: 105, capacityGap: 13 },
  2021: { activeVehicles: 105, requiredVehicles: 115, capacityGap: 10 },
  2022: { activeVehicles: 118, requiredVehicles: 125, capacityGap: 7 },
  2023: { activeVehicles: 125, requiredVehicles: 135, capacityGap: 10 },
  2024: { activeVehicles: 135, requiredVehicles: 145, capacityGap: 10 },
  2025: { activeVehicles: 145, requiredVehicles: 155, capacityGap: 10 }
}

// CHART 3: Spare Parts Risk & Inventory Health
const sparePartsRiskData = {
  2019: { inventoryValue: 2850000, lowStockCriticalParts: 8, estimatedDowntimeLoss: 125000 },
  2020: { inventoryValue: 3200000, lowStockCriticalParts: 12, estimatedDowntimeLoss: 185000 },
  2021: { inventoryValue: 3650000, lowStockCriticalParts: 15, estimatedDowntimeLoss: 245000 },
  2022: { inventoryValue: 4100000, lowStockCriticalParts: 18, estimatedDowntimeLoss: 320000 },
  2023: { inventoryValue: 4650000, lowStockCriticalParts: 22, estimatedDowntimeLoss: 410000 },
  2024: { inventoryValue: 5200000, lowStockCriticalParts: 25, estimatedDowntimeLoss: 520000 },
  2025: { inventoryValue: 5800000, lowStockCriticalParts: 28, estimatedDowntimeLoss: 650000 }
}

// CHART 4: Warehouse & Utilization Analysis
const warehouseUsageData = {
  2019: [
    { warehouse: 'İstanbul', totalCapacity: 5000, usedCapacity: 3500, utilization: 70 },
    { warehouse: 'Ankara', totalCapacity: 3000, usedCapacity: 2100, utilization: 70 },
    { warehouse: 'İzmir', totalCapacity: 2500, usedCapacity: 1750, utilization: 70 },
    { warehouse: 'Bursa', totalCapacity: 2000, usedCapacity: 1400, utilization: 70 }
  ],
  2020: [
    { warehouse: 'İstanbul', totalCapacity: 5000, usedCapacity: 3800, utilization: 76 },
    { warehouse: 'Ankara', totalCapacity: 3000, usedCapacity: 2400, utilization: 80 },
    { warehouse: 'İzmir', totalCapacity: 2500, usedCapacity: 2000, utilization: 80 },
    { warehouse: 'Bursa', totalCapacity: 2000, usedCapacity: 1600, utilization: 80 }
  ],
  2021: [
    { warehouse: 'İstanbul', totalCapacity: 5000, usedCapacity: 4200, utilization: 84 },
    { warehouse: 'Ankara', totalCapacity: 3000, usedCapacity: 2550, utilization: 85 },
    { warehouse: 'İzmir', totalCapacity: 2500, usedCapacity: 2125, utilization: 85 },
    { warehouse: 'Bursa', totalCapacity: 2000, usedCapacity: 1700, utilization: 85 }
  ],
  2022: [
    { warehouse: 'İstanbul', totalCapacity: 5000, usedCapacity: 4500, utilization: 90 },
    { warehouse: 'Ankara', totalCapacity: 3000, usedCapacity: 2700, utilization: 90 },
    { warehouse: 'İzmir', totalCapacity: 2500, usedCapacity: 2250, utilization: 90 },
    { warehouse: 'Bursa', totalCapacity: 2000, usedCapacity: 1800, utilization: 90 }
  ],
  2023: [
    { warehouse: 'İstanbul', totalCapacity: 5000, usedCapacity: 4750, utilization: 95 },
    { warehouse: 'Ankara', totalCapacity: 3000, usedCapacity: 2850, utilization: 95 },
    { warehouse: 'İzmir', totalCapacity: 2500, usedCapacity: 2375, utilization: 95 },
    { warehouse: 'Bursa', totalCapacity: 2000, usedCapacity: 1900, utilization: 95 }
  ],
  2024: [
    { warehouse: 'İstanbul', totalCapacity: 5000, usedCapacity: 4900, utilization: 98 },
    { warehouse: 'Ankara', totalCapacity: 3000, usedCapacity: 2940, utilization: 98 },
    { warehouse: 'İzmir', totalCapacity: 2500, usedCapacity: 2450, utilization: 98 },
    { warehouse: 'Bursa', totalCapacity: 2000, usedCapacity: 1960, utilization: 98 }
  ],
  2025: [
    { warehouse: 'İstanbul', totalCapacity: 6000, usedCapacity: 5700, utilization: 95 },
    { warehouse: 'Ankara', totalCapacity: 3500, usedCapacity: 3325, utilization: 95 },
    { warehouse: 'İzmir', totalCapacity: 3000, usedCapacity: 2850, utilization: 95 },
    { warehouse: 'Bursa', totalCapacity: 2500, usedCapacity: 2375, utilization: 95 }
  ]
}

// Loss by source (yearly)
const lossBySourceData = {
  2019: {
    fleetCapacityLoss: 450000, // Kapasite açığı nedeniyle kayıp
    sparePartsLoss: 125000, // Arıza kaybı
    warehouseLoss: 85000, // Depo tıkanıklığı kaybı
    financialLoss: 320000 // Enflasyon/döviz kaybı
  },
  2020: {
    fleetCapacityLoss: 680000,
    sparePartsLoss: 185000,
    warehouseLoss: 120000,
    financialLoss: 480000
  },
  2021: {
    fleetCapacityLoss: 750000,
    sparePartsLoss: 245000,
    warehouseLoss: 150000,
    financialLoss: 620000
  },
  2022: {
    fleetCapacityLoss: 580000,
    sparePartsLoss: 320000,
    warehouseLoss: 180000,
    financialLoss: 780000
  },
  2023: {
    fleetCapacityLoss: 850000,
    sparePartsLoss: 410000,
    warehouseLoss: 220000,
    financialLoss: 950000
  },
  2024: {
    fleetCapacityLoss: 920000,
    sparePartsLoss: 520000,
    warehouseLoss: 280000,
    financialLoss: 1150000
  },
  2025: {
    fleetCapacityLoss: 1100000,
    sparePartsLoss: 650000,
    warehouseLoss: 320000,
    financialLoss: 1350000
  }
}

// Export functions
export function getDemandTrend(year) {
  return demandTrendData[year] || demandTrendData[2024]
}

export function getFleetStatus(year) {
  return fleetStatusData[year] || fleetStatusData[2024]
}

export function getSparePartRisk(year) {
  return sparePartsRiskData[year] || sparePartsRiskData[2024]
}

export function getWarehouseUsage(year) {
  return warehouseUsageData[year] || warehouseUsageData[2024]
}

export function getLossBySource(year) {
  return lossBySourceData[year] || lossBySourceData[2024]
}

export { years }
