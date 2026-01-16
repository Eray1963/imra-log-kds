import { useState, useEffect, useRef } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, ComposedChart, AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Label } from 'recharts'
import { getDemandTrend, getFleetStatus, getSparePartRisk, getWarehouseUsage, getLossBySource, years as kdsYears } from '../kds/overviewKdsEngine'
import { getMultiYearDemandTrend, getMultiYearFleetTrend, getMultiYearSparePartsTrend, getMultiYearWarehouseTrend } from '../kds/chartViewModeHelper'
import { getSectorVolumeByRegion, getSectorVolumeTotal } from '../services/dataService'

function Overview({ onNavigate }) {
  // Loss type to route mapping
  const lossTypeToRoute = {
    fleet: 'fleet-expansion',
    spareParts: 'spare-parts',
    warehouse: 'warehouse',
    finance: 'scenarios'
  }

  const handleLossClick = (lossType) => {
    if (onNavigate && lossTypeToRoute[lossType]) {
      onNavigate(lossTypeToRoute[lossType])
    }
  }
  const currentYear = new Date().getFullYear()
  const defaultYear = currentYear >= 2020 && currentYear <= 2024 ? currentYear : 2024
  const [selectedYear, setSelectedYear] = useState(defaultYear)
  const [routesData, setRoutesData] = useState([])
  const [sparePartsData, setSparePartsData] = useState([])
  const [sectorData, setSectorData] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Anlık veriler
  const [currentRoutes, setCurrentRoutes] = useState([])
  const [currentVehicles, setCurrentVehicles] = useState([])
  const [currentSpareParts, setCurrentSpareParts] = useState([])
  const [currentDrivers, setCurrentDrivers] = useState([])
  const [currentWarehouses, setCurrentWarehouses] = useState([])
  const [currentDataLoading, setCurrentDataLoading] = useState(true)
  
  // Türkiye haritası için state'ler
  const [svgContent, setSvgContent] = useState(null)
  const [selectedMapRegion, setSelectedMapRegion] = useState(null)
  const [hoveredMapRegion, setHoveredMapRegion] = useState(null)
  const [showAllRegions, setShowAllRegions] = useState(true)
  const [selectedRegionForParts, setSelectedRegionForParts] = useState('Marmara') // Bölge & Parça ilişkisi için seçili bölge (varsayılan: Marmara)
  const [selectedSectorForParts, setSelectedSectorForParts] = useState('food') // Sektör Parça ilişkisi için seçili sektör: 'food', 'standard', 'heavy'
  const [selectedSectorYear, setSelectedSectorYear] = useState(null) // null = tüm yıllar
  const [sectorVolumeData, setSectorVolumeData] = useState(null) // API'den gelecek veri
  const [sectorVolumeLoading, setSectorVolumeLoading] = useState(true)
  // selectedSector artık kullanılmıyor - her zaman tüm sektörler gösteriliyor
  const svgRef = useRef(null)
  const colorPathsRef = useRef({})

  // Yıl listesi (2020-2024) - mevcut mock data için
  const years = [2020, 2021, 2022, 2023, 2024]
  
  // Local year selectors for KDS charts
  const [localYearChart1, setLocalYearChart1] = useState(null) // Demand & Operation Trend
  const [localYearChart2, setLocalYearChart2] = useState(null) // Fleet Status & Capacity
  const [localYearChart3, setLocalYearChart3] = useState(null) // Spare Parts Risk
  const [localYearChart4, setLocalYearChart4] = useState(null) // Warehouse & Utilization
  const [localYearRadarChart, setLocalYearRadarChart] = useState(null) // Radar Chart - Sector Demand
  
  // View mode for each chart (single vs trend)
  const [viewModeChart1, setViewModeChart1] = useState('single') // 'single' | 'trend'
  const [viewModeChart2, setViewModeChart2] = useState('single')
  const [viewModeChart3, setViewModeChart3] = useState('single')
  const [viewModeChart4, setViewModeChart4] = useState('single')

  // Mock data - Yıllara göre rotalar/bölgeler
  const mockRoutesByYear = {
    2020: [
      { region: 'Marmara', count: 1250, distance: 45000 },
      { region: 'Ege', count: 890, distance: 32000 },
      { region: 'İç Anadolu', count: 1100, distance: 38000 },
      { region: 'Akdeniz', count: 750, distance: 28000 },
      { region: 'Karadeniz', count: 650, distance: 22000 },
      { region: 'Doğu Anadolu', count: 420, distance: 15000 },
      { region: 'Güneydoğu Anadolu', count: 380, distance: 14000 }
    ],
    2021: [
      { region: 'Marmara', count: 1380, distance: 48000 },
      { region: 'Ege', count: 950, distance: 34000 },
      { region: 'İç Anadolu', count: 1200, distance: 41000 },
      { region: 'Akdeniz', count: 820, distance: 30000 },
      { region: 'Karadeniz', count: 720, distance: 24000 },
      { region: 'Doğu Anadolu', count: 480, distance: 17000 },
      { region: 'Güneydoğu Anadolu', count: 420, distance: 15000 }
    ],
    2022: [
      { region: 'Marmara', count: 1520, distance: 52000 },
      { region: 'Ege', count: 1050, distance: 37000 },
      { region: 'İç Anadolu', count: 1320, distance: 45000 },
      { region: 'Akdeniz', count: 920, distance: 33000 },
      { region: 'Karadeniz', count: 780, distance: 26000 },
      { region: 'Doğu Anadolu', count: 550, distance: 19000 },
      { region: 'Güneydoğu Anadolu', count: 480, distance: 17000 }
    ],
    2023: [
      { region: 'Marmara', count: 1680, distance: 57000 },
      { region: 'Ege', count: 1180, distance: 41000 },
      { region: 'İç Anadolu', count: 1450, distance: 49000 },
      { region: 'Akdeniz', count: 1020, distance: 36000 },
      { region: 'Karadeniz', count: 850, distance: 29000 },
      { region: 'Doğu Anadolu', count: 620, distance: 21000 },
      { region: 'Güneydoğu Anadolu', count: 550, distance: 19000 }
    ],
    2024: [
      { region: 'Marmara', count: 1850, distance: 62000 },
      { region: 'Ege', count: 1320, distance: 46000 },
      { region: 'İç Anadolu', count: 1600, distance: 54000 },
      { region: 'Akdeniz', count: 1150, distance: 40000 },
      { region: 'Karadeniz', count: 920, distance: 31000 },
      { region: 'Doğu Anadolu', count: 680, distance: 23000 },
      { region: 'Güneydoğu Anadolu', count: 620, distance: 21000 }
    ]
  }

  // Mock data - Yıllara göre sektör talepleri
  const mockSectorDemandByYear = {
    2020: [
      { sector: 'Meyve&Sebze', demand: 850, revenue: 4250000 },
      { sector: 'Ağır Nakliyat', demand: 620, revenue: 6200000 },
      { sector: 'Standart Taşımacılık', demand: 1850, revenue: 3700000 }
    ],
    2021: [
      { sector: 'Meyve&Sebze', demand: 920, revenue: 4600000 },
      { sector: 'Ağır Nakliyat', demand: 680, revenue: 6800000 },
      { sector: 'Standart Taşımacılık', demand: 2050, revenue: 4100000 }
    ],
    2022: [
      { sector: 'Meyve&Sebze', demand: 1050, revenue: 5250000 },
      { sector: 'Ağır Nakliyat', demand: 750, revenue: 7500000 },
      { sector: 'Standart Taşımacılık', demand: 2280, revenue: 4560000 }
    ],
    2023: [
      { sector: 'Meyve&Sebze', demand: 1180, revenue: 5900000 },
      { sector: 'Ağır Nakliyat', demand: 820, revenue: 8200000 },
      { sector: 'Standart Taşımacılık', demand: 2520, revenue: 5040000 }
    ],
    2024: [
      { sector: 'Meyve&Sebze', demand: 1320, revenue: 6600000 },
      { sector: 'Ağır Nakliyat', demand: 950, revenue: 9500000 },
      { sector: 'Standart Taşımacılık', demand: 2780, revenue: 5560000 }
    ]
  }

  // Mock data - Bölge bazlı sektör verileri (2020-2025)
  // Bölge bazlı sektör yoğunluk verileri
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

  // API'den sektör hacim verilerini yükle
  useEffect(() => {
    const loadSectorVolumeData = async () => {
      try {
        setSectorVolumeLoading(true)
        const data = await getSectorVolumeByRegion()
        setSectorVolumeData(data)
      } catch (error) {
        console.error('Sektör hacim verileri yüklenirken hata:', error)
        // Fallback: Eski hesaplama yöntemini kullan
        setSectorVolumeData(null)
      } finally {
        setSectorVolumeLoading(false)
      }
    }
    loadSectorVolumeData()
  }, [])

  // Sektör isim mapping: DB -> Frontend
  const sectorNameMap = {
    'Gida': 'Gıda Nakliyat',
    'Standart': 'Standart Nakliyat',
    'Agir': 'Ağır Nakliyat'
  }

  const getRegionSectorData = (region, year = null, sector = 'Tümü') => {
    // API'den veri varsa onu kullan
    if (sectorVolumeData && Array.isArray(sectorVolumeData)) {
      // Bölge adı mapping (DB'deki format -> Frontend formatı)
      const regionMap = {
        'Marmara': 'Marmara',
        'Ege': 'Ege',
        'İç Anadolu': 'İç Anadolu',
        'Akdeniz': 'Akdeniz',
        'Karadeniz': 'Karadeniz',
        'Doğu Anadolu': 'Doğu Anadolu',
        'Güneydoğu Anadolu': 'Güneydoğu Anadolu'
      }
      
      const dbRegion = regionMap[region] || region
      const filteredData = sectorVolumeData.filter(d => d.region === dbRegion)
      
      if (year && sector === 'Tümü') {
        // Belirli bir yıl için tüm sektörleri göster
        const yearData = filteredData.filter(d => d.year === year)
        return yearData.map(d => ({
          sector: sectorNameMap[d.sector] || d.sector,
          value: d.volume
        }))
      }
      
      // Yıllar için veri hazırla
      const years = year ? [year] : [2020, 2021, 2022, 2023, 2024, 2025]
      const data = years.map(yearVal => {
        const result = { year: yearVal }
        const yearData = filteredData.filter(d => d.year === yearVal)
        
        if (sector === 'Tümü') {
          yearData.forEach(d => {
            const sectorName = sectorNameMap[d.sector] || d.sector
            result[sectorName] = d.volume
          })
        } else {
          // Belirli bir sektör için
          const sectorKey = Object.keys(sectorNameMap).find(k => sectorNameMap[k] === sector) || sector
          const sectorData = yearData.find(d => d.sector === sectorKey)
          result[sector] = sectorData ? sectorData.volume : 0
        }
        
        return result
      })
      
      return data
    }
    
    // Fallback: Eski hesaplama yöntemi
    const intensity = getRegionSectorIntensity(region)
    
    if (year && sector === 'Tümü') {
      const yearIndex = year - 2020
      const growthFactor = 1 + (yearIndex * 0.05)
      const baseMultiplier = 5
      
      return [
        {
          sector: 'Gıda Nakliyat',
          value: Math.round(intensity['Gıda Nakliyat'] * baseMultiplier * growthFactor)
        },
        {
          sector: 'Standart Nakliyat',
          value: Math.round(intensity['Standart Nakliyat'] * baseMultiplier * growthFactor)
        },
        {
          sector: 'Ağır Nakliyat',
          value: Math.round(intensity['Ağır Nakliyat'] * baseMultiplier * growthFactor)
        }
      ]
    }
    
    const years = year ? [year] : [2020, 2021, 2022, 2023, 2024, 2025]
    const baseMultiplier = 5
    const data = years.map(yearVal => {
      const yearIndex = yearVal - 2020
      const growthFactor = 1 + (yearIndex * 0.05)
      const result = { year: yearVal }
      
      if (sector === 'Tümü') {
        result['Gıda Nakliyat'] = Math.round(intensity['Gıda Nakliyat'] * baseMultiplier * growthFactor)
        result['Standart Nakliyat'] = Math.round(intensity['Standart Nakliyat'] * baseMultiplier * growthFactor)
        result['Ağır Nakliyat'] = Math.round(intensity['Ağır Nakliyat'] * baseMultiplier * growthFactor)
      } else {
        result[sector] = Math.round(intensity[sector] * baseMultiplier * growthFactor)
      }
      
      return result
    })
    
    return data
  }

  // Tüm bölgeler için toplam veri (SUM - mutlak adet/ton metriği)
  const getAllRegionsSectorData = (year = null, sector = 'Tümü') => {
    // API'den veri varsa onu kullan
    if (sectorVolumeData && Array.isArray(sectorVolumeData)) {
      if (year && sector === 'Tümü') {
        // Belirli bir yıl için tüm sektörlerin toplamı
        const yearData = sectorVolumeData.filter(d => d.year === year)
        const sums = {
          'Gıda Nakliyat': 0,
          'Standart Nakliyat': 0,
          'Ağır Nakliyat': 0
        }
        
        yearData.forEach(d => {
          const sectorName = sectorNameMap[d.sector] || d.sector
          if (sums[sectorName] !== undefined) {
            sums[sectorName] += d.volume || 0
          }
        })
        
        return [
          { sector: 'Gıda Nakliyat', value: sums['Gıda Nakliyat'] },
          { sector: 'Standart Nakliyat', value: sums['Standart Nakliyat'] },
          { sector: 'Ağır Nakliyat', value: sums['Ağır Nakliyat'] }
        ]
      }
      
      // Yıllar için toplam hesapla
      const years = year ? [year] : [2020, 2021, 2022, 2023, 2024, 2025]
      const data = years.map(yearVal => {
        const result = { year: yearVal }
        const yearData = sectorVolumeData.filter(d => d.year === yearVal)
        
        if (sector === 'Tümü') {
          const sums = {
            'Gıda Nakliyat': 0,
            'Standart Nakliyat': 0,
            'Ağır Nakliyat': 0
          }
          
          yearData.forEach(d => {
            const sectorName = sectorNameMap[d.sector] || d.sector
            if (sums[sectorName] !== undefined) {
              sums[sectorName] += d.volume || 0
            }
          })
          
          result['Gıda Nakliyat'] = sums['Gıda Nakliyat']
          result['Standart Nakliyat'] = sums['Standart Nakliyat']
          result['Ağır Nakliyat'] = sums['Ağır Nakliyat']
        } else {
          // Belirli bir sektör için toplam
          const sectorKey = Object.keys(sectorNameMap).find(k => sectorNameMap[k] === sector) || sector
          const sectorYearData = yearData.filter(d => d.sector === sectorKey)
          result[sector] = sectorYearData.reduce((sum, d) => sum + (d.volume || 0), 0)
        }
        
        return result
      })
      
      return data
    }
    
    // Fallback: Eski hesaplama yöntemi
    const allRegions = ['Marmara', 'Ege', 'İç Anadolu', 'Akdeniz', 'Karadeniz', 'Doğu Anadolu', 'Güneydoğu Anadolu']
    
    if (year && sector === 'Tümü') {
      let sumGida = 0
      let sumStandart = 0
      let sumAgir = 0
      
      allRegions.forEach(region => {
        const regionData = getRegionSectorData(region, year, 'Tümü')
        if (regionData && Array.isArray(regionData)) {
          regionData.forEach(item => {
            if (item.sector === 'Gıda Nakliyat') sumGida += item.value || 0
            if (item.sector === 'Standart Nakliyat') sumStandart += item.value || 0
            if (item.sector === 'Ağır Nakliyat') sumAgir += item.value || 0
          })
        }
      })
      
      return [
        { sector: 'Gıda Nakliyat', value: sumGida },
        { sector: 'Standart Nakliyat', value: sumStandart },
        { sector: 'Ağır Nakliyat', value: sumAgir }
      ]
    }
    
    const years = year ? [year] : [2020, 2021, 2022, 2023, 2024, 2025]
    const data = years.map(yearVal => {
      const result = { year: yearVal }
      
      if (sector === 'Tümü') {
        let sumGida = 0
        let sumStandart = 0
        let sumAgir = 0
        
        allRegions.forEach(region => {
          const regionData = getRegionSectorData(region, null, 'Tümü')
          if (regionData && Array.isArray(regionData)) {
            const yearData = regionData.find(d => d.year === yearVal)
            if (yearData) {
              sumGida += yearData['Gıda Nakliyat'] || 0
              sumStandart += yearData['Standart Nakliyat'] || 0
              sumAgir += yearData['Ağır Nakliyat'] || 0
            }
          }
        })
        
        result['Gıda Nakliyat'] = sumGida
        result['Standart Nakliyat'] = sumStandart
        result['Ağır Nakliyat'] = sumAgir
      } else {
        let sumSector = 0
        
        allRegions.forEach(region => {
          const regionData = getRegionSectorData(region, null, sector)
          if (regionData && Array.isArray(regionData)) {
            const yearData = regionData.find(d => d.year === yearVal)
            if (yearData) {
              sumSector += yearData[sector] || 0
            }
          }
        })
        
        result[sector] = sumSector
      }
      
      return result
    })
    
    return data
  }

  // Mini bilgi kutusu için metin üretme fonksiyonu
  const getInsightText = (region, chartType, value) => {
    const isAll = region === 'all' || !region
    const regionName = region

    switch (chartType) {
      case 'spareParts': {
        // Yedek Parça Yoğunluğu
        if (isAll) {
          return {
            text: 'Fren ve lastik parçaları öncelikli. Bakım yükü bu parçalarda yoğunlaşıyor.',
            warning: false
          }
        }
        
        const sparePartsTexts = {
          'Marmara': 'Ağır nakliyat nedeniyle fren ve süspansiyon parçalarında yoğunluk var. Kritik parça stok seviyesi artırılmalı.',
          'Ege': 'Standart nakliyat ağırlıklı. Lastik ve antifriz sarf parçalarında artış görülüyor.',
          'İç Anadolu': 'Uzun mesafeli taşımalar parça kullanımını artırıyor. Tüketim düzenli ve sürekli.',
          'Karadeniz': 'Yol ve iklim koşulları fren sistemi yoğunluğunu artırıyor. Önleyici bakım önerilir.',
          'Akdeniz': 'Gıda taşımacılığına bağlı soğutma sistemi parça kullanımı yüksek.',
          'Doğu Anadolu': 'Düşük operasyon yoğunluğu. Minimum stok seviyesi korunmalı.',
          'Güneydoğu Anadolu': 'Düşük operasyon yoğunluğu. Minimum stok seviyesi korunmalı.'
        }
        
        return {
          text: sparePartsTexts[regionName] || 'Bu bölge için yeterli veri bulunmuyor.',
          warning: regionName === 'Marmara' || regionName === 'Karadeniz'
        }
      }
      
      case 'fleet': {
        // Araç Filosu Dağılımı
        if (isAll) {
          return {
            text: 'Filo belirli markalarda yoğunlaşmış. Bakım kolaylaşıyor ancak marka bağımlılığı riski var.',
            warning: false
          }
        }
        
        const fleetTexts = {
          'Marmara': 'Yüksek kapasiteli araçlar ağırlıkta. Sanayi ve ağır yük talebiyle uyumlu.',
          'Ege': 'Orta tonajlı ve standart araçlar ön planda. Bölgesel dağıtım odaklı.',
          'İç Anadolu': 'Filo yapısı dengeli. Transit ve dağıtım operasyonları birlikte.',
          'Karadeniz': 'Dar yol yapısı nedeniyle manevra kabiliyeti yüksek araçlar tercih ediliyor.',
          'Akdeniz': 'Soğutmalı taşımalara uygun araç oranı yüksek.',
          'Doğu Anadolu': 'Bu bölge için yeterli veri bulunmuyor.',
          'Güneydoğu Anadolu': 'Bu bölge için yeterli veri bulunmuyor.'
        }
        
        return {
          text: fleetTexts[regionName] || 'Bu bölge için yeterli veri bulunmuyor.',
          warning: false
        }
      }
      
      case 'trailer': {
        // Dorse Tipi Dağılımı
        if (isAll) {
          return {
            text: 'Frigo ve standart dorse kullanımı baskın. Taşınan yüklerin çoğu gıda ve hızlı tüketim ürünleri.',
            warning: false
          }
        }
        
        const trailerTexts = {
          'Marmara': 'Lowbed ve ağır yük dorseleri öne çıkıyor. Sanayi ve proje taşımaları ağırlıkta.',
          'Ege': 'Standart ve frigo dorseler ağırlıkta. Tarım ve gıda taşımacılığı belirleyici.',
          'İç Anadolu': 'Standart dorse kullanımı baskın. Ülke içi dağıtım merkezi rolü.',
          'Karadeniz': 'Frigo dorse kullanımı artıyor. Bölgesel tarım ve gıda taşımaları etkili.',
          'Akdeniz': 'Frigo dorse oranı yüksek. İhracat ve soğuk zincir taşımaları ön planda. Frigo motoru seviyesi arttırılması önerilir.',
          'Doğu Anadolu': 'Bu bölge için yeterli veri bulunmuyor.',
          'Güneydoğu Anadolu': 'Bu bölge için yeterli veri bulunmuyor.'
        }
        
        return {
          text: trailerTexts[regionName] || 'Bu bölge için yeterli veri bulunmuyor.',
          warning: false
        }
      }
      
      case 'warehouse': {
        // Depo Doluluk Oranı
        if (value === null || value === undefined || isNaN(value)) {
          // Depo verisi olmayan bölgeler için taşıma oranına göre öneri
          if (!isAll && regionName) {
            const intensity = getRegionSectorIntensity(regionName)
            const gida = intensity['Gıda Nakliyat'] || 0
            const standart = intensity['Standart Nakliyat'] || 0
            const agir = intensity['Ağır Nakliyat'] || 0
            const totalIntensity = gida + standart + agir
            
            // En yüksek taşıma oranına göre öneri
            let recommendation = ''
            let priority = ''
            
            if (totalIntensity > 0) {
              const maxSector = gida >= standart && gida >= agir ? 'Gıda' : 
                               standart >= agir ? 'Standart' : 'Ağır'
              
              if (maxSector === 'Gıda' && gida >= 80) {
                recommendation = 'Soğuk zincir depolama kapasitesi yüksek olmalı. Frigo depo açılması önerilir.'
                priority = 'yüksek'
              } else if (maxSector === 'Ağır' && agir >= 60) {
                recommendation = 'Ağır yük depolama alanı gereksinimi var. Büyük kapasiteli depo açılması önerilir.'
                priority = 'yüksek'
              } else if (maxSector === 'Standart' && standart >= 60) {
                recommendation = 'Standart depo kapasitesi artırılmalı. Orta ölçekli depo açılması önerilir.'
                priority = 'orta'
              } else {
                recommendation = 'Bölgenin taşıma yoğunluğuna göre depo açılması değerlendirilmeli.'
                priority = 'düşük'
              }
            } else {
              recommendation = 'Bölge için depo açılması değerlendirilmeli.'
              priority = 'düşük'
            }
            
            return {
              text: `Bu bölge için yeterli depo verisi bulunmuyor. ${recommendation}`,
              warning: priority === 'yüksek'
            }
          }
          
          return {
            text: 'Bu bölge için yeterli depo verisi bulunmuyor.',
            warning: false
          }
        }
        
        const occupancy = typeof value === 'number' ? value : parseFloat(value) || 0
        
        if (occupancy >= 85 && occupancy <= 95) {
          return {
            text: 'Depo doluluk oranı kritik seviyede. Optimizasyon veya ek kapasite planlaması gerekli.',
            warning: true
          }
        } else if (occupancy >= 70 && occupancy < 85) {
          return {
            text: 'Depo doluluk oranı dengeli. Mevcut kapasite kısa vadede yeterli.',
            warning: false
          }
        } else if (occupancy < 50) {
          return {
            text: 'Depo kapasitesi yeterli ancak alan verimliliği düşük olabilir.',
            warning: false
          }
        } else {
          // 50-70 arası veya 95+ için genel mesaj
          if (occupancy >= 70) {
            return {
              text: 'Depo doluluk oranı dengeli. Mevcut kapasite kısa vadede yeterli.',
              warning: false
            }
          } else {
            return {
              text: 'Depo kapasitesi yeterli ancak alan verimliliği düşük olabilir.',
              warning: false
            }
          }
        }
      }
      
      default:
        return {
          text: 'Veri analizi yapılıyor...',
          warning: false
        }
    }
  }

  // Tüm bölgeleri seçme fonksiyonu
  const handleSelectAllRegions = () => {
    const newState = !showAllRegions
    setShowAllRegions(newState)
    if (newState) {
      setSelectedMapRegion(null)
      // Tüm path'leri morumsu yap
      if (svgRef.current && colorPathsRef.current) {
        Object.values(colorPathsRef.current).forEach(pathArray => {
          if (Array.isArray(pathArray)) {
            pathArray.forEach(path => {
              if (path) {
                path.style.fill = '#7c3aed'
                path.style.opacity = '1'
                path.style.filter = 'brightness(1.1) drop-shadow(0 0 10px rgba(124, 58, 237, 0.7))'
                path.style.stroke = '#000000'
                path.style.strokeWidth = '2'
              }
            })
          }
        })
      }
    } else {
      // Tüm path'leri varsayılan renge döndür
      if (svgRef.current && colorPathsRef.current) {
        Object.values(colorPathsRef.current).forEach(pathArray => {
          if (Array.isArray(pathArray)) {
            pathArray.forEach(path => {
              if (path) {
                path.style.fill = '#475569'
                path.style.opacity = '1'
                path.style.filter = 'none'
                path.style.stroke = '#000000'
                path.style.strokeWidth = '1.5'
              }
            })
          }
        })
      }
    }
  }

  // Mock data - Yıllara göre yedek parça alımları
  const mockSparePartsByYear = {
    2020: [
      { category: 'Motor', quantity: 450, value: 125000 },
      { category: 'Fren', quantity: 320, value: 384000 },
      { category: 'Lastik', quantity: 180, value: 630000 },
      { category: 'Elektrik', quantity: 250, value: 450000 },
      { category: 'Süspansiyon', quantity: 150, value: 142500 }
    ],
    2021: [
      { category: 'Motor', quantity: 520, value: 145000 },
      { category: 'Fren', quantity: 380, value: 456000 },
      { category: 'Lastik', quantity: 210, value: 735000 },
      { category: 'Elektrik', quantity: 290, value: 522000 },
      { category: 'Süspansiyon', quantity: 180, value: 171000 }
    ],
    2022: [
      { category: 'Motor', quantity: 580, value: 162000 },
      { category: 'Fren', quantity: 420, value: 504000 },
      { category: 'Lastik', quantity: 240, value: 840000 },
      { category: 'Elektrik', quantity: 330, value: 594000 },
      { category: 'Süspansiyon', quantity: 210, value: 199500 }
    ],
    2023: [
      { category: 'Motor', quantity: 650, value: 182000 },
      { category: 'Fren', quantity: 480, value: 576000 },
      { category: 'Lastik', quantity: 280, value: 980000 },
      { category: 'Elektrik', quantity: 380, value: 684000 },
      { category: 'Süspansiyon', quantity: 240, value: 228000 }
    ],
    2024: [
      { category: 'Motor', quantity: 720, value: 201600 },
      { category: 'Fren', quantity: 550, value: 660000 },
      { category: 'Lastik', quantity: 320, value: 1120000 },
      { category: 'Elektrik', quantity: 430, value: 774000 },
      { category: 'Süspansiyon', quantity: 280, value: 266000 }
    ]
  }

  const COLORS = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#00f2fe', '#43e97b', '#fa709a']

  // Anlık verileri yükle
  const loadCurrentData = async () => {
    try {
      setCurrentDataLoading(true)
      const timestamp = new Date().getTime()
      const [routesRes, vehiclesRes, sparePartsRes, driversRes, warehousesRes] = await Promise.all([
        fetch(`/api/routes?_t=${timestamp}`, { cache: 'no-store', headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache', 'Expires': '0' } }).catch(() => ({ json: () => ({ data: [] }) })),
        fetch(`/api/vehicles?_t=${timestamp}`, { cache: 'no-store', headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache', 'Expires': '0' } }).catch(() => ({ json: () => ({ data: [] }) })),
        fetch(`/api/spare-parts?_t=${timestamp}`, { cache: 'no-store', headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache', 'Expires': '0' } }).catch(() => ({ json: () => ({ data: [] }) })),
        fetch(`/api/drivers?_t=${timestamp}`, { cache: 'no-store', headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache', 'Expires': '0' } }).catch(() => ({ json: () => ({ data: [] }) })),
        fetch(`/api/warehouses?_t=${timestamp}`, { cache: 'no-store', headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache', 'Expires': '0' } }).catch(() => ({ json: () => ({ data: [] }) }))
      ])
      
      const routesData = await routesRes.json()
      const vehiclesData = await vehiclesRes.json()
      const sparePartsData = await sparePartsRes.json()
      const driversData = await driversRes.json()
      const warehousesData = await warehousesRes.json()
      
      setCurrentRoutes(routesData.data || routesData || [])
      setCurrentVehicles(vehiclesData.data || vehiclesData || [])
      setCurrentSpareParts(sparePartsData.data || sparePartsData || [])
      setCurrentDrivers(driversData.data || driversData || [])
      setCurrentWarehouses(warehousesData.data || warehousesData || [])
    } catch (err) {
      console.error('Anlık veri yükleme hatası:', err)
    } finally {
      setCurrentDataLoading(false)
    }
  }

  useEffect(() => {
    loadCurrentData()
    
    // Her 5 saniyede bir otomatik yenile
    const interval = setInterval(() => {
      loadCurrentData()
    }, 5000)
    
    // Tab'a geri dönüldüğünde yenile
    const handleFocus = () => {
      loadCurrentData()
    }
    window.addEventListener('focus', handleFocus)
    
    return () => {
      clearInterval(interval)
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  // Yıl seçildiğinde geçmiş verileri yükle
  useEffect(() => {
    setLoading(true)
    setTimeout(() => {
      // Sadece mevcut mock data yılları için veri yükle
      if (mockRoutesByYear[selectedYear]) {
        setRoutesData(mockRoutesByYear[selectedYear] || [])
        setSparePartsData(mockSparePartsByYear[selectedYear] || [])
        setSectorData(mockSectorDemandByYear[selectedYear] || [])
      } else {
        // KDS yılları için boş array
        setRoutesData([])
        setSparePartsData([])
        setSectorData([])
      }
      setLoading(false)
    }, 300)
  }, [selectedYear])

  // Anlık verilerden hesaplamalar
  const currentTotalRoutes = currentRoutes.length
  const currentTotalDistance = currentRoutes.reduce((sum, r) => sum + (Number(r.distance_km) || 0), 0)
  const currentTotalVehicles = currentVehicles.length
  const currentActiveVehicles = currentVehicles.filter(v => v.status === 'active').length
  const currentTotalDrivers = currentDrivers.length
  const currentTotalSpareParts = currentSpareParts.length
  const currentSparePartsValue = currentSpareParts.reduce((sum, p) => {
    const stock = Number(p.stock) || 0
    const price = Number(p.unit_price) || 0
    return sum + (stock * price)
  }, 0)
  const currentLowStockParts = currentSpareParts.filter(p => {
    const stock = Number(p.stock) || 0
    const minStock = Number(p.min_stock) || 0
    return stock <= minStock
  }).length
  const currentTotalWarehouses = currentWarehouses.length
  const currentWarehouseCapacity = 15500 // Toplam depo kapasitesi
  const currentWarehouseUsed = 11715 // Kullanılan depo alanı
  const currentWarehouseUtilization = 73 // Depo doluluk oranı %73 olarak sabitlendi
  
  // Çekici ve Dorse sayıları
  // Eğer API'den veri gelmiyorsa mock değerler kullan
  const currentCekiCount = currentVehicles.length > 0 
    ? currentVehicles.filter(v => {
        const type = (v.type || v.vehicle_type || '').toLowerCase()
        return type === 'ceki' || type === 'çekici' || type === 'tractor' || type === 'truck'
      }).length
    : 88 // Mock değer: 88 Çekici
  const currentDorseCount = currentVehicles.length > 0
    ? currentVehicles.filter(v => {
        const type = (v.type || v.vehicle_type || '').toLowerCase()
        return type === 'dorse' || type === 'trailer' || type === 'dorse'
      }).length
    : 99 // Mock değer: 99 Dorse

  // Filo-Depo Analizi: Filo arttığında depo kapasitesi de artmalı
  // Her araç için ortalama 50 m² depo alanı gereksinimi varsayıyoruz
  const getFleetWarehouseAnalysis = (year) => {
    const fleetData = getFleetStatus(year)
    const warehouseData = getWarehouseUsage(year)
    
    // Toplam depo kapasitesi
    const totalWarehouseCapacity = warehouseData.reduce((sum, w) => sum + w.totalCapacity, 0)
    const totalWarehouseUsed = warehouseData.reduce((sum, w) => sum + w.usedCapacity, 0)
    
    // Filo başına gereken depo alanı (m²/araç)
    const warehousePerVehicle = 50
    const requiredWarehouseForFleet = fleetData.activeVehicles * warehousePerVehicle
    const requiredWarehouseForRequiredFleet = fleetData.requiredVehicles * warehousePerVehicle
    
    // Mevcut depo kapasitesi yeterli mi?
    const warehouseGap = requiredWarehouseForRequiredFleet - totalWarehouseCapacity
    const warehouseUtilization = totalWarehouseCapacity > 0 ? (totalWarehouseUsed / totalWarehouseCapacity) * 100 : 0
    
    return {
      ...fleetData,
      totalWarehouseCapacity: Math.round(totalWarehouseCapacity),
      totalWarehouseUsed: Math.round(totalWarehouseUsed),
      requiredWarehouseForFleet: Math.round(requiredWarehouseForFleet),
      requiredWarehouseForRequiredFleet: Math.round(requiredWarehouseForRequiredFleet),
      warehouseGap: Math.round(warehouseGap),
      warehouseUtilization: Math.round(warehouseUtilization)
    }
  }

  // Bölgelere göre rota dağılımı (anlık)
  const currentRoutesByRegion = currentRoutes.reduce((acc, route) => {
    const region = route.start_city || 'Bilinmeyen'
    if (!acc[region]) {
      acc[region] = { region, count: 0, distance: 0 }
    }
    acc[region].count++
    acc[region].distance += Number(route.distance_km) || 0
    return acc
  }, {})
  const currentRoutesByRegionArray = Object.values(currentRoutesByRegion)

  // Yedek parça kategorilere göre dağılım (anlık)
  const currentSparePartsByCategory = currentSpareParts.reduce((acc, part) => {
    const category = part.category || 'Diğer'
    if (!acc[category]) {
      acc[category] = { category, quantity: 0, value: 0 }
    }
    const stock = Number(part.stock) || 0
    const price = Number(part.unit_price) || 0
    acc[category].quantity += stock
    acc[category].value += (stock * price)
    return acc
  }, {})
  const currentSparePartsByCategoryArray = Object.values(currentSparePartsByCategory)

  // Geçmiş verilerden hesaplamalar (yıl seçildiğinde)
  const totalRoutes = routesData.reduce((sum, r) => sum + r.count, 0)
  const totalDistance = routesData.reduce((sum, r) => sum + r.distance, 0)
  const totalSparePartsValue = sparePartsData.reduce((sum, p) => sum + p.value, 0)
  const totalSparePartsQuantity = sparePartsData.reduce((sum, p) => sum + p.quantity, 0)
  
  // Radar grafiği için sektör verisi hazırlama
  const radarChartYear = localYearRadarChart || selectedYear
  
  // Yıla göre renk paleti
  const getYearColor = (year) => {
    const colorMap = {
      2020: '#3b82f6', // Mavi
      2021: '#9B59B6', // Mor
      2022: '#2ECC71', // Yeşil
      2023: '#f59e0b', // Turuncu
      2024: '#FF4D4D', // Kırmızı
      2025: '#ec4899'  // Pembe
    }
    return colorMap[year] || '#9B59B6'
  }
  
  const radarChartData = mockSectorDemandByYear[radarChartYear] 
    ? mockSectorDemandByYear[radarChartYear].map(item => ({
        sector: item.sector,
        demand: item.demand,
        fullMark: Math.max(...(mockSectorDemandByYear[radarChartYear] || []).map(s => s.demand)) * 1.2 // Max değerin %120'si
      }))
    : []
  
  const radarChartColor = getYearColor(radarChartYear)

  // Bölge isimleri ve id'leri
  const regionMap = {
    'Marmara': 'marmara',
    'Ege': 'ege',
    'Akdeniz': 'akdeniz',
    'İç Anadolu': 'ic-anadolu',
    'Karadeniz': 'karadeniz',
    'Doğu Anadolu': 'dogu-anadolu',
    'Güneydoğu Anadolu': 'guneydogu-anadolu'
  }

  // Renk-bölge eşleştirmesi
  const colorToRegionMap = {
    'st6': 'Marmara',
    'st7': 'Ege',
    'st5': 'Akdeniz',
    'st1': 'Güneydoğu Anadolu',
    'st3': 'Doğu Anadolu',
    'st4': 'Karadeniz',
    'st2': 'İç Anadolu'
  }

  // SVG dosyasını yükle
  useEffect(() => {
    const loadSVG = async () => {
      try {
        const response = await fetch('/TR-BOLGE.svg')
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const text = await response.text()
        let svgText = text
        
        // Eğer HTML içinde SVG varsa, sadece SVG kısmını al
        if (text.includes('<!DOCTYPE') || text.includes('<html')) {
          const svgMatch = text.match(/<svg[\s\S]*?<\/svg>/i)
          if (svgMatch) {
            svgText = svgMatch[0]
          } else {
            console.error('SVG içeriği HTML içinde bulunamadı')
            return
          }
        }
        
        if (svgText && svgText.trim().startsWith('<svg')) {
          // Text elementlerini kaldır
          svgText = svgText.replace(/<text[\s\S]*?<\/text>/gi, '')
          svgText = svgText.replace(/<tspan[\s\S]*?<\/tspan>/gi, '')
          
          setSvgContent(svgText)
          console.log('SVG başarıyla yüklendi, uzunluk:', svgText.length)
        } else {
          console.error('SVG içeriği geçersiz:', svgText.substring(0, 100))
        }
      } catch (error) {
        console.error('SVG yükleme hatası:', error)
      }
    }
    
    loadSVG()
  }, [])

  // SVG yüklendikten sonra bölgeleri interaktif yap
  useEffect(() => {
    if (!svgContent) {
      return
    }

    let timeoutId = null
    let retryCount = 0
    const maxRetries = 10
    let isCancelled = false

    // SVG içeriği hazır olduğunda render et
    const renderSVG = () => {
      if (isCancelled) return
      
      const svgContainer = svgRef.current
      if (!svgContainer) {
        retryCount++
        if (retryCount < maxRetries) {
          timeoutId = setTimeout(renderSVG, 100)
        } else {
          console.error('svgContainer bulunamadı, maksimum deneme sayısına ulaşıldı')
        }
        return
      }

      try {
        console.log('SVG içeriği render ediliyor...')
        svgContainer.innerHTML = svgContent

        const svg = svgContainer.querySelector('svg')
        if (!svg) {
          console.error('SVG elementi bulunamadı')
          return
        }

        console.log('SVG elementi bulundu, path sayısı:', svg.querySelectorAll('path').length)

        svg.style.width = '100%'
        svg.style.height = 'auto'
        svg.style.maxHeight = '600px'
        svg.style.display = 'block'
        svg.style.maxWidth = '100%'
        svg.style.visibility = 'visible'
        svg.style.opacity = '1'
        svg.style.position = 'relative'
        svg.style.zIndex = '1'
        svg.style.overflow = 'hidden'
        svg.setAttribute('preserveAspectRatio', 'xMidYMid meet')
        
        // Container'ı da görünür yap
        svgContainer.style.visibility = 'visible'
        svgContainer.style.display = 'block'
        svgContainer.style.opacity = '1'
        svgContainer.style.overflow = 'hidden'

        const texts = svg.querySelectorAll('text')
        texts.forEach(text => {
          text.style.display = 'none'
          text.style.visibility = 'hidden'
          text.style.pointerEvents = 'none'
        })
        
        // Ayrıca tspan elementlerini de gizle
        const tspans = svg.querySelectorAll('tspan')
        tspans.forEach(tspan => {
          tspan.style.display = 'none'
          tspan.style.visibility = 'hidden'
        })

        const paths = svg.querySelectorAll('path')
        const colorPaths = {}
        const eventListeners = [] // Event listener'ları sakla

        // Önce tüm path'leri görünür yap ve başlangıç stillerini ayarla
        paths.forEach(path => {
          // SVG'nin orijinal fill rengini koru, eğer yoksa varsayılan renk ver
          const originalFill = path.getAttribute('fill') || path.style.fill
          if (!originalFill || originalFill === 'none' || originalFill === '') {
            path.setAttribute('fill', '#475569')
            path.style.fill = '#475569'
          } else {
            path.setAttribute('fill', originalFill)
            path.style.fill = originalFill
          }
          path.setAttribute('opacity', '1')
          path.style.opacity = '1'
          path.style.cursor = 'pointer'
          path.style.transition = 'all 0.3s ease'
          path.style.visibility = 'visible'
          path.style.display = 'block'
          // Her bölgenin etrafına siyah border ekle
          path.style.stroke = '#000000'
          path.style.strokeWidth = '1.5'
          path.style.strokeLinejoin = 'round'
          path.style.strokeLinecap = 'round'
        })

        paths.forEach(path => {
          const className = path.getAttribute('class') || ''
          const colorClassMatch = className.match(/st\d+/)
          if (colorClassMatch) {
            const colorClass = colorClassMatch[0]
            if (!colorPaths[colorClass]) {
              colorPaths[colorClass] = []
            }
            colorPaths[colorClass].push(path)
          }
        })

        // Tüm path'lere event listener ekle
        paths.forEach(path => {
          const colorClass = (path.getAttribute('class') || '').match(/st\d+/)?.[0]
          if (!colorClass) return

          // Bölge adını bul (colorToRegionMap'te varsa)
          const regionName = colorToRegionMap[colorClass] || null
          
          // Aynı colorClass'a sahip tüm path'leri al (bölge + iller)
          const relatedPaths = colorPaths[colorClass] || [path]

          const mouseEnterHandler = () => {
            const currentSelected = selectedMapRegion
            if (regionName) {
              setHoveredMapRegion(regionName)
            }
            
            // Eğer "Tüm Bölgeler" seçiliyse, tüm ilgili path'leri kabart ve daha belirgin yap (ama mor kal)
            if (showAllRegions) {
              relatedPaths.forEach(p => {
                p.style.fill = '#8b5cf6' // Biraz daha açık mor
                p.style.opacity = '1'
                p.style.filter = 'brightness(1.4) drop-shadow(0 0 20px rgba(139, 92, 246, 1)) drop-shadow(0 0 30px rgba(139, 92, 246, 0.8))'
                p.style.stroke = '#ffffff'
                p.style.strokeWidth = '3.5'
                p.style.strokeLinejoin = 'round'
                p.style.strokeLinecap = 'round'
              })
              return
            }
            
            // Eğer bu bölge zaten seçiliyse, hover rengini uygulama
            if (regionName && currentSelected === regionName) {
              return
            }
            
            // Normal hover rengi - açık mavi/turkuaz (sadece bölge path'leri için)
            if (regionName) {
              relatedPaths.forEach(p => {
                p.style.fill = '#3b82f6'
                p.style.opacity = '1'
                p.style.filter = 'brightness(1.2) drop-shadow(0 0 8px rgba(59, 130, 246, 0.6))'
                p.style.stroke = '#000000'
                p.style.strokeWidth = '2'
              })
            }
          }

          const mouseLeaveHandler = () => {
            const currentSelected = selectedMapRegion
            if (regionName) {
              setHoveredMapRegion(null)
            }
            
            // Eğer "Tüm Bölgeler" seçiliyse, normal mor rengine dön
            if (showAllRegions) {
              relatedPaths.forEach(p => {
                p.style.fill = '#7c3aed'
                p.style.opacity = '1'
                p.style.filter = 'brightness(1.1) drop-shadow(0 0 10px rgba(124, 58, 237, 0.7))'
                p.style.stroke = '#000000'
                p.style.strokeWidth = '2'
              })
              return
            }
            
            if (regionName && currentSelected !== regionName) {
              relatedPaths.forEach(p => {
                p.style.fill = currentSelected === regionName ? '#7c3aed' : '#475569'
                p.style.opacity = '1'
                p.style.filter = currentSelected === regionName ? 'brightness(1.1) drop-shadow(0 0 10px rgba(124, 58, 237, 0.7))' : 'none'
                p.style.stroke = '#000000'
                p.style.strokeWidth = currentSelected === regionName ? '2' : '1.5'
              })
            }
          }

          const clickHandler = () => {
            if (!regionName) return
            
            const currentSelected = selectedMapRegion
            const newSelected = currentSelected === regionName ? null : regionName
            setSelectedMapRegion(newSelected)
            setShowAllRegions(false) // Bölge seçildiğinde "Tüm Bölgeler" modunu kapat
            
            // Tüm path'leri güncelle
            paths.forEach(p => {
              const pColorClass = (p.getAttribute('class') || '').match(/st\d+/)?.[0]
              if (pColorClass && colorToRegionMap[pColorClass]) {
                const pRegionName = colorToRegionMap[pColorClass]
                const pRelatedPaths = colorPaths[pColorClass] || [p]
                
                if (newSelected === pRegionName) {
                  // Seçili bölge - morumsu renk
                  pRelatedPaths.forEach(relatedP => {
                    relatedP.style.fill = '#7c3aed'
                    relatedP.style.opacity = '1'
                    relatedP.style.filter = 'brightness(1.1) drop-shadow(0 0 10px rgba(124, 58, 237, 0.7))'
                    relatedP.style.stroke = '#000000'
                    relatedP.style.strokeWidth = '2'
                  })
                } else {
                  pRelatedPaths.forEach(relatedP => {
                    relatedP.style.fill = '#475569'
                    relatedP.style.opacity = '1'
                    relatedP.style.filter = 'none'
                    relatedP.style.stroke = '#000000'
                    relatedP.style.strokeWidth = '1.5'
                  })
                }
              }
            })
          }

          path.addEventListener('mouseenter', mouseEnterHandler)
          path.addEventListener('mouseleave', mouseLeaveHandler)
          if (regionName) {
            path.addEventListener('click', clickHandler)
          }
          
          eventListeners.push({ path, mouseEnterHandler, mouseLeaveHandler, clickHandler })
        })

      colorPathsRef.current = colorPaths


      // Seçili bölgeyi uygula
      if (showAllRegions) {
        // Tüm bölgeleri morumsu yap
        paths.forEach(path => {
          path.style.fill = '#7c3aed'
          path.style.opacity = '1'
          path.style.filter = 'brightness(1.1) drop-shadow(0 0 10px rgba(124, 58, 237, 0.7))'
          path.style.stroke = '#000000'
          path.style.strokeWidth = '2'
        })
      } else if (selectedMapRegion) {
        paths.forEach(path => {
          const colorClass = (path.getAttribute('class') || '').match(/st\d+/)?.[0]
          if (colorClass && colorToRegionMap[colorClass] === selectedMapRegion) {
            // Seçili bölge - morumsu renk
            path.style.fill = '#7c3aed'
            path.style.opacity = '1'
            path.style.filter = 'brightness(1.1) drop-shadow(0 0 10px rgba(124, 58, 237, 0.7))'
            path.style.stroke = '#000000'
            path.style.strokeWidth = '2'
          } else {
            path.style.fill = '#475569'
            path.style.opacity = '1'
            path.style.filter = 'none'
            path.style.stroke = '#000000'
            path.style.strokeWidth = '1.5'
          }
        })
      } else {
        paths.forEach(path => {
          const originalFill = path.getAttribute('fill') || '#475569'
          path.style.fill = originalFill
          path.style.opacity = '1'
          path.style.filter = 'none'
          path.style.stroke = '#000000'
          path.style.strokeWidth = '1.5'
        })
      }
      } catch (error) {
        console.error('Harita işleme hatası:', error)
      }
    }

    // İlk render'ı başlat
    timeoutId = setTimeout(renderSVG, 50)

    return () => {
      isCancelled = true
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      
      // Event listener'ları temizle
      const svgContainer = svgRef.current
      if (svgContainer) {
        const svg = svgContainer.querySelector('svg')
        if (svg) {
          const paths = svg.querySelectorAll('path')
          paths.forEach(path => {
            // Tüm event listener'ları kaldırmak için clone ve replace
            const newPath = path.cloneNode(true)
            path.parentNode?.replaceChild(newPath, path)
          })
        }
      }
    }
    }, [svgContent, selectedMapRegion, showAllRegions, currentWarehouses])

  // Yıllara göre sektör bazında trend verisi (grafik için)
  const yearlyTrendData = years.filter(year => mockSectorDemandByYear[year]).map((year, index) => {
    const sectorData = mockSectorDemandByYear[year] || []
    const meyveSebze = sectorData.find(s => s.sector === 'Meyve&Sebze')?.demand || 0
    const agirNakliyat = sectorData.find(s => s.sector === 'Ağır Nakliyat')?.demand || 0
    const standartTasimacilik = sectorData.find(s => s.sector === 'Standart Taşımacılık')?.demand || 0
    
    // Önceki yılın değerlerini al
    const prevYear = index > 0 ? years[index - 1] : null
    const prevSectorData = prevYear ? (mockSectorDemandByYear[prevYear] || []) : []
    const prevMeyveSebze = prevYear ? (prevSectorData.find(s => s.sector === 'Meyve&Sebze')?.demand || 0) : 0
    const prevAgirNakliyat = prevYear ? (prevSectorData.find(s => s.sector === 'Ağır Nakliyat')?.demand || 0) : 0
    const prevStandartTasimacilik = prevYear ? (prevSectorData.find(s => s.sector === 'Standart Taşımacılık')?.demand || 0) : 0
    
    // Yüzdesel değişim hesapla
    const calculatePercentageChange = (current, previous) => {
      if (!previous || previous === 0) return null
      return ((current - previous) / previous * 100).toFixed(1)
    }
    
    return {
      year: year.toString(),
      yearNum: year,
      'Meyve&Sebze': meyveSebze,
      'Ağır Nakliyat': agirNakliyat,
      'Standart Taşımacılık': standartTasimacilik,
      'Meyve&Sebze_Change': calculatePercentageChange(meyveSebze, prevMeyveSebze),
      'Ağır Nakliyat_Change': calculatePercentageChange(agirNakliyat, prevAgirNakliyat),
      'Standart Taşımacılık_Change': calculatePercentageChange(standartTasimacilik, prevStandartTasimacilik)
    }
  })

  if (loading) {
    return (
      <div style={{ 
        height: '100vh',
        background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ fontSize: '1rem', color: '#cbd5e1' }}>Yükleniyor...</div>
      </div>
    )
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
      
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '2rem',
        position: 'relative',
        zIndex: 1
      }}>
        <h2 className="card-title" style={{ margin: 0, color: '#ffffff' }}>📊 Genel Bakış</h2>
      </div>

      {/* KPI Kartları - Modern Premium Design */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2.5rem',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Kart 1: 🏭 Depo Yönetimi Kartı */}
        <div 
          onClick={() => handleLossClick('warehouse')}
          style={{
            background: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '16px',
            padding: '1.5rem',
            transition: 'all 0.2s ease',
            cursor: 'pointer',
            position: 'relative',
            zIndex: 1
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(16, 185, 129, 0.3)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = 'none'
          }}
          title="Depo detayları için tıklayın"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.1) 100%)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.25rem'
            }}>
              🏭
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
                Toplam Depo Doluluğu
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ 
                  color: '#10b981', 
                  fontSize: '1.5rem', 
                  fontWeight: '700'
                }}>
                  {currentWarehouseUtilization}%
                </div>
                <div style={{
                  color: '#10b981',
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  ↗️
                </div>
              </div>
            </div>
          </div>
          
          <div style={{
            height: '6px',
            background: 'rgba(16, 185, 129, 0.2)',
            borderRadius: '3px',
            overflow: 'hidden',
            marginBottom: '0.75rem'
          }}>
            <div style={{
              height: '100%',
              width: `${Math.min(Number(currentWarehouseUtilization), 100)}%`,
              background: 'linear-gradient(90deg, #10b981 0%, #34d399 100%)',
              borderRadius: '3px',
              transition: 'width 0.5s ease',
              boxShadow: '0 0 8px rgba(16, 185, 129, 0.5)'
            }} />
          </div>
          
          <div style={{ 
            color: '#64748b', 
            fontSize: '0.7rem', 
            marginBottom: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span>↗️</span>
            <span>Geçen aya göre +%2 artış</span>
          </div>
          
          <div style={{
            padding: '0.75rem',
            background: 'rgba(245, 158, 11, 0.1)',
            borderRadius: '6px',
            border: '1px solid rgba(245, 158, 11, 0.2)'
          }}>
            <div style={{ 
              color: '#f59e0b', 
              fontSize: '0.75rem',
              lineHeight: '1.4'
            }}>
              <span style={{ fontSize: '1rem', marginRight: '0.5rem' }}>💡</span> Genel durum iyi ancak Marmara Bölgesi (%95) kritik sınıra yaklaşıyor. ⚠️
            </div>
          </div>
        </div>

        {/* Kart 2: 🚛 Filo Hazırlık & Operasyon Kartı */}
        <div 
          onClick={() => handleLossClick('fleet')}
          style={{
            background: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: '16px',
            padding: '1.5rem',
            transition: 'all 0.2s ease',
            cursor: 'pointer',
            position: 'relative',
            zIndex: 1
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(245, 158, 11, 0.3)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = 'none'
          }}
          title="Filo detayları için tıklayın"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(217, 119, 6, 0.1) 100%)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.25rem'
            }}>
              🚛
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.25rem' }}>
                Filo Hazırlık Oranı
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ color: '#f1c40f', fontSize: '1.5rem', fontWeight: '700' }}>
                  92%
                </div>
                <div style={{
                  color: '#ef4444',
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  📉
                </div>
              </div>
            </div>
          </div>
          
          <div style={{
            height: '6px',
            background: 'rgba(245, 158, 11, 0.2)',
            borderRadius: '3px',
            overflow: 'hidden',
            marginBottom: '0.75rem'
          }}>
            <div style={{
              height: '100%',
              width: '92%',
              background: 'linear-gradient(90deg, #f1c40f 0%, #f39c12 100%)',
              borderRadius: '3px',
              transition: 'width 0.5s ease',
              boxShadow: '0 0 8px rgba(245, 158, 11, 0.5)'
            }} />
          </div>
          
          <div style={{ 
            color: '#64748b', 
            fontSize: '0.7rem', 
            marginBottom: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span>📉</span>
            <span>Bakım maliyetleri artışta</span>
          </div>
          
          <div style={{
            padding: '0.75rem',
            background: 'rgba(239, 68, 68, 0.1)',
            borderRadius: '6px',
            border: '1px solid rgba(239, 68, 68, 0.2)'
          }}>
            <div style={{ 
              color: '#f87171', 
              fontSize: '0.75rem',
              lineHeight: '1.4'
            }}>
              <span style={{ fontSize: '1rem', marginRight: '0.5rem' }}>💡</span> 10 Çekici bakımda, 1 Frigo Dorse arızalı. Gıda operasyonunda gecikme riski var.
            </div>
          </div>
        </div>

        {/* Kart 3: ⚙️ Yedek Parça & Stok Sağlığı Kartı */}
        <div 
          onClick={() => handleLossClick('spareParts')}
          style={{
            background: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: '16px',
            padding: '1.5rem',
            transition: 'all 0.2s ease',
            cursor: 'pointer',
            position: 'relative',
            zIndex: 1
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(59, 130, 246, 0.3)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = 'none'
          }}
          title="Yedek parça detayları için tıklayın"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(37, 99, 235, 0.1) 100%)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.25rem'
            }}>
              ⚙️
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.25rem' }}>
                Kritik Stok Seviyesi
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ color: '#3498db', fontSize: '1.5rem', fontWeight: '700' }}>
                  Stabil
                </div>
                <div style={{
                  color: '#3498db',
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  ✅
                </div>
              </div>
            </div>
          </div>
          
          <div style={{
            height: '6px',
            background: 'rgba(59, 130, 246, 0.2)',
            borderRadius: '3px',
            overflow: 'hidden',
            marginBottom: '0.75rem'
          }}>
            <div style={{
              height: '100%',
              width: '100%',
              background: 'linear-gradient(90deg, #3498db 0%, #5dade2 100%)',
              borderRadius: '3px',
              transition: 'width 0.5s ease',
              boxShadow: '0 0 8px rgba(59, 130, 246, 0.5)'
            }} />
          </div>
          
          <div style={{ 
            color: '#64748b', 
            fontSize: '0.7rem', 
            marginBottom: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span>📦</span>
            <span>Stok değeri optimal seviyede</span>
          </div>
          
          <div style={{
            padding: '0.75rem',
            background: 'rgba(59, 130, 246, 0.1)',
            borderRadius: '6px',
            border: '1px solid rgba(59, 130, 246, 0.2)'
          }}>
            <div style={{ 
              color: '#60a5fa', 
              fontSize: '0.75rem',
              lineHeight: '1.4'
            }}>
              <span style={{ fontSize: '1rem', marginRight: '0.5rem' }}>💡</span> Genel stok yeterli. Sadece Fren Balatası için 2 hafta içinde sipariş geçilmeli.
            </div>
          </div>
        </div>

        {/* Kart 4: 💰 Finansal Genel Bakış (YENİ) */}
        {(() => {
          const lossData = getLossBySource(selectedYear)
          const totalLoss = (lossData?.fleetCapacityLoss || 0) + 
                          (lossData?.sparePartsLoss || 0) + 
                          (lossData?.warehouseLoss || 0) + 
                          (lossData?.financialLoss || 0)
          const lossPercentage = totalLoss > 0 ? Math.min(40, Math.round((totalLoss / 10000000) * 40)) : 0
          const biggestLoss = lossData?.fleetCapacityLoss || 0
          
          return (
            <div 
              onClick={() => handleLossClick('finance')}
              style={{
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(231, 76, 60, 0.3)',
                borderRadius: '16px',
                padding: '1.5rem',
                transition: 'all 0.2s ease',
                cursor: 'pointer',
                position: 'relative',
                zIndex: 1
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(231, 76, 60, 0.3)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
              title="Finansal detaylar için tıklayın"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, rgba(231, 76, 60, 0.2) 0%, rgba(192, 57, 43, 0.1) 100%)',
                  border: '1px solid rgba(231, 76, 60, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.25rem'
                }}>
                  💰
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.25rem' }}>
                    Operasyonel Verimlilik Kaybı
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ color: '#e74c3c', fontSize: '1.5rem', fontWeight: '700' }}>
                      ₺ {(totalLoss / 1000000).toFixed(2)}M
                    </div>
                    <div style={{
                      color: '#e74c3c',
                      fontSize: '0.9rem',
                      display: 'flex',
                      alignItems: 'center'
                    }}>
                      ⚠️
                    </div>
                  </div>
                </div>
              </div>
              
              <div style={{
                height: '6px',
                background: 'rgba(231, 76, 60, 0.2)',
                borderRadius: '3px',
                overflow: 'hidden',
                marginBottom: '0.75rem'
              }}>
                <div style={{
                  height: '100%',
                  width: `${lossPercentage}%`,
                  background: 'linear-gradient(90deg, #e74c3c 0%, #ec7063 100%)',
                  borderRadius: '3px',
                  transition: 'width 0.5s ease',
                  boxShadow: '0 0 8px rgba(231, 76, 60, 0.5)'
                }} />
              </div>
              
              <div style={{ 
                color: '#64748b', 
                fontSize: '0.7rem', 
                marginBottom: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <span>⚠️</span>
                <span>Hedeflenen bütçenin üzerinde</span>
              </div>
              
              <div style={{
                padding: '0.75rem',
                background: 'rgba(231, 76, 60, 0.1)',
                borderRadius: '6px',
                border: '1px solid rgba(231, 76, 60, 0.2)'
              }}>
                <div style={{ 
                  color: '#f87171', 
                  fontSize: '0.75rem',
                  lineHeight: '1.4'
                }}>
                  <span style={{ fontSize: '1rem', marginRight: '0.5rem' }}>💡</span> En büyük kayıp {biggestLoss.toLocaleString('tr-TR')} ₺ ile 'Filo Kapasite Açığı' kaynaklı. Yatırım şart.
                </div>
              </div>
            </div>
          )
        })()}
      </div>

      {/* Türkiye Haritası ve Bölge Grafiği */}
      <div className="card" style={{ 
        marginBottom: '2rem',
        background: 'rgba(15, 23, 42, 0.8)',
        border: '1px solid rgba(59, 130, 246, 0.2)',
        borderRadius: '16px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
        position: 'relative',
        zIndex: 1
      }}>
        <div className="card-header" style={{ 
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)', 
          padding: '1rem 1.5rem', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center'
        }}>
          <div>
            <h3 className="card-title" style={{ color: '#ffffff', margin: 0, fontSize: '1.25rem' }}>
              🗺️ Türkiye Bölgeler Haritası
            </h3>
            {selectedMapRegion && (
              <p style={{ color: '#cbd5e1', margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>
                Seçili Bölge: <strong style={{ color: '#9333EA' }}>{selectedMapRegion}</strong>
                {currentRoutesByRegionArray.find(r => r.region === selectedMapRegion) && (
                  <span style={{ marginLeft: '1rem', color: '#94a3b8' }}>
                    ({currentRoutesByRegionArray.find(r => r.region === selectedMapRegion).count} rota)
                  </span>
                )}
              </p>
            )}
          </div>
          <button
            onClick={handleSelectAllRegions}
            style={{
              padding: '0.65rem 1.5rem',
              borderRadius: '10px',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              background: showAllRegions 
                ? 'linear-gradient(135deg, #6D28D9 0%, #7C3AED 50%, #8B5CF6 100%)'
                : 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(99, 102, 241, 0.1) 100%)',
              color: showAllRegions ? '#ffffff' : '#60a5fa',
              border: showAllRegions 
                ? '2px solid rgba(109, 40, 217, 0.5)'
                : '2px solid rgba(59, 130, 246, 0.4)',
              boxShadow: showAllRegions
                ? '0 8px 32px rgba(109, 40, 217, 0.5), 0 0 0 1px rgba(109, 40, 217, 0.2) inset'
                : '0 4px 16px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(59, 130, 246, 0.1)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              position: 'relative',
              overflow: 'hidden',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => {
              if (!showAllRegions) {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(59, 130, 246, 0.25) 0%, rgba(99, 102, 241, 0.2) 100%)'
                e.currentTarget.style.borderColor = '#60a5fa'
                e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)'
                e.currentTarget.style.boxShadow = '0 12px 24px rgba(59, 130, 246, 0.3), 0 4px 8px rgba(59, 130, 246, 0.2)'
                e.currentTarget.style.color = '#93c5fd'
              } else {
                e.currentTarget.style.transform = 'translateY(-2px) scale(1.01)'
                e.currentTarget.style.boxShadow = '0 12px 40px rgba(109, 40, 217, 0.6), 0 0 0 1px rgba(109, 40, 217, 0.3) inset'
              }
            }}
            onMouseLeave={(e) => {
              if (!showAllRegions) {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(99, 102, 241, 0.1) 100%)'
                e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.4)'
                e.currentTarget.style.transform = 'translateY(0) scale(1)'
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(59, 130, 246, 0.1)'
                e.currentTarget.style.color = '#60a5fa'
              } else {
                e.currentTarget.style.transform = 'translateY(0) scale(1)'
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(109, 40, 217, 0.5), 0 0 0 1px rgba(109, 40, 217, 0.2) inset'
              }
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'translateY(1px) scale(0.98)'
            }}
            onMouseUp={(e) => {
              if (showAllRegions) {
                e.currentTarget.style.transform = 'translateY(0) scale(1)'
              } else {
                e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)'
              }
            }}
          >
            <span style={{ 
              fontSize: '1rem',
              display: 'inline-block',
              transition: 'transform 0.3s ease',
              transform: showAllRegions ? 'rotate(360deg)' : 'rotate(0deg)'
            }}>
              🗺️
            </span>
            <span style={{ 
              letterSpacing: '0.3px',
              textShadow: showAllRegions ? '0 2px 4px rgba(0, 0, 0, 0.2)' : 'none'
            }}>
              {showAllRegions ? 'Tüm Bölgeler Seçili' : 'Tüm Bölgeleri Seç'}
            </span>
            {showAllRegions && (
              <span style={{
                marginLeft: '0.4rem',
                fontSize: '0.75rem',
                opacity: 0.9
              }}>
                ✓
              </span>
            )}
          </button>
        </div>
        <div style={{ padding: '1.5rem', display: 'flex', gap: '1.5rem' }}>
          {/* Harita - Sol Taraf */}
          <div style={{ flex: '0 0 45%' }}>
          {!svgContent ? (
            <div style={{ 
              width: '100%', 
              height: '400px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              background: 'rgba(15, 23, 42, 0.5)',
              borderRadius: '8px',
              color: '#94a3b8'
            }}>
              Harita yükleniyor...
            </div>
          ) : (
            <div 
              ref={svgRef}
              style={{
                width: '100%',
                minHeight: '400px',
                height: 'auto',
                  maxHeight: '500px',
                overflow: 'visible',
                background: 'rgba(15, 23, 42, 0.5)',
                borderRadius: '8px',
                padding: '1rem',
                position: 'relative',
                visibility: 'visible',
                display: 'block'
              }}
            />
          )}
      </div>

          {/* Bar Grafiği - Sağ Taraf */}
          <div style={{ flex: '1', minHeight: '400px' }}>
            {selectedMapRegion || showAllRegions ? (
              <div style={{ 
                width: '100%', 
                height: '100%',
                background: 'rgba(15, 23, 42, 0.5)',
                borderRadius: '8px',
                padding: '1.5rem',
                position: 'relative'
              }}>
                <h4 style={{ 
                  color: '#ffffff',
                  margin: '0 0 1rem 0', 
                  fontSize: '1.1rem',
                  fontWeight: '600'
                }}>
                  📊 {showAllRegions ? 'Tüm Bölgeler' : selectedMapRegion} - Sektör Dağılım Analizi
                </h4>
                
                <ResponsiveContainer width="100%" height={350}>
                  <AreaChart 
                    data={showAllRegions 
                      ? getAllRegionsSectorData(null, 'Tümü')
                      : getRegionSectorData(selectedMapRegion, null, 'Tümü')
                    }
                    margin={{ top: 10, right: 30, left: 0, bottom: 50 }}
                  >
                    <defs>
                      {/* Neon Emerald Gradient for Gıda */}
                      <linearGradient id="colorGida" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2ecc71" stopOpacity={0.8}/>
                        <stop offset="100%" stopColor="#2ecc71" stopOpacity={0}/>
                      </linearGradient>
                      {/* Cyber Blue Gradient for Standart */}
                      <linearGradient id="colorStandart" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3498db" stopOpacity={0.8}/>
                        <stop offset="100%" stopColor="#3498db" stopOpacity={0}/>
                      </linearGradient>
                      {/* Hot Red/Orange Gradient for Ağır */}
                      <linearGradient id="colorAgir" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#e74c3c" stopOpacity={0.8}/>
                        <stop offset="100%" stopColor="#e74c3c" stopOpacity={0}/>
                      </linearGradient>
                      {/* Glow filters for neon effect */}
                      <filter id="glowGida">
                        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                        <feMerge>
                          <feMergeNode in="coloredBlur"/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                      <filter id="glowStandart">
                        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                        <feMerge>
                          <feMergeNode in="coloredBlur"/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                      <filter id="glowAgir">
                        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                        <feMerge>
                          <feMergeNode in="coloredBlur"/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" opacity={0.3} />
                    <XAxis 
                      dataKey="year" 
                      stroke="#cbd5e1"
                      style={{ fontSize: '0.85rem' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis 
                      stroke="#cbd5e1"
                      style={{ fontSize: '0.85rem' }}
                      axisLine={false}
                      tickLine={false}
                      label={{ value: 'Toplam Hacim', angle: -90, position: 'insideLeft', style: { fill: '#cbd5e1' } }}
                    />
                    <Tooltip 
                      content={(props) => {
                        const { active, payload } = props
                        if (!active || !payload || !payload.length) return null
                        
                        return (
                          <div style={{
                            background: 'rgba(20, 20, 30, 0.8)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '12px',
                            padding: '1rem',
                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                            color: '#ffffff'
                          }}>
                            <div style={{
                              fontSize: '0.85rem',
                              fontWeight: '600',
                              marginBottom: '0.75rem',
                              color: '#ffffff',
                              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                              paddingBottom: '0.5rem'
                            }}>
                              {payload[0]?.payload?.year || 'Yıl'}
                            </div>
                            {payload.map((entry, index) => {
                              const sectorColors = {
                                'Gıda Nakliyat': '#2ecc71',
                                'Standart Nakliyat': '#3498db',
                                'Ağır Nakliyat': '#e74c3c'
                              }
                              const color = sectorColors[entry.dataKey] || entry.color
                              
                              return (
                                <div key={index} style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  gap: '1rem',
                                  marginBottom: '0.5rem',
                                  fontSize: '0.8rem'
                                }}>
                                  <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                  }}>
                                    <div style={{
                                      width: '10px',
                                      height: '10px',
                                      borderRadius: '50%',
                                      background: color,
                                      boxShadow: `0 0 8px ${color}`
                                    }} />
                                    <span style={{ color: '#cbd5e1' }}>
                                      {entry.dataKey}
                                    </span>
                                  </div>
                                  <span style={{
                                    color: '#ffffff',
                                    fontWeight: '600'
                                  }}>
                                    {entry.value?.toLocaleString('tr-TR') || 0}
                                  </span>
                                </div>
                              )
                            })}
                          </div>
                        )
                      }}
                    />
                    <Legend 
                      wrapperStyle={{ color: '#cbd5e1', fontSize: '0.9rem' }}
                      content={(props) => {
                        const annualRates = {
                          'Gıda Nakliyat': 12.8,
                          'Standart Nakliyat': 14.0,
                          'Ağır Nakliyat': 8.8
                        }
                        
                        const sectorColors = {
                          'Gıda Nakliyat': '#2ecc71',
                          'Standart Nakliyat': '#3498db',
                          'Ağır Nakliyat': '#e74c3c'
                        }
                        
                        const { payload } = props
                        
                        return (
                          <div style={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: '2rem',
                            paddingTop: '10px',
                            flexWrap: 'wrap'
                          }}>
                            {payload && payload.map((entry, index) => {
                              const sectorName = entry.value
                              const rate = annualRates[sectorName] || 0
                              const color = sectorColors[sectorName] || '#cbd5e1'
                              
                              return (
                                <div 
                                  key={`legend-${index}`}
                                  style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '0.25rem'
                                  }}
                                >
                                  <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                  }}>
                                    <div style={{
                                      width: '12px',
                                      height: '12px',
                                      background: color,
                                      borderRadius: '3px',
                                      boxShadow: `0 0 6px ${color}`
                                    }} />
                                    <span style={{
                                      color: '#cbd5e1',
                                      fontSize: '0.9rem',
                                      fontWeight: '500'
                                    }}>
                                      {sectorName === 'Gıda Nakliyat' ? 'Gıda Nakliyat' : 
                                       sectorName === 'Standart Nakliyat' ? 'Standart Nakliyat' : 
                                       'Ağır Nakliyat'}
                                    </span>
                                  </div>
                                  <span style={{
                                    color: color,
                                    fontSize: '0.75rem',
                                    fontWeight: '600',
                                    marginTop: '-2px'
                                  }}>
                                    +{rate.toFixed(1)}% / yıl
                                  </span>
                                </div>
                              )
                            })}
                          </div>
                        )
                      }}
                    />
                    <Area 
                      type="natural" 
                      dataKey="Gıda Nakliyat" 
                      stackId="1" 
                      stroke="#2ecc71" 
                      strokeWidth={3}
                      fill="url(#colorGida)" 
                      isAnimationActive={true}
                      animationDuration={1200}
                      animationEasing="ease-out"
                      style={{ filter: 'drop-shadow(0 0 6px #2ecc71)' }}
                    />
                    <Area 
                      type="natural" 
                      dataKey="Standart Nakliyat" 
                      stackId="1" 
                      stroke="#3498db" 
                      strokeWidth={3}
                      fill="url(#colorStandart)" 
                      isAnimationActive={true}
                      animationDuration={1200}
                      animationEasing="ease-out"
                      style={{ filter: 'drop-shadow(0 0 6px #3498db)' }}
                    />
                    <Area 
                      type="natural" 
                      dataKey="Ağır Nakliyat" 
                      stackId="1" 
                      stroke="#e74c3c" 
                      strokeWidth={3}
                      fill="url(#colorAgir)" 
                      isAnimationActive={true}
                      animationDuration={1200}
                      animationEasing="ease-out"
                      style={{ filter: 'drop-shadow(0 0 6px #e74c3c)' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : null}
          </div>
        </div>
        
        {/* Bölge Bazlı Pasta Grafikleri */}
        <div style={{
          padding: '1rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          background: 'rgba(30, 30, 46, 0.6)',
          marginTop: '0.5rem'
        }}>
          {/* Grafikler Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '1rem',
            transition: 'all 0.5s ease-in-out',
            alignItems: 'stretch',
            marginTop: '0.5rem'
          }}>
          {/* Bölge Bazlı Yedek Parça Kullanımı */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid rgba(139, 92, 246, 0.2)',
            borderRadius: '12px',
            padding: '0.9rem',
            transition: 'all 0.2s ease',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
            display: 'flex',
            flexDirection: 'column',
            minHeight: '480px',
            maxHeight: '480px',
            height: '480px',
            overflow: 'hidden'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(139, 92, 246, 0.3)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.3)'
          }}>
            {(() => {
              const region = selectedMapRegion || (showAllRegions ? 'all' : null)
              const getDominantSector = (region) => {
                if (region === 'all') return null
                const intensity = getRegionSectorIntensity(region)
                const sectors = [
                  { name: 'Gıda Nakliyat', value: intensity['Gıda Nakliyat'] || 0 },
                  { name: 'Standart Nakliyat', value: intensity['Standart Nakliyat'] || 0 },
                  { name: 'Ağır Nakliyat', value: intensity['Ağır Nakliyat'] || 0 }
                ]
                const dominant = sectors.reduce((max, sector) => 
                  sector.value > max.value ? sector : max
                )
                return dominant.value > 0 ? dominant.name : null
              }
              const dominantSector = getDominantSector(region)
              return (
                <>
                  <div style={{
                    marginBottom: '0.75rem',
                    paddingBottom: '0.6rem',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    flexShrink: 0
                  }}>
                    <h4 style={{
                      color: '#ffffff',
                      margin: '0 0 0.5rem 0',
                      fontSize: '1rem',
                      fontWeight: '700',
                      textAlign: 'center',
                      letterSpacing: '0.5px',
                      textShadow: '0 0 10px rgba(139, 92, 246, 0.5)'
                    }}>
                      🔧 Yedek Parça Yoğunluğu
                    </h4>
                    {selectedMapRegion && !showAllRegions && (
                      <div style={{
                        textAlign: 'center',
                        marginTop: '0.5rem',
                        fontSize: '0.85rem',
                        color: '#a78bfa',
                        fontWeight: '600',
                        opacity: 0.9
                      }}>
                        {selectedMapRegion}
                      </div>
                    )}
                    {dominantSector && (
                      <div style={{
                        textAlign: 'center',
                        marginTop: '0.4rem',
                        fontSize: '0.75rem',
                        color: dominantSector === 'Ağır Nakliyat' 
                          ? '#F87171'
                          : dominantSector === 'Gıda Nakliyat'
                          ? '#2DD4BF'
                          : '#818CF8',
                        fontWeight: '500',
                        opacity: 0.85
                      }}>
                        Baskın: {dominantSector}
                      </div>
                    )}
                  </div>
                </>
              )
            })()}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '220px', minHeight: '220px', maxHeight: '220px', position: 'relative' }}>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <defs>
                    <filter id="glowSpareParts">
                      <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                      <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                  </defs>
                <Pie
                  isAnimationActive={true}
                  animationDuration={1000}
                  animationEasing="ease-out"
                  data={(() => {
                    const region = selectedMapRegion || (showAllRegions ? 'all' : null)
                    const calculateSparePartsDistribution = (region) => {
                      if (region === 'all') {
                        return [
                          { name: 'Fren Sistemi', value: 25, color: '#F87171' },
                          { name: 'AntiFreeze', value: 25, color: '#94A3B8' },
                          { name: 'Lastik', value: 25, color: '#FBBF24' },
                          { name: 'Soğutma Sistemi', value: 25, color: '#2DD4BF' }
                        ]
                      }
                      const intensity = getRegionSectorIntensity(region)
                      let gida = intensity['Gıda Nakliyat'] || 0
                      let standart = intensity['Standart Nakliyat'] || 0
                      let agir = intensity['Ağır Nakliyat'] || 0
                      const totalIntensity = gida + standart + agir
                      if (totalIntensity === 0) {
                        return [
                          { name: 'Fren Sistemi', value: 25, color: '#F87171' },
                          { name: 'AntiFreeze', value: 25, color: '#94A3B8' },
                          { name: 'Lastik', value: 25, color: '#FBBF24' },
                          { name: 'Soğutma Sistemi', value: 25, color: '#2DD4BF' }
                        ]
                      }
                      const gidaRatio = gida / totalIntensity
                      const standartRatio = standart / totalIntensity
                      const agirRatio = agir / totalIntensity
                      const equalParts = (gidaRatio + standartRatio) * 25
                      const frenSistemi = equalParts + (agirRatio * 40)
                      const lastik = equalParts + (agirRatio * 40)
                      const antifreeze = equalParts + (agirRatio * 10)
                      const sogutma = equalParts + (agirRatio * 10)
                      const total = frenSistemi + lastik + antifreeze + sogutma
                      const normalizedFren = Math.round((frenSistemi / total) * 100)
                      const normalizedLastik = Math.round((lastik / total) * 100)
                      const normalizedAntifreeze = Math.round((antifreeze / total) * 100)
                      const normalizedSogutma = 100 - normalizedFren - normalizedLastik - normalizedAntifreeze
                      return [
                        { name: 'Fren Sistemi', value: normalizedFren, color: '#F87171' },
                        { name: 'AntiFreeze', value: normalizedAntifreeze, color: '#94A3B8' },
                        { name: 'Lastik', value: normalizedLastik, color: '#FBBF24' },
                        { name: 'Soğutma Sistemi', value: normalizedSogutma, color: '#2DD4BF' }
                      ]
                    }
                    return calculateSparePartsDistribution(region)
                  })()}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={false}
                  outerRadius={70}
                  innerRadius={45}
                  fill="#8884d8"
                  dataKey="value"
                  paddingAngle={5}
                  cornerRadius={50}
                >
                  {(() => {
                    const region = selectedMapRegion || (showAllRegions ? 'all' : null)
                    const calculateSparePartsDistribution = (region) => {
                      if (region === 'all') {
                        return [
                          { name: 'Fren Sistemi', value: 25, color: '#F87171' },
                          { name: 'AntiFreeze', value: 25, color: '#94A3B8' },
                          { name: 'Lastik', value: 25, color: '#FBBF24' },
                          { name: 'Soğutma Sistemi', value: 25, color: '#2DD4BF' }
                        ]
                      }
                      const intensity = getRegionSectorIntensity(region)
                      let gida = intensity['Gıda Nakliyat'] || 0
                      let standart = intensity['Standart Nakliyat'] || 0
                      let agir = intensity['Ağır Nakliyat'] || 0
                      const totalIntensity = gida + standart + agir
                      if (totalIntensity === 0) {
                        return [
                          { name: 'Fren Sistemi', value: 25, color: '#F87171' },
                          { name: 'AntiFreeze', value: 25, color: '#94A3B8' },
                          { name: 'Lastik', value: 25, color: '#FBBF24' },
                          { name: 'Soğutma Sistemi', value: 25, color: '#2DD4BF' }
                        ]
                      }
                      const gidaRatio = gida / totalIntensity
                      const standartRatio = standart / totalIntensity
                      const agirRatio = agir / totalIntensity
                      const equalParts = (gidaRatio + standartRatio) * 25
                      const frenSistemi = equalParts + (agirRatio * 40)
                      const lastik = equalParts + (agirRatio * 40)
                      const antifreeze = equalParts + (agirRatio * 10)
                      const sogutma = equalParts + (agirRatio * 10)
                      const total = frenSistemi + lastik + antifreeze + sogutma
                      const normalizedFren = Math.round((frenSistemi / total) * 100)
                      const normalizedLastik = Math.round((lastik / total) * 100)
                      const normalizedAntifreeze = Math.round((antifreeze / total) * 100)
                      const normalizedSogutma = 100 - normalizedFren - normalizedLastik - normalizedAntifreeze
                      return [
                        { name: 'Fren Sistemi', value: normalizedFren, color: '#F87171' },
                        { name: 'AntiFreeze', value: normalizedAntifreeze, color: '#94A3B8' },
                        { name: 'Lastik', value: normalizedLastik, color: '#FBBF24' },
                        { name: 'Soğutma Sistemi', value: normalizedSogutma, color: '#2DD4BF' }
                      ]
                    }
                    const data = calculateSparePartsDistribution(region)
                    const sorted = [...data].sort((a, b) => b.value - a.value).slice(0, 3)
                    const criticalCount = sorted.filter(item => item.value > 30).length
                    return data.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.color}
                        stroke={entry.color}
                        strokeWidth={2}
                        style={{ filter: 'drop-shadow(0 0 6px ' + entry.color + ')' }}
                      />
                    ))
                  })()}
                </Pie>
                <Label
                  value={(() => {
                    const region = selectedMapRegion || (showAllRegions ? 'all' : null)
                    const calculateSparePartsDistribution = (region) => {
                      if (region === 'all') {
                        return [
                          { name: 'Fren Sistemi', value: 25, color: '#F87171' },
                          { name: 'AntiFreeze', value: 25, color: '#94A3B8' },
                          { name: 'Lastik', value: 25, color: '#FBBF24' },
                          { name: 'Soğutma Sistemi', value: 25, color: '#2DD4BF' }
                        ]
                      }
                      const intensity = getRegionSectorIntensity(region)
                      let gida = intensity['Gıda Nakliyat'] || 0
                      let standart = intensity['Standart Nakliyat'] || 0
                      let agir = intensity['Ağır Nakliyat'] || 0
                      const totalIntensity = gida + standart + agir
                      if (totalIntensity === 0) {
                        return [
                          { name: 'Fren Sistemi', value: 25, color: '#F87171' },
                          { name: 'AntiFreeze', value: 25, color: '#94A3B8' },
                          { name: 'Lastik', value: 25, color: '#FBBF24' },
                          { name: 'Soğutma Sistemi', value: 25, color: '#2DD4BF' }
                        ]
                      }
                      const gidaRatio = gida / totalIntensity
                      const standartRatio = standart / totalIntensity
                      const agirRatio = agir / totalIntensity
                      const equalParts = (gidaRatio + standartRatio) * 25
                      const frenSistemi = equalParts + (agirRatio * 40)
                      const lastik = equalParts + (agirRatio * 40)
                      const antifreeze = equalParts + (agirRatio * 10)
                      const sogutma = equalParts + (agirRatio * 10)
                      const total = frenSistemi + lastik + antifreeze + sogutma
                      const normalizedFren = Math.round((frenSistemi / total) * 100)
                      const normalizedLastik = Math.round((lastik / total) * 100)
                      const normalizedAntifreeze = Math.round((antifreeze / total) * 100)
                      const normalizedSogutma = 100 - normalizedFren - normalizedLastik - normalizedAntifreeze
                      return [
                        { name: 'Fren Sistemi', value: normalizedFren, color: '#F87171' },
                        { name: 'AntiFreeze', value: normalizedAntifreeze, color: '#94A3B8' },
                        { name: 'Lastik', value: normalizedLastik, color: '#FBBF24' },
                        { name: 'Soğutma Sistemi', value: normalizedSogutma, color: '#2DD4BF' }
                      ]
                    }
                    const data = calculateSparePartsDistribution(region)
                    const sorted = [...data].sort((a, b) => b.value - a.value).slice(0, 3)
                    const criticalCount = sorted.filter(item => item.value > 30).length
                    return criticalCount > 0 ? criticalCount.toString() : '0'
                  })()}
                  position="center"
                  offset={-10}
                  style={{ 
                    fontSize: '1.75rem',
                    fontWeight: '700',
                    fill: '#ffffff',
                    textAnchor: 'middle'
                  }}
                />
                <Label
                  value="Kritik"
                  position="center"
                  offset={10}
                  style={{ 
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    fill: '#94a3b8',
                    textAnchor: 'middle'
                  }}
                />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(20, 20, 30, 0.9)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    color: '#ffffff',
                    fontSize: '0.85rem'
                  }}
                  formatter={(value, name, props) => [`${props.payload.name}: ${value}%`, '']}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Custom Compact Legend */}
            <div style={{
              position: 'absolute',
              bottom: '10px',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: '0.75rem',
              fontSize: '0.7rem',
              color: '#94a3b8'
            }}>
              {(() => {
                const region = selectedMapRegion || (showAllRegions ? 'all' : null)
                const calculateSparePartsDistribution = (region) => {
                  if (region === 'all') {
                    return [
                      { name: 'Fren Sistemi', value: 25, color: '#F87171' },
                      { name: 'AntiFreeze', value: 25, color: '#94A3B8' },
                      { name: 'Lastik', value: 25, color: '#FBBF24' },
                      { name: 'Soğutma Sistemi', value: 25, color: '#2DD4BF' }
                    ]
                  }
                  const intensity = getRegionSectorIntensity(region)
                  let gida = intensity['Gıda Nakliyat'] || 0
                  let standart = intensity['Standart Nakliyat'] || 0
                  let agir = intensity['Ağır Nakliyat'] || 0
                  const totalIntensity = gida + standart + agir
                  if (totalIntensity === 0) {
                    return [
                      { name: 'Fren Sistemi', value: 25, color: '#F87171' },
                      { name: 'AntiFreeze', value: 25, color: '#94A3B8' },
                      { name: 'Lastik', value: 25, color: '#FBBF24' },
                      { name: 'Soğutma Sistemi', value: 25, color: '#2DD4BF' }
                    ]
                  }
                  const gidaRatio = gida / totalIntensity
                  const standartRatio = standart / totalIntensity
                  const agirRatio = agir / totalIntensity
                  const equalParts = (gidaRatio + standartRatio) * 25
                  const frenSistemi = equalParts + (agirRatio * 40)
                  const lastik = equalParts + (agirRatio * 40)
                  const antifreeze = equalParts + (agirRatio * 10)
                  const sogutma = equalParts + (agirRatio * 10)
                  const total = frenSistemi + lastik + antifreeze + sogutma
                  const normalizedFren = Math.round((frenSistemi / total) * 100)
                  const normalizedLastik = Math.round((lastik / total) * 100)
                  const normalizedAntifreeze = Math.round((antifreeze / total) * 100)
                  const normalizedSogutma = 100 - normalizedFren - normalizedLastik - normalizedAntifreeze
                  return [
                    { name: 'Fren Sistemi', value: normalizedFren, color: '#F87171' },
                    { name: 'AntiFreeze', value: normalizedAntifreeze, color: '#94A3B8' },
                    { name: 'Lastik', value: normalizedLastik, color: '#FBBF24' },
                    { name: 'Soğutma Sistemi', value: normalizedSogutma, color: '#2DD4BF' }
                  ]
                }
                const data = calculateSparePartsDistribution(region)
                const sorted = [...data].sort((a, b) => b.value - a.value)
                return sorted.map((entry, index) => (
                  <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: entry.color, boxShadow: `0 0 6px ${entry.color}` }} />
                    <span>{entry.name}</span>
                  </div>
                ))
              })()}
            </div>
            </div>
            {/* Mini Bilgi Kutusu - Yedek Parça */}
            {(() => {
              const region = selectedMapRegion || (showAllRegions ? 'all' : null)
              const insight = getInsightText(region, 'spareParts', null)
              return (
                <div style={{
                  marginTop: '0.75rem',
                  padding: '0.6rem 0.9rem',
                  background: insight.warning 
                    ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(217, 119, 6, 0.1) 100%)'
                    : 'rgba(15, 23, 42, 0.6)',
                  border: insight.warning
                    ? '1px solid rgba(245, 158, 11, 0.4)'
                    : '1px solid rgba(139, 92, 246, 0.3)',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.6rem',
                  boxShadow: insight.warning
                    ? '0 2px 8px rgba(245, 158, 11, 0.2)'
                    : '0 2px 8px rgba(139, 92, 246, 0.15)',
                  flexShrink: 0
                }}>
                  <span style={{ fontSize: '0.9rem', marginTop: '0.05rem', flexShrink: 0 }}>ℹ️</span>
                  <p style={{
                    margin: 0,
                    color: '#cbd5e1',
                    fontSize: '0.75rem',
                    lineHeight: '1.4',
                    fontWeight: '500'
                  }}>
                    {insight.text}
                  </p>
                </div>
              )
            })()}
          </div>

          {/* Bölge Bazlı Çekici Kullanımı */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            borderRadius: '12px',
            padding: '0.9rem',
            transition: 'all 0.2s ease',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
            display: 'flex',
            flexDirection: 'column',
            minHeight: '480px',
            maxHeight: '480px',
            height: '480px',
            overflow: 'hidden'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(59, 130, 246, 0.3)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.3)'
          }}>
            <div style={{
              marginBottom: '0.75rem',
              paddingBottom: '0.5rem',
              borderBottom: '1px solid rgba(59, 130, 246, 0.2)'
            }}>
              <h4 style={{
                color: '#ffffff',
                margin: '0 0 0.25rem 0',
                fontSize: '0.9rem',
                fontWeight: '700',
                textAlign: 'center',
                letterSpacing: '0.3px'
              }}>
                🚛 Araç Filosu Dağılımı
              </h4>
              {selectedMapRegion && !showAllRegions && (
                <div style={{
                  textAlign: 'center',
                  marginTop: '0.25rem',
                  fontSize: '0.75rem',
                  color: '#60a5fa',
                  fontWeight: '600',
                  opacity: 0.9
                }}>
                  {selectedMapRegion}
                </div>
              )}
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '220px', minHeight: '220px', maxHeight: '220px', position: 'relative' }}>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <defs>
                    <filter id="glowFleet">
                      <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                      <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                  </defs>
                <Pie
                  isAnimationActive={true}
                  animationDuration={1000}
                  animationEasing="ease-out"
                  data={(() => {
                    const region = selectedMapRegion || (showAllRegions ? 'all' : null)
                    const calculateTractorDistribution = (region) => {
                      if (region === 'all') {
                        return [
                          { name: 'Scania 4x2', value: 45, color: '#3b82f6' },
                          { name: 'Volvo 4x2', value: 35, color: '#06b6d4' },
                          { name: 'Scania 6x4', value: 20, color: '#a855f7' }
                        ]
                      }
                      const intensity = getRegionSectorIntensity(region)
                      let gida = intensity['Gıda Nakliyat'] || 0
                      let standart = intensity['Standart Nakliyat'] || 0
                      let agir = intensity['Ağır Nakliyat'] || 0
                      const totalIntensity = gida + standart + agir
                      if (totalIntensity === 0) {
                        return [
                          { name: 'Scania 4x2', value: 33, color: '#3b82f6' },
                          { name: 'Volvo 4x2', value: 33, color: '#06b6d4' },
                          { name: 'Scania 6x4', value: 34, color: '#a855f7' }
                        ]
                      }
                      const gidaRatio = gida / totalIntensity
                      const standartRatio = standart / totalIntensity
                      const agirRatio = agir / totalIntensity
                      const kirkyak = gidaRatio * 40
                      const fourx2 = (gidaRatio * 60) + (standartRatio * 100)
                      const sixx4 = agirRatio * 100
                      const total = kirkyak + fourx2 + sixx4
                      const normalizedKirkyak = Math.round((kirkyak / total) * 100)
                      const normalizedFourx2 = Math.round((fourx2 / total) * 100)
                      const normalizedSixx4 = 100 - normalizedKirkyak - normalizedFourx2
                      // Map to truck brands: 4x2 -> Scania 4x2 (Blue), Kırkayak -> Volvo 4x2 (Cyan), 6x4 -> Scania 6x4 (Purple)
                      return [
                        { name: 'Scania 4x2', value: normalizedFourx2, color: '#3b82f6' },
                        { name: 'Volvo 4x2', value: normalizedKirkyak, color: '#06b6d4' },
                        { name: 'Scania 6x4', value: normalizedSixx4, color: '#a855f7' }
                      ].filter(item => item.value > 0)
                    }
                    return calculateTractorDistribution(region)
                  })()}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={false}
                  outerRadius={70}
                  innerRadius={45}
                  fill="#8884d8"
                  dataKey="value"
                  paddingAngle={5}
                  cornerRadius={50}
                >
                  {(() => {
                    const region = selectedMapRegion || (showAllRegions ? 'all' : null)
                    const calculateTractorDistribution = (region) => {
                      if (region === 'all') {
                        return [
                          { name: 'Scania 4x2', value: 45, color: '#3b82f6' },
                          { name: 'Volvo 4x2', value: 35, color: '#06b6d4' },
                          { name: 'Scania 6x4', value: 20, color: '#a855f7' }
                        ]
                      }
                      const intensity = getRegionSectorIntensity(region)
                      let gida = intensity['Gıda Nakliyat'] || 0
                      let standart = intensity['Standart Nakliyat'] || 0
                      let agir = intensity['Ağır Nakliyat'] || 0
                      const totalIntensity = gida + standart + agir
                      if (totalIntensity === 0) {
                        return [
                          { name: 'Scania 4x2', value: 45, color: '#3b82f6' },
                          { name: 'Volvo 4x2', value: 35, color: '#06b6d4' },
                          { name: 'Scania 6x4', value: 20, color: '#a855f7' }
                        ]
                      }
                      const gidaRatio = gida / totalIntensity
                      const standartRatio = standart / totalIntensity
                      const agirRatio = agir / totalIntensity
                      const kirkyak = gidaRatio * 40
                      const fourx2 = (gidaRatio * 60) + (standartRatio * 100)
                      const sixx4 = agirRatio * 100
                      const total = kirkyak + fourx2 + sixx4
                      const normalizedKirkyak = Math.round((kirkyak / total) * 100)
                      const normalizedFourx2 = Math.round((fourx2 / total) * 100)
                      const normalizedSixx4 = 100 - normalizedKirkyak - normalizedFourx2
                      return [
                        { name: 'Scania 4x2', value: normalizedFourx2, color: '#3b82f6' },
                        { name: 'Volvo 4x2', value: normalizedKirkyak, color: '#06b6d4' },
                        { name: 'Scania 6x4', value: normalizedSixx4, color: '#a855f7' }
                      ].filter(item => item.value > 0)
                    }
                    const data = calculateTractorDistribution(region)
                    return data.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.color}
                        stroke={entry.color}
                        strokeWidth={2}
                        style={{ filter: 'drop-shadow(0 0 6px ' + entry.color + ')' }}
                      />
                    ))
                  })()}
                </Pie>
                <Label
                  value={(() => {
                    const region = selectedMapRegion || (showAllRegions ? 'all' : null)
                    const calculateTractorDistribution = (region) => {
                      if (region === 'all') {
                        return [
                          { name: 'Scania 4x2', value: 45, color: '#3b82f6' },
                          { name: 'Volvo 4x2', value: 35, color: '#06b6d4' },
                          { name: 'Scania 6x4', value: 20, color: '#a855f7' }
                        ]
                      }
                      const intensity = getRegionSectorIntensity(region)
                      let gida = intensity['Gıda Nakliyat'] || 0
                      let standart = intensity['Standart Nakliyat'] || 0
                      let agir = intensity['Ağır Nakliyat'] || 0
                      const totalIntensity = gida + standart + agir
                      if (totalIntensity === 0) {
                        return [
                          { name: 'Scania 4x2', value: 45, color: '#3b82f6' },
                          { name: 'Volvo 4x2', value: 35, color: '#06b6d4' },
                          { name: 'Scania 6x4', value: 20, color: '#a855f7' }
                        ]
                      }
                      const gidaRatio = gida / totalIntensity
                      const standartRatio = standart / totalIntensity
                      const agirRatio = agir / totalIntensity
                      const kirkyak = gidaRatio * 40
                      const fourx2 = (gidaRatio * 60) + (standartRatio * 100)
                      const sixx4 = agirRatio * 100
                      const total = kirkyak + fourx2 + sixx4
                      const normalizedKirkyak = Math.round((kirkyak / total) * 100)
                      const normalizedFourx2 = Math.round((fourx2 / total) * 100)
                      const normalizedSixx4 = 100 - normalizedKirkyak - normalizedFourx2
                      return [
                        { name: 'Scania 4x2', value: normalizedFourx2, color: '#3b82f6' },
                        { name: 'Volvo 4x2', value: normalizedKirkyak, color: '#06b6d4' },
                        { name: 'Scania 6x4', value: normalizedSixx4, color: '#a855f7' }
                      ].filter(item => item.value > 0)
                    }
                    const data = calculateTractorDistribution(region)
                    const totalVehicles = data.reduce((sum, item) => sum + item.value, 0)
                    return totalVehicles.toString()
                  })()}
                  position="center"
                  offset={-10}
                  style={{ 
                    fontSize: '1.75rem',
                    fontWeight: '700',
                    fill: '#ffffff',
                    textAnchor: 'middle'
                  }}
                />
                <Label
                  value="Aktif"
                  position="center"
                  offset={10}
                  style={{ 
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    fill: '#94a3b8',
                    textAnchor: 'middle'
                  }}
                />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(20, 20, 30, 0.9)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    color: '#ffffff',
                    fontSize: '0.85rem'
                  }}
                  formatter={(value, name, props) => [`${props.payload.name}: ${value}%`, '']}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Custom Compact Legend */}
            <div style={{
              position: 'absolute',
              bottom: '10px',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: '0.75rem',
              fontSize: '0.7rem',
              color: '#94a3b8'
            }}>
              {(() => {
                const region = selectedMapRegion || (showAllRegions ? 'all' : null)
                const calculateTractorDistribution = (region) => {
                  if (region === 'all') {
                    return [
                      { name: 'Scania 4x2', value: 45, color: '#3b82f6' },
                      { name: 'Volvo 4x2', value: 35, color: '#06b6d4' },
                      { name: 'Scania 6x4', value: 20, color: '#a855f7' }
                    ]
                  }
                  const intensity = getRegionSectorIntensity(region)
                  let gida = intensity['Gıda Nakliyat'] || 0
                  let standart = intensity['Standart Nakliyat'] || 0
                  let agir = intensity['Ağır Nakliyat'] || 0
                  const totalIntensity = gida + standart + agir
                  if (totalIntensity === 0) {
                    return [
                      { name: 'Scania 4x2', value: 45, color: '#3b82f6' },
                      { name: 'Volvo 4x2', value: 35, color: '#06b6d4' },
                      { name: 'Scania 6x4', value: 20, color: '#a855f7' }
                    ]
                  }
                  const gidaRatio = gida / totalIntensity
                  const standartRatio = standart / totalIntensity
                  const agirRatio = agir / totalIntensity
                  const kirkyak = gidaRatio * 40
                  const fourx2 = (gidaRatio * 60) + (standartRatio * 100)
                  const sixx4 = agirRatio * 100
                  const total = kirkyak + fourx2 + sixx4
                  const normalizedKirkyak = Math.round((kirkyak / total) * 100)
                  const normalizedFourx2 = Math.round((fourx2 / total) * 100)
                  const normalizedSixx4 = 100 - normalizedKirkyak - normalizedFourx2
                  return [
                      { name: 'Scania 4x2', value: normalizedFourx2, color: '#3b82f6' },
                    { name: 'Volvo 4x2', value: normalizedKirkyak, color: '#06b6d4' },
                    { name: 'Scania 6x4', value: normalizedSixx4, color: '#a855f7' }
                  ].filter(item => item.value > 0)
                }
                const data = calculateTractorDistribution(region)
                return data.map((entry, index) => (
                  <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: entry.color, boxShadow: `0 0 6px ${entry.color}` }} />
                    <span>{entry.name}</span>
                  </div>
                ))
              })()}
            </div>
            </div>
            {/* Mini Bilgi Kutusu - Araç Filosu */}
            {(() => {
              const region = selectedMapRegion || (showAllRegions ? 'all' : null)
              const insight = getInsightText(region, 'fleet', null)
              return (
                <div style={{
                  marginTop: '1rem',
                  padding: '0.75rem 1rem',
                  background: insight.warning 
                    ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(217, 119, 6, 0.1) 100%)'
                    : 'rgba(15, 23, 42, 0.6)',
                  border: insight.warning
                    ? '1px solid rgba(245, 158, 11, 0.4)'
                    : '1px solid rgba(59, 130, 246, 0.3)',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                  boxShadow: insight.warning
                    ? '0 2px 8px rgba(245, 158, 11, 0.2)'
                    : '0 2px 8px rgba(59, 130, 246, 0.15)'
                }}>
                  <span style={{ fontSize: '1rem', marginTop: '0.1rem' }}>ℹ️</span>
                  <p style={{
                    margin: 0,
                    color: '#cbd5e1',
                    fontSize: '0.8rem',
                    lineHeight: '1.5',
                    fontWeight: '500'
                  }}>
                    {insight.text}
                  </p>
                </div>
              )
            })()}
          </div>

          {/* Bölge Bazlı Dorse Kullanımı */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            borderRadius: '12px',
            padding: '0.9rem',
            transition: 'all 0.2s ease',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
            display: 'flex',
            flexDirection: 'column',
            minHeight: '480px',
            maxHeight: '480px',
            height: '480px',
            overflow: 'hidden'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(16, 185, 129, 0.3)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.3)'
          }}>
            <div style={{
              marginBottom: '0.75rem',
              paddingBottom: '0.5rem',
              borderBottom: '1px solid rgba(16, 185, 129, 0.2)'
            }}>
              <h4 style={{
                color: '#ffffff',
                margin: '0 0 0.25rem 0',
                fontSize: '0.9rem',
                fontWeight: '700',
                textAlign: 'center',
                letterSpacing: '0.3px'
              }}>
                📦 Dorse Tipi Dağılımı
              </h4>
              {selectedMapRegion && !showAllRegions && (
                <div style={{
                  textAlign: 'center',
                  marginTop: '0.25rem',
                  fontSize: '0.75rem',
                  color: '#34d399',
                  fontWeight: '600',
                  opacity: 0.9
                }}>
                  {selectedMapRegion}
                </div>
              )}
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '220px', minHeight: '220px', maxHeight: '220px', position: 'relative' }}>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <defs>
                    <filter id="glowTrailer">
                      <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                      <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                  </defs>
                <Pie
                  isAnimationActive={true}
                  animationDuration={1000}
                  animationEasing="ease-out"
                  data={(() => {
                    const region = selectedMapRegion || (showAllRegions ? 'all' : null)
                    const calculateTrailerDistribution = (region) => {
                      if (region === 'all') {
                        return [
                          { name: 'Lowbed', value: 28, color: '#F87171' },
                          { name: 'Frigo', value: 35, color: '#2DD4BF' },
                          { name: 'Standart', value: 37, color: '#818CF8' }
                        ]
                      }
                      const intensity = getRegionSectorIntensity(region)
                      let gida = intensity['Gıda Nakliyat'] || 0
                      let standart = intensity['Standart Nakliyat'] || 0
                      let agir = intensity['Ağır Nakliyat'] || 0
                      const totalIntensity = gida + standart + agir
                      if (totalIntensity === 0) {
                        return [
                          { name: 'Lowbed', value: 33, color: '#F87171' },
                          { name: 'Frigo', value: 33, color: '#2DD4BF' },
                          { name: 'Standart', value: 34, color: '#818CF8' }
                        ]
                      }
                      const gidaRatio = gida / totalIntensity
                      const standartRatio = standart / totalIntensity
                      const agirRatio = agir / totalIntensity
                      const gidaWeight = gida / 100
                      const frigoBonus = gidaWeight > 0.7 ? (gidaWeight - 0.7) * 80 : 0
                      const frigo = (gidaRatio * 60) + frigoBonus
                      const standartPenalty = gidaWeight > 0.7 ? (gidaWeight - 0.7) * 30 : 0
                      const standartTrailer = Math.max(0, (gidaRatio * 40) + (standartRatio * 100) - standartPenalty)
                      const lowbed = agirRatio * 100
                      const total = frigo + standartTrailer + lowbed
                      const normalizedFrigo = Math.round((frigo / total) * 100)
                      const normalizedStandart = Math.round((standartTrailer / total) * 100)
                      const normalizedLowbed = 100 - normalizedFrigo - normalizedStandart
                      return [
                        { name: 'Lowbed', value: normalizedLowbed, color: '#F87171' },
                        { name: 'Frigo', value: normalizedFrigo, color: '#2DD4BF' },
                        { name: 'Standart', value: normalizedStandart, color: '#818CF8' }
                      ]
                    }
                    return calculateTrailerDistribution(region)
                  })()}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={false}
                  outerRadius={70}
                  innerRadius={45}
                  fill="#8884d8"
                  dataKey="value"
                  paddingAngle={5}
                  cornerRadius={50}
                >
                  {(() => {
                    const region = selectedMapRegion || (showAllRegions ? 'all' : null)
                    const calculateTrailerDistribution = (region) => {
                      if (region === 'all') {
                        return [
                          { name: 'Lowbed', value: 28, color: '#F87171' },
                          { name: 'Frigo', value: 35, color: '#2DD4BF' },
                          { name: 'Standart', value: 37, color: '#818CF8' }
                        ]
                      }
                      const intensity = getRegionSectorIntensity(region)
                      let gida = intensity['Gıda Nakliyat'] || 0
                      let standart = intensity['Standart Nakliyat'] || 0
                      let agir = intensity['Ağır Nakliyat'] || 0
                      const totalIntensity = gida + standart + agir
                      if (totalIntensity === 0) {
                        return [
                          { name: 'Lowbed', value: 33, color: '#F87171' },
                          { name: 'Frigo', value: 33, color: '#2DD4BF' },
                          { name: 'Standart', value: 34, color: '#818CF8' }
                        ]
                      }
                      const gidaRatio = gida / totalIntensity
                      const standartRatio = standart / totalIntensity
                      const agirRatio = agir / totalIntensity
                      const gidaWeight = gida / 100
                      const frigoBonus = gidaWeight > 0.7 ? (gidaWeight - 0.7) * 80 : 0
                      const frigo = (gidaRatio * 60) + frigoBonus
                      const standartPenalty = gidaWeight > 0.7 ? (gidaWeight - 0.7) * 30 : 0
                      const standartTrailer = Math.max(0, (gidaRatio * 40) + (standartRatio * 100) - standartPenalty)
                      const lowbed = agirRatio * 100
                      const total = frigo + standartTrailer + lowbed
                      const normalizedFrigo = Math.round((frigo / total) * 100)
                      const normalizedStandart = Math.round((standartTrailer / total) * 100)
                      const normalizedLowbed = 100 - normalizedFrigo - normalizedStandart
                      return [
                        { name: 'Lowbed', value: normalizedLowbed, color: '#F87171' },
                        { name: 'Frigo', value: normalizedFrigo, color: '#2DD4BF' },
                        { name: 'Standart', value: normalizedStandart, color: '#818CF8' }
                      ]
                    }
                    const data = calculateTrailerDistribution(region)
                    return data.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.color}
                        stroke={entry.color}
                        strokeWidth={2}
                        style={{ filter: 'drop-shadow(0 0 6px ' + entry.color + ')' }}
                      />
                    ))
                  })()}
                </Pie>
                <Label
                  value={(() => {
                    const region = selectedMapRegion || (showAllRegions ? 'all' : null)
                    const calculateTrailerDistribution = (region) => {
                      if (region === 'all') {
                        return [
                          { name: 'Lowbed', value: 28, color: '#F87171' },
                          { name: 'Frigo', value: 35, color: '#2DD4BF' },
                          { name: 'Standart', value: 37, color: '#818CF8' }
                        ]
                      }
                      const intensity = getRegionSectorIntensity(region)
                      let gida = intensity['Gıda Nakliyat'] || 0
                      let standart = intensity['Standart Nakliyat'] || 0
                      let agir = intensity['Ağır Nakliyat'] || 0
                      const totalIntensity = gida + standart + agir
                      if (totalIntensity === 0) {
                        return [
                          { name: 'Lowbed', value: 33, color: '#F87171' },
                          { name: 'Frigo', value: 33, color: '#2DD4BF' },
                          { name: 'Standart', value: 34, color: '#818CF8' }
                        ]
                      }
                      const gidaRatio = gida / totalIntensity
                      const standartRatio = standart / totalIntensity
                      const agirRatio = agir / totalIntensity
                      const gidaWeight = gida / 100
                      const frigoBonus = gidaWeight > 0.7 ? (gidaWeight - 0.7) * 80 : 0
                      const frigo = (gidaRatio * 60) + frigoBonus
                      const standartPenalty = gidaWeight > 0.7 ? (gidaWeight - 0.7) * 30 : 0
                      const standartTrailer = Math.max(0, (gidaRatio * 40) + (standartRatio * 100) - standartPenalty)
                      const lowbed = agirRatio * 100
                      const total = frigo + standartTrailer + lowbed
                      const normalizedFrigo = Math.round((frigo / total) * 100)
                      const normalizedStandart = Math.round((standartTrailer / total) * 100)
                      const normalizedLowbed = 100 - normalizedFrigo - normalizedStandart
                      return [
                        { name: 'Lowbed', value: normalizedLowbed, color: '#F87171' },
                        { name: 'Frigo', value: normalizedFrigo, color: '#2DD4BF' },
                        { name: 'Standart', value: normalizedStandart, color: '#818CF8' }
                      ]
                    }
                    const data = calculateTrailerDistribution(region)
                    const utilizationRate = Math.round(data.reduce((sum, item) => sum + (item.value * 0.85), 0))
                    return `%${utilizationRate}`
                  })()}
                  position="center"
                  offset={-10}
                  style={{ 
                    fontSize: '1.75rem',
                    fontWeight: '700',
                    fill: '#ffffff',
                    textAnchor: 'middle'
                  }}
                />
                <Label
                  value="Kullanım"
                  position="center"
                  offset={10}
                  style={{ 
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    fill: '#94a3b8',
                    textAnchor: 'middle'
                  }}
                />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(20, 20, 30, 0.9)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    color: '#ffffff',
                    fontSize: '0.85rem'
                  }}
                  formatter={(value, name, props) => [`${props.payload.name}: ${value}%`, '']}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Custom Compact Legend */}
            <div style={{
              position: 'absolute',
              bottom: '10px',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: '0.75rem',
              fontSize: '0.7rem',
              color: '#94a3b8'
            }}>
              {(() => {
                const region = selectedMapRegion || (showAllRegions ? 'all' : null)
                const calculateTrailerDistribution = (region) => {
                  if (region === 'all') {
                    return [
                      { name: 'Lowbed', value: 28, color: '#F87171' },
                      { name: 'Frigo', value: 35, color: '#2DD4BF' },
                      { name: 'Standart', value: 37, color: '#818CF8' }
                    ]
                  }
                  const intensity = getRegionSectorIntensity(region)
                  let gida = intensity['Gıda Nakliyat'] || 0
                  let standart = intensity['Standart Nakliyat'] || 0
                  let agir = intensity['Ağır Nakliyat'] || 0
                  const totalIntensity = gida + standart + agir
                  if (totalIntensity === 0) {
                    return [
                      { name: 'Lowbed', value: 33, color: '#F87171' },
                      { name: 'Frigo', value: 33, color: '#2DD4BF' },
                      { name: 'Standart', value: 34, color: '#818CF8' }
                    ]
                  }
                  const gidaRatio = gida / totalIntensity
                  const standartRatio = standart / totalIntensity
                  const agirRatio = agir / totalIntensity
                  const gidaWeight = gida / 100
                  const frigoBonus = gidaWeight > 0.7 ? (gidaWeight - 0.7) * 80 : 0
                  const frigo = (gidaRatio * 60) + frigoBonus
                  const standartPenalty = gidaWeight > 0.7 ? (gidaWeight - 0.7) * 30 : 0
                  const standartTrailer = Math.max(0, (gidaRatio * 40) + (standartRatio * 100) - standartPenalty)
                  const lowbed = agirRatio * 100
                  const total = frigo + standartTrailer + lowbed
                  const normalizedFrigo = Math.round((frigo / total) * 100)
                  const normalizedStandart = Math.round((standartTrailer / total) * 100)
                  const normalizedLowbed = 100 - normalizedFrigo - normalizedStandart
                  return [
                    { name: 'Lowbed', value: normalizedLowbed, color: '#F87171' },
                    { name: 'Frigo', value: normalizedFrigo, color: '#2DD4BF' },
                    { name: 'Standart', value: normalizedStandart, color: '#818CF8' }
                  ]
                }
                const data = calculateTrailerDistribution(region)
                return data.map((entry, index) => (
                  <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: entry.color, boxShadow: `0 0 6px ${entry.color}` }} />
                    <span>{entry.name}</span>
                  </div>
                ))
              })()}
            </div>
            </div>
            {/* Mini Bilgi Kutusu - Dorse */}
            {(() => {
              const region = selectedMapRegion || (showAllRegions ? 'all' : null)
              const insight = getInsightText(region, 'trailer', null)
              return (
                <div style={{
                  marginTop: '1rem',
                  padding: '0.75rem 1rem',
                  background: insight.warning 
                    ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(217, 119, 6, 0.1) 100%)'
                    : 'rgba(15, 23, 42, 0.6)',
                  border: insight.warning
                    ? '1px solid rgba(245, 158, 11, 0.4)'
                    : '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                  boxShadow: insight.warning
                    ? '0 2px 8px rgba(245, 158, 11, 0.2)'
                    : '0 2px 8px rgba(16, 185, 129, 0.15)'
                }}>
                  <span style={{ fontSize: '1rem', marginTop: '0.1rem' }}>ℹ️</span>
                  <p style={{
                    margin: 0,
                    color: '#cbd5e1',
                    fontSize: '0.8rem',
                    lineHeight: '1.5',
                    fontWeight: '500'
                  }}>
                    {insight.text}
                  </p>
                </div>
              )
            })()}
          </div>

          {/* Bölge Bazlı Depo Doluluk Oranları */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid rgba(251, 191, 36, 0.2)',
            borderRadius: '12px',
            padding: '0.9rem',
            transition: 'all 0.2s ease',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
            display: 'flex',
            flexDirection: 'column',
            minHeight: '480px',
            maxHeight: '480px',
            height: '480px',
            overflow: 'hidden'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(251, 191, 36, 0.3)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.3)'
          }}>
            <div style={{
              marginBottom: '0.75rem',
              paddingBottom: '0.5rem',
              borderBottom: '1px solid rgba(251, 191, 36, 0.2)'
            }}>
              <h4 style={{
                color: '#ffffff',
                margin: '0 0 0.25rem 0',
                fontSize: '0.9rem',
                fontWeight: '700',
                textAlign: 'center',
                letterSpacing: '0.3px'
              }}>
                🏭 Depo Doluluk Oranı
              </h4>
              {selectedMapRegion && !showAllRegions && (
                <div style={{
                  textAlign: 'center',
                  marginTop: '0.25rem',
                  fontSize: '0.75rem',
                  color: '#fbbf24',
                  fontWeight: '600',
                  opacity: 0.9
                }}>
                  {selectedMapRegion}
                </div>
              )}
            </div>
            <div style={{ position: 'relative', width: '100%', height: '220px', minHeight: '220px', maxHeight: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <defs>
                    <filter id="glowWarehouse">
                      <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                      <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                  </defs>
                  <Pie
                    isAnimationActive={true}
                    animationDuration={1000}
                    animationEasing="ease-out"
                    data={(() => {
                      const region = selectedMapRegion || (showAllRegions ? 'all' : null)
                      const getColor = (value) => {
                        if (value >= 90) return '#ef4444' // Red
                        if (value >= 70) return '#f59e0b' // Yellow
                        return '#10b981' // Green
                      }
                      const warehouses = {
                        'Marmara': 95,
                        'Ege': 76,
                        'Akdeniz': 71,
                        'Doğu Anadolu': 48
                      }
                      let value = 0
                      if (region === 'all') {
                        value = Math.round(Object.values(warehouses).reduce((sum, val) => sum + val, 0) / Object.keys(warehouses).length)
                      } else if (warehouses[region] !== undefined) {
                        value = warehouses[region]
                      }
                      const color = getColor(value)
                      return [
                        { name: 'Dolu', value: value, color: color },
                        { name: 'Boş', value: 100 - value, color: 'rgba(100, 100, 100, 0.2)' }
                      ]
                    })()}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={false}
                    outerRadius={70}
                    innerRadius={45}
                    fill="#8884d8"
                    dataKey="value"
                    paddingAngle={5}
                    cornerRadius={50}
                  >
                    {(() => {
                      const region = selectedMapRegion || (showAllRegions ? 'all' : null)
                      const getColor = (value) => {
                        if (value >= 90) return '#ef4444'
                        if (value >= 70) return '#f59e0b'
                        return '#10b981'
                      }
                      const warehouses = {
                        'Marmara': 95,
                        'Ege': 76,
                        'Akdeniz': 71,
                        'Doğu Anadolu': 48
                      }
                      let value = 0
                      if (region === 'all') {
                        value = Math.round(Object.values(warehouses).reduce((sum, val) => sum + val, 0) / Object.keys(warehouses).length)
                      } else if (warehouses[region] !== undefined) {
                        value = warehouses[region]
                      }
                      const color = getColor(value)
                      return (
                        <>
                          <Cell key="cell-0" fill={color} stroke={color} strokeWidth={2} style={{ filter: 'drop-shadow(0 0 6px ' + color + ')' }} />
                          <Cell key="cell-1" fill="rgba(100, 100, 100, 0.2)" stroke="rgba(100, 100, 100, 0.3)" strokeWidth={2} />
                        </>
                      )
                    })()}
                    <Label
                      value={(() => {
                        const region = selectedMapRegion || (showAllRegions ? 'all' : null)
                        const warehouses = {
                          'Marmara': 95,
                          'Ege': 76,
                          'Akdeniz': 71,
                          'Doğu Anadolu': 48
                        }
                        if (region === 'all') {
                          const avgValue = Math.round(Object.values(warehouses).reduce((sum, val) => sum + val, 0) / Object.keys(warehouses).length)
                          return `${avgValue}%`
                        }
                        if (warehouses[region] !== undefined) {
                          return `${warehouses[region]}%`
                        } else {
                          return 'N/A'
                        }
                      })()}
                      position="center"
                      style={{ 
                        fontSize: '1.75rem',
                        fontWeight: '700',
                        fill: '#ffffff',
                        textAnchor: 'middle'
                      }}
                    />
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(20, 20, 30, 0.9)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '12px',
                      color: '#ffffff',
                      fontSize: '0.85rem'
                    }}
                    formatter={(value, name) => {
                      if (name === 'Dolu') {
                        return [`${value}%`, 'Doluluk Oranı']
                      }
                      return null
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Mini Bilgi Kutusu - Depo Doluluk */}
            {(() => {
              const region = selectedMapRegion || (showAllRegions ? 'all' : null)
              const warehouses = {
                'Marmara': 95,
                'Ege': 76,
                'Akdeniz': 71,
                'Doğu Anadolu': 48
              }
              let occupancyValue = null
              if (region === 'all') {
                occupancyValue = Math.round(Object.values(warehouses).reduce((sum, val) => sum + val, 0) / Object.keys(warehouses).length)
              } else if (warehouses[region] !== undefined) {
                occupancyValue = warehouses[region]
              }
              const insight = getInsightText(region, 'warehouse', occupancyValue)
              return (
                <div style={{
                  marginTop: '1rem',
                  padding: '0.75rem 1rem',
                  background: insight.warning 
                    ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(217, 119, 6, 0.1) 100%)'
                    : 'rgba(15, 23, 42, 0.6)',
                  border: insight.warning
                    ? '1px solid rgba(245, 158, 11, 0.4)'
                    : '1px solid rgba(251, 191, 36, 0.3)',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                  boxShadow: insight.warning
                    ? '0 2px 8px rgba(245, 158, 11, 0.2)'
                    : '0 2px 8px rgba(251, 191, 36, 0.15)'
                }}>
                  <span style={{ fontSize: '1rem', marginTop: '0.1rem' }}>ℹ️</span>
                  <p style={{
                    margin: 0,
                    color: '#cbd5e1',
                    fontSize: '0.8rem',
                    lineHeight: '1.5',
                    fontWeight: '500'
                  }}>
                    {insight.text}
                  </p>
                </div>
              )
            })()}
          </div>
          </div>
        </div>
      </div>


      {/* Anlık Veriler Grafikleri */}
      {!currentDataLoading && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
          {/* Anlık Bölgelere Göre Rota Dağılımı */}
          {currentRoutesByRegionArray.length > 0 && (
            <div className="card" style={{
              background: 'rgba(30, 30, 46, 0.8)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
            }}>
              <div className="card-header" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <h3 className="card-title" style={{ color: '#ffffff' }}>Anlık Bölgelere Göre Rota Dağılımı</h3>
              </div>
              <div style={{ padding: '1.5rem' }}>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={currentRoutesByRegionArray}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                    <XAxis 
                      dataKey="region" 
                      angle={-45} 
                      textAnchor="end" 
                      height={100}
                      stroke="#cbd5e1"
                      tick={{ fill: '#cbd5e1', fontSize: 11 }}
                    />
                    <YAxis 
                      stroke="#cbd5e1"
                      tick={{ fill: '#cbd5e1', fontSize: 12 }}
                    />
                    <Tooltip 
                      contentStyle={{
                        background: 'rgba(30, 30, 46, 0.95)',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                        borderRadius: '8px',
                        color: '#ffffff'
                      }}
                    />
                    <Legend wrapperStyle={{ color: '#cbd5e1' }} />
                    <Bar dataKey="count" fill="#3b82f6" name="Rota Sayısı" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Anlık Yedek Parça Kategori Dağılımı */}
          {currentSparePartsByCategoryArray.length > 0 && (
            <div className="card" style={{
              background: 'rgba(30, 30, 46, 0.8)',
              border: '1px solid rgba(155, 89, 182, 0.2)',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
            }}>
              <div className="card-header" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <h3 className="card-title" style={{ color: '#ffffff' }}>Anlık Yedek Parça Kategori Dağılımı</h3>
              </div>
              <div style={{ padding: '1.5rem' }}>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={currentSparePartsByCategoryArray}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ category, value, percent }) => 
                        `${category}: ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {currentSparePartsByCategoryArray.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{
                        background: 'rgba(30, 30, 46, 0.95)',
                        border: '1px solid rgba(155, 89, 182, 0.3)',
                        borderRadius: '8px',
                        color: '#ffffff'
                      }}
                      formatter={(value) => value.toLocaleString('tr-TR') + ' ₺'}
                    />
                    <Legend wrapperStyle={{ color: '#cbd5e1' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {/* KDS Overview Dashboard Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* CHART 1: Bölge & Parça ilişkisi - Radar Grafiği */}
        <div className="card" style={{
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(10, 14, 26, 0.95) 100%)',
          border: '1px solid rgba(139, 92, 246, 0.25)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(139, 92, 246, 0.1)',
          borderRadius: '16px',
          backdropFilter: 'blur(10px)',
          position: 'relative',
          overflow: 'hidden'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.4)'
          e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(139, 92, 246, 0.2), 0 0 30px rgba(139, 92, 246, 0.15)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.25)'
          e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(139, 92, 246, 0.1)'
        }}>
          <div style={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            right: 0, 
            height: '3px', 
            background: 'linear-gradient(90deg, rgba(139, 92, 246, 0.8) 0%, rgba(59, 130, 246, 0.8) 100%)',
            zIndex: 1
          }}></div>
          <div className="card-header" style={{ 
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)', 
            padding: '1.75rem 1.75rem 1.25rem 1.75rem',
            background: 'linear-gradient(180deg, rgba(139, 92, 246, 0.05) 0%, transparent 100%)',
            marginTop: '3px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '1.5rem', filter: 'drop-shadow(0 0 8px rgba(139, 92, 246, 0.5))' }}>🔗</span>
              <h3 className="card-title" style={{ 
                color: '#ffffff', 
                margin: 0, 
                fontSize: '1.4rem', 
                fontWeight: '700', 
                letterSpacing: '-0.3px',
                textShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
              }}>
                Bölge & Parça İlişkisi
              </h3>
            </div>
            <p style={{ 
              color: 'rgba(203, 213, 225, 0.7)', 
              margin: 0, 
              fontSize: '0.85rem', 
              lineHeight: '1.6',
              paddingLeft: '2.25rem'
            }}>
              Bölge bazında parça tüketim eğilimlerini analiz edin
            </p>
          </div>
          <div style={{ padding: '1.75rem' }}>
            {/* Bölge Seçici */}
            <div style={{ 
              display: 'flex', 
              gap: '0.6rem', 
              marginBottom: '1.75rem',
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              {['Marmara', 'Karadeniz', 'Akdeniz', 'Ege', 'İç Anadolu', 'Doğu Anadolu', 'Güneydoğu Anadolu'].map(region => {
                const regionColors = {
                  'Marmara': '#3b82f6',
                  'Karadeniz': '#10b981',
                  'Akdeniz': '#f59e0b',
                  'Ege': '#f97316',
                  'İç Anadolu': '#8b5cf6',
                  'Doğu Anadolu': '#94a3b8',
                  'Güneydoğu Anadolu': '#ec4899'
                }
                const isSelected = selectedRegionForParts === region
                return (
                  <button
                    key={region}
                    onClick={() => setSelectedRegionForParts(region)}
                    style={{
                      padding: '0.65rem 1.15rem',
                      borderRadius: '10px',
                      border: `1.5px solid ${isSelected ? regionColors[region] : 'rgba(139, 92, 246, 0.3)'}`,
                      background: isSelected 
                        ? `linear-gradient(135deg, ${regionColors[region]}30 0%, ${regionColors[region]}15 100%)` 
                        : 'rgba(15, 23, 42, 0.5)',
                      color: isSelected ? '#ffffff' : 'rgba(203, 213, 225, 0.8)',
                      fontSize: '0.875rem',
                      fontWeight: isSelected ? '600' : '500',
                      cursor: 'pointer',
                      transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: isSelected 
                        ? `0 4px 16px ${regionColors[region]}30, inset 0 1px 0 rgba(255, 255, 255, 0.1)` 
                        : '0 2px 8px rgba(0, 0, 0, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      backdropFilter: 'blur(5px)',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = `linear-gradient(135deg, ${regionColors[region]}20 0%, ${regionColors[region]}10 100%)`
                        e.currentTarget.style.borderColor = `${regionColors[region]}60`
                        e.currentTarget.style.boxShadow = `0 4px 12px ${regionColors[region]}20`
                        e.currentTarget.style.transform = 'translateY(-2px)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = 'rgba(15, 23, 42, 0.5)'
                        e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.3)'
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2)'
                        e.currentTarget.style.transform = 'translateY(0)'
                      }
                    }}
                  >
                    {region}
                  </button>
                )
              })}
            </div>

            {/* Radar Grafiği - Seçili Bölgeye Göre */}
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart 
                data={(() => {
                  const getRegionData = (region) => {
                    if (region === 'Marmara') {
                      return {
                        'Fren Balatası': 75,
                        'Debriyaj': 90,
                        'Soğutma Sistemi': 40,
                        'Lastik': 50,
                        'Süspansiyon': 45
                      }
                    } else if (region === 'Karadeniz') {
                      return {
                        'Fren Balatası': 95,
                        'Debriyaj': 60,
                        'Soğutma Sistemi': 30,
                        'Lastik': 70,
                        'Süspansiyon': 65
                      }
                    } else if (region === 'Akdeniz') {
                      return {
                        'Fren Balatası': 50,
                        'Debriyaj': 45,
                        'Soğutma Sistemi': 95,
                        'Lastik': 60,
                        'Süspansiyon': 50
                      }
                    } else if (region === 'Ege') {
                      return {
                        'Fren Balatası': 55,
                        'Debriyaj': 50,
                        'Soğutma Sistemi': 85,
                        'Lastik': 65,
                        'Süspansiyon': 55
                      }
                    } else if (region === 'İç Anadolu') {
                      return {
                        'Fren Balatası': 60,
                        'Debriyaj': 70,
                        'Soğutma Sistemi': 50,
                        'Lastik': 55,
                        'Süspansiyon': 60
                      }
                    } else if (region === 'Doğu Anadolu') {
                      return {
                        'Fren Balatası': 55,
                        'Debriyaj': 40,
                        'Soğutma Sistemi': 25,
                        'Lastik': 90,
                        'Süspansiyon': 95
                      }
                    } else if (region === 'Güneydoğu Anadolu') {
                      return {
                        'Fren Balatası': 65,
                        'Debriyaj': 55,
                        'Soğutma Sistemi': 80,
                        'Lastik': 75,
                        'Süspansiyon': 70
                      }
                    }
                    return {}
                  }
                  const data = getRegionData(selectedRegionForParts)
                  return Object.keys(data).map(key => ({
                    category: key,
                    value: data[key]
                  }))
                })()}
                margin={{ top: 20, right: 30, bottom: 20, left: 20 }}
              >
                <PolarGrid stroke="rgba(255, 255, 255, 0.1)" />
                  <PolarAngleAxis 
                    dataKey="category" 
                    tick={{ fill: '#cbd5e1', fontSize: 11 }}
                  />
                <PolarRadiusAxis 
                  angle={90} 
                  domain={[0, 100]} 
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                />
                <Radar 
                  name={selectedRegionForParts}
                  dataKey="value"
                    stroke={(() => {
                      const colors = {
                        'Marmara': '#3b82f6',
                        'Karadeniz': '#10b981',
                        'Akdeniz': '#f59e0b',
                        'Ege': '#f97316',
                        'İç Anadolu': '#8b5cf6',
                        'Doğu Anadolu': '#94a3b8',
                        'Güneydoğu Anadolu': '#ec4899'
                      }
                      return colors[selectedRegionForParts] || '#3b82f6'
                    })()}
                    fill={(() => {
                      const colors = {
                        'Marmara': '#3b82f6',
                        'Karadeniz': '#10b981',
                        'Akdeniz': '#f59e0b',
                        'Ege': '#f97316',
                        'İç Anadolu': '#8b5cf6',
                        'Doğu Anadolu': '#94a3b8',
                        'Güneydoğu Anadolu': '#ec4899'
                      }
                      return colors[selectedRegionForParts] || '#3b82f6'
                    })()}
                  fillOpacity={0.4}
                  strokeWidth={3}
                  dot={{ r: 5, fill: '#ffffff', strokeWidth: 2 }}
                  activeDot={{ r: 7 }}
                />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(30, 30, 46, 0.95)',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    borderRadius: '8px',
                    color: '#ffffff'
                  }}
                  formatter={(value) => [`${value}%`, 'Tüketim Oranı']}
                />
              </RadarChart>
            </ResponsiveContainer>

            {/* Alt: Dinamik KDS Kartı */}
            {(() => {
              const regionData = {
                'Marmara': {
                  borderColor: '#3b82f6',
                  problem: 'Baskı Balata & Debriyaj',
                  reason: 'İstanbul merkezli yoğun dur-kalk trafiği ve köprü geçişleri.',
                  recommendation: 'Şanzıman yağı değişim periyodu %20 kısaltılmalı. Otomatik şanzımanlı araçlar bu bölgeye kaydırılmalı.'
                },
                'Karadeniz': {
                  borderColor: '#10b981',
                  problem: 'Fren Sistemi & Balata',
                  reason: 'Dik yamaçlar ve sürekli rampa iniş-çıkışları frenleri aşırı ısıtıyor.',
                  recommendation: 'Balata stoklarında "Heavy Duty (Ağır Hizmet)" serisi bulundurulmalı. Retarder (Hız kesici) kullanımı denetlenmeli.'
                },
                'Akdeniz': {
                  borderColor: '#f59e0b',
                  problem: 'Motor Soğutma & Klima',
                  reason: 'Yüksek hava sıcaklığı (+40°C) ve nem, motor hararet riskini artırıyor. Özellikle Antalya ve Mersin gibi sahil şehirlerinde.',
                  recommendation: 'Antifriz ve radyatör bakımları Mayıs ayında tamamlanmalı. Termokin (Frigo) motorları ekstra kontrolden geçmeli.'
                },
                'Ege': {
                  borderColor: '#f97316',
                  problem: 'Soğutma Sistemi & Motor',
                  reason: 'Yaz aylarında yüksek sıcaklık ve deniz kenarı nemi motor soğutma sistemini zorluyor.',
                  recommendation: 'Radyatör temizliği ve su pompası kontrolü düzenli yapılmalı. Soğutma suyu seviyesi haftalık kontrol edilmeli.'
                },
                'İç Anadolu': {
                  borderColor: '#8b5cf6',
                  problem: 'Debriyaj & Şanzıman',
                  reason: 'Ankara merkezli yoğun şehir içi trafiği ve sık dur-kalk hareketleri debriyaj ve şanzımanı yıpratıyor.',
                  recommendation: 'Debriyaj balata değişim periyodu %15 kısaltılmalı. Şanzıman yağı kontrolü 3 ayda bir yapılmalı.'
                },
                'Doğu Anadolu': {
                  borderColor: '#94a3b8',
                  problem: 'Lastik & Süspansiyon',
                  reason: 'Bozuk yol satıhları, kar/buzlanma ve sert kış koşulları.',
                  recommendation: 'Kış lastiği geçişi 1 ay erken yapılmalı. Makas ve amortisör stokları %30 artırılmalı.'
                },
                'Güneydoğu Anadolu': {
                  borderColor: '#ec4899',
                  problem: 'Soğutma & Lastik',
                  reason: 'Yaz aylarında çok yüksek sıcaklıklar (+45°C) ve asfalt ısısı hem motor soğutmayı hem de lastik ömrünü kısaltıyor.',
                  recommendation: 'Soğutma sistemleri yaz başında revize edilmeli. Lastik basınçları düşük tutulmalı ve düzenli kontrol edilmeli.'
                }
              }
              const data = regionData[selectedRegionForParts]
              if (!data) return null
              return (
                <div style={{
                  marginTop: '1.75rem',
                  background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.7) 0%, rgba(10, 14, 26, 0.7) 100%)',
                  border: `1px solid ${data.borderColor}40`,
                  borderRadius: '12px',
                  padding: '1.5rem',
                  minHeight: '200px',
                  display: 'flex',
                  flexDirection: 'column',
                  backdropFilter: 'blur(10px)',
                  boxShadow: `0 4px 20px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 0 0 1px ${data.borderColor}20`,
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '2px',
                    background: `linear-gradient(90deg, ${data.borderColor}80 0%, ${data.borderColor}40 100%)`,
                    zIndex: 1
                  }}></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', marginTop: '2px' }}>
                    <span style={{ fontSize: '1.5rem', filter: 'drop-shadow(0 0 6px rgba(139, 92, 246, 0.5))' }}>📍</span>
                    <h4 style={{ color: '#ffffff', margin: 0, fontSize: '1.05rem', fontWeight: '700', letterSpacing: '0.5px' }}>
                      {selectedRegionForParts.toUpperCase()} BÖLGESİ ANALİZİ
                    </h4>
                  </div>
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: '600' }}>
                      🌍 Neden (Coğrafi/Durum):
                    </div>
                    <div style={{ color: '#cbd5e1', fontSize: '0.95rem', lineHeight: '1.6' }}>
                      {data.reason}
                    </div>
                  </div>
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.08) 100%)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: '10px',
                    padding: '1.15rem',
                    marginTop: 'auto',
                    backdropFilter: 'blur(5px)',
                    boxShadow: '0 2px 12px rgba(16, 185, 129, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                  }}>
                    <div style={{ color: '#10b981', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span>💡</span>
                      <span>Öneri:</span>
                    </div>
                    <div style={{ color: '#cbd5e1', fontSize: '0.9rem', lineHeight: '1.65' }}>
                      {data.recommendation}
                    </div>
                  </div>
                </div>
              )
            })()}
          </div>
        </div>

        {/* CHART 2: Sektör Parça ilişkisi - Radar Grafiği */}
        <div className="card" style={{
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(10, 14, 26, 0.95) 100%)',
          border: '1px solid rgba(245, 158, 11, 0.25)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(245, 158, 11, 0.1)',
          borderRadius: '16px',
          backdropFilter: 'blur(10px)',
          position: 'relative',
          overflow: 'hidden'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.4)'
          e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(245, 158, 11, 0.2), 0 0 30px rgba(245, 158, 11, 0.15)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.25)'
          e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(245, 158, 11, 0.1)'
        }}>
          <div style={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            right: 0, 
            height: '3px', 
            background: 'linear-gradient(90deg, rgba(245, 158, 11, 0.8) 0%, rgba(251, 191, 36, 0.8) 100%)',
            zIndex: 1
          }}></div>
          <div className="card-header" style={{ 
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)', 
            padding: '1.75rem 1.75rem 1.25rem 1.75rem',
            background: 'linear-gradient(180deg, rgba(245, 158, 11, 0.05) 0%, transparent 100%)',
            marginTop: '3px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '1.5rem', filter: 'drop-shadow(0 0 8px rgba(245, 158, 11, 0.5))' }}>🔧</span>
              <h3 className="card-title" style={{ 
                color: '#ffffff', 
                margin: 0, 
                fontSize: '1.4rem', 
                fontWeight: '700', 
                letterSpacing: '-0.3px',
                textShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
              }}>
                Sektör & Parça İlişkisi
              </h3>
            </div>
            <p style={{ 
              color: 'rgba(203, 213, 225, 0.7)', 
              margin: 0, 
              fontSize: '0.85rem', 
              lineHeight: '1.6',
              paddingLeft: '2.25rem'
            }}>
              Sektör bazında parça tüketim eğilimlerini analiz edin
            </p>
          </div>
          <div style={{ padding: '1.75rem' }}>
            {/* Üst: Sektör Seçimi (3 İkonlu Tab) */}
            <div style={{ 
              display: 'flex', 
              gap: '0.6rem', 
              marginBottom: '1.75rem',
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              {[
                { id: 'food', icon: '🍎', name: 'Gıda', color: '#10b981' },
                { id: 'standard', icon: '📦', name: 'Standart', color: '#3b82f6' },
                { id: 'heavy', icon: '🏗️', name: 'Ağır Nakliyat', color: '#f59e0b' }
              ].map(sector => {
                const isSelected = selectedSectorForParts === sector.id
                return (
                  <button
                    key={sector.id}
                    onClick={() => setSelectedSectorForParts(sector.id)}
                    style={{
                      padding: '0.65rem 1.15rem',
                      borderRadius: '10px',
                      border: `1.5px solid ${isSelected ? sector.color : 'rgba(245, 158, 11, 0.3)'}`,
                      background: isSelected 
                        ? `linear-gradient(135deg, ${sector.color}30 0%, ${sector.color}15 100%)` 
                        : 'rgba(15, 23, 42, 0.5)',
                      color: isSelected ? '#ffffff' : 'rgba(203, 213, 225, 0.8)',
                      fontSize: '0.875rem',
                      fontWeight: isSelected ? '600' : '500',
                      cursor: 'pointer',
                      transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: isSelected 
                        ? `0 4px 16px ${sector.color}30, inset 0 1px 0 rgba(255, 255, 255, 0.1)` 
                        : '0 2px 8px rgba(0, 0, 0, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      backdropFilter: 'blur(5px)',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = `linear-gradient(135deg, ${sector.color}20 0%, ${sector.color}10 100%)`
                        e.currentTarget.style.borderColor = `${sector.color}60`
                        e.currentTarget.style.boxShadow = `0 4px 12px ${sector.color}20`
                        e.currentTarget.style.transform = 'translateY(-2px)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = 'rgba(15, 23, 42, 0.5)'
                        e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.3)'
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2)'
                        e.currentTarget.style.transform = 'translateY(0)'
                      }
                    }}
                  >
                    <span style={{ fontSize: '1.2rem', filter: isSelected ? 'drop-shadow(0 0 4px ' + sector.color + ')' : 'none' }}>{sector.icon}</span>
                    <span>{sector.name}</span>
                  </button>
                )
              })}
            </div>

            {/* Orta: Radar Grafiği */}
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart 
                data={(() => {
                  const getSectorData = (sector) => {
                    if (sector === 'food') {
                      // Gıda: Soğutma/Frigo'ya odaklı
                      return {
                        'Lastik & Yürüyen': 45,
                        'Fren Sistemi': 50,
                        'Motor & Yağ (Bakım)': 55,
                        'Soğutma / Frigo': 95,
                        'Kaporta & Kozmetik': 40
                      }
                    } else if (sector === 'standard') {
                      // Standart: Motor & Yağ'a odaklı
                      return {
                        'Lastik & Yürüyen': 60,
                        'Fren Sistemi': 55,
                        'Motor & Yağ (Bakım)': 90,
                        'Soğutma / Frigo': 50,
                        'Kaporta & Kozmetik': 50
                      }
                    } else if (sector === 'heavy') {
                      // Ağır Nakliyat: Lastik, Fren ve Soğutma'ya odaklı
                      return {
                        'Lastik & Yürüyen': 95,
                        'Fren Sistemi': 95,
                        'Motor & Yağ (Bakım)': 70,
                        'Soğutma / Frigo': 85,
                        'Kaporta & Kozmetik': 50
                      }
                    }
                    return {}
                  }
                  const data = getSectorData(selectedSectorForParts)
                  return Object.keys(data).map(key => ({
                    category: key,
                    value: data[key]
                  }))
                })()}
                margin={{ top: 20, right: 30, bottom: 20, left: 20 }}
              >
                <PolarGrid stroke="rgba(255, 255, 255, 0.1)" />
                <PolarAngleAxis 
                  dataKey="category" 
                  tick={{ fill: '#cbd5e1', fontSize: 11 }}
                />
                <PolarRadiusAxis 
                  angle={90} 
                  domain={[0, 100]} 
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                />
                <Radar 
                  name={(() => {
                    const names = {
                      'food': 'Gıda Lojistiği',
                      'standard': 'Standart Nakliyat',
                      'heavy': 'Ağır Nakliyat'
                    }
                    return names[selectedSectorForParts] || 'Sektör'
                  })()}
                  dataKey="value"
                  stroke={(() => {
                    const colors = {
                      'food': '#10b981',
                      'standard': '#3b82f6',
                      'heavy': '#f59e0b'
                    }
                    return colors[selectedSectorForParts] || '#3b82f6'
                  })()}
                  fill={(() => {
                    const colors = {
                      'food': '#10b981',
                      'standard': '#3b82f6',
                      'heavy': '#f59e0b'
                    }
                    return colors[selectedSectorForParts] || '#3b82f6'
                  })()}
                  fillOpacity={0.4}
                  strokeWidth={3}
                  dot={{ r: 5, fill: '#ffffff', strokeWidth: 2 }}
                  activeDot={{ r: 7 }}
                />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(30, 30, 46, 0.95)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    borderRadius: '8px',
                    color: '#ffffff'
                  }}
                  formatter={(value) => [`${value}%`, 'Tüketim Oranı']}
                />
              </RadarChart>
            </ResponsiveContainer>

            {/* Alt: Dinamik KDS Kartı */}
            <div style={{
              marginTop: '1.75rem',
              background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.7) 0%, rgba(10, 14, 26, 0.7) 100%)',
              border: `1px solid ${(() => {
                const colors = {
                  'food': '#10b981',
                  'standard': '#3b82f6',
                  'heavy': '#f59e0b'
                }
                return colors[selectedSectorForParts] || '#3b82f6'
              })()}40`,
              borderRadius: '12px',
              padding: '1.5rem',
              minHeight: '200px',
              display: 'flex',
              flexDirection: 'column',
              backdropFilter: 'blur(10px)',
              boxShadow: `0 4px 20px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 0 0 1px ${(() => {
                const colors = {
                  'food': '#10b981',
                  'standard': '#3b82f6',
                  'heavy': '#f59e0b'
                }
                return colors[selectedSectorForParts] || '#3b82f6'
              })()}20`,
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '2px',
                background: `linear-gradient(90deg, ${(() => {
                  const colors = {
                    'food': '#10b981',
                    'standard': '#3b82f6',
                    'heavy': '#f59e0b'
                  }
                  return colors[selectedSectorForParts] || '#3b82f6'
                })()}80 0%, ${(() => {
                  const colors = {
                    'food': '#10b981',
                    'standard': '#3b82f6',
                    'heavy': '#f59e0b'
                  }
                  return colors[selectedSectorForParts] || '#3b82f6'
                })()}40 100%)`,
                zIndex: 1
              }}></div>
              {(() => {
                const kdsData = {
                  'food': {
                    icon: '🍎',
                    title: 'SEBEP ANALİZİ: SOĞUTMA BASKISI',
                    reason: 'Gıda lojistiğinde sürekli soğuk zincir korunması gerektiği için Frigo sistemleri yoğun çalışır. Termokin motorlar ve soğutma kompresörleri sürekli yük altındadır.',
                    recommendation: 'Frigo sistemlerinin periyodik bakımları 2 haftada bir yapılmalı. Kompresör yağı değişim süresi %30 kısaltılmalı.'
                  },
                  'standard': {
                    icon: '📦',
                    title: 'SEBEP ANALİZİ: YÜKSEK KM BASKISI',
                    reason: 'Standart nakliyat sektöründe araçlar çok fazla kilometre yapar. Sürekli uzun yol yapıldığı için motor yağı ve filtreler daha sık değişir.',
                    recommendation: 'Motor yağı değişim periyodu 10.000 km yerine 8.000 km\'ye düşürülmeli. Hava filtresi kontrolü her 5.000 km\'de yapılmalı.'
                  },
                  'heavy': {
                    icon: '🏗️',
                    title: 'SEBEP ANALİZİ: TONAJ BASKIS',
                    reason: 'Aşırı yük (Tonaj), lastik tabanını ezer ve fren mesafesini uzatarak balataları %60 daha hızlı ısıtır. Ağır yük motoru ve soğutma sistemini de zorlar.',
                    recommendation: 'Lastik basınçları her sefer öncesi ölçülmeli. Fren balata stokları %40 artırılmalı. Retarder (Hız kesici) kullanımı zorunlu hale getirilmeli.'
                  }
                }
                const data = kdsData[selectedSectorForParts]
                if (!data) return null
                return (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', marginTop: '2px' }}>
                      <span style={{ fontSize: '1.5rem', filter: 'drop-shadow(0 0 6px rgba(245, 158, 11, 0.5))' }}>{data.icon}</span>
                      <h4 style={{ color: '#ffffff', margin: 0, fontSize: '1.05rem', fontWeight: '700', letterSpacing: '0.5px' }}>
                        {data.title}
                      </h4>
                    </div>
                    <div style={{ marginBottom: '1rem' }}>
                      <div style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: '600' }}>
                        🌍 Neden (Coğrafi/Durum):
                      </div>
                      <div style={{ color: '#cbd5e1', fontSize: '0.95rem', lineHeight: '1.6' }}>
                        {data.reason}
                      </div>
                    </div>
                    <div style={{
                      background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.08) 100%)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      borderRadius: '10px',
                      padding: '1.15rem',
                      marginTop: 'auto',
                      backdropFilter: 'blur(5px)',
                      boxShadow: '0 2px 12px rgba(16, 185, 129, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                    }}>
                      <div style={{ color: '#10b981', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span>💡</span>
                        <span>Öneri:</span>
                      </div>
                      <div style={{ color: '#cbd5e1', fontSize: '0.9rem', lineHeight: '1.65' }}>
                        {data.recommendation}
                      </div>
                    </div>
                  </>
                )
              })()}
            </div>
          </div>
        </div>

      </div>

      {/* Geçmiş Yıl Verileri (Yıl seçildiğinde gösterilir) */}
      {selectedYear !== defaultYear && mockRoutesByYear[selectedYear] && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
          {/* Yıllara Göre Rotalar/Bölgeler */}
          <div className="card" style={{
            background: 'rgba(30, 30, 46, 0.8)',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
          }}>
            <div className="card-header" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <h3 className="card-title" style={{ color: '#ffffff' }}>{selectedYear} Yılı Bölgelere Göre Rota Dağılımı</h3>
            </div>
          <div style={{ padding: '1.5rem' }}>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={routesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                <XAxis 
                  dataKey="region" 
                  angle={-45} 
                  textAnchor="end" 
                  height={100}
                  stroke="#cbd5e1"
                  tick={{ fill: '#cbd5e1', fontSize: 12 }}
                />
                <YAxis 
                  stroke="#cbd5e1"
                  tick={{ fill: '#cbd5e1', fontSize: 12 }}
                />
                <Tooltip 
                  contentStyle={{
                    background: 'rgba(30, 30, 46, 0.95)',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    borderRadius: '8px',
                    color: '#ffffff'
                  }}
                  formatter={(value, name) => {
                    if (name === 'count') return [value.toLocaleString('tr-TR'), 'Rota Sayısı']
                    if (name === 'distance') return [value.toLocaleString('tr-TR') + ' km', 'Toplam Mesafe']
                    return [value, name]
                  }}
                />
                <Legend wrapperStyle={{ color: '#cbd5e1' }} />
                <Bar dataKey="count" fill="#3b82f6" name="Rota Sayısı" radius={[8, 8, 0, 0]} />
                <Bar dataKey="distance" fill="#9B59B6" name="Toplam Mesafe (km)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Yıllara Göre Yedek Parça Alımları */}
        <div className="card" style={{
            background: 'rgba(30, 30, 46, 0.8)',
            border: '1px solid rgba(155, 89, 182, 0.2)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
          }}>
            <div className="card-header" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <h3 className="card-title" style={{ color: '#ffffff' }}>{selectedYear} Yılı Yedek Parça Alımları</h3>
            </div>
          <div style={{ padding: '1.5rem' }}>
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={sparePartsData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ category, value, percent }) => 
                    `${category}: ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {sparePartsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    background: 'rgba(30, 30, 46, 0.95)',
                    border: '1px solid rgba(155, 89, 182, 0.3)',
                    borderRadius: '8px',
                    color: '#ffffff'
                  }}
                  formatter={(value) => value.toLocaleString('tr-TR') + ' ₺'}
                />
                <Legend wrapperStyle={{ color: '#cbd5e1' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        </div>
      )}

    </div>
  )
}

export default Overview


