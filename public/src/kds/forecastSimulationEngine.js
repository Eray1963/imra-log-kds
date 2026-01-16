// Historical inflation data (2020-2024)
const historicalInflationData = {
  2020: 14.6,
  2021: 36.1,
  2022: 64.3,
  2023: 53.9,
  2024: 44.2
}

// Get historical inflation data
export function getHistoricalInflation() {
  return Object.entries(historicalInflationData).map(([year, rate]) => ({
    year: parseInt(year),
    inflation: rate,
    type: 'historical'
  }))
}

// Calculate inflation forecast for 2025
export function calculateInflationForecast() {
  const rates = Object.values(historicalInflationData)
  const avgIncrease = (rates[rates.length - 1] - rates[0]) / (rates.length - 1)
  const lastRate = rates[rates.length - 1]
  const forecast = Math.max(20, Math.min(60, lastRate + avgIncrease * 0.5))
  return Math.round(forecast * 10) / 10
}

// Run inflation simulation
export function runInflationSimulation(selectedYear, inflationAssumption) {
  const baseInvestment = 5000000 // Base investment cost
  const baseLoss = 2000000 // Base estimated loss
  
  const inflationFactor = inflationAssumption / 100
  const investmentCost = baseInvestment * (1 + inflationFactor * 0.3)
  const estimatedLoss = baseLoss * (1 + inflationFactor * 0.4)
  
  let riskLevel = 'Düşük'
  let recommendation = 'BEKLE'
  
  if (inflationAssumption >= 50) {
    riskLevel = 'Yüksek'
    recommendation = 'HEMEN AL'
  } else if (inflationAssumption >= 40) {
    riskLevel = 'Orta'
    recommendation = 'KISMI AL'
  }
  
  return {
    investmentCost,
    estimatedLoss,
    riskLevel,
    recommendation
  }
}

// Get scenario data
export function getScenarioData() {
  const forecast = calculateInflationForecast()
  
  return {
    optimistic: {
      inflation: 25,
      ...runInflationSimulation(2025, 25),
      label: 'İyimser'
    },
    expected: {
      inflation: forecast,
      ...runInflationSimulation(2025, forecast),
      label: 'Beklenen'
    },
    pessimistic: {
      inflation: 50,
      ...runInflationSimulation(2025, 50),
      label: 'Kötümser'
    }
  }
}
