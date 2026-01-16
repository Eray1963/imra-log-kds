import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, Label } from 'recharts'
import { getFleetBySector, getFleetSummary } from '../services/fleetService'

function FleetManagement() {
  // Overview'dan sektör büyüme oranlarını hesapla
  const calculateSectorGrowthRatesFromOverview = () => {
    // Overview.jsx'teki getAllRegionsSectorData mantığını kullan
    const allRegions = ['Marmara', 'Ege', 'İç Anadolu', 'Akdeniz', 'Karadeniz', 'Doğu Anadolu', 'Güneydoğu Anadolu']
    
    // Bölge bazlı sektör yoğunluk verileri (Overview.jsx'ten)
    const getRegionSectorIntensity = (region) => {
      const intensityData = {
        'Marmara': { 'Standart Nakliyat': 15, 'Ağır Nakliyat': 70, 'Gıda Nakliyat': 15 },
        'Ege': { 'Standart Nakliyat': 75, 'Gıda Nakliyat': 60, 'Ağır Nakliyat': 50 },
        'İç Anadolu': { 'Standart Nakliyat': 60, 'Gıda Nakliyat': 40, 'Ağır Nakliyat': 30 },
        'Akdeniz': { 'Standart Nakliyat': 65, 'Gıda Nakliyat': 95, 'Ağır Nakliyat': 35 },
        'Karadeniz': { 'Gıda Nakliyat': 90, 'Standart Nakliyat': 65, 'Ağır Nakliyat': 20 },
        'Güneydoğu Anadolu': { 'Standart Nakliyat': 65, 'Gıda Nakliyat': 30, 'Ağır Nakliyat': 25 },
        'Doğu Anadolu': { 'Standart Nakliyat': 50, 'Gıda Nakliyat': 25, 'Ağır Nakliyat': 15 }
      }
      return intensityData[region] || { 'Standart Nakliyat': 50, 'Gıda Nakliyat': 50, 'Ağır Nakliyat': 50 }
    }
    
    // Tüm bölgelerin ortalama yoğunluklarını hesapla
    let avgGida = 0
    let avgStandart = 0
    let avgAgir = 0
    
    allRegions.forEach(region => {
      const intensity = getRegionSectorIntensity(region)
      avgGida += intensity['Gıda Nakliyat'] || 0
      avgStandart += intensity['Standart Nakliyat'] || 0
      avgAgir += intensity['Ağır Nakliyat'] || 0
    })
    
    avgGida = avgGida / allRegions.length
    avgStandart = avgStandart / allRegions.length
    avgAgir = avgAgir / allRegions.length
    
    // Overview.jsx'teki büyüme formülü: growthFactor = 1 + (yearIndex * 0.05) (%5 yıllık)
    const baseMultiplier = 5
    
    // 2024 verileri (yearIndex = 4, growthFactor = 1.20)
    const year2024Index = 2024 - 2020
    const growthFactor2024 = 1 + (year2024Index * 0.05)
    const value2024Gida = avgGida * baseMultiplier * growthFactor2024
    const value2024Standart = avgStandart * baseMultiplier * growthFactor2024
    const value2024Agir = avgAgir * baseMultiplier * growthFactor2024
    
    // 2025 verileri (yearIndex = 5, growthFactor = 1.25)
    const year2025Index = 2025 - 2020
    const growthFactor2025 = 1 + (year2025Index * 0.05)
    const value2025Gida = avgGida * baseMultiplier * growthFactor2025
    const value2025Standart = avgStandart * baseMultiplier * growthFactor2025
    const value2025Agir = avgAgir * baseMultiplier * growthFactor2025
    
    // Yıllık büyüme oranını hesapla (CAGR benzeri, ancak burada basit yıllık büyüme)
    // Overview'da %5 yıllık büyüme var, bu yüzden:
    // 2024'ten 2025'e: (1.25 - 1.20) / 1.20 = 0.05 / 1.20 ≈ 4.17%
    // Ancak Overview'da formül %5 yıllık olduğu için direkt %5 kullanabiliriz
    // Ya da gerçek değerlerden hesaplayalım:
    const growthRateGida = value2024Gida > 0 ? ((value2025Gida - value2024Gida) / value2024Gida) * 100 : 5
    const growthRateStandart = value2024Standart > 0 ? ((value2025Standart - value2024Standart) / value2024Standart) * 100 : 5
    const growthRateAgir = value2024Agir > 0 ? ((value2025Agir - value2024Agir) / value2024Agir) * 100 : 5
    
    return {
      food: Math.round(growthRateGida * 10) / 10, // Gıda Nakliyat
      standard: Math.round(growthRateStandart * 10) / 10, // Standart Nakliyat
      heavy: Math.round(growthRateAgir * 10) / 10 // Ağır Nakliyat
    }
  }

  // Sektör bazlı yıllık büyüme oranları (sabit değerler)
  const BASE_SECTOR_GROWTH_RATES = {
    food: 12.8,      // Gıda Lojistiği: +12.8%
    standard: 14.0,  // Standart Nakliyat: +14.0%
    heavy: 8.8       // Ağır Nakliyat: +8.8%
  }
  
  // Overview'dan hesaplanan büyüme oranları (fallback için)
  const overviewGrowthRates = calculateSectorGrowthRatesFromOverview()
  
  // Senaryo bazlı büyüme oranları (optimistik, normal, pesimistik)
  const scenarioGrowthRates = {
    optimistic: {
      food: BASE_SECTOR_GROWTH_RATES.food * 1.5, // +12.8% -> ~+19.2%
      standard: BASE_SECTOR_GROWTH_RATES.standard * 1.3, // +14.0% -> ~+18.2%
      heavy: BASE_SECTOR_GROWTH_RATES.heavy * 1.7 // +8.8% -> ~+15.0%
    },
    normal: {
      food: BASE_SECTOR_GROWTH_RATES.food, // +12.8%
      standard: BASE_SECTOR_GROWTH_RATES.standard, // +14.0%
      heavy: BASE_SECTOR_GROWTH_RATES.heavy // +8.8%
    },
    pessimistic: {
      food: BASE_SECTOR_GROWTH_RATES.food * 0.4, // +12.8% -> ~+5.1%
      standard: BASE_SECTOR_GROWTH_RATES.standard * 0.6, // +14.0% -> ~+8.4%
      heavy: BASE_SECTOR_GROWTH_RATES.heavy * 0.35 // +8.8% -> ~+3.1%
    }
  }
  
  const [selectedSector, setSelectedSector] = useState('food') // 'food', 'standard', 'heavy'
  const [showSimulation, setShowSimulation] = useState(false) // Simülasyon modalı açık/kapalı
  const [isClosing, setIsClosing] = useState(false) // Modal kapanma animasyonu için
  const [selectedScenario, setSelectedScenario] = useState('normal') // 'optimistic', 'normal', 'pessimistic'
  const [fleetDataBase, setFleetDataBase] = useState(null) // API'den gelecek veri
  const [fleetSummary, setFleetSummary] = useState(null) // Toplam çekici/dorse sayıları
  const [loading, setLoading] = useState(true)
  
  // Senaryo seçimine göre büyüme oranlarını güncelle
  const scenarioBasedGrowthRates = scenarioGrowthRates[selectedScenario] || scenarioGrowthRates.normal
  
  // Fallback: Hardcoded filo verileri (API çalışmazsa kullanılacak)
  const fallbackFleetDataBase = {
    food: {
      tractors: [
        { 
          brand: 'Scania', 
          model: 'S',
          chassis: '4x2', 
          power: '500 bg', 
          name: 'Scania 4x2', 
          count: 12, 
          onRoad: 10, 
          maintenance: 2 
        },
        { 
          brand: 'Scania', 
          model: 'S',
          chassis: '8x4', 
          power: '440 bg', 
          name: 'Scania 8x4', 
          count: 8, 
          onRoad: 8, 
          maintenance: 0 
        }
      ],
      trailers: [
        { name: 'Frigo Dorse', type: 'Soğutuculu', count: 22, occupancy: 95, compatible: true }
      ],
      currentCapacity: 20,
      recommendations: {
        tractors: [{ name: 'Scania 4x2 (500 bg)', count: 2 }],
        trailers: [{ name: 'Frigo Dorse', count: 2 }],
        investment: 14000000
      }
    },
    standard: {
      tractors: [
        { 
          brand: 'Scania', 
          model: 'S',
          chassis: '4x2', 
          power: '500 bg', 
          name: 'Scania 4x2', 
          count: 35, 
          onRoad: 32, 
          maintenance: 3 
        },
        { 
          brand: 'Volvo', 
          model: 'FH',
          chassis: '4x2', 
          power: '480 bg', 
          name: 'Volvo 4x2', 
          count: 18, 
          onRoad: 16, 
          maintenance: 2 
        }
      ],
      trailers: [
        { name: 'Kuru Yük Dorse', type: 'Standart', count: 45, occupancy: 78, compatible: true },
        { name: 'Açık Dorse', type: 'Açık', count: 20, occupancy: 65, compatible: true }
      ],
      currentCapacity: 53,
      recommendations: {
        tractors: [{ name: 'Scania 4x2 (500 bg)', count: 3 }],
        trailers: [{ name: 'Kuru Yük Dorse', count: 4 }],
        investment: 18500000
      }
    },
    heavy: {
      tractors: [
        { 
          brand: 'Scania', 
          model: 'S',
          chassis: '6x4', 
          power: '770 bg', 
          name: 'Scania 6x4', 
          count: 15, 
          onRoad: 12, 
          maintenance: 3, 
          maxTonnage: 500 
        }
      ],
      trailers: [
        { name: 'Lowbed', type: 'Ağır Yük', count: 12, occupancy: 88, compatible: true }
      ],
      currentCapacity: 15,
      recommendations: {
        tractors: [{ name: '6x4 Çekici (770 bg)', count: 3 }],
        trailers: [{ name: 'Lowbed', count: 3 }],
        investment: 19500000
      }
    }
  }

  // Her sektör için büyüme oranı state'leri (Base rates ile başlat)
  const [growthRates, setGrowthRates] = useState(() => ({
    food: BASE_SECTOR_GROWTH_RATES.food,
    standard: BASE_SECTOR_GROWTH_RATES.standard,
    heavy: BASE_SECTOR_GROWTH_RATES.heavy
  }))

  // Sektör temaları
  const sectorThemes = {
    food: {
      name: 'Gıda Lojistiği',
      icon: '🍎',
      primaryColor: '#10b981', // Yeşil
      bgGradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%)',
      borderColor: 'rgba(16, 185, 129, 0.3)'
    },
    standard: {
      name: 'Standart Nakliyat',
      icon: '📦',
      primaryColor: '#3b82f6', // Mavi
      bgGradient: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.05) 100%)',
      borderColor: 'rgba(59, 130, 246, 0.3)'
    },
    heavy: {
      name: 'Ağır Nakliyat',
      icon: '🏗️',
      primaryColor: '#f59e0b', // Turuncu/Sarı
      bgGradient: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(217, 119, 6, 0.05) 100%)',
      borderColor: 'rgba(245, 158, 11, 0.3)'
    }
  }

  // API'den filo verilerini yükle
  useEffect(() => {
    const loadFleetData = async () => {
      try {
        setLoading(true)
        const [fleetData, summary] = await Promise.all([
          getFleetBySector(),
          getFleetSummary()
        ])
        
        // API verisini frontend formatına dönüştür
        const formattedData = {}
        // Sektör key mapping: DB -> Frontend
        const sectorKeyMap = {
          'gida': 'food',
          'standart': 'standard',
          'agir': 'heavy'
        }
        
        fleetData.forEach(sector => {
          const sectorKey = sectorKeyMap[sector.sector_key] || sector.sector_key
          formattedData[sectorKey] = {
            tractors: sector.tractors.map(t => {
              // Model'e göre name oluştur
              let name = `${t.brand} ${t.model}`
              if (t.model === 'S500') name = 'Scania 4x2'
              else if (t.model === '8x4') name = 'Scania 8x4'
              else if (t.model === 'FH480') name = 'Volvo 4x2'
              else if (t.model === '770S') name = 'Scania 6x4'
              
              return {
                brand: t.brand,
                model: t.model,
                name: name,
                count: t.total_count,
                onRoad: Math.round(t.total_count * 0.85), // %85 yolda varsayımı
                maintenance: Math.round(t.total_count * 0.15) // %15 bakımda
              }
            }),
            trailers: sector.trailers.map(t => ({
              name: t.trailer_type,
              type: t.trailer_type.includes('Frigo') ? 'Soğutuculu' : 
                    t.trailer_type.includes('Kuru') ? 'Standart' :
                    t.trailer_type.includes('Açık') ? 'Açık' : 'Ağır Yük',
              count: t.total_count,
              occupancy: 85, // Varsayılan
              compatible: true
            })),
            currentCapacity: sector.tractors.reduce((sum, t) => sum + t.total_count, 0),
            recommendations: {
              tractors: [],
              trailers: [],
              investment: 0
            }
          }
        })
        
        setFleetDataBase(formattedData)
        setFleetSummary(summary)
      } catch (error) {
        console.error('Filo verileri yüklenirken hata:', error)
        // Fallback: Hardcoded veriyi kullan
        setFleetDataBase(fallbackFleetDataBase)
        setFleetSummary({ totalTrucks: 88, totalTrailers: 99 })
      } finally {
        setLoading(false)
      }
    }
    
    loadFleetData()
  }, [])

  // Kullanılacak veri: API'den gelirse onu, yoksa fallback'i kullan
  const activeFleetData = fleetDataBase || fallbackFleetDataBase
  const currentSector = sectorThemes[selectedSector]
  const currentData = activeFleetData?.[selectedSector] || fallbackFleetDataBase[selectedSector]
  
  // Senaryo bazlı başlangıç büyüme oranı
  const scenarioBaseGrowthRate = scenarioBasedGrowthRates?.[selectedSector] || overviewGrowthRates[selectedSector] || 5
  // Eğer kullanıcı manuel olarak değiştirmişse o değeri kullan, yoksa senaryo değerini kullan
  const currentGrowthRate = growthRates[selectedSector] || scenarioBaseGrowthRate
  
  // Senaryo değiştiğinde büyüme oranlarını güncelle
  useEffect(() => {
    const currentScenarioRates = {
      optimistic: {
        food: BASE_SECTOR_GROWTH_RATES.food * 1.5,
        standard: BASE_SECTOR_GROWTH_RATES.standard * 1.3,
        heavy: BASE_SECTOR_GROWTH_RATES.heavy * 1.7
      },
      normal: {
        food: BASE_SECTOR_GROWTH_RATES.food,
        standard: BASE_SECTOR_GROWTH_RATES.standard,
        heavy: BASE_SECTOR_GROWTH_RATES.heavy
      },
      pessimistic: {
        food: BASE_SECTOR_GROWTH_RATES.food * 0.4,
        standard: BASE_SECTOR_GROWTH_RATES.standard * 0.6,
        heavy: BASE_SECTOR_GROWTH_RATES.heavy * 0.35
      }
    }[selectedScenario]
    
    if (currentScenarioRates) {
      setGrowthRates(prev => ({
        ...prev,
        food: currentScenarioRates.food,
        standard: currentScenarioRates.standard,
        heavy: currentScenarioRates.heavy
      }))
    }
  }, [selectedScenario])

  // Büyüme oranına göre hesaplanan değerler
  // Formula: Future Demand = Current Capacity * (1 + (GrowthRate / 100))
  const calculateProjectedDemand = (months, capacity, growthRate) => {
    // Yıllık büyüme oranını aylık büyümeye çevir
    const monthlyGrowthFactor = (growthRate / 100) / 12
    // Future Demand = Current Capacity * (1 + monthlyGrowthFactor * months)
    return Math.ceil(capacity * (1 + monthlyGrowthFactor * months))
  }

  // Gap hesaplama: Gap = Current Capacity - Future Demand
  const calculateGap = (currentCapacity, futureDemand) => {
    return currentCapacity - futureDemand
  }

  const calculateRiskMonth = (capacity, growthRate) => {
    const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık']
    const monthlyGrowthFactor = (growthRate / 100) / 12
    const currentMonth = new Date().getMonth() // 0-11 arası
    
    // Her ay için talep hesapla, kapasiteyi aşan ilk ayı bul
    for (let i = 1; i <= 12; i++) {
      const projectedDemand = capacity * (1 + monthlyGrowthFactor * i)
      // Kapasiteyi %5 aştığında risk başlıyor sayıyoruz
      if (projectedDemand >= capacity * 1.05) {
        const riskMonthIndex = (currentMonth + i) % 12
        return months[riskMonthIndex]
      }
    }
    // 12 ay içinde risk yoksa, gelecek yılın bir ayını döndür
    return months[(currentMonth + 7) % 12] // 6-7 ay sonrası (yaklaşık)
  }

  // Hesaplamalar
  const projectedDemand6Months = calculateProjectedDemand(6, currentData.currentCapacity, currentGrowthRate)
  const gap = calculateGap(currentData.currentCapacity, projectedDemand6Months)
  const riskMonth = calculateRiskMonth(currentData.currentCapacity, currentGrowthRate)
  
  // Gap durumu: negatif = açık (deficit), pozitif = fazla (surplus)
  const hasDeficit = gap < 0
  const gapAbs = Math.abs(gap)

  // gapAbs'e göre dinamik öneriler hesapla
  const calculateDynamicRecommendations = (sector, deficit) => {
    if (deficit <= 0) {
      // Açık yok, rota optimizasyonu öner
      return {
        tractors: [],
        trailers: [],
        investment: 0
      }
    }

    // Sektör bazlı araç ve dorse fiyatları
    const vehiclePrices = {
      food: {
        tractor: { name: 'Scania 4x2 (500 bg)', price: 3500000 },
        trailer: { name: 'Frigo Dorse', price: 3500000 }
      },
      standard: {
        tractor: { name: 'Scania 4x2 (500 bg)', price: 3500000 },
        trailer: { name: 'Kuru Yük Dorse', price: 2000000 }
      },
      heavy: {
        tractor: { name: '6x4 Çekici (770 bg)', price: 6500000 },
        trailer: { name: 'Lowbed', price: 4000000 }
      }
    }

    const prices = vehiclePrices[sector] || vehiclePrices.standard

    // Açık değerine göre gerekli araç sayısını hesapla
    // Her araç ortalama 1 sefer kapasitesi varsayıyoruz
    // Açığı kapatmak için: deficit / 1 = deficit adet araç gerekli
    // Ancak yedek kapasite için %20 ekstra ekleyelim
    const requiredVehicles = Math.ceil(deficit * 1.2)
    
    // Çekici ve dorse sayıları (1:1 oran)
    const tractorCount = Math.ceil(requiredVehicles * 0.6) // %60 çekici
    const trailerCount = Math.ceil(requiredVehicles * 0.6) // %60 dorse (çekici ile eşleşecek)

    // Yatırım maliyeti
    const investment = (tractorCount * prices.tractor.price) + (trailerCount * prices.trailer.price)

    return {
      tractors: tractorCount > 0 ? [{ name: prices.tractor.name, count: tractorCount }] : [],
      trailers: trailerCount > 0 ? [{ name: prices.trailer.name, count: trailerCount }] : [],
      investment: investment
    }
  }

  // Dinamik önerileri hesapla
  const dynamicRecommendations = hasDeficit 
    ? calculateDynamicRecommendations(selectedSector, gapAbs)
    : { tractors: [], trailers: [], investment: 0 }

  // Toplam filo sayıları (KPI için - TÜM SEKTÖRLERİN TOPLAMI)
  const totalTractorsOnRoadAll = Object.values(activeFleetData).reduce((total, sectorData) => {
    return total + sectorData.tractors.reduce((sum, t) => sum + t.onRoad, 0)
  }, 0)
  const totalTractorsInMaintenanceAll = Object.values(activeFleetData).reduce((total, sectorData) => {
    return total + sectorData.tractors.reduce((sum, t) => sum + t.maintenance, 0)
  }, 0)
  const totalTractorsCountAll = fleetSummary?.totalTrucks || Object.values(activeFleetData).reduce((total, sectorData) => {
    return total + sectorData.tractors.reduce((sum, t) => sum + t.count, 0)
  }, 0)
  const totalTrailersAll = fleetSummary?.totalTrailers || Object.values(activeFleetData).reduce((total, sectorData) => {
    return total + sectorData.trailers.reduce((sum, t) => sum + t.count, 0)
  }, 0)
  
  // Seçili sektör için (eşleşme kontrolü için)
  const totalTractorsOnRoad = currentData.tractors.reduce((sum, t) => sum + t.onRoad, 0)
  const totalTractorsInMaintenance = currentData.tractors.reduce((sum, t) => sum + t.maintenance, 0)
  const totalTractorsCount = currentData.tractors.reduce((sum, t) => sum + t.count, 0)
  const totalTrailers = currentData.trailers.reduce((sum, t) => sum + t.count, 0)
  
  // Eşleşme durumu kontrolü
  const totalTractors = totalTractorsOnRoad
  const isCompatible = totalTractors >= totalTrailers * 0.8 // %80 eşleşme yeterli

  // Simülasyon verileri
  const investmentCost = hasDeficit ? dynamicRecommendations.investment : 0
  const monthlyNetProfit = 1350000 // Aylık ek net kâr
  const breakEvenMonth = investmentCost > 0 ? Math.ceil(investmentCost / monthlyNetProfit) : 0 // Başabaş noktası (ay)
  const opportunityCost = -450000 // Aylık fırsat maliyeti (müşteri kaybı)
  const monthlyRentalCost = 350000 // Aylık kira maliyeti

  // Amortisman grafiği verileri
  const amortizationData = []
  let cumulativeProfit = -investmentCost
  for (let month = 0; month <= 24; month++) {
    if (month === 0) {
      cumulativeProfit = -investmentCost
    } else {
      cumulativeProfit += monthlyNetProfit
    }
    amortizationData.push({
      month: month === 0 ? 'Başlangıç' : `${month}. Ay`,
      profit: cumulativeProfit,
      breakEven: month === breakEvenMonth ? 0 : null
    })
  }

  return (
    <div style={{ 
      padding: '2.5rem', 
      background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.98) 0%, rgba(15, 23, 42, 0.98) 100%)',
      backgroundImage: 'radial-gradient(ellipse at top, rgba(59, 130, 246, 0.05) 0%, transparent 50%), radial-gradient(ellipse at bottom right, rgba(16, 185, 129, 0.05) 0%, transparent 50%)',
      minHeight: '100vh',
      color: '#cbd5e1',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Dekoratif arka plan elementleri */}
      <div style={{
        position: 'absolute',
        top: '-200px',
        right: '-200px',
        width: '600px',
        height: '600px',
        background: 'radial-gradient(circle, rgba(59, 130, 246, 0.08) 0%, transparent 70%)',
        borderRadius: '50%',
        filter: 'blur(60px)',
        pointerEvents: 'none',
        zIndex: 0
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-150px',
        left: '-150px',
        width: '500px',
        height: '500px',
        background: 'radial-gradient(circle, rgba(16, 185, 129, 0.06) 0%, transparent 70%)',
        borderRadius: '50%',
        filter: 'blur(60px)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'flex-start', 
        alignItems: 'center', 
        marginBottom: '3rem',
        paddingBottom: '2rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1.25rem'
        }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(16, 185, 129, 0.2) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2rem',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
            backdropFilter: 'blur(10px)'
          }}>
            🚛
          </div>
          <div>
            <h1 style={{ 
              margin: 0, 
              fontSize: '2.25rem', 
              fontWeight: '800', 
              color: '#ffffff',
              letterSpacing: '-0.75px',
              marginBottom: '0.5rem',
              textShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
              background: 'linear-gradient(135deg, #ffffff 0%, #cbd5e1 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              Filo Yönetimi
            </h1>
            <p style={{ 
              margin: 0, 
              fontSize: '1rem', 
              color: '#94a3b8',
              fontWeight: '500',
              letterSpacing: '0.2px'
            }}>
              Sektör bazlı filo analizi ve yatırım önerileri
            </p>
          </div>
        </div>
      </div>

      {/* KPI Kartları */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '1.5rem',
        marginBottom: '3rem',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Çekici Sayısı KPI */}
        <div 
          style={{
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(37, 99, 235, 0.1) 100%)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: '12px',
            padding: '1.5rem',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
            transition: 'all 0.3s ease',
            position: 'relative',
            overflow: 'hidden',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)'
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(59, 130, 246, 0.3)'
            e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.5)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.2)'
            e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.3)'
          }}
        >
          {/* Dekoratif blur */}
          <div style={{
            position: 'absolute',
            top: '-20px',
            right: '-20px',
            width: '80px',
            height: '80px',
            background: 'rgba(59, 130, 246, 0.1)',
            borderRadius: '50%',
            filter: 'blur(20px)'
          }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem', position: 'relative', zIndex: 1 }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
            }}>
              🚚
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ 
                color: '#94a3b8', 
                fontSize: '0.75rem', 
                fontWeight: '500', 
                textTransform: 'uppercase', 
                letterSpacing: '0.5px',
                marginBottom: '0.25rem'
              }}>
                Toplam Çekici
              </div>
              <div style={{ 
                display: 'flex', 
                alignItems: 'baseline', 
                gap: '0.5rem'
              }}>
                <div style={{ 
                  color: '#3b82f6', 
                  fontSize: '2rem', 
                  fontWeight: '700',
                  lineHeight: '1'
                }}>
                  {totalTractorsCountAll}
                </div>
                <div style={{
                  color: '#64748b',
                  fontSize: '0.75rem',
                  fontWeight: '500'
                }}>
                  adet
                </div>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div style={{
            height: '6px',
            background: 'rgba(59, 130, 246, 0.2)',
            borderRadius: '3px',
            overflow: 'hidden',
            marginBottom: '1rem',
            position: 'relative', zIndex: 1
          }}>
            <div style={{
              height: '100%',
              width: `${(totalTractorsOnRoadAll / totalTractorsCountAll) * 100 || 0}%`,
              background: 'linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%)',
              borderRadius: '3px',
              transition: 'width 0.5s ease',
              boxShadow: '0 0 8px rgba(59, 130, 246, 0.5)'
            }} />
          </div>

          {/* Alt Bilgi */}
          <div style={{
            display: 'flex',
            gap: '1.5rem',
            fontSize: '0.85rem',
            color: '#cbd5e1',
            position: 'relative', zIndex: 1
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#10b981',
                boxShadow: '0 0 8px rgba(16, 185, 129, 0.6)'
              }} />
              <span style={{ color: '#cbd5e1' }}>
                <strong style={{ color: '#10b981', fontWeight: '600' }}>{totalTractorsOnRoadAll}</strong> Yolda
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#f59e0b',
                boxShadow: '0 0 8px rgba(245, 158, 11, 0.6)'
              }} />
              <span style={{ color: '#cbd5e1' }}>
                <strong style={{ color: '#f59e0b', fontWeight: '600' }}>{totalTractorsInMaintenanceAll}</strong> Bakımda
              </span>
            </div>
          </div>
        </div>

        {/* Dorse Sayısı KPI */}
        <div 
          style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.1) 100%)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '12px',
            padding: '1.5rem',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
            transition: 'all 0.3s ease',
            position: 'relative',
            overflow: 'hidden',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)'
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(16, 185, 129, 0.3)'
            e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.5)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.2)'
            e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.3)'
          }}
        >
          {/* Dekoratif blur */}
          <div style={{
            position: 'absolute',
            top: '-20px',
            right: '-20px',
            width: '80px',
            height: '80px',
            background: 'rgba(16, 185, 129, 0.1)',
            borderRadius: '50%',
            filter: 'blur(20px)'
          }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem', position: 'relative', zIndex: 1 }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
            }}>
              📦
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ 
                color: '#94a3b8', 
                fontSize: '0.75rem', 
                fontWeight: '500', 
                textTransform: 'uppercase', 
                letterSpacing: '0.5px',
                marginBottom: '0.25rem'
              }}>
                Toplam Dorse
              </div>
              <div style={{ 
                display: 'flex', 
                alignItems: 'baseline', 
                gap: '0.5rem'
              }}>
                <div style={{ 
                  color: '#10b981', 
                  fontSize: '2rem', 
                  fontWeight: '700',
                  lineHeight: '1'
                }}>
                  {totalTrailersAll}
                </div>
                <div style={{
                  color: '#64748b',
                  fontSize: '0.75rem',
                  fontWeight: '500'
                }}>
                  adet
                </div>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div style={{
            height: '6px',
            background: 'rgba(16, 185, 129, 0.2)',
            borderRadius: '3px',
            overflow: 'hidden',
            marginBottom: '1rem',
            position: 'relative', zIndex: 1
          }}>
            <div style={{
              height: '100%',
              width: '85%', // Placeholder, actual occupancy logic removed
              background: 'linear-gradient(90deg, #10b981 0%, #34d399 100%)',
              borderRadius: '3px',
              transition: 'width 0.5s ease',
              boxShadow: '0 0 8px rgba(16, 185, 129, 0.5)'
            }} />
          </div>

          {/* Alt Bilgi - Dorse Tipleri */}
          <div style={{
            fontSize: '0.8rem',
            color: '#cbd5e1',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.5rem',
            lineHeight: '1.6',
            position: 'relative', zIndex: 1
          }}>
            {(() => {
              // Tüm sektörlerdeki dorse tiplerini grupla
              const trailerTypes = {}
              Object.values(activeFleetData).forEach(sectorData => {
                sectorData.trailers.forEach(trailer => {
                  if (trailerTypes[trailer.name]) {
                    trailerTypes[trailer.name] += trailer.count
                  } else {
                    trailerTypes[trailer.name] = trailer.count
                  }
                })
              })
              
              return Object.entries(trailerTypes).map(([name, count], idx) => (
                <div 
                  key={idx}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.25rem 0.5rem',
                    background: 'rgba(16, 185, 129, 0.1)',
                    borderRadius: '6px',
                    border: '1px solid rgba(16, 185, 129, 0.2)'
                  }}
                >
                  <span style={{ color: '#10b981', fontWeight: '700', fontSize: '0.85rem' }}>
                    {count}
                  </span>
                  <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                    {name}
                  </span>
                </div>
              ))
            })()}
          </div>
        </div>
      </div>

      {/* 1. Üst Kısım: Sektör Seçici Tab Menu */}
      <div style={{
        display: 'flex',
        gap: '1rem',
        marginBottom: '3rem',
        padding: '0.5rem',
        background: 'rgba(15, 23, 42, 0.6)',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
        position: 'relative',
        zIndex: 1
      }}>
        {Object.entries(sectorThemes).map(([key, theme]) => (
          <button
            key={key}
            onClick={() => setSelectedSector(key)}
            style={{
              flex: 1,
              padding: '1.25rem 1.5rem',
              background: selectedSector === key 
                ? theme.bgGradient 
                : 'rgba(30, 30, 46, 0.6)',
              border: selectedSector === key 
                ? `2px solid ${theme.primaryColor}` 
                : '2px solid transparent',
              borderRadius: '12px',
              color: selectedSector === key ? '#ffffff' : '#94a3b8',
              fontSize: '1rem',
              fontWeight: selectedSector === key ? '700' : '600',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              boxShadow: selectedSector === key 
                ? `0 4px 20px ${theme.primaryColor}40, inset 0 2px 4px rgba(255, 255, 255, 0.1)` 
                : 'none',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
              if (selectedSector !== key) {
                e.currentTarget.style.background = 'rgba(30, 30, 46, 0.8)'
                e.currentTarget.style.borderColor = theme.borderColor
              }
            }}
            onMouseLeave={(e) => {
              if (selectedSector !== key) {
                e.currentTarget.style.background = 'rgba(30, 30, 46, 0.6)'
                e.currentTarget.style.borderColor = 'transparent'
              }
            }}
          >
            <span style={{ fontSize: '1.5rem' }}>{theme.icon}</span>
            <span>{theme.name}</span>
          </button>
        ))}
      </div>

      {/* 2. Orta Kısım: Filo Matrisi */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        gap: '2rem',
        marginBottom: '3rem',
        padding: '2rem',
        background: currentSector.bgGradient,
        borderRadius: '16px',
        border: `1px solid ${currentSector.borderColor}`
      }}>
        {/* Sol Blok: Çekici & Kamyonlar */}
        <div>
          <h3 style={{
            color: currentSector.primaryColor,
            fontSize: '1.3rem',
            fontWeight: '700',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            🚛 Çekici
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {currentData.tractors.map((tractor, idx) => (
              <div
                key={idx}
                style={{
                  background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.9) 100%)',
                  border: `1px solid ${currentSector.borderColor}`,
                  borderRadius: '16px',
                  padding: '1.75rem',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)'
                  e.currentTarget.style.boxShadow = `0 12px 32px ${currentSector.primaryColor}40`
                  e.currentTarget.style.borderColor = `${currentSector.primaryColor}60`
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.2)'
                  e.currentTarget.style.borderColor = currentSector.borderColor
                }}
              >
                {/* Dekoratif arka plan efekti */}
                <div style={{
                  position: 'absolute',
                  top: '-50px',
                  right: '-50px',
                  width: '150px',
                  height: '150px',
                  background: `radial-gradient(circle, ${currentSector.primaryColor}08 0%, transparent 70%)`,
                  borderRadius: '50%',
                  filter: 'blur(40px)',
                  pointerEvents: 'none'
                }} />
                
                {/* Başlık Bölümü */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '1.25rem',
                  position: 'relative',
                  zIndex: 1
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      background: `linear-gradient(135deg, ${currentSector.primaryColor}30 0%, ${currentSector.primaryColor}15 100%)`,
                      border: `1px solid ${currentSector.primaryColor}40`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.5rem',
                      boxShadow: `0 4px 12px ${currentSector.primaryColor}20`
                    }}>
                      🚛
                    </div>
                    <div>
                      <h4 style={{
                        color: '#ffffff',
                        fontSize: '1.25rem',
                        fontWeight: '800',
                        margin: 0,
                        letterSpacing: '-0.3px',
                        textShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
                      }}>
                        {tractor.brand || tractor.name}
                      </h4>
                      <div style={{
                        color: '#94a3b8',
                        fontSize: '0.8rem',
                        fontWeight: '500',
                        marginTop: '0.25rem'
                      }}>
                        Çekici Araç
                      </div>
                    </div>
                  </div>
                  <div style={{
                    padding: '0.5rem 1rem',
                    background: `linear-gradient(135deg, ${currentSector.primaryColor}20 0%, ${currentSector.primaryColor}10 100%)`,
                    border: `1px solid ${currentSector.primaryColor}40`,
                    borderRadius: '10px',
                    color: currentSector.primaryColor,
                    fontSize: '1.1rem',
                    fontWeight: '800',
                    boxShadow: `0 2px 8px ${currentSector.primaryColor}20`
                  }}>
                    {tractor.count} Adet
                  </div>
                </div>

                {/* Teknik Özellikler Grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '1rem',
                  marginBottom: '1.25rem',
                  position: 'relative',
                  zIndex: 1
                }}>
                  <div style={{
                    padding: '1rem',
                    background: 'rgba(30, 41, 59, 0.6)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    transition: 'all 0.2s ease'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginBottom: '0.5rem'
                    }}>
                      <span style={{ fontSize: '1rem' }}>🏷️</span>
                      <div style={{
                        color: '#94a3b8',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        Marka
                      </div>
                    </div>
                    <div style={{
                      color: '#ffffff',
                      fontSize: '1rem',
                      fontWeight: '700',
                      letterSpacing: '-0.2px'
                    }}>
                      {tractor.brand || 'N/A'}
                    </div>
                  </div>
                  
                  <div style={{
                    padding: '1rem',
                    background: 'rgba(30, 41, 59, 0.6)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    transition: 'all 0.2s ease'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginBottom: '0.5rem'
                    }}>
                      <span style={{ fontSize: '1rem' }}>🚗</span>
                      <div style={{
                        color: '#94a3b8',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        Model
                      </div>
                    </div>
                    <div style={{
                      color: '#ffffff',
                      fontSize: '1rem',
                      fontWeight: '700',
                      letterSpacing: '-0.2px'
                    }}>
                      {tractor.model || 'N/A'}
                    </div>
                  </div>
                  
                  <div style={{
                    padding: '1rem',
                    background: 'rgba(30, 41, 59, 0.6)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    transition: 'all 0.2s ease'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginBottom: '0.5rem'
                    }}>
                      <span style={{ fontSize: '1rem' }}>⚙️</span>
                      <div style={{
                        color: '#94a3b8',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        Şasi Tipi
                      </div>
                    </div>
                    <div style={{
                      color: '#ffffff',
                      fontSize: '1rem',
                      fontWeight: '700',
                      letterSpacing: '-0.2px'
                    }}>
                      {tractor.chassis || 'N/A'}
                    </div>
                  </div>
                  
                  <div style={{
                    padding: '1rem',
                    background: `linear-gradient(135deg, ${currentSector.primaryColor}15 0%, ${currentSector.primaryColor}08 100%)`,
                    borderRadius: '12px',
                    border: `1px solid ${currentSector.primaryColor}30`,
                    transition: 'all 0.2s ease'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginBottom: '0.5rem'
                    }}>
                      <span style={{ fontSize: '1rem' }}>⚡</span>
                      <div style={{
                        color: '#94a3b8',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        Motor Gücü
                      </div>
                    </div>
                    <div style={{
                      color: currentSector.primaryColor,
                      fontSize: '1rem',
                      fontWeight: '800',
                      letterSpacing: '-0.2px',
                      textShadow: `0 0 8px ${currentSector.primaryColor}30`
                    }}>
                      {tractor.power || 'N/A'}
                    </div>
                  </div>
                  
                  {selectedSector === 'heavy' && tractor.maxTonnage && (
                    <div style={{
                      padding: '1rem',
                      background: 'rgba(245, 158, 11, 0.1)',
                      borderRadius: '12px',
                      border: '1px solid rgba(245, 158, 11, 0.3)',
                      transition: 'all 0.2s ease'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        marginBottom: '0.5rem'
                      }}>
                        <span style={{ fontSize: '1rem' }}>📊</span>
                        <div style={{
                          color: '#94a3b8',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          Maks. Tonaj
                        </div>
                      </div>
                      <div style={{
                        color: '#f59e0b',
                        fontSize: '1rem',
                        fontWeight: '800',
                        letterSpacing: '-0.2px'
                      }}>
                        {tractor.maxTonnage} ton
                      </div>
                    </div>
                  )}
                </div>

                {/* Durum Bilgisi */}
                <div style={{
                  padding: '1rem',
                  background: 'rgba(30, 41, 59, 0.8)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  position: 'relative',
                  zIndex: 1
                }}>
                  <div style={{
                    color: '#94a3b8',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <span>📈</span>
                    Operasyonel Durum
                  </div>
                  <div style={{
                    display: 'flex',
                    gap: '1.5rem',
                    flexWrap: 'wrap'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      flex: 1,
                      minWidth: '120px'
                    }}>
                      <div style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        background: '#10b981',
                        boxShadow: '0 0 12px rgba(16, 185, 129, 0.6)',
                        animation: 'pulse 2s infinite'
                      }} />
                      <div>
                        <div style={{
                          color: '#10b981',
                          fontSize: '1.25rem',
                          fontWeight: '800',
                          lineHeight: '1'
                        }}>
                          {tractor.onRoad}
                        </div>
                        <div style={{
                          color: '#94a3b8',
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          marginTop: '0.25rem'
                        }}>
                          Yolda
                        </div>
                      </div>
                    </div>
                    {tractor.maintenance > 0 && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        flex: 1,
                        minWidth: '120px'
                      }}>
                        <div style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          background: '#f59e0b',
                          boxShadow: '0 0 12px rgba(245, 158, 11, 0.6)'
                        }} />
                        <div>
                          <div style={{
                            color: '#f59e0b',
                            fontSize: '1.25rem',
                            fontWeight: '800',
                            lineHeight: '1'
                          }}>
                            {tractor.maintenance}
                          </div>
                          <div style={{
                            color: '#94a3b8',
                            fontSize: '0.75rem',
                            fontWeight: '500',
                            marginTop: '0.25rem'
                          }}>
                            Bakımda
                          </div>
                        </div>
                      </div>
                    )}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      flex: 1,
                      minWidth: '120px'
                    }}>
                      <div style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        background: '#64748b',
                        boxShadow: '0 0 12px rgba(100, 116, 139, 0.4)'
                      }} />
                      <div>
                        <div style={{
                          color: '#64748b',
                          fontSize: '1.25rem',
                          fontWeight: '800',
                          lineHeight: '1'
                        }}>
                          {tractor.count - tractor.onRoad - tractor.maintenance}
                        </div>
                        <div style={{
                          color: '#94a3b8',
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          marginTop: '0.25rem'
                        }}>
                          Beklemede
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Kapasite Çubuğu */}
                  <div style={{
                    marginTop: '1rem',
                    height: '6px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '3px',
                    overflow: 'hidden',
                    position: 'relative'
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${(tractor.onRoad / tractor.count) * 100}%`,
                      background: `linear-gradient(90deg, #10b981 0%, #34d399 100%)`,
                      borderRadius: '3px',
                      transition: 'width 0.5s ease',
                      boxShadow: '0 0 8px rgba(16, 185, 129, 0.5)'
                    }} />
                    {tractor.maintenance > 0 && (
                      <div style={{
                        position: 'absolute',
                        left: `${(tractor.onRoad / tractor.count) * 100}%`,
                        height: '100%',
                        width: `${(tractor.maintenance / tractor.count) * 100}%`,
                        background: `linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%)`,
                        borderRadius: '3px',
                        boxShadow: '0 0 8px rgba(245, 158, 11, 0.5)'
                      }} />
                    )}
                  </div>
                </div>

                {/* Durum Rozetleri */}
                {tractor.onRoad === tractor.count && (
                  <div style={{
                    marginTop: '1rem',
                    padding: '0.75rem 1rem',
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.15) 100%)',
                    borderRadius: '10px',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                    color: '#10b981',
                    fontSize: '0.9rem',
                    fontWeight: '700',
                    textAlign: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.2)',
                    position: 'relative',
                    zIndex: 1
                  }}>
                    <span style={{ fontSize: '1.1rem' }}>✅</span>
                    <span>Tam Kapasite Çalışıyor</span>
                  </div>
                )}
                {selectedSector === 'heavy' && tractor.maxTonnage && (
                  <div style={{
                    marginTop: '1rem',
                    padding: '0.75rem 1rem',
                    background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(217, 119, 6, 0.15) 100%)',
                    borderRadius: '10px',
                    border: '1px solid rgba(245, 158, 11, 0.4)',
                    color: '#f59e0b',
                    fontSize: '0.9rem',
                    fontWeight: '700',
                    textAlign: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 2px 8px rgba(245, 158, 11, 0.2)',
                    position: 'relative',
                    zIndex: 1
                  }}>
                    <span style={{ fontSize: '1.1rem' }}>⚖️</span>
                    <span>Maksimum Yük Kapasitesi: {tractor.maxTonnage} ton</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Orta: Bağlantı İkonu */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem'
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: isCompatible 
              ? `linear-gradient(135deg, ${currentSector.primaryColor} 0%, ${currentSector.primaryColor}dd 100%)`
              : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2rem',
            boxShadow: isCompatible
              ? `0 4px 20px ${currentSector.primaryColor}50`
              : '0 4px 20px rgba(239, 68, 68, 0.5)',
            animation: isCompatible ? 'pulse 2s infinite' : 'none'
          }}>
            {isCompatible ? '🔗' : '⚠️'}
          </div>
          <div style={{
            fontSize: '0.85rem',
            color: isCompatible ? currentSector.primaryColor : '#ef4444',
            fontWeight: '600',
            textAlign: 'center',
            maxWidth: '80px'
          }}>
            {isCompatible 
              ? '✅ Eşleşme Uyumlu' 
              : '⚠️ Çekici Eksik!'}
          </div>
        </div>

        {/* Sağ Blok: Dorse & Üniteler */}
        <div>
          <h3 style={{
            color: currentSector.primaryColor,
            fontSize: '1.3rem',
            fontWeight: '700',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            📦 Dorse
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {currentData.trailers.map((trailer, idx) => (
              <div
                key={idx}
                style={{
                  background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.9) 100%)',
                  border: `1px solid ${currentSector.borderColor}`,
                  borderRadius: '16px',
                  padding: '1.75rem',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)'
                  e.currentTarget.style.boxShadow = `0 12px 32px ${currentSector.primaryColor}40`
                  e.currentTarget.style.borderColor = `${currentSector.primaryColor}60`
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.2)'
                  e.currentTarget.style.borderColor = currentSector.borderColor
                }}
              >
                {/* Dekoratif arka plan efekti */}
                <div style={{
                  position: 'absolute',
                  top: '-50px',
                  right: '-50px',
                  width: '150px',
                  height: '150px',
                  background: `radial-gradient(circle, ${currentSector.primaryColor}08 0%, transparent 70%)`,
                  borderRadius: '50%',
                  filter: 'blur(40px)',
                  pointerEvents: 'none'
                }} />
                
                {/* Başlık Bölümü */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '1.25rem',
                  position: 'relative',
                  zIndex: 1
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      background: `linear-gradient(135deg, ${currentSector.primaryColor}30 0%, ${currentSector.primaryColor}15 100%)`,
                      border: `1px solid ${currentSector.primaryColor}40`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.5rem',
                      boxShadow: `0 4px 12px ${currentSector.primaryColor}20`
                    }}>
                      📦
                    </div>
                    <div>
                      <h4 style={{
                        color: '#ffffff',
                        fontSize: '1.25rem',
                        fontWeight: '800',
                        margin: 0,
                        letterSpacing: '-0.3px',
                        textShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
                      }}>
                        {trailer.name}
                      </h4>
                      <div style={{
                        color: '#94a3b8',
                        fontSize: '0.8rem',
                        fontWeight: '500',
                        marginTop: '0.25rem'
                      }}>
                        {trailer.type} Dorse
                      </div>
                    </div>
                  </div>
                  <div style={{
                    padding: '0.5rem 1rem',
                    background: `linear-gradient(135deg, ${currentSector.primaryColor}20 0%, ${currentSector.primaryColor}10 100%)`,
                    border: `1px solid ${currentSector.primaryColor}40`,
                    borderRadius: '10px',
                    color: currentSector.primaryColor,
                    fontSize: '1.1rem',
                    fontWeight: '800',
                    boxShadow: `0 2px 8px ${currentSector.primaryColor}20`
                  }}>
                    {trailer.count} Adet
                  </div>
                </div>

                {/* Bilgi Grid */}
                <div style={{
                  marginBottom: '1.25rem',
                  position: 'relative',
                  zIndex: 1
                }}>
                  <div style={{
                    padding: '1rem',
                    background: 'rgba(30, 41, 59, 0.6)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    transition: 'all 0.2s ease'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginBottom: '0.5rem'
                    }}>
                      <span style={{ fontSize: '1rem' }}>🏷️</span>
                      <div style={{
                        color: '#94a3b8',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        Marka
                      </div>
                    </div>
                    <div style={{
                      color: '#ffffff',
                      fontSize: '1rem',
                      fontWeight: '700',
                      letterSpacing: '-0.2px'
                    }}>
                      Krone
                    </div>
                  </div>
                </div>

                {/* Uyumluluk Durumu */}
                <div style={{
                  padding: '1rem',
                  background: trailer.compatible 
                    ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.15) 100%)'
                    : 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.15) 100%)',
                  borderRadius: '12px',
                  border: `1px solid ${trailer.compatible ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
                  position: 'relative',
                  zIndex: 1,
                  boxShadow: trailer.compatible 
                    ? '0 2px 8px rgba(16, 185, 129, 0.2)'
                    : '0 2px 8px rgba(239, 68, 68, 0.2)'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.75rem'
                  }}>
                    <span style={{
                      fontSize: '1.25rem',
                      filter: trailer.compatible ? 'drop-shadow(0 0 4px rgba(16, 185, 129, 0.6))' : 'drop-shadow(0 0 4px rgba(239, 68, 68, 0.6))'
                    }}>
                      {trailer.compatible ? '✅' : '⚠️'}
                    </span>
                    <div>
                      <div style={{
                        color: trailer.compatible ? '#10b981' : '#ef4444',
                        fontSize: '0.95rem',
                        fontWeight: '700',
                        marginBottom: '0.25rem'
                      }}>
                        {trailer.compatible 
                          ? 'Çekici Sayısıyla Uyumlu' 
                          : 'Çekici Eksikliği Var'}
                      </div>
                      <div style={{
                        color: '#94a3b8',
                        fontSize: '0.8rem',
                        fontWeight: '500'
                      }}>
                        {trailer.compatible 
                          ? 'Tüm dorseler için yeterli çekici mevcut' 
                          : 'Ek çekici alınması önerilir'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Alt Kısım: KDS & Gelecek Projeksiyonu */}
      <div style={{
        background: 'rgba(15, 23, 42, 0.9)',
        border: `1px solid ${currentSector.borderColor}40`,
        borderRadius: '24px',
        padding: '2.5rem',
        marginTop: '3rem',
        boxShadow: `0 8px 32px ${currentSector.primaryColor}15, inset 0 1px 0 rgba(255, 255, 255, 0.05)`,
        backdropFilter: 'blur(10px)',
        position: 'relative',
        zIndex: 1,
        overflow: 'hidden'
      }}>
        {/* Dekoratif blur arka plan */}
        <div style={{
          position: 'absolute',
          top: '-30%',
          left: '-20%',
          width: '500px',
          height: '500px',
          background: `radial-gradient(circle, ${currentSector.primaryColor}10 0%, transparent 70%)`,
          borderRadius: '50%',
          filter: 'blur(80px)',
          pointerEvents: 'none',
          zIndex: 0
        }} />
        
        {/* Modern Başlık */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '1rem',
          position: 'relative',
          zIndex: 1,
          marginBottom: '1rem',
          flexWrap: 'wrap'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            flex: 1
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: `linear-gradient(135deg, ${currentSector.primaryColor}40 0%, ${currentSector.secondaryColor || currentSector.primaryColor}20 100%)`,
              border: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.75rem',
              boxShadow: `0 4px 12px ${currentSector.primaryColor}30`
            }}>
              📊
            </div>
            <div>
              <h3 style={{
                margin: 0,
                fontSize: '1.75rem',
                fontWeight: '800',
                color: '#ffffff',
                letterSpacing: '-0.5px',
                textShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                marginBottom: '0.25rem'
              }}>
                Yatırım ve Büyüme Simülasyonu
              </h3>
              <p style={{
                margin: 0,
                fontSize: '0.9rem',
                color: '#94a3b8',
                fontWeight: '500'
              }}>
                Senaryo bazlı analiz ve yatırım kararları
              </p>
            </div>
          </div>
          
          {/* Senaryo Seçimi ve Yıllık Ortalama Büyüme Oranları Paneli */}
          <div style={{
            display: 'flex',
            flexDirection: 'row',
            gap: '1rem',
            alignItems: 'flex-start'
          }}>
            {/* Senaryo Seçimi */}
            <div style={{
              padding: '0.75rem',
              background: 'rgba(15, 23, 42, 0.85)',
              backdropFilter: 'blur(10px)',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
            }}>
              <div style={{
                color: '#64748b',
                fontSize: '0.7rem',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '0.75rem',
                opacity: '0.9'
              }}>
                Senaryo Seçimi
              </div>
              <div style={{
                display: 'flex',
                gap: '0.5rem',
                flexWrap: 'wrap'
              }}>
                {[
                  { key: 'optimistic', label: 'Optimistik', color: '#10b981', icon: '📈' },
                  { key: 'normal', label: 'Normal', color: '#3b82f6', icon: '📊' },
                  { key: 'pessimistic', label: 'Pesimistik', color: '#ef4444', icon: '📉' }
                ].map(scenario => (
                  <button
                    key={scenario.key}
                    onClick={() => setSelectedScenario(scenario.key)}
                    style={{
                      flex: 1,
                      minWidth: '80px',
                      padding: '0.5rem 0.75rem',
                      background: selectedScenario === scenario.key
                        ? `linear-gradient(135deg, ${scenario.color} 0%, ${scenario.color}dd 100%)`
                        : `linear-gradient(135deg, ${scenario.color}20 0%, ${scenario.color}10 100%)`,
                      border: `1px solid ${scenario.color}${selectedScenario === scenario.key ? 'ff' : '40'}`,
                      borderRadius: '8px',
                      color: selectedScenario === scenario.key ? '#ffffff' : scenario.color,
                      cursor: 'pointer',
                      fontSize: '0.7rem',
                      fontWeight: selectedScenario === scenario.key ? '700' : '600',
                      transition: 'all 0.3s ease',
                      boxShadow: selectedScenario === scenario.key ? `0 4px 12px ${scenario.color}40` : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.25rem'
                    }}
                    onMouseEnter={(e) => {
                      if (selectedScenario !== scenario.key) {
                        e.currentTarget.style.background = `linear-gradient(135deg, ${scenario.color}30 0%, ${scenario.color}20 100%)`
                        e.currentTarget.style.borderColor = `${scenario.color}60`
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedScenario !== scenario.key) {
                        e.currentTarget.style.background = `linear-gradient(135deg, ${scenario.color}20 0%, ${scenario.color}10 100%)`
                        e.currentTarget.style.borderColor = `${scenario.color}40`
                      }
                    }}
                  >
                    <span>{scenario.icon}</span>
                    <span>{scenario.label}</span>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Yıllık Ortalama Büyüme Oranları Paneli */}
            <div style={{
              padding: '0.75rem 1rem',
              background: 'rgba(15, 23, 42, 0.85)',
              backdropFilter: 'blur(10px)',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
            }}>
              <div style={{
                color: '#64748b',
                fontSize: '0.7rem',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '0.5rem',
                opacity: 0.9
              }}>
                Yıllık Ortalama
              </div>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.35rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#2DD4BF' }} />
                    <span style={{ color: '#cbd5e1', fontSize: '0.75rem', fontWeight: '500' }}>Gıda</span>
                  </div>
                  <span style={{ color: '#2DD4BF', fontSize: '0.75rem', fontWeight: '700' }}>
                    {scenarioBasedGrowthRates.food > 0 ? '+' : ''}{scenarioBasedGrowthRates.food.toFixed(1)}%
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#818CF8' }} />
                    <span style={{ color: '#cbd5e1', fontSize: '0.75rem', fontWeight: '500' }}>Standart</span>
                  </div>
                  <span style={{ color: '#818CF8', fontSize: '0.75rem', fontWeight: '700' }}>
                    {scenarioBasedGrowthRates.standard > 0 ? '+' : ''}{scenarioBasedGrowthRates.standard.toFixed(1)}%
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#F87171' }} />
                    <span style={{ color: '#cbd5e1', fontSize: '0.75rem', fontWeight: '500' }}>Ağır</span>
                  </div>
                  <span style={{ color: '#F87171', fontSize: '0.75rem', fontWeight: '700' }}>
                    {scenarioBasedGrowthRates.heavy > 0 ? '+' : ''}{scenarioBasedGrowthRates.heavy.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Risk Analizi */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(37, 99, 235, 0.1) 100%)',
          border: '1px solid rgba(59, 130, 246, 0.4)',
          borderRadius: '16px',
          padding: '2rem',
          marginBottom: '2rem',
          position: 'relative',
          zIndex: 1,
          boxShadow: '0 4px 16px rgba(59, 130, 246, 0.2)',
          overflow: 'hidden'
        }}>
          {/* Dekoratif blur */}
          <div style={{
            position: 'absolute',
            top: '-50px',
            right: '-50px',
            width: '150px',
            height: '150px',
            background: 'radial-gradient(circle, rgba(59, 130, 246, 0.2) 0%, transparent 70%)',
            borderRadius: '50%',
            filter: 'blur(40px)',
            pointerEvents: 'none'
          }} />
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            marginBottom: '1.5rem',
            position: 'relative',
            zIndex: 1
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.3) 0%, rgba(37, 99, 235, 0.2) 100%)',
              border: '1px solid rgba(59, 130, 246, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.75rem',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
            }}>
              📊
            </div>
            <div>
              <h4 style={{
                color: '#ffffff',
                fontSize: '1.35rem',
                fontWeight: '800',
                margin: 0,
                letterSpacing: '-0.3px',
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
              }}>
                6 Aylık Risk Analizi
              </h4>
              <p style={{
                margin: '0.25rem 0 0 0',
                color: '#60a5fa',
                fontSize: '0.85rem',
                fontWeight: '600'
              }}>
                {currentSector.name}
              </p>
            </div>
          </div>
          {/* Büyüme Oranı Kontrolü - Modern */}
          <div style={{
            marginBottom: '2rem',
            padding: '1.5rem',
            background: 'rgba(15, 23, 42, 0.7)',
            borderRadius: '12px',
            border: `1px solid ${currentSector.borderColor}40`,
            backdropFilter: 'blur(10px)',
            position: 'relative',
            zIndex: 1
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1rem',
              flexWrap: 'wrap',
              gap: '1rem'
            }}>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <label style={{
                  color: '#ffffff',
                  fontSize: '1rem',
                  fontWeight: '700',
                  marginBottom: '0.75rem',
                  display: 'block'
                }}>
                  Yıllık Büyüme Oranı
                </label>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1.25rem',
                  flexWrap: 'wrap'
                }}>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    step="0.5"
                    value={currentGrowthRate}
                    onChange={(e) => {
                      setGrowthRates(prev => ({
                        ...prev,
                        [selectedSector]: parseFloat(e.target.value)
                      }))
                    }}
                    style={{
                      flex: 1,
                      minWidth: '250px',
                      height: '8px',
                      borderRadius: '4px',
                      background: `linear-gradient(to right, ${currentSector.primaryColor} 0%, ${currentSector.primaryColor} ${(currentGrowthRate / 50) * 100}%, rgba(255, 255, 255, 0.15) ${(currentGrowthRate / 50) * 100}%, rgba(255, 255, 255, 0.15) 100%)`,
                      outline: 'none',
                      cursor: 'pointer',
                      WebkitAppearance: 'none',
                      appearance: 'none'
                    }}
                  />
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: `linear-gradient(135deg, ${currentSector.primaryColor}20 0%, ${currentSector.secondaryColor || currentSector.primaryColor}10 100%)`,
                    padding: '0.5rem 1rem',
                    borderRadius: '10px',
                    border: `1px solid ${currentSector.primaryColor}40`
                  }}>
                    <input
                      type="number"
                      min="0"
                      max="50"
                      step="0.5"
                      value={currentGrowthRate}
                      onChange={(e) => {
                        const value = Math.max(0, Math.min(50, parseFloat(e.target.value) || 0))
                        setGrowthRates(prev => ({
                          ...prev,
                          [selectedSector]: value
                        }))
                      }}
                      style={{
                        width: '80px',
                        padding: '0.5rem 0.75rem',
                        background: 'rgba(15, 23, 42, 0.8)',
                        border: `1px solid ${currentSector.primaryColor}40`,
                        borderRadius: '8px',
                        color: '#ffffff',
                        fontSize: '1.1rem',
                        fontWeight: '700',
                        textAlign: 'center',
                        outline: 'none'
                      }}
                    />
                    <span style={{
                      color: currentSector.primaryColor,
                      fontSize: '1.1rem',
                      fontWeight: '700',
                      minWidth: '30px'
                    }}>
                      %
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Büyüme Oranı Bilgisi */}
          <div style={{
            padding: '1rem',
            background: `linear-gradient(135deg, ${currentSector.primaryColor}15 0%, ${currentSector.primaryColor}08 100%)`,
            borderRadius: '12px',
            border: `1px solid ${currentSector.primaryColor}40`,
            marginBottom: '1.5rem',
            position: 'relative',
            zIndex: 1
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: '#cbd5e1',
              fontSize: '0.9rem',
              lineHeight: '1.6'
            }}>
              <span style={{ fontSize: '1.1rem' }}>📊</span>
              <span>
                <strong style={{ color: currentSector.primaryColor, fontWeight: '700' }}>%{currentGrowthRate.toFixed(1)}</strong> sektör büyüme oranına göre simülasyon yapılıyor.
              </span>
            </div>
          </div>
          
          <p style={{
            color: '#cbd5e1',
            fontSize: '1.05rem',
            lineHeight: '1.7',
            margin: 0,
            marginBottom: '1.5rem',
            fontWeight: '600',
            position: 'relative',
            zIndex: 1
          }}>
            {hasDeficit ? (
              <>
                Sektördeki <strong style={{ color: '#ffffff', fontWeight: '700' }}>%{currentGrowthRate.toFixed(1)} büyüme trendine</strong> göre, 
                önümüzdeki <strong style={{ color: '#ef4444', fontWeight: '800', fontSize: '1.15rem' }}>{riskMonth} ayında</strong> araç yetersizliği başlayacak.
              </>
            ) : (
              <>
                Sektördeki <strong style={{ color: '#ffffff', fontWeight: '700' }}>%{currentGrowthRate.toFixed(1)} büyüme trendine</strong> göre, 
                mevcut kapasite <strong style={{ color: '#10b981', fontWeight: '800', fontSize: '1.15rem' }}>yeterli</strong> görünmektedir.
              </>
            )}
          </p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1.25rem',
            position: 'relative',
            zIndex: 1
          }}>
            <div style={{
              padding: '1.25rem',
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(37, 99, 235, 0.1) 100%)',
              borderRadius: '12px',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.15)'
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem',
                marginBottom: '0.75rem'
              }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#3b82f6',
                  boxShadow: '0 0 8px rgba(59, 130, 246, 0.6)'
                }} />
                <span style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Mevcut Kapasite
                </span>
              </div>
              <div style={{ color: '#ffffff', fontSize: '1.5rem', fontWeight: '800', lineHeight: '1' }}>
                {currentData.currentCapacity}
              </div>
              <div style={{ color: '#60a5fa', fontSize: '0.9rem', fontWeight: '600', marginTop: '0.25rem' }}>
                Sefer/Gün
              </div>
            </div>
            <div style={{
              padding: '1.25rem',
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.1) 100%)',
              borderRadius: '12px',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.15)'
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem',
                marginBottom: '0.75rem'
              }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#ef4444',
                  boxShadow: '0 0 8px rgba(239, 68, 68, 0.6)'
                }} />
                <span style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  6 Ay Sonraki Talep
                </span>
              </div>
              <div style={{ color: '#ffffff', fontSize: '1.5rem', fontWeight: '800', lineHeight: '1' }}>
                {projectedDemand6Months}
              </div>
              <div style={{ color: '#fca5a5', fontSize: '0.9rem', fontWeight: '600', marginTop: '0.25rem' }}>
                Sefer/Gün
              </div>
            </div>
          </div>
        </div>

        {/* KDS Önerisi */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(37, 99, 235, 0.1) 100%)',
          border: '1px solid rgba(59, 130, 246, 0.4)',
          borderRadius: '16px',
          padding: '2rem',
          marginBottom: '2rem',
          position: 'relative',
          zIndex: 1,
          boxShadow: '0 4px 16px rgba(59, 130, 246, 0.2)',
          overflow: 'hidden'
        }}>
          {/* Dekoratif blur */}
          <div style={{
            position: 'absolute',
            top: '-50px',
            left: '-50px',
            width: '150px',
            height: '150px',
            background: 'radial-gradient(circle, rgba(59, 130, 246, 0.2) 0%, transparent 70%)',
            borderRadius: '50%',
            filter: 'blur(40px)',
            pointerEvents: 'none'
          }} />
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            marginBottom: '1.5rem',
            position: 'relative',
            zIndex: 1
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.3) 0%, rgba(37, 99, 235, 0.2) 100%)',
              border: '1px solid rgba(59, 130, 246, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.75rem',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
            }}>
              {hasDeficit ? '⚠️' : '✅'}
            </div>
            <div>
              <h4 style={{
                color: '#ffffff',
                fontSize: '1.35rem',
                fontWeight: '800',
                margin: 0,
                letterSpacing: '-0.3px',
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
              }}>
                KDS Önerisi
              </h4>
              <p style={{
                margin: '0.25rem 0 0 0',
                color: hasDeficit ? '#fca5a5' : '#60a5fa',
                fontSize: '0.85rem',
                fontWeight: '600'
              }}>
                {hasDeficit ? 'Araç Yatırımı Gerekli' : 'Rota Optimizasyonu'}
              </p>
            </div>
          </div>
          <p style={{
            color: '#cbd5e1',
            fontSize: '1rem',
            lineHeight: '1.7',
            marginBottom: '1.5rem',
            position: 'relative',
            zIndex: 1,
            fontWeight: '500'
          }}>
            {hasDeficit ? (
              <>
                <strong style={{ color: '#ef4444', fontWeight: '700' }}>{gapAbs} sefer açığı</strong> nedeniyle operasyonun aksamaması için <strong style={{ color: '#ef4444', fontWeight: '700' }}>6 ay içinde</strong> aşağıdaki yatırımlar yapılmalı:
              </>
            ) : (
              <>
                Mevcut kapasite <strong style={{ color: '#10b981', fontWeight: '700' }}>yeterli</strong> görünmektedir. <strong style={{ color: '#10b981', fontWeight: '700' }}>Rota optimizasyonu</strong> ile mevcut kaynakları daha verimli kullanabilirsiniz:
              </>
            )}
          </p>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1.25rem',
            marginBottom: '1.5rem',
            position: 'relative',
            zIndex: 1
          }}>
            <div style={{
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(37, 99, 235, 0.1) 100%)',
              borderRadius: '12px',
              padding: '1.25rem',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.15)'
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem',
                marginBottom: '1rem'
              }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#3b82f6',
                  boxShadow: '0 0 8px rgba(59, 130, 246, 0.6)'
                }} />
                <span style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Çekici Önerileri
                </span>
              </div>
              {hasDeficit && dynamicRecommendations.tractors.length > 0 ? (
                dynamicRecommendations.tractors.map((rec, idx) => (
                  <div key={idx} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem',
                    background: 'rgba(59, 130, 246, 0.1)',
                    borderRadius: '8px',
                    marginBottom: '0.5rem'
                  }}>
                    <span style={{
                      color: '#3b82f6',
                      fontSize: '1.1rem',
                      fontWeight: '800'
                    }}>+{rec.count}</span>
                    <span style={{
                      color: '#ffffff',
                      fontSize: '0.95rem',
                      fontWeight: '600'
                    }}>
                      Adet {rec.name}
                    </span>
                  </div>
                ))
              ) : (
                <div style={{
                  color: '#94a3b8',
                  fontSize: '0.9rem',
                  fontStyle: 'italic',
                  padding: '0.75rem'
                }}>
                  Çekici önerisi yok
                </div>
              )}
            </div>
            <div style={{
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.1) 100%)',
              borderRadius: '12px',
              padding: '1.25rem',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.15)'
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem',
                marginBottom: '1rem'
              }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#10b981',
                  boxShadow: '0 0 8px rgba(16, 185, 129, 0.6)'
                }} />
                <span style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Dorse Önerileri
                </span>
              </div>
              {hasDeficit && dynamicRecommendations.trailers.length > 0 ? (
                dynamicRecommendations.trailers.map((rec, idx) => (
                  <div key={idx} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem',
                    background: 'rgba(16, 185, 129, 0.1)',
                    borderRadius: '8px',
                    marginBottom: '0.5rem'
                  }}>
                    <span style={{
                      color: '#10b981',
                      fontSize: '1.1rem',
                      fontWeight: '800'
                    }}>+{rec.count}</span>
                    <span style={{
                      color: '#ffffff',
                      fontSize: '0.95rem',
                      fontWeight: '600'
                    }}>
                      Adet {rec.name}
                    </span>
                  </div>
                ))
              ) : (
                <div style={{
                  color: '#94a3b8',
                  fontSize: '0.9rem',
                  fontStyle: 'italic',
                  padding: '0.75rem'
                }}>
                  Dorse önerisi yok
                </div>
              )}
            </div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(217, 119, 6, 0.1) 100%)',
            borderRadius: '12px',
            padding: '1.5rem',
            marginBottom: '1.5rem',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            boxShadow: '0 4px 12px rgba(245, 158, 11, 0.15)',
            position: 'relative',
            zIndex: 1
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem'
            }}>
              <div>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem',
                  marginBottom: '0.5rem'
                }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#f59e0b',
                    boxShadow: '0 0 8px rgba(245, 158, 11, 0.6)'
                  }} />
                  <span style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Tahmini Yatırım Maliyeti
                  </span>
                </div>
                <div style={{
                  color: '#ffffff',
                  fontSize: '2rem',
                  fontWeight: '800',
                  lineHeight: '1',
                  letterSpacing: '-0.5px'
                }}>
                  {hasDeficit ? dynamicRecommendations.investment.toLocaleString('tr-TR') : '0'}
                </div>
                <div style={{
                  color: '#fbbf24',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  marginTop: '0.25rem'
                }}>
                  TL
                </div>
              </div>
            </div>
          </div>

          <div style={{
            display: 'flex',
            gap: '1.25rem',
            marginTop: '2rem',
            position: 'relative',
            zIndex: 1
          }}>
            <button
              style={{
                flex: 1,
                padding: '1rem 1.75rem',
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(37, 99, 235, 0.15) 100%)',
                border: '1px solid rgba(59, 130, 246, 0.5)',
                borderRadius: '12px',
                color: '#60a5fa',
                fontSize: '1.05rem',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 4px 16px rgba(59, 130, 246, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(59, 130, 246, 0.3) 0%, rgba(37, 99, 235, 0.25) 100%)'
                e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.7)'
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(59, 130, 246, 0.5)'
                e.currentTarget.style.color = '#93c5fd'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(37, 99, 235, 0.15) 100%)'
                e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.5)'
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(59, 130, 246, 0.3)'
                e.currentTarget.style.color = '#60a5fa'
              }}
              onClick={() => setShowSimulation(true)}
            >
              <span style={{ fontSize: '1.25rem' }}>🎯</span>
              <span>Simüle Et</span>
            </button>
          </div>
        </div>
      </div>

      {/* Simülasyon Modal */}
      {showSimulation && (
        <div 
          className="modal-backdrop"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '2rem',
            animation: isClosing ? 'fadeOut 0.3s ease-out' : 'fadeIn 0.3s ease-out'
          }}
          onClick={() => {
            setIsClosing(true)
            setTimeout(() => {
              setShowSimulation(false)
              setIsClosing(false)
            }, 300) // Animasyon süresi kadar bekle
          }}
        >
          <div 
            className="modal-content"
            style={{
              background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
              borderRadius: '16px',
              padding: '2rem',
              maxWidth: '1200px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
              border: `2px solid ${currentSector.borderColor}`,
              boxShadow: `0 8px 32px ${currentSector.primaryColor}40`,
              animation: isClosing ? 'slideDownScale 0.3s ease-out' : 'slideUpScale 0.4s ease-out'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '2rem',
              paddingBottom: '1rem',
              borderBottom: `1px solid ${currentSector.borderColor}`
            }}>
              <h2 style={{
                color: '#ffffff',
                fontSize: '1.8rem',
                fontWeight: '700',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <span>{currentSector.icon}</span>
                <span>Yatırım Simülasyonu - {currentSector.name}</span>
              </h2>
              <button
                onClick={() => {
            setIsClosing(true)
            setTimeout(() => {
              setShowSimulation(false)
              setIsClosing(false)
            }, 300) // Animasyon süresi kadar bekle
          }}
                style={{
                  background: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid rgba(239, 68, 68, 0.5)',
                  borderRadius: '8px',
                  padding: '0.5rem 1rem',
                  color: '#f87171',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'
                }}
              >
                ✕ Kapat
              </button>
            </div>

            {/* 1. Amortisman Grafiği */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.6)',
              borderRadius: '12px',
              padding: '1.5rem',
              marginBottom: '2rem',
              border: `1px solid ${currentSector.borderColor}`
            }}>
              <h3 style={{
                color: currentSector.primaryColor,
                fontSize: '1.3rem',
                fontWeight: '700',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                📈 Amortisman Grafiği (Break-even Point)
              </h3>
              <div style={{ height: '400px', marginBottom: '1rem' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={amortizationData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                    <XAxis 
                      dataKey="month" 
                      stroke="#94a3b8"
                      style={{ fontSize: '0.85rem' }}
                    />
                    <YAxis 
                      stroke="#94a3b8"
                      style={{ fontSize: '0.85rem' }}
                      tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M ₺`}
                    />
                    <Tooltip
                      contentStyle={{
                        background: 'rgba(30, 30, 46, 0.95)',
                        border: `1px solid ${currentSector.primaryColor}`,
                        borderRadius: '8px',
                        color: '#ffffff'
                      }}
                      formatter={(value) => `${(value / 1000000).toFixed(2)}M ₺`}
                    />
                    <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="5 5" strokeWidth={2}>
                      <Label value="Başabaş Noktası" position="right" style={{ fill: '#ef4444', fontSize: '0.85rem' }} />
                    </ReferenceLine>
                    <Line 
                      type="monotone" 
                      dataKey="profit" 
                      stroke={currentSector.primaryColor}
                      strokeWidth={3}
                      dot={{ fill: currentSector.primaryColor, r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                    {amortizationData[breakEvenMonth] && (
                      <ReferenceLine 
                        x={amortizationData[breakEvenMonth].month} 
                        stroke="#10b981" 
                        strokeWidth={2}
                        strokeDasharray="3 3"
                      >
                        <Label 
                          value={`${breakEvenMonth}. Ay - Başabaş`} 
                          position="top" 
                          style={{ fill: '#10b981', fontSize: '0.85rem', fontWeight: '700' }} 
                        />
                      </ReferenceLine>
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div style={{
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '8px',
                padding: '1rem',
                textAlign: 'center'
              }}>
                <div style={{
                  color: '#10b981',
                  fontSize: '1.1rem',
                  fontWeight: '700',
                  marginBottom: '0.5rem'
                }}>
                  🚩 Tahmini Geri Dönüş: {breakEvenMonth}. Ay
                </div>
                <div style={{
                  color: '#cbd5e1',
                  fontSize: '0.85rem'
                }}>
                  Yatırım maliyeti {breakEvenMonth} ay içinde geri kazanılacak
                </div>
              </div>
            </div>

            {/* 2. Kritik Kartlar: ROI ve Fırsat Maliyeti */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '1.5rem',
              marginBottom: '2rem'
            }}>
              {/* Kart A: Yatırımın Geri Dönüş Süresi (ROI) */}
              <div style={{
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '12px',
                padding: '1.5rem'
              }}>
                <div style={{
                  color: '#94a3b8',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  marginBottom: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Kart A: Yatırımın Geri Dönüş Süresi (ROI)
                </div>
                <div style={{
                  color: '#10b981',
                  fontSize: '2rem',
                  fontWeight: '700',
                  marginBottom: '1rem'
                }}>
                  {breakEvenMonth} Ay
                </div>
                <div style={{
                  color: '#10b981',
                  fontSize: '0.9rem',
                  lineHeight: '1.5',
                  padding: '0.75rem',
                  background: 'rgba(16, 185, 129, 0.1)',
                  borderRadius: '6px'
                }}>
                  ✅ Sektör ortalaması olan 18 aydan daha hızlı. Yatırım yapılabilir.
                </div>
              </div>

              {/* Kart B: Aylık Ek Net Kâr (Projeksiyon) */}
              <div style={{
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: '12px',
                padding: '1.5rem'
              }}>
                <div style={{
                  color: '#94a3b8',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  marginBottom: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Kart B: Aylık Ek Net Kâr (Projeksiyon)
                </div>
                <div style={{
                  color: '#3b82f6',
                  fontSize: '2rem',
                  fontWeight: '700',
                  marginBottom: '1rem'
                }}>
                  +{(monthlyNetProfit / 1000000).toFixed(2)}M ₺ / Ay
                </div>
                <div style={{
                  color: '#60a5fa',
                  fontSize: '0.9rem',
                  lineHeight: '1.5',
                  padding: '0.75rem',
                  background: 'rgba(59, 130, 246, 0.1)',
                  borderRadius: '6px'
                }}>
                  💰 Yeni alınan {hasDeficit ? dynamicRecommendations.tractors.reduce((sum, t) => sum + t.count, 0) : 0} çekici ve {hasDeficit ? dynamicRecommendations.trailers.reduce((sum, t) => sum + t.count, 0) : 0} dorsenin tam kapasite çalışması durumunda aylık katkısı.
                </div>
              </div>

              {/* Kart C: "Yapmazsam Ne Olur?" (Fırsat Maliyeti) */}
              <div style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '12px',
                padding: '1.5rem'
              }}>
                <div style={{
                  color: '#94a3b8',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  marginBottom: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Kart C: "Yapmazsam Ne Olur?" (Fırsat Maliyeti)
                </div>
                <div style={{
                  color: '#ef4444',
                  fontSize: '2rem',
                  fontWeight: '700',
                  marginBottom: '1rem'
                }}>
                  {(opportunityCost / 1000000).toFixed(2)}M ₺ / Ay
                </div>
                <div style={{
                  color: '#f87171',
                  fontSize: '0.9rem',
                  lineHeight: '1.5',
                  padding: '0.75rem',
                  background: 'rgba(239, 68, 68, 0.1)',
                  borderRadius: '6px'
                }}>
                  ⚠️ Eğer bu yatırımı yapmazsanız, artan talebi karşılayamayacağınız için rakiplere kaptırılacak ciro.
                </div>
              </div>
            </div>

            {/* 3. Satın Alma vs. Kiralama Karşılaştırması */}
            <div style={{
              background: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: '12px',
              padding: '1.5rem'
            }}>
              <h3 style={{
                color: '#f59e0b',
                fontSize: '1.2rem',
                fontWeight: '700',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                🤔 Alternatif Senaryo: Kiralama Yaparsak?
              </h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1.5rem',
                marginBottom: '1rem'
              }}>
                <div style={{
                  background: 'rgba(15, 23, 42, 0.6)',
                  borderRadius: '8px',
                  padding: '1rem'
                }}>
                  <div style={{
                    color: '#94a3b8',
                    fontSize: '0.85rem',
                    marginBottom: '0.5rem',
                    fontWeight: '600'
                  }}>
                    Satın Alma
                  </div>
                  <div style={{
                    color: '#ffffff',
                    fontSize: '1.1rem',
                    fontWeight: '700',
                    marginBottom: '0.5rem'
                  }}>
                    İlk Yatırım: {investmentCost.toLocaleString('tr-TR')} ₺
                  </div>
                  <div style={{
                    color: '#cbd5e1',
                    fontSize: '0.85rem',
                    lineHeight: '1.5'
                  }}>
                    • Araç sahibi sizsiniz<br/>
                    • Uzun vadede daha kârlı<br/>
                    • {breakEvenMonth} ay sonra kâra geçiş
                  </div>
                </div>
                <div style={{
                  background: 'rgba(15, 23, 42, 0.6)',
                  borderRadius: '8px',
                  padding: '1rem'
                }}>
                  <div style={{
                    color: '#94a3b8',
                    fontSize: '0.85rem',
                    marginBottom: '0.5rem',
                    fontWeight: '600'
                  }}>
                    Kiralama
                  </div>
                  <div style={{
                    color: '#ffffff',
                    fontSize: '1.1rem',
                    fontWeight: '700',
                    marginBottom: '0.5rem'
                  }}>
                    İlk Yatırım: 0 ₺
                  </div>
                  <div style={{
                    color: '#cbd5e1',
                    fontSize: '0.85rem',
                    lineHeight: '1.5'
                  }}>
                    • Aylık Gider: {monthlyRentalCost.toLocaleString('tr-TR')} ₺ (Kira)<br/>
                    • Risk: Araç sahibi siz değilsiniz<br/>
                    • Nakit akışını korur
                  </div>
                </div>
              </div>
              <div style={{
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '8px',
                padding: '1rem'
              }}>
                <div style={{
                  color: '#10b981',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  marginBottom: '0.5rem'
                }}>
                  🤖 KDS Önerisi:
                </div>
                <div style={{
                  color: '#cbd5e1',
                  fontSize: '0.9rem',
                  lineHeight: '1.6'
                }}>
                  {(() => {
                    const rentalCost24Months = monthlyRentalCost * 24
                    const purchaseAdvantage = rentalCost24Months - investmentCost
                    if (purchaseAdvantage > 0) {
                      return `Uzun vadede Satın Alma ${((purchaseAdvantage / investmentCost) * 100).toFixed(0)}% daha kârlı. Ancak nakit akışını korumak için Kiralama da mantıklı bir seçenek olabilir.`
                    } else {
                      return `Nakit akışını korumak için Kiralama daha mantıklı olabilir. Satın alma yatırımı 24 ay içinde kira maliyetinden fazla olacaktır.`
                    }
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.05);
          }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        @keyframes fadeOut {
          from {
            opacity: 1;
          }
          to {
            opacity: 0;
          }
        }
        
        @keyframes slideUpScale {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        @keyframes slideDownScale {
          from {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          to {
            opacity: 0;
            transform: translateY(30px) scale(0.95);
          }
        }
        
        .modal-backdrop {
          animation: fadeIn 0.3s ease-out;
        }
        
        .modal-content {
          animation: slideUpScale 0.4s ease-out;
        }
      `}</style>
    </div>
  )
}

export default FleetManagement
