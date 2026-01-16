// Mock data for Fleet Expansion Analysis

export const mockDemandByRegionSector = {
  'Marmara': {
    'Heavy': { historical: [120, 135, 150], projected: [165, 180] },
    'Food/Fruit': { historical: [45, 50, 55], projected: [60, 65] },
    'Standard': { historical: [200, 220, 240], projected: [260, 280] },
    'Industrial': { historical: [180, 195, 210], projected: [225, 240] }
  },
  'Ege': {
    'Heavy': { historical: [80, 90, 100], projected: [110, 120] },
    'Food/Fruit': { historical: [150, 170, 190], projected: [210, 230] },
    'Standard': { historical: [120, 135, 150], projected: [165, 180] },
    'Industrial': { historical: [100, 110, 120], projected: [130, 140] }
  },
  'Akdeniz': {
    'Heavy': { historical: [60, 70, 80], projected: [90, 100] },
    'Food/Fruit': { historical: [180, 200, 220], projected: [240, 260] },
    'Standard': { historical: [100, 115, 130], projected: [145, 160] },
    'Industrial': { historical: [80, 90, 100], projected: [110, 120] }
  },
  'İç Anadolu': {
    'Heavy': { historical: [100, 115, 130], projected: [145, 160] },
    'Food/Fruit': { historical: [90, 100, 110], projected: [120, 130] },
    'Standard': { historical: [150, 165, 180], projected: [195, 210] },
    'Industrial': { historical: [140, 155, 170], projected: [185, 200] }
  },
  'Karadeniz': {
    'Heavy': { historical: [50, 60, 70], projected: [80, 90] },
    'Food/Fruit': { historical: [70, 80, 90], projected: [100, 110] },
    'Standard': { historical: [80, 90, 100], projected: [110, 120] },
    'Industrial': { historical: [60, 70, 80], projected: [90, 100] }
  },
  'Doğu Anadolu': {
    'Heavy': { historical: [40, 50, 60], projected: [70, 80] },
    'Food/Fruit': { historical: [30, 35, 40], projected: [45, 50] },
    'Standard': { historical: [60, 70, 80], projected: [90, 100] },
    'Industrial': { historical: [50, 60, 70], projected: [80, 90] }
  },
  'Güneydoğu Anadolu': {
    'Heavy': { historical: [35, 45, 55], projected: [65, 75] },
    'Food/Fruit': { historical: [40, 50, 60], projected: [70, 80] },
    'Standard': { historical: [55, 65, 75], projected: [85, 95] },
    'Industrial': { historical: [45, 55, 65], projected: [75, 85] }
  }
}

export const currentFleet = {
  trailers: {
    frigo: 12,
    open: 25,
    closed: 35,
    heavy: 8
  },
  tractors: {
    '6x4-high-hp': 15,
    '4x2-500hp': 45,
    'kirkayak': 8
  }
}

export const trailerPrices = {
  frigo: 850000,
  open: 450000,
  closed: 550000,
  heavy: 1200000
}

export const tractorPrices = {
  '6x4-high-hp': 3500000,
  '4x2-500hp': 2800000,
  'kirkayak': 3200000
}

export const brandReliability = {
  'Mercedes': { breakdownRate: 0.08, avgDelayHours: 12, lossPerBreakdown: 15000 },
  'Volvo': { breakdownRate: 0.05, avgDelayHours: 8, lossPerBreakdown: 12000 },
  'MAN': { breakdownRate: 0.12, avgDelayHours: 18, lossPerBreakdown: 20000 },
  'Scania': { breakdownRate: 0.06, avgDelayHours: 10, lossPerBreakdown: 14000 },
  'Iveco': { breakdownRate: 0.15, avgDelayHours: 24, lossPerBreakdown: 25000 },
  'DAF': { breakdownRate: 0.09, avgDelayHours: 14, lossPerBreakdown: 16000 }
}

export const scenarios = {
  'A': { inflation: 0.25, fxRate: 34.5, interest: 0.45 },
  'B': { inflation: 0.30, fxRate: 38.2, interest: 0.55 },
  'C': { inflation: 0.25, fxRate: 34.5, interest: 0.45 } // Will be overridden by custom values
}

export function getScenarioData(scenario, customValues = null) {
  if (scenario === 'C' && customValues) {
    return {
      inflation: customValues.inflation / 100,
      fxRate: customValues.fxRate,
      interest: customValues.interest / 100
    }
  }
  return scenarios[scenario] || scenarios['A']
}

export const frigoGap = {
  current: 12,
  required: 28,
  gap: 16,
  marketGrowth: 0.35
}

// Main analysis function
export function runFleetExpansionAnalysis({ region, sector, scenario, customScenarioValues = null }) {
  const scenarioData = scenario === 'C' && customScenarioValues 
    ? getScenarioData(scenario, customScenarioValues)
    : (scenarios[scenario] || scenarios['A'])
  const demandData = mockDemandByRegionSector[region]?.[sector] || mockDemandByRegionSector['Marmara']['Standard']
  
  // Calculate demand increase
  const lastHistorical = demandData.historical[demandData.historical.length - 1]
  const avgProjected = demandData.projected.reduce((a, b) => a + b, 0) / demandData.projected.length
  const demandIncrease = ((avgProjected - lastHistorical) / lastHistorical) * 100

  // Calculate required capacity
  const currentCapacity = Object.values(currentFleet.trailers).reduce((a, b) => a + b, 0) +
                          Object.values(currentFleet.tractors).reduce((a, b) => a + b, 0)
  const requiredCapacity = Math.ceil(avgProjected * 1.2) // 20% buffer
  const capacityGap = Math.max(0, requiredCapacity - currentCapacity)

  // Trailer recommendations based on sector and region
  const recommendedTrailers = calculateTrailerRecommendations(region, sector, demandIncrease)
  
  // Tractor recommendations
  const recommendedTractors = calculateTractorRecommendations(region, sector, demandIncrease)

  // Calculate investment cost
  let investmentCost = 0
  Object.entries(recommendedTrailers).forEach(([type, count]) => {
    investmentCost += (trailerPrices[type] || 0) * count
  })
  Object.entries(recommendedTractors).forEach(([type, count]) => {
    investmentCost += (tractorPrices[type] || 0) * count
  })

  // Adjust for inflation and FX
  const adjustedCost = investmentCost * (1 + scenarioData.inflation)
  
  // Calculate ROI (simplified: monthly revenue increase - costs)
  const monthlyRevenueIncrease = avgProjected * 15000 // avg revenue per unit
  const monthlyCosts = adjustedCost * (scenarioData.interest / 12) + (investmentCost * 0.02) // interest + depreciation
  const monthlyNet = monthlyRevenueIncrease - monthlyCosts
  const roiMonths = monthlyNet > 0 ? Math.ceil(adjustedCost / monthlyNet) : 999

  // Risk level
  const riskLevel = calculateRiskLevel(scenarioData, demandIncrease, capacityGap)

  // Breakdown loss
  const breakdownLoss = calculateBreakdownLoss(recommendedTractors)

  // Generate actions
  const actions = generateActions(region, sector, recommendedTrailers, recommendedTractors, frigoGap, brandReliability)

  return {
    recommendedTrailers,
    recommendedTractors,
    investmentCost: adjustedCost,
    roiMonths,
    riskLevel,
    breakdownLoss,
    actions,
    demandIncrease,
    capacityGap,
    currentCapacity,
    requiredCapacity
  }
}

function calculateTrailerRecommendations(region, sector, demandIncrease) {
  const baseIncrease = Math.ceil(demandIncrease / 10)
  const recommendations = { frigo: 0, open: 0, closed: 0, heavy: 0 }

  if (sector === 'Heavy') {
    recommendations.heavy = Math.max(2, baseIncrease)
    recommendations.closed = Math.max(1, Math.floor(baseIncrease * 0.5))
  } else if (sector === 'Food/Fruit') {
    // Fruit transport is low in Marmara
    if (region === 'Marmara') {
      recommendations.frigo = Math.max(1, Math.floor(baseIncrease * 0.3))
    } else {
      recommendations.frigo = Math.max(2, Math.floor(baseIncrease * 0.6))
    }
    recommendations.open = Math.max(1, Math.floor(baseIncrease * 0.4))
  } else if (sector === 'Standard') {
    recommendations.closed = Math.max(2, baseIncrease)
    recommendations.open = Math.max(1, Math.floor(baseIncrease * 0.5))
  } else if (sector === 'Industrial') {
    recommendations.closed = Math.max(2, baseIncrease)
    recommendations.heavy = Math.max(1, Math.floor(baseIncrease * 0.3))
  }

  // Frigo gap consideration
  if (frigoGap.gap > 0 && sector !== 'Heavy') {
    recommendations.frigo += Math.min(2, Math.ceil(frigoGap.gap * 0.3))
  }

  return recommendations
}

function calculateTractorRecommendations(region, sector, demandIncrease) {
  const baseIncrease = Math.ceil(demandIncrease / 8)
  const recommendations = { '6x4-high-hp': 0, '4x2-500hp': 0, 'kirkayak': 0 }

  if (sector === 'Heavy') {
    recommendations['6x4-high-hp'] = Math.max(2, baseIncrease)
    recommendations['4x2-500hp'] = Math.max(1, Math.floor(baseIncrease * 0.3))
  } else if (sector === 'Food/Fruit') {
    // Kırkayak for fruit/market or new "hal" opening
    recommendations['kirkayak'] = Math.max(2, baseIncrease)
    recommendations['4x2-500hp'] = Math.max(1, Math.floor(baseIncrease * 0.5))
  } else {
    // Standard loads
    recommendations['4x2-500hp'] = Math.max(2, baseIncrease)
    recommendations['6x4-high-hp'] = Math.max(1, Math.floor(baseIncrease * 0.2))
  }

  return recommendations
}

function calculateRiskLevel(scenarioData, demandIncrease, capacityGap) {
  let riskScore = 0
  
  if (scenarioData.inflation >= 0.30) riskScore += 2
  else if (scenarioData.inflation >= 0.25) riskScore += 1
  
  if (scenarioData.interest >= 0.55) riskScore += 2
  else if (scenarioData.interest >= 0.45) riskScore += 1
  
  if (scenarioData.fxRate >= 38) riskScore += 1
  
  if (demandIncrease < 5) riskScore += 1
  if (capacityGap > 20) riskScore += 1

  if (riskScore >= 5) return 'High'
  if (riskScore >= 3) return 'Medium'
  return 'Low'
}

function calculateBreakdownLoss(recommendedTractors) {
  // Estimate breakdown loss based on recommended tractors and brand reliability
  let totalLoss = 0
  const avgBreakdownRate = Object.values(brandReliability).reduce((sum, b) => sum + b.breakdownRate, 0) / Object.values(brandReliability).length
  const avgLossPerBreakdown = Object.values(brandReliability).reduce((sum, b) => sum + b.lossPerBreakdown, 0) / Object.values(brandReliability).length
  
  const totalTractors = Object.values(recommendedTractors).reduce((a, b) => a + b, 0)
  totalLoss = totalTractors * avgBreakdownRate * avgLossPerBreakdown * 12 // annual
  
  return totalLoss
}

function generateActions(region, sector, trailers, tractors, frigoGap, brandReliability) {
  const actions = []

  // Heavy transport recommendation
  if (sector === 'Heavy' && tractors['6x4-high-hp'] > 0) {
    actions.push(`${region} + Heavy: ${tractors['6x4-high-hp']} adet 6x4 yüksek beygir çekici alımı önerilir.`)
  }

  // Marmara fruit transport limitation
  if (region === 'Marmara' && sector === 'Food/Fruit' && trailers.frigo > 2) {
    actions.push("Marmara'da meyve taşımacılığı düşük: frigo dorse alımını sınırlayın (önerilen: 1-2 adet).")
  }

  // Frigo gap
  if (frigoGap.gap > 0 && trailers.frigo > 0) {
    actions.push(`Soğutucu dorse piyasası büyüyor (%${(frigoGap.marketGrowth * 100).toFixed(0)}): ${trailers.frigo} adet frigo dorse açığı kapatılmalı.`)
  }

  // Kırkayak recommendation
  if (sector === 'Food/Fruit' && tractors.kirkayak > 0) {
    actions.push(`Meyve/hal taşımacılığı için ${tractors.kirkayak} adet kırkayak çekici önerilir.`)
  }

  // Brand reliability warnings
  const problematicBrands = Object.entries(brandReliability)
    .filter(([_, data]) => data.breakdownRate > 0.10)
    .sort((a, b) => b[1].breakdownRate - a[1].breakdownRate)
  
  if (problematicBrands.length > 0) {
    const worstBrand = problematicBrands[0]
    actions.push(`${worstBrand[0]} marka arıza oranı yüksek (%${(worstBrand[1].breakdownRate * 100).toFixed(0)}): yeni alımda kaçın / kritik parça stoğu artır.`)
  }

  // Standard recommendation
  if (sector === 'Standard' && tractors['4x2-500hp'] > 0) {
    actions.push(`Standart yükler için ${tractors['4x2-500hp']} adet 500 HP 4x2 çekici önerilir.`)
  }

  return actions
}

// Helper function to get demand trend data for charts
export function getDemandTrendData(region, sector) {
  const demandData = mockDemandByRegionSector[region]?.[sector] || mockDemandByRegionSector['Marmara']['Standard']
  const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık']
  
  const historical = demandData.historical.map((val, idx) => ({
    month: months[idx % 12] || `Ay ${idx + 1}`,
    demand: val,
    type: 'Geçmiş'
  }))
  
  const projected = demandData.projected.map((val, idx) => ({
    month: months[(historical.length + idx) % 12] || `Ay ${historical.length + idx + 1}`,
    demand: val,
    type: 'Tahmin'
  }))
  
  return [...historical, ...projected]
}

// Helper function to get brand breakdown data
export function getBrandBreakdownData() {
  return Object.entries(brandReliability).map(([brand, data]) => ({
    brand,
    breakdownRate: data.breakdownRate * 100,
    avgDelayHours: data.avgDelayHours,
    lossPerBreakdown: data.lossPerBreakdown,
    annualLoss: data.breakdownRate * data.lossPerBreakdown * 12 * 10 // assuming 10 trucks per brand avg
  }))
}
