// Mock data for Spare Parts KDS

export const mockSparePartUsage = {
  'Motor Yağı': { frequency: 45, avgDowntime: 2, unitPrice: 250, category: 'Motor' },
  'Filtre Seti': { frequency: 38, avgDowntime: 1.5, unitPrice: 450, category: 'Motor' },
  'Fren Balata': { frequency: 52, avgDowntime: 4, unitPrice: 1200, category: 'Fren' },
  'Fren Diski': { frequency: 28, avgDowntime: 6, unitPrice: 2500, category: 'Fren' },
  'Lastik (315/80R22.5)': { frequency: 65, avgDowntime: 3, unitPrice: 3500, category: 'Lastik' },
  'Akü': { frequency: 22, avgDowntime: 2, unitPrice: 1800, category: 'Elektrik' },
  'Alternatör': { frequency: 15, avgDowntime: 5, unitPrice: 3200, category: 'Elektrik' },
  'Soğutma Sistemi': { frequency: 18, avgDowntime: 4, unitPrice: 2800, category: 'Soğutma' },
  'Antifriz': { frequency: 12, avgDowntime: 1, unitPrice: 180, category: 'Soğutma' },
  'Kış Lastiği': { frequency: 8, avgDowntime: 2, unitPrice: 4200, category: 'Lastik' },
  'Yüksek Yük Lastiği': { frequency: 35, avgDowntime: 3, unitPrice: 4800, category: 'Lastik' },
  'Fren Hortumu': { frequency: 25, avgDowntime: 3, unitPrice: 450, category: 'Fren' },
  'Fren Silindiri': { frequency: 20, avgDowntime: 5, unitPrice: 1800, category: 'Fren' }
}

export const scenarios = {
  'A': {
    name: 'İskandinavya Talep Artışı',
    condition: 'İskandinavya ülkelerine lojistik talebi artıyor',
    implication: 'Soğuk hava operasyonları',
    recommendations: [
      { part: 'Kış Lastiği', quantity: 15, priority: 'Yüksek', reason: 'Soğuk hava koşulları için kritik' },
      { part: 'Antifriz', quantity: 50, priority: 'Yüksek', reason: 'Donma riski nedeniyle yüksek kalite gerekli' },
      { part: 'Soğutma Sistemi', quantity: 8, priority: 'Orta', reason: 'Soğuk hava testi ve bakım' }
    ]
  },
  'B': {
    name: 'Ağır Taşımacılık Talep Artışı',
    condition: 'Ağır taşımacılık talebi artıyor',
    implication: 'Yüksek tonaj daha hızlı lastik aşınmasına neden oluyor',
    recommendations: [
      { part: 'Yüksek Yük Lastiği', quantity: 25, priority: 'Yüksek', reason: 'Ağır yük taşımacılığı için dayanıklı lastik' },
      { part: 'Lastik (315/80R22.5)', quantity: 40, priority: 'Yüksek', reason: 'Artırılmış lastik güvenlik stoğu' },
      { part: 'Fren Balata', quantity: 30, priority: 'Yüksek', reason: 'Ağır yük frenleme için daha sık değişim' },
      { part: 'Fren Diski', quantity: 15, priority: 'Orta', reason: 'Ağır yük nedeniyle artan fren aşınması' }
    ]
  },
  'C': {
    name: 'Doğu Anadolu Talep Devamı',
    condition: '2024\'te Doğu Anadolu\'ya talep arttı (dağlık arazi). Sözleşmeler ve talep gelecek yıl devam edecek veya büyüyecek',
    implication: 'Fren sistemleri daha hızlı aşınıyor',
    recommendations: [
      { part: 'Fren Balata', quantity: 45, priority: 'Kritik', reason: 'Dağlık arazi nedeniyle artan fren kullanımı' },
      { part: 'Fren Diski', quantity: 20, priority: 'Kritik', reason: 'Engebeli yollar fren disklerini hızla aşındırıyor' },
      { part: 'Fren Hortumu', quantity: 30, priority: 'Yüksek', reason: 'Fren sisteminin kritik bileşeni' },
      { part: 'Fren Silindiri', quantity: 18, priority: 'Yüksek', reason: 'Yüksek basınç nedeniyle aşınma riski' }
    ]
  }
}

export const cargoTypes = {
  'heavy': { name: 'Ağır Yük', impactMultiplier: 1.5 },
  'standard': { name: 'Standart Yük', impactMultiplier: 1.0 },
  'food': { name: 'Gıda/Meyve', impactMultiplier: 1.2 },
  'long-distance': { name: 'Uzun Mesafe', impactMultiplier: 1.3 }
}

export const regions = {
  'Marmara': { name: 'Marmara', terrain: 'urban', brakeWearMultiplier: 1.0 },
  'Ege': { name: 'Ege', terrain: 'mixed', brakeWearMultiplier: 1.1 },
  'Akdeniz': { name: 'Akdeniz', terrain: 'coastal', brakeWearMultiplier: 1.0 },
  'İç Anadolu': { name: 'İç Anadolu', terrain: 'flat', brakeWearMultiplier: 1.0 },
  'Karadeniz': { name: 'Karadeniz', terrain: 'mountainous', brakeWearMultiplier: 1.3 },
  'Doğu Anadolu': { name: 'Doğu Anadolu', terrain: 'mountainous', brakeWearMultiplier: 1.5 },
  'Güneydoğu Anadolu': { name: 'Güneydoğu Anadolu', terrain: 'flat', brakeWearMultiplier: 1.0 }
}

// Main KDS function
export function runSparePartsKDS({ region, cargoType, scenario, inflation, exchangeRate }) {
  const regionData = regions[region] || regions['Marmara']
  const cargoData = cargoTypes[cargoType] || cargoTypes['standard']
  const scenarioData = scenarios[scenario] || scenarios['A']
  
  // Calculate loss by part
  const lossByPart = Object.entries(mockSparePartUsage).map(([partName, data]) => {
    const hourlyLoss = 15000 // Average hourly loss from downtime
    const totalDowntime = data.frequency * data.avgDowntime
    const financialLoss = totalDowntime * hourlyLoss
    
    // Adjust based on region and cargo type
    let adjustedFrequency = data.frequency
    let adjustedDowntime = data.avgDowntime
    
    if (data.category === 'Fren') {
      adjustedFrequency = Math.ceil(data.frequency * regionData.brakeWearMultiplier)
    }
    
    if (cargoType === 'heavy' && data.category === 'Lastik') {
      adjustedFrequency = Math.ceil(data.frequency * 1.3)
    }
    
    const adjustedLoss = adjustedFrequency * adjustedDowntime * hourlyLoss
    
    return {
      partName,
      frequency: adjustedFrequency,
      avgDowntime: adjustedDowntime,
      financialLoss: adjustedLoss,
      category: data.category,
      unitPrice: data.unitPrice
    }
  }).sort((a, b) => b.financialLoss - a.financialLoss)

  // Priority parts for early stock
  const priorityParts = lossByPart
    .filter(part => part.financialLoss > 200000) // High loss threshold
    .map(part => ({
      partName: part.partName,
      currentStock: Math.floor(Math.random() * 20) + 5, // Mock current stock
      recommendedStock: Math.ceil(part.frequency * 1.5), // 1.5x frequency as safety stock
      reason: `Yıllık ${part.financialLoss.toLocaleString('tr-TR')} ₺ kayıp`,
      category: part.category
    }))

  // Generate recommendations
  const recommendations = []
  
  // Scenario-based recommendations
  scenarioData.recommendations.forEach(rec => {
    recommendations.push({
      type: 'scenario',
      text: `${scenarioData.name} senaryosunda ${rec.part} stoğu ${rec.quantity} adete çıkarılmalıdır. ${rec.reason}`,
      priority: rec.priority
    })
  })

  // Loss-based recommendations
  const topLossPart = lossByPart[0]
  if (topLossPart) {
    recommendations.push({
      type: 'loss',
      text: `${topLossPart.partName} geçen yıl en yüksek gecikme maliyetine sebep olmuştur (${topLossPart.financialLoss.toLocaleString('tr-TR')} ₺). Öncelikli stok artırımı önerilir.`,
      priority: 'Kritik'
    })
  }

  // Region-specific recommendations
  if (region === 'Doğu Anadolu') {
    recommendations.push({
      type: 'region',
      text: 'Doğu Anadolu operasyonları için fren aksamı yedek parça stoğu kritik seviyeye çıkarılmalıdır.',
      priority: 'Kritik'
    })
  }

  // Cargo type recommendations
  if (cargoType === 'heavy') {
    recommendations.push({
      type: 'cargo',
      text: 'Ağır taşımacılık artışı nedeniyle lastik ömrü kısalmakta, dayanıklı lastik alımı önerilir.',
      priority: 'Yüksek'
    })
  }

  // Inflation/FX impact
  if (inflation > 25 || exchangeRate > 35) {
    recommendations.push({
      type: 'financial',
      text: `Yüksek enflasyon (${inflation}%) ve döviz kuru (${exchangeRate}) nedeniyle önceden stok artırımı finansal açıdan avantajlı olabilir.`,
      priority: 'Orta'
    })
  }

  return {
    priorityParts,
    lossByPart,
    recommendations,
    scenario: scenarioData
  }
}
