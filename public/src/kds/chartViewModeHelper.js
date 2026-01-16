// Helper functions for chart view mode management

// Transform single-year data to multi-year trend data
export function transformToMultiYearTrend(dataByYear, getDataFunction) {
  const years = [2020, 2021, 2022, 2023, 2024, 2025]
  return years.map(year => {
    const yearData = getDataFunction(year)
    return {
      year,
      ...yearData,
      isForecast: year === 2025
    }
  })
}

// Get aggregated multi-year data for demand trend
export function getMultiYearDemandTrend(getDemandTrendFn) {
  const years = [2020, 2021, 2022, 2023, 2024, 2025]
  return years.map(year => {
    const monthlyData = getDemandTrendFn(year) || []
    if (!Array.isArray(monthlyData) || monthlyData.length === 0) {
      return {
        year,
        totalDemand: 0,
        completedRoutes: 0,
        isForecast: year === 2025
      }
    }
    const totalDemand = monthlyData.reduce((sum, m) => sum + (m.totalDemand || 0), 0)
    const totalCompleted = monthlyData.reduce((sum, m) => sum + (m.completedRoutes || 0), 0)
    return {
      year,
      totalDemand,
      completedRoutes: totalCompleted,
      isForecast: year === 2025
    }
  })
}

// Get multi-year fleet status trend
export function getMultiYearFleetTrend(getFleetStatusFn) {
  const years = [2020, 2021, 2022, 2023, 2024, 2025]
  return years.map(year => {
    const status = getFleetStatusFn(year)
    return {
      year,
      activeVehicles: status.activeVehicles,
      requiredVehicles: status.requiredVehicles,
      capacityGap: status.capacityGap,
      isForecast: year === 2025
    }
  })
}

// Get multi-year spare parts risk trend
export function getMultiYearSparePartsTrend(getSparePartRiskFn) {
  const years = [2020, 2021, 2022, 2023, 2024, 2025]
  return years.map(year => {
    const risk = getSparePartRiskFn(year) || {}
    return {
      year,
      inventoryValue: risk.inventoryValue || 0,
      lowStockCriticalParts: risk.lowStockCriticalParts || 0,
      estimatedDowntimeLoss: risk.estimatedDowntimeLoss || 0,
      isForecast: year === 2025
    }
  })
}

// Get multi-year warehouse usage trend (aggregated)
export function getMultiYearWarehouseTrend(getWarehouseUsageFn) {
  const years = [2020, 2021, 2022, 2023, 2024, 2025]
  return years.map(year => {
    const usage = getWarehouseUsageFn(year) || []
    if (!Array.isArray(usage) || usage.length === 0) {
      return {
        year,
        totalCapacity: 0,
        usedCapacity: 0,
        utilization: 0,
        isForecast: year === 2025
      }
    }
    const totalCapacity = usage.reduce((sum, w) => sum + (w.totalCapacity || 0), 0)
    const totalUsed = usage.reduce((sum, w) => sum + (w.usedCapacity || 0), 0)
    const avgUtilization = usage.length > 0 
      ? usage.reduce((sum, w) => sum + (w.utilization || 0), 0) / usage.length 
      : 0
    return {
      year,
      totalCapacity,
      usedCapacity: totalUsed,
      utilization: avgUtilization,
      isForecast: year === 2025
    }
  })
}
