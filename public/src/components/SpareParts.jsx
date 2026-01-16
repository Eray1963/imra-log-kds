import { useState, useEffect, useRef } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, Cell } from 'recharts'
import { runSparePartsKDS } from '../kds/sparePartsDecisionEngine'
import { getSpareParts } from '../services/dataService'

function SpareParts() {
  const [loading, setLoading] = useState(true)
  const [spareParts, setSpareParts] = useState([])
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [graphViewMode, setGraphViewMode] = useState('year') // 'year' veya 'trend'
  const [hoveredConnection, setHoveredConnection] = useState(null)
  const [kdsRegion, setKdsRegion] = useState('Marmara')
  const [kdsCargoType, setKdsCargoType] = useState('standard')
  const [kdsScenario, setKdsScenario] = useState('A')
  const [kdsInflation, setKdsInflation] = useState(25)
  const [kdsExchangeRate, setKdsExchangeRate] = useState(34.5)
  const [kdsResult, setKdsResult] = useState(null)
  
  // Parça alımı simülasyonu state'leri
  const [simulationPart, setSimulationPart] = useState(null)
  const [simulationQuantity, setSimulationQuantity] = useState(0)
  const [simulationResult, setSimulationResult] = useState(null)
  
  // Hızlı tedarik simülasyonu state'leri
  const [quickProcurementModal, setQuickProcurementModal] = useState(null) // { part, suppliers }
  
  // Mevcut veriyi takip etmek için ref (closure sorununu önlemek için)
  const sparePartsRef = useRef([])

  useEffect(() => {
    runKDSAnalysis()
  }, [kdsRegion, kdsCargoType, kdsScenario, kdsInflation, kdsExchangeRate])

  const runKDSAnalysis = () => {
    const result = runSparePartsKDS({
      region: kdsRegion,
      cargoType: kdsCargoType,
      scenario: kdsScenario,
      inflation: kdsInflation,
      exchangeRate: kdsExchangeRate
    })
    setKdsResult(result)
  }

  // Parça alımı simülasyonu fonksiyonu
  const runSimulation = (part, quantity) => {
    if (!part || quantity <= 0) {
      setSimulationResult(null)
      return
    }

    const currentStock = Number(part.stock) || 0
    const minStock = Number(part.min_stock) || 0
    const unitPrice = Number(part.unit_price) || 0
    const newStock = currentStock + quantity
    const totalCost = quantity * unitPrice
    
    // Optimal stok seviyesi: min_stock ile min_stock * 3 arası
    const optimalMin = minStock
    const optimalMax = minStock * 3
    
    let status = 'optimal'
    let message = ''
    const recommendations = []
    
    // Stok durumu analizi
    if (newStock < minStock) {
      status = 'error'
      message = `⚠️ UYARI: Alım sonrası stok (${newStock}) minimum stok seviyesinin (${minStock}) altında kalacak! Bu durum stok tükenmesi riski oluşturur.`
      recommendations.push(`En az ${minStock - currentStock} adet daha alınmalıdır.`)
      recommendations.push('Acil tedarik planlaması yapılmalıdır.')
    } else if (newStock < optimalMin * 1.5) {
      status = 'warning'
      message = `⚠️ DİKKAT: Alım sonrası stok (${newStock}) optimal seviyenin (${optimalMin * 1.5}) altında kalacak. Minimum stok seviyesinin üzerinde ancak yeterli güvenlik marjı yok.`
      recommendations.push(`Optimal seviye için ${Math.ceil(optimalMin * 1.5 - currentStock)} adet daha alınabilir.`)
      recommendations.push('Kısa vadede tekrar tedarik gerekebilir.')
    } else if (newStock > optimalMax) {
      status = 'warning'
      message = `⚠️ DİKKAT: Alım sonrası stok (${newStock}) optimal maksimum seviyenin (${optimalMax}) üzerinde olacak. Bu durum gereksiz sermaye bağlanmasına neden olabilir.`
      recommendations.push(`Optimal seviye için ${Math.ceil(optimalMax - currentStock)} adet yeterli olabilir.`)
      recommendations.push('Fazla stok depolama maliyeti oluşturabilir.')
      recommendations.push(`Şu anki alım ${newStock - optimalMax} adet fazla olabilir.`)
    } else {
      status = 'optimal'
      message = `✅ MÜKEMMEL: Alım sonrası stok (${newStock}) optimal seviyede olacak. Bu miktar hem yeterli güvenlik marjı sağlar hem de gereksiz sermaye bağlanmasını önler.`
      recommendations.push('Bu alım miktarı önerilir.')
      recommendations.push('Stok seviyesi optimal aralıkta kalacaktır.')
    }
    
    // Ek öneriler
    if (currentStock <= minStock && newStock > minStock) {
      recommendations.push('✅ Kritik stok seviyesinden çıkılacak.')
    }
    
    if (totalCost > 100000) {
      recommendations.push(`💰 Yüksek maliyetli alım: ${totalCost.toLocaleString('tr-TR')} ₺. Bütçe planlaması kontrol edilmelidir.`)
    }
    
    setSimulationResult({
      currentStock,
      purchaseQuantity: quantity,
      newStock,
      totalCost,
      minStock,
      optimalMin,
      optimalMax,
      status,
      message,
      recommendations
    })
  }

  // Parça listesini yükle
  const loadSpareParts = async (showLoading = true) => {
    try {
      // Scroll pozisyonunu kaydet
      const savedScrollPosition = window.scrollY || document.documentElement.scrollTop
      
      if (showLoading) {
        setLoading(true)
      }
      const data = await getSpareParts()
      
      // Sadece veri gerçekten değiştiğinde state'i güncelle
      // JSON karşılaştırması ile gereksiz render'ları önle
      const currentDataStr = JSON.stringify(sparePartsRef.current)
      const newDataStr = JSON.stringify(data || [])
      
      if (currentDataStr !== newDataStr) {
        sparePartsRef.current = data || []
        setSpareParts(data || [])
        
        // Veri güncellendiğinde scroll pozisyonunu koru
        // Bir sonraki frame'de restore et (render tamamlandıktan sonra)
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            window.scrollTo(0, savedScrollPosition)
          })
        })
      }
    } catch (error) {
      console.error('Yedek parça verileri yüklenirken hata:', error)
      sparePartsRef.current = []
      setSpareParts([])
    } finally {
      if (showLoading) {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    // İlk yüklemede loading göster
    loadSpareParts(true)
    
    // Her 30 saniyede bir otomatik yenile (5 saniye çok sık)
    // Loading gösterme, sadece arka planda güncelle
    const interval = setInterval(() => {
      loadSpareParts(false)
    }, 30000)
    
    // Tab'a geri dönüldüğünde yenile (sadece kullanıcı başka tab'dan döndüğünde)
    let lastFocusTime = Date.now()
    const handleFocus = () => {
      const now = Date.now()
      // Sadece 5 saniyeden fazla başka yerde kaldıysa yenile
      if (now - lastFocusTime > 5000) {
        loadSpareParts(false)
      }
      lastFocusTime = now
    }
    window.addEventListener('focus', handleFocus)
    
    return () => {
      clearInterval(interval)
      window.removeEventListener('focus', handleFocus)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  
  // sparePartsRef'i güncelle
  useEffect(() => {
    sparePartsRef.current = spareParts
  }, [spareParts])

  const totalValue = spareParts.reduce((sum, part) => {
    const stock = Number(part.stock) || 0
    const price = Number(part.unit_price) || 0
    return sum + (stock * price)
  }, 0)
  
  const criticalStockItems = spareParts.filter(part => {
    const stock = Number(part.stock) || 0
    const minStock = Number(part.min_stock) || 0
    // Lastik için özel kontrol: stok min stoktan %5 fazla olsa bile kritik sayılır
    if (part.name === 'Lastik') {
      return stock <= minStock * 1.05 // Min stokun %5 üzerine kadar kritik
    }
    // Frigo Dorse Motoru için de kontrol
    if (part.name === 'Frigo Dorse Motoru') {
      return stock <= minStock
    }
    return stock <= minStock
  })
  
  // Ölü stok: Son 6 aydır kullanılmayan parçalar (mock data - gerçekte API'den gelecek)
  const deadStockItems = spareParts.filter(part => {
    // Mock: Bazı parçaları ölü stok olarak işaretle
    const mockDeadStockNames = ['Akü'] // Örnek: Akü ölü stokta
    return mockDeadStockNames.includes(part.name)
  })
  
  const deadStockValue = deadStockItems.reduce((sum, part) => {
    const stock = Number(part.stock) || 0
    const price = Number(part.unit_price) || 0
    return sum + (stock * price)
  }, 0)
  
  // Aylık bakım/parça gideri (son 6 ayın ortalaması - mock data)
  const monthlyMaintenanceCost = 45000 // Mock data
  const previousMonthCost = 42857 // Mock data - geçen ay
  const monthlyCostTrend = ((monthlyMaintenanceCost - previousMonthCost) / previousMonthCost) * 100
  
  // Günlük tüketim oranları (mock data - gerçekte geçmiş satış/çıkış verilerinden hesaplanır)
  // Daha gerçekçi değerler: yüksek stok seviyelerine göre artırılmış tüketim oranları
  const dailyConsumptionRates = {
    'Motor Yağı': 18,       // Motor Yağı: günde 18 adet (1230/18 ≈ 68 gün)
    'Filtre Seti': 10,      // Filtre Seti: günde 10 adet (800/10 = 80 gün)
    'Fren Balata': 6,       // Fren Balata: günde 6 adet (1700/6 ≈ 283 gün)
    'Lastik': 3,            // Lastik: günde 3 adet (900/3 = 300 gün)
    'Akü': 1,               // Akü: günde 1 adet (780/1 = 780 gün)
    'Frigo Dorse Motoru': 0.5  // Frigo Dorse Motoru: günde 0.5 adet (10/0.5 = 20 gün)
  }
  
  // Kalan ömür hesaplama fonksiyonu
  const calculateDaysRemaining = (part) => {
    const stock = Number(part.stock) || 0
    const partName = (part.name || '').trim()
    // İsim bazlı eşleştirme (kısmi eşleşme destekler)
    const dailyRate = dailyConsumptionRates[partName] || 
                      Object.entries(dailyConsumptionRates).find(([key]) => partName.includes(key))?.[1] || 
                      0.5 // Varsayılan günlük tüketim
    if (dailyRate <= 0) return null
    return Math.round(stock / dailyRate)
  }
  
  const categories = [...new Set(spareParts.map(p => p.category || 'Diğer').filter(Boolean))]

  const categoryData = categories.map(cat => ({
    category: cat,
    count: spareParts.filter(p => (p.category || 'Diğer') === cat).length,
    value: spareParts.filter(p => (p.category || 'Diğer') === cat).reduce((sum, p) => {
      const stock = Number(p.stock) || 0
      const price = Number(p.unit_price) || 0
      return sum + (stock * price)
    }, 0)
  }))

  // Yıl listesi
  const years = [2020, 2021, 2022, 2023, 2024, 2025, 2026]

  // Mock data - Yıllara göre parça bazında kullanım verileri
  // 6 parça: Motor Yağı, Filtre Seti, Fren Balata, Lastik, Akü, Frigo Dorse Motoru
  const mockYearlyPartUsage = {
    2020: {
      'Motor Yağı': 750,
      'Filtre Seti': 500,
      'Fren Balata': 890,
      'Lastik': 680,
      'Akü': 420,
      'Frigo Dorse Motoru': 120
    },
    2021: {
      'Motor Yağı': 830,
      'Filtre Seti': 550,
      'Fren Balata': 1020,
      'Lastik': 750,
      'Akü': 480,
      'Frigo Dorse Motoru': 135
    },
    2022: {
      'Motor Yağı': 920,
      'Filtre Seti': 600,
      'Fren Balata': 1180,
      'Lastik': 890,
      'Akü': 550,
      'Frigo Dorse Motoru': 150
    },
    2023: {
      'Motor Yağı': 1020,
      'Filtre Seti': 660,
      'Fren Balata': 1350,
      'Lastik': 1050,
      'Akü': 620,
      'Frigo Dorse Motoru': 165
    },
    2024: {
      'Motor Yağı': 1120,
      'Filtre Seti': 730,
      'Fren Balata': 1520,
      'Lastik': 1220,
      'Akü': 700,
      'Frigo Dorse Motoru': 180
    },
    2025: {
      'Motor Yağı': 1230,
      'Filtre Seti': 800,
      'Fren Balata': 1700,
      'Lastik': 900,
      'Akü': 150,
      'Frigo Dorse Motoru': 195
    },
    2026: {
      'Motor Yağı': 1350,   // %9.8 artış
      'Filtre Seti': 880,   // %10 artış
      'Fren Balata': 1870,  // %10 artış
      'Lastik': 990,        // %10 artış
      'Akü': 860,           // %10.3 artış
      'Frigo Dorse Motoru': 215  // %10.3 artış
    }
  }

  // Yıllara göre trend verisi (LineChart için)
  const yearlyTrendData = years.filter(y => y !== 2026).map(year => {
    const yearData = { year }
    Object.keys(mockYearlyPartUsage[2020] || {}).forEach(partName => {
      yearData[partName] = mockYearlyPartUsage[year]?.[partName] || 0
    })
    return yearData
  })

  // Mock data - Bölge, Yük Tipi ve Yedek Parça İlişkisi
  const mockRegionLoadPartRelation = {
    2020: [
      { region: 'Marmara', loadType: 'Standart Yük', partCategory: 'Motor', demand: 320, reason: 'Yoğun şehir içi trafik' },
      { region: 'Marmara', loadType: 'Hal Sektörü', partCategory: 'Soğutma', demand: 180, reason: 'Soğutuculu dorse ihtiyacı' },
      { region: 'Ege', loadType: 'Standart Yük', partCategory: 'Motor', demand: 240, reason: 'Uzun mesafe taşımacılık' },
      { region: 'Ege', loadType: 'Hal Sektörü', partCategory: 'Soğutma', demand: 150, reason: 'Meyve-sebze taşımacılığı' },
      { region: 'İç Anadolu', loadType: 'Ağır Yük', partCategory: 'Fren', demand: 280, reason: 'Ağır yük taşımacılığı' },
      { region: 'İç Anadolu', loadType: 'Ağır Yük', partCategory: 'Lastik', demand: 320, reason: 'Aşınma ve yük basıncı' },
      { region: 'Akdeniz', loadType: 'Hal Sektörü', partCategory: 'Soğutma', demand: 220, reason: 'Hal sezonu yoğunluğu' },
      { region: 'Akdeniz', loadType: 'Hal Sektörü', partCategory: 'Elektrik', demand: 160, reason: 'Soğutma sistemi elektrik' },
      { region: 'Karadeniz', loadType: 'Standart Yük', partCategory: 'Fren', demand: 190, reason: 'Dağlık yol koşulları' },
      { region: 'Doğu Anadolu', loadType: 'Standart Yük', partCategory: 'Fren', demand: 250, reason: 'Dağlık ve engebeli yollar' },
      { region: 'Doğu Anadolu', loadType: 'Ağır Yük', partCategory: 'Süspansiyon', demand: 180, reason: 'Zorlu arazi koşulları' },
      { region: 'Güneydoğu Anadolu', loadType: 'Ağır Yük', partCategory: 'Lastik', demand: 200, reason: 'Sıcak iklim ve ağır yük' },
      { region: 'Güneydoğu Anadolu', loadType: 'Ağır Yük', partCategory: 'Motor', demand: 170, reason: 'Yüksek performans ihtiyacı' }
    ],
    2021: [
      { region: 'Marmara', loadType: 'Standart Yük', partCategory: 'Motor', demand: 350, reason: 'Yoğun şehir içi trafik' },
      { region: 'Marmara', loadType: 'Hal Sektörü', partCategory: 'Soğutma', demand: 200, reason: 'Soğutuculu dorse ihtiyacı' },
      { region: 'Ege', loadType: 'Standart Yük', partCategory: 'Motor', demand: 270, reason: 'Uzun mesafe taşımacılık' },
      { region: 'Ege', loadType: 'Hal Sektörü', partCategory: 'Soğutma', demand: 170, reason: 'Meyve-sebze taşımacılığı' },
      { region: 'İç Anadolu', loadType: 'Ağır Yük', partCategory: 'Fren', demand: 310, reason: 'Ağır yük taşımacılığı' },
      { region: 'İç Anadolu', loadType: 'Ağır Yük', partCategory: 'Lastik', demand: 360, reason: 'Aşınma ve yük basıncı' },
      { region: 'Akdeniz', loadType: 'Hal Sektörü', partCategory: 'Soğutma', demand: 250, reason: 'Hal sezonu yoğunluğu' },
      { region: 'Akdeniz', loadType: 'Hal Sektörü', partCategory: 'Elektrik', demand: 180, reason: 'Soğutma sistemi elektrik' },
      { region: 'Karadeniz', loadType: 'Standart Yük', partCategory: 'Fren', demand: 210, reason: 'Dağlık yol koşulları' },
      { region: 'Doğu Anadolu', loadType: 'Standart Yük', partCategory: 'Fren', demand: 280, reason: 'Dağlık ve engebeli yollar' },
      { region: 'Doğu Anadolu', loadType: 'Ağır Yük', partCategory: 'Süspansiyon', demand: 200, reason: 'Zorlu arazi koşulları' },
      { region: 'Güneydoğu Anadolu', loadType: 'Ağır Yük', partCategory: 'Lastik', demand: 230, reason: 'Sıcak iklim ve ağır yük' },
      { region: 'Güneydoğu Anadolu', loadType: 'Ağır Yük', partCategory: 'Motor', demand: 190, reason: 'Yüksek performans ihtiyacı' }
    ],
    2022: [
      { region: 'Marmara', loadType: 'Standart Yük', partCategory: 'Motor', demand: 380, reason: 'Yoğun şehir içi trafik' },
      { region: 'Marmara', loadType: 'Hal Sektörü', partCategory: 'Soğutma', demand: 220, reason: 'Soğutuculu dorse ihtiyacı' },
      { region: 'Ege', loadType: 'Standart Yük', partCategory: 'Motor', demand: 300, reason: 'Uzun mesafe taşımacılık' },
      { region: 'Ege', loadType: 'Hal Sektörü', partCategory: 'Soğutma', demand: 190, reason: 'Meyve-sebze taşımacılığı' },
      { region: 'İç Anadolu', loadType: 'Ağır Yük', partCategory: 'Fren', demand: 340, reason: 'Ağır yük taşımacılığı' },
      { region: 'İç Anadolu', loadType: 'Ağır Yük', partCategory: 'Lastik', demand: 400, reason: 'Aşınma ve yük basıncı' },
      { region: 'Akdeniz', loadType: 'Hal Sektörü', partCategory: 'Soğutma', demand: 280, reason: 'Hal sezonu yoğunluğu' },
      { region: 'Akdeniz', loadType: 'Hal Sektörü', partCategory: 'Elektrik', demand: 200, reason: 'Soğutma sistemi elektrik' },
      { region: 'Karadeniz', loadType: 'Standart Yük', partCategory: 'Fren', demand: 230, reason: 'Dağlık yol koşulları' },
      { region: 'Doğu Anadolu', loadType: 'Standart Yük', partCategory: 'Fren', demand: 310, reason: 'Dağlık ve engebeli yollar' },
      { region: 'Doğu Anadolu', loadType: 'Ağır Yük', partCategory: 'Süspansiyon', demand: 220, reason: 'Zorlu arazi koşulları' },
      { region: 'Güneydoğu Anadolu', loadType: 'Ağır Yük', partCategory: 'Lastik', demand: 260, reason: 'Sıcak iklim ve ağır yük' },
      { region: 'Güneydoğu Anadolu', loadType: 'Ağır Yük', partCategory: 'Motor', demand: 210, reason: 'Yüksek performans ihtiyacı' }
    ],
    2023: [
      { region: 'Marmara', loadType: 'Standart Yük', partCategory: 'Motor', demand: 420, reason: 'Yoğun şehir içi trafik' },
      { region: 'Marmara', loadType: 'Hal Sektörü', partCategory: 'Soğutma', demand: 240, reason: 'Soğutuculu dorse ihtiyacı' },
      { region: 'Ege', loadType: 'Standart Yük', partCategory: 'Motor', demand: 330, reason: 'Uzun mesafe taşımacılık' },
      { region: 'Ege', loadType: 'Hal Sektörü', partCategory: 'Soğutma', demand: 210, reason: 'Meyve-sebze taşımacılığı' },
      { region: 'İç Anadolu', loadType: 'Ağır Yük', partCategory: 'Fren', demand: 370, reason: 'Ağır yük taşımacılığı' },
      { region: 'İç Anadolu', loadType: 'Ağır Yük', partCategory: 'Lastik', demand: 440, reason: 'Aşınma ve yük basıncı' },
      { region: 'Akdeniz', loadType: 'Hal Sektörü', partCategory: 'Soğutma', demand: 310, reason: 'Hal sezonu yoğunluğu' },
      { region: 'Akdeniz', loadType: 'Hal Sektörü', partCategory: 'Elektrik', demand: 220, reason: 'Soğutma sistemi elektrik' },
      { region: 'Karadeniz', loadType: 'Standart Yük', partCategory: 'Fren', demand: 250, reason: 'Dağlık yol koşulları' },
      { region: 'Doğu Anadolu', loadType: 'Standart Yük', partCategory: 'Fren', demand: 340, reason: 'Dağlık ve engebeli yollar' },
      { region: 'Doğu Anadolu', loadType: 'Ağır Yük', partCategory: 'Süspansiyon', demand: 240, reason: 'Zorlu arazi koşulları' },
      { region: 'Güneydoğu Anadolu', loadType: 'Ağır Yük', partCategory: 'Lastik', demand: 290, reason: 'Sıcak iklim ve ağır yük' },
      { region: 'Güneydoğu Anadolu', loadType: 'Ağır Yük', partCategory: 'Motor', demand: 230, reason: 'Yüksek performans ihtiyacı' }
    ],
    2024: [
      { region: 'Marmara', loadType: 'Standart Yük', partCategory: 'Motor', demand: 460, reason: 'Yoğun şehir içi trafik' },
      { region: 'Marmara', loadType: 'Hal Sektörü', partCategory: 'Soğutma', demand: 260, reason: 'Soğutuculu dorse ihtiyacı' },
      { region: 'Ege', loadType: 'Standart Yük', partCategory: 'Motor', demand: 360, reason: 'Uzun mesafe taşımacılık' },
      { region: 'Ege', loadType: 'Hal Sektörü', partCategory: 'Soğutma', demand: 230, reason: 'Meyve-sebze taşımacılığı' },
      { region: 'İç Anadolu', loadType: 'Ağır Yük', partCategory: 'Fren', demand: 400, reason: 'Ağır yük taşımacılığı' },
      { region: 'İç Anadolu', loadType: 'Ağır Yük', partCategory: 'Lastik', demand: 480, reason: 'Aşınma ve yük basıncı' },
      { region: 'Akdeniz', loadType: 'Hal Sektörü', partCategory: 'Soğutma', demand: 340, reason: 'Hal sezonu yoğunluğu' },
      { region: 'Akdeniz', loadType: 'Hal Sektörü', partCategory: 'Elektrik', demand: 240, reason: 'Soğutma sistemi elektrik' },
      { region: 'Karadeniz', loadType: 'Standart Yük', partCategory: 'Fren', demand: 270, reason: 'Dağlık yol koşulları' },
      { region: 'Doğu Anadolu', loadType: 'Standart Yük', partCategory: 'Fren', demand: 370, reason: 'Dağlık ve engebeli yollar' },
      { region: 'Doğu Anadolu', loadType: 'Ağır Yük', partCategory: 'Süspansiyon', demand: 260, reason: 'Zorlu arazi koşulları' },
      { region: 'Güneydoğu Anadolu', loadType: 'Ağır Yük', partCategory: 'Lastik', demand: 320, reason: 'Sıcak iklim ve ağır yük' },
      { region: 'Güneydoğu Anadolu', loadType: 'Ağır Yük', partCategory: 'Motor', demand: 250, reason: 'Yüksek performans ihtiyacı' }
    ]
  }

  const relationData = mockRegionLoadPartRelation[selectedYear] || []

  if (loading) {
    return (
      <div style={{ 
        height: '100vh',
        background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.98) 0%, rgba(15, 23, 42, 0.98) 100%)',
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
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2rem',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
            backdropFilter: 'blur(10px)'
          }}>
            🔧
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
              Yedek Parça Yönetimi
            </h1>
            <p style={{ 
              margin: 0, 
              fontSize: '1rem', 
              color: '#94a3b8',
              fontWeight: '500',
              letterSpacing: '0.2px'
            }}>
              Stok takibi, tedarik planlaması ve karar destek sistemi
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
        {/* Toplam Stok Değeri KPI */}
        <div 
          style={{
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(124, 58, 237, 0.1) 100%)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
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
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(139, 92, 246, 0.3)'
            e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.5)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.2)'
            e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.3)'
          }}
        >
          <div style={{
            position: 'absolute',
            top: '-20px',
            right: '-20px',
            width: '80px',
            height: '80px',
            background: 'rgba(139, 92, 246, 0.1)',
            borderRadius: '50%',
            filter: 'blur(20px)'
          }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem', position: 'relative', zIndex: 1 }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)'
            }}>
              💰
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
                Toplam Stok Değeri
              </div>
              <div style={{ 
                display: 'flex', 
                alignItems: 'baseline', 
                gap: '0.5rem'
              }}>
                <div style={{ 
                  color: '#8b5cf6', 
                  fontSize: '2rem', 
                  fontWeight: '700',
                  lineHeight: '1'
                }}>
                  {totalValue >= 1000000 
                    ? `${(totalValue / 1000000).toFixed(1)}M`
                    : totalValue >= 1000
                    ? `${(totalValue / 1000).toFixed(0)}K`
                    : totalValue.toLocaleString('tr-TR')}
                </div>
                <div style={{
                  color: '#64748b',
                  fontSize: '0.75rem',
                  fontWeight: '500'
                }}>
                  ₺
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Kritik Seviyedeki Parçalar KPI */}
        <div 
          style={{
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.1) 100%)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
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
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(239, 68, 68, 0.3)'
            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.2)'
            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)'
          }}
        >
          <div style={{
            position: 'absolute',
            top: '-20px',
            right: '-20px',
            width: '80px',
            height: '80px',
            background: 'rgba(239, 68, 68, 0.1)',
            borderRadius: '50%',
            filter: 'blur(20px)'
          }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem', position: 'relative', zIndex: 1 }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
            }}>
              ⚠️
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
                Kritik Seviyedeki Parçalar
              </div>
              <div style={{ 
                display: 'flex', 
                alignItems: 'baseline', 
                gap: '0.5rem'
              }}>
                <div style={{ 
                  color: '#ef4444', 
                  fontSize: '2rem', 
                  fontWeight: '700',
                  lineHeight: '1'
                }}>
                  {criticalStockItems.length}
                </div>
                <div style={{
                  color: '#64748b',
                  fontSize: '0.75rem',
                  fontWeight: '500'
                }}>
                  kalem
                </div>
              </div>
            </div>
          </div>
          {criticalStockItems.length > 0 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.85rem',
              color: '#fca5a5',
              position: 'relative', zIndex: 1
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#ef4444',
                boxShadow: '0 0 8px rgba(239, 68, 68, 0.6)'
              }} />
              <span style={{ fontWeight: '600' }}>Acil Aksiyon Gerekli</span>
            </div>
          )}
        </div>

        {/* Ölü Stok Maliyeti KPI */}
        <div 
          style={{
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(217, 119, 6, 0.1) 100%)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
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
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(245, 158, 11, 0.3)'
            e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.5)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.2)'
            e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.3)'
          }}
        >
          <div style={{
            position: 'absolute',
            top: '-20px',
            right: '-20px',
            width: '80px',
            height: '80px',
            background: 'rgba(245, 158, 11, 0.1)',
            borderRadius: '50%',
            filter: 'blur(20px)'
          }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem', position: 'relative', zIndex: 1 }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
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
                Ölü Stok Maliyeti
              </div>
              <div style={{ 
                display: 'flex', 
                alignItems: 'baseline', 
                gap: '0.5rem'
              }}>
                <div style={{ 
                  color: '#f59e0b', 
                  fontSize: '2rem', 
                  fontWeight: '700',
                  lineHeight: '1'
                }}>
                  {deadStockValue >= 1000000 
                    ? `${(deadStockValue / 1000000).toFixed(1)}M`
                    : deadStockValue >= 1000
                    ? `${(deadStockValue / 1000).toFixed(0)}K`
                    : deadStockValue.toLocaleString('tr-TR')}
                </div>
                <div style={{
                  color: '#64748b',
                  fontSize: '0.75rem',
                  fontWeight: '500'
                }}>
                  ₺
                </div>
              </div>
            </div>
          </div>
          <div style={{
            fontSize: '0.75rem',
            color: '#fbbf24',
            position: 'relative', zIndex: 1,
            fontStyle: 'italic'
          }}>
            Son 6 aydır kullanılmadı
          </div>
        </div>

        {/* Aylık Bakım/Parça Gideri KPI */}
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
              📊
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
                Aylık Bakım/Parça Gideri
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
                  {monthlyMaintenanceCost >= 1000000 
                    ? `${(monthlyMaintenanceCost / 1000000).toFixed(1)}M`
                    : monthlyMaintenanceCost >= 1000
                    ? `${(monthlyMaintenanceCost / 1000).toFixed(0)}K`
                    : monthlyMaintenanceCost.toLocaleString('tr-TR')}
                </div>
                <div style={{
                  color: '#64748b',
                  fontSize: '0.75rem',
                  fontWeight: '500'
                }}>
                  ₺
                </div>
              </div>
            </div>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.85rem',
            color: '#cbd5e1',
            position: 'relative', zIndex: 1
          }}>
            {monthlyCostTrend > 0 ? (
              <>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#ef4444',
                  boxShadow: '0 0 8px rgba(239, 68, 68, 0.6)'
                }} />
                <span>
                  <strong style={{ color: '#ef4444', fontWeight: '600' }}>%{Math.abs(monthlyCostTrend).toFixed(1)}</strong> artış
                </span>
              </>
            ) : (
              <>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#10b981',
                  boxShadow: '0 0 8px rgba(16, 185, 129, 0.6)'
                }} />
                <span>
                  <strong style={{ color: '#10b981', fontWeight: '600' }}>%{Math.abs(monthlyCostTrend).toFixed(1)}</strong> azalış
                </span>
              </>
            )}
            <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>(Geçen aya göre)</span>
          </div>
        </div>
      </div>

      {/* Kategoriye Göre Kullanım Grafiği */}
      <div style={{ 
        marginBottom: '2rem',
        background: 'rgba(15, 23, 42, 0.9)',
        border: '1px solid rgba(59, 130, 246, 0.3)',
        borderRadius: '16px',
        padding: '2rem',
        boxShadow: '0 8px 32px rgba(59, 130, 246, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(10px)',
        position: 'relative',
        zIndex: 1,
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: '-30%',
          left: '-20%',
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(80px)',
          pointerEvents: 'none',
          zIndex: 0
        }} />
        <div style={{ 
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingBottom: '1.5rem',
          marginBottom: '1.5rem',
          position: 'relative',
          zIndex: 1
        }}>
          <h3 style={{ 
            color: '#ffffff', 
            margin: 0,
            fontSize: '1.5rem',
            fontWeight: '700',
            letterSpacing: '-0.3px'
          }}>
            {graphViewMode === 'year' ? `${selectedYear} Yılı Kategoriye Göre Kullanım` : 'Parça Bazında Yıllık Kullanım Trendi (2020-2025)'}
          </h3>
          
          {/* Görünüm Modu Seçimi */}
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button
              onClick={() => setGraphViewMode('year')}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                border: 'none',
                background: graphViewMode === 'year' ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' : 'rgba(59, 130, 246, 0.2)',
                color: '#ffffff',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s',
                boxShadow: graphViewMode === 'year' ? '0 2px 8px rgba(59, 130, 246, 0.3)' : 'none'
              }}
            >
              Yıl Seçimi
            </button>
            
            {graphViewMode === 'year' && (
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#ffffff',
                  background: 'rgba(30, 30, 46, 0.8)',
                  cursor: 'pointer',
                  transition: 'all 0.3s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(59, 130, 246, 0.3)'}
              >
                {years.filter(y => y !== 2026).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            )}
            
            <button
              onClick={() => setGraphViewMode('trend')}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                border: 'none',
                background: graphViewMode === 'trend' ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' : 'rgba(59, 130, 246, 0.2)',
                color: '#ffffff',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s',
                boxShadow: graphViewMode === 'trend' ? '0 2px 8px rgba(59, 130, 246, 0.3)' : 'none'
              }}
            >
              Trend (2020-2025)
            </button>
          </div>
        </div>
        
        <div style={{ padding: '1.5rem' }}>
          {/* Yıl Seçimi Görünümü */}
          {graphViewMode === 'year' && (
            <>
              <ResponsiveContainer width="100%" height={350}>
            <BarChart 
              data={Object.entries(mockYearlyPartUsage[selectedYear] || {}).map(([partName, value]) => ({ category: partName, kullanım: value }))}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              <defs>
                {/* Gradient tanımları - 5 parça */}
                <linearGradient id="gradientMotorYagi" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
                  <stop offset="100%" stopColor="#2563eb" stopOpacity={0.8} />
                </linearGradient>
                <linearGradient id="gradientFiltreSeti" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity={1} />
                  <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.8} />
                </linearGradient>
                <linearGradient id="gradientFren" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={1} />
                  <stop offset="100%" stopColor="#dc2626" stopOpacity={0.8} />
                </linearGradient>
                <linearGradient id="gradientLastik" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity={1} />
                  <stop offset="100%" stopColor="#d97706" stopOpacity={0.8} />
                </linearGradient>
                <linearGradient id="gradientElektrik" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                  <stop offset="100%" stopColor="#059669" stopOpacity={0.8} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.08)" vertical={false} />
              <XAxis 
                dataKey="category" 
                stroke="#94a3b8"
                tick={{ fill: '#cbd5e1', fontSize: 11, fontWeight: '500' }}
                axisLine={{ stroke: 'rgba(255, 255, 255, 0.2)' }}
                tickLine={{ stroke: 'rgba(255, 255, 255, 0.2)' }}
                angle={-15}
                textAnchor="end"
                height={70}
              />
              <YAxis 
                stroke="#94a3b8"
                tick={{ fill: '#cbd5e1', fontSize: 12 }}
                axisLine={{ stroke: 'rgba(255, 255, 255, 0.2)' }}
                tickLine={{ stroke: 'rgba(255, 255, 255, 0.2)' }}
                label={{ value: 'Kullanım Miktarı (adet)', angle: -90, position: 'insideLeft', fill: '#cbd5e1', style: { fontSize: 13, fontWeight: '500' } }}
              />
              <Tooltip 
                contentStyle={{
                  background: 'rgba(15, 23, 42, 0.98)',
                  border: '1px solid rgba(59, 130, 246, 0.5)',
                  borderRadius: '12px',
                  color: '#ffffff',
                  padding: '12px 16px',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)'
                }}
                labelStyle={{ 
                  color: '#ffffff', 
                  fontWeight: '700', 
                  marginBottom: '8px',
                  fontSize: '14px'
                }}
                itemStyle={{ 
                  color: '#cbd5e1',
                  fontSize: '13px',
                  padding: '4px 0'
                }}
                formatter={(value, name) => [
                  <span key="value" style={{ fontWeight: '700', color: '#3b82f6' }}>
                    {value ? value.toLocaleString('tr-TR') : '0'} adet
                  </span>,
                  name
                ]}
                cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
              />
              <Legend 
                wrapperStyle={{ 
                  color: '#cbd5e1',
                  paddingTop: '20px',
                  fontSize: '13px',
                  fontWeight: '500'
                }}
                iconType="square"
              />
              <Bar 
                dataKey="kullanım" 
                name="Kullanım Miktarı" 
                radius={[12, 12, 0, 0]}
                animationDuration={1000}
                animationBegin={0}
              >
                {Object.entries(mockYearlyPartUsage[selectedYear] || {}).map((entry, index) => {
                  const partName = entry[0]
                  const categoryColors = {
                    'Motor Yağı': 'url(#gradientMotorYagi)',
                    'Filtre Seti': 'url(#gradientFiltreSeti)',
                    'Fren Balata': 'url(#gradientFren)',
                    'Lastik': 'url(#gradientLastik)',
                    'Akü': 'url(#gradientElektrik)'
                  }
                  const solidColors = {
                    'Motor Yağı': '#3b82f6',
                    'Filtre Seti': '#8b5cf6',
                    'Fren Balata': '#ef4444',
                    'Lastik': '#f59e0b',
                    'Akü': '#10b981'
                  }
                  return (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={categoryColors[partName] || solidColors[partName] || '#3b82f6'}
                      style={{ filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.3))' }}
                    />
                  )
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          
          {/* Kategori özet kartları */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '0.75rem',
            marginTop: '1.5rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            {Object.entries(mockYearlyPartUsage[selectedYear] || {}).map(([partName, value], index) => {
              const partIcons = {
                'Motor Yağı': '🛢️',
                'Filtre Seti': '🔧',
                'Fren Balata': '🛑',
                'Lastik': '🛞',
                'Akü': '⚡',
                'Frigo Dorse Motoru': '❄️'
              }
              const partColors = {
                'Motor Yağı': '#3b82f6',
                'Filtre Seti': '#8b5cf6',
                'Fren Balata': '#ef4444',
                'Lastik': '#f59e0b',
                'Akü': '#10b981',
                'Frigo Dorse Motoru': '#06b6d4'
              }
              const color = partColors[partName] || '#3b82f6'
              
              // Artış oranını hesapla
              let changePercent = 0
              let growthColor = '#cbd5e1'
              let yearLabel = ''
              
              if (selectedYear === 2025) {
                // 2025 seçildiğinde: Yıllık ortalama artış oranını göster (2026 tahmini ile aynı)
                const value2020 = mockYearlyPartUsage[2020]?.[partName] || 0
                const value2025 = value
                const yearsBetween = 5 // 2020-2025 arası 5 yıl
                const annualGrowthRate = value2020 > 0 ? (((value2025 / value2020) ** (1 / yearsBetween)) - 1) * 100 : 0
                changePercent = annualGrowthRate
                yearLabel = 'Yıllık ortalama artış'
              } else if (selectedYear > 2020) {
                // Diğer yıllarda: Seçilen yıl ile bir önceki yıl arasındaki artış oranı
                const previousYear = selectedYear - 1
                const currentValue = value
                const previousValue = mockYearlyPartUsage[previousYear]?.[partName] || 0
                const change = currentValue - previousValue
                changePercent = previousValue > 0 ? ((change / previousValue) * 100) : 0
                yearLabel = `${previousYear}-${selectedYear} artış`
              }
              
              growthColor = changePercent > 0 ? '#10b981' : changePercent < 0 ? '#ef4444' : '#cbd5e1'
              
              return (
                <div
                  key={partName}
                  style={{
                    padding: '0.75rem',
                    background: `linear-gradient(135deg, ${color}15 0%, ${color}08 100%)`,
                    borderRadius: '8px',
                    border: `1px solid ${color}40`,
                    textAlign: 'center',
                    transition: 'all 0.3s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = `0 4px 12px ${color}40`
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>
                    {partIcons[partName] || '📦'}
                  </div>
                  <div style={{ 
                    color: '#ffffff', 
                    fontWeight: '700', 
                    fontSize: '1.1rem',
                    marginBottom: '0.25rem'
                  }}>
                    {value.toLocaleString('tr-TR')}
                  </div>
                  <div style={{ 
                    color: color, 
                    fontSize: '0.7rem', 
                    fontWeight: '600',
                    textTransform: 'none',
                    letterSpacing: '0.3px',
                    lineHeight: '1.2',
                    marginBottom: '0.5rem'
                  }}>
                    {partName}
                  </div>
                  {(selectedYear >= 2025 || (selectedYear > 2020 && selectedYear < 2025)) && (
                    <div style={{ 
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.25rem',
                      paddingTop: '0.5rem',
                      borderTop: `1px solid ${color}30`
                    }}>
                      <div style={{ 
                        color: growthColor, 
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.25rem'
                      }}>
                        <span>{changePercent > 0 ? '↑' : changePercent < 0 ? '↓' : '→'}</span>
                        <span>{Math.abs(changePercent).toFixed(1)}%</span>
                      </div>
                      <div style={{ 
                        color: '#94a3b8', 
                        fontSize: '0.65rem',
                        fontStyle: 'italic'
                      }}>
                        {yearLabel}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
            </>)
          }
          
          {/* Trend Görünümü (2020-2025) */}
          {graphViewMode === 'trend' && (
            <>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart 
                  data={yearlyTrendData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                >
                  <defs>
                    {/* Gradient tanımları - 5 parça */}
                    <linearGradient id="gradientMotorYagiTrend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
                      <stop offset="100%" stopColor="#2563eb" stopOpacity={0.8} />
                    </linearGradient>
                    <linearGradient id="gradientFiltreSetiTrend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8b5cf6" stopOpacity={1} />
                      <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.8} />
                    </linearGradient>
                    <linearGradient id="gradientFrenTrend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ef4444" stopOpacity={1} />
                      <stop offset="100%" stopColor="#dc2626" stopOpacity={0.8} />
                    </linearGradient>
                    <linearGradient id="gradientLastikTrend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f59e0b" stopOpacity={1} />
                      <stop offset="100%" stopColor="#d97706" stopOpacity={0.8} />
                    </linearGradient>
                    <linearGradient id="gradientElektrikTrend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                      <stop offset="100%" stopColor="#059669" stopOpacity={0.8} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.08)" vertical={false} />
                  <XAxis 
                    dataKey="year" 
                    stroke="#94a3b8"
                    tick={{ fill: '#cbd5e1', fontSize: 13, fontWeight: '500' }}
                    axisLine={{ stroke: 'rgba(255, 255, 255, 0.2)' }}
                    tickLine={{ stroke: 'rgba(255, 255, 255, 0.2)' }}
                  />
                  <YAxis 
                    stroke="#94a3b8"
                    tick={{ fill: '#cbd5e1', fontSize: 12 }}
                    axisLine={{ stroke: 'rgba(255, 255, 255, 0.2)' }}
                    tickLine={{ stroke: 'rgba(255, 255, 255, 0.2)' }}
                    label={{ value: 'Kullanım Miktarı (adet)', angle: -90, position: 'insideLeft', fill: '#cbd5e1', style: { fontSize: 13, fontWeight: '500' } }}
                  />
                  <Tooltip 
                    contentStyle={{
                      background: 'rgba(15, 23, 42, 0.98)',
                      border: '1px solid rgba(59, 130, 246, 0.5)',
                      borderRadius: '12px',
                      color: '#ffffff',
                      padding: '12px 16px',
                      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)'
                    }}
                    labelStyle={{ 
                      color: '#ffffff', 
                      fontWeight: '700', 
                      marginBottom: '8px',
                      fontSize: '14px'
                    }}
                    itemStyle={{ 
                      color: '#cbd5e1',
                      fontSize: '13px',
                      padding: '4px 0'
                    }}
                    formatter={(value, name) => [
                      <span key="value" style={{ fontWeight: '700', color: '#3b82f6' }}>
                        {value ? value.toLocaleString('tr-TR') : '0'} adet
                      </span>,
                      name
                    ]}
                    cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
                  />
                  <Legend 
                    wrapperStyle={{ 
                      color: '#cbd5e1',
                      paddingTop: '20px',
                      fontSize: '13px',
                      fontWeight: '500'
                    }}
                    iconType="square"
                    formatter={(value) => {
                      // Sadece parça ismini göster, miktar bilgisi ekleme
                      return value
                    }}
                  />
                  <Bar dataKey="Motor Yağı" fill="url(#gradientMotorYagiTrend)" name="Motor Yağı" radius={[12, 12, 0, 0]} />
                  <Bar dataKey="Filtre Seti" fill="url(#gradientFiltreSetiTrend)" name="Filtre Seti" radius={[12, 12, 0, 0]} />
                  <Bar dataKey="Fren Balata" fill="url(#gradientFrenTrend)" name="Fren Balata" radius={[12, 12, 0, 0]} />
                  <Bar dataKey="Lastik" fill="url(#gradientLastikTrend)" name="Lastik" radius={[12, 12, 0, 0]} />
                  <Bar dataKey="Akü" fill="url(#gradientElektrikTrend)" name="Akü" radius={[12, 12, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              
              {/* Yıllık Trend Özet Kartları */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                gap: '0.75rem',
                marginTop: '1.5rem',
                paddingTop: '1.5rem',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                {(() => {
                  // 2020-2025 yılları için toplam kullanımı ve yıllık ortalama artış oranını hesapla
                  const partStats = {}
                  Object.keys(mockYearlyPartUsage[2020] || {}).forEach(partName => {
                    const value2020 = mockYearlyPartUsage[2020]?.[partName] || 0
                    const value2025 = mockYearlyPartUsage[2025]?.[partName] || 0
                    const totalValue = yearlyTrendData.reduce((sum, yearData) => sum + (yearData[partName] || 0), 0)
                    const averageValue = totalValue / yearlyTrendData.length
                    
                    // Yıllık ortalama artış oranı (CAGR - Compound Annual Growth Rate)
                    // CAGR = ((Son Değer / İlk Değer) ^ (1 / Yıl Sayısı) - 1) * 100
                    const yearsBetween = 5 // 2020-2025 arası 5 yıl
                    const annualGrowthRate = value2020 > 0 ? (((value2025 / value2020) ** (1 / yearsBetween)) - 1) * 100 : 0
                    
                    partStats[partName] = {
                      average: averageValue,
                      growthRate: annualGrowthRate,
                      value2020,
                      value2025
                    }
                  })
                  
                  return Object.entries(partStats).map(([partName, stats]) => {
                    const partIcons = {
                      'Motor Yağı': '🛢️',
                      'Filtre Seti': '🔧',
                      'Fren Balata': '🛑',
                      'Lastik': '🛞',
                      'Akü': '⚡'
                    }
                    const partColors = {
                      'Motor Yağı': '#3b82f6',
                      'Filtre Seti': '#8b5cf6',
                      'Fren Balata': '#ef4444',
                      'Lastik': '#f59e0b',
                      'Akü': '#10b981'
                    }
                    const color = partColors[partName] || '#3b82f6'
                    const growthColor = stats.growthRate > 0 ? '#10b981' : stats.growthRate < 0 ? '#ef4444' : '#cbd5e1'
                    
                    return (
                      <div
                        key={partName}
                        style={{
                          padding: '0.75rem',
                          background: `linear-gradient(135deg, ${color}15 0%, ${color}08 100%)`,
                          borderRadius: '8px',
                          border: `1px solid ${color}40`,
                          textAlign: 'center',
                          transition: 'all 0.3s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)'
                          e.currentTarget.style.boxShadow = `0 4px 12px ${color}40`
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)'
                          e.currentTarget.style.boxShadow = 'none'
                        }}
                      >
                        <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
                          {partIcons[partName] || '📦'}
                        </div>
                        <div style={{ 
                          color: color, 
                          fontSize: '0.7rem', 
                          fontWeight: '600',
                          textTransform: 'none',
                          letterSpacing: '0.3px',
                          lineHeight: '1.2',
                          marginBottom: '0.75rem'
                        }}>
                          {partName}
                        </div>
                        <div style={{ 
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.25rem',
                          paddingTop: '0.75rem',
                          borderTop: `1px solid ${color}30`
                        }}>
                          <div style={{ 
                            color: growthColor, 
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.25rem'
                          }}>
                            <span>{stats.growthRate > 0 ? '↑' : stats.growthRate < 0 ? '↓' : '→'}</span>
                            <span>{Math.abs(stats.growthRate).toFixed(1)}%</span>
                          </div>
                          <div style={{ 
                            color: '#94a3b8', 
                            fontSize: '0.65rem',
                            fontStyle: 'italic'
                          }}>
                            Yıllık ortalama artış
                          </div>
                        </div>
                      </div>
                    )
                  })
                })()}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Gelecek Yıl Tahmini ve Karar Önerileri */}
      <div style={{ 
        marginBottom: '2rem',
        background: 'rgba(15, 23, 42, 0.9)',
        border: '1px solid rgba(59, 130, 246, 0.3)',
        borderRadius: '16px',
        padding: '2rem',
        boxShadow: '0 8px 32px rgba(59, 130, 246, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(10px)',
        position: 'relative',
        zIndex: 1,
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: '-30%',
          right: '-20%',
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(80px)',
          pointerEvents: 'none',
          zIndex: 0
        }} />
        <div style={{ 
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          paddingBottom: '1.5rem',
          marginBottom: '1.5rem',
          position: 'relative',
          zIndex: 1
        }}>
          <h3 style={{ 
            color: '#ffffff',
            margin: 0,
            fontSize: '1.5rem',
            fontWeight: '700',
            letterSpacing: '-0.3px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span>🔮</span>
            <span>2026 Yılı Tahmini ve Karar Önerileri</span>
          </h3>
        </div>
        <div style={{ padding: '1.5rem' }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
            gap: '1rem',
            marginBottom: '1.5rem'
          }}>
            {Object.entries(mockYearlyPartUsage[2025] || {}).map(([partName, current]) => {
              // Yıllık ortalama artış oranını hesapla (2020-2025 CAGR)
              const value2020 = mockYearlyPartUsage[2020]?.[partName] || 0
              const value2025 = current
              const yearsBetween = 5 // 2020-2025 arası 5 yıl
              const annualGrowthRate = value2020 > 0 ? (((value2025 / value2020) ** (1 / yearsBetween)) - 1) * 100 : 0
              
              // 2026 tahmini: Yıllık ortalama artış oranına göre hesapla
              const predicted = current * (1 + annualGrowthRate / 100)
              const change = predicted - current
              
              const changePercent = annualGrowthRate.toFixed(1)
              const trend = annualGrowthRate > 0 ? 'artış' : annualGrowthRate < 0 ? 'azalış' : 'sabit'
              const trendColor = annualGrowthRate > 0 ? '#ef4444' : annualGrowthRate < 0 ? '#10b981' : '#cbd5e1'
              
              return (
                <div
                  key={partName}
                  style={{
                    padding: '1rem',
                    background: 'rgba(15, 23, 42, 0.5)',
                    borderRadius: '8px',
                    border: `1px solid ${trendColor}40`,
                    transition: 'all 0.3s'
                  }}
                >
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: '0.5rem'
                  }}>
                    <span style={{ color: '#ffffff', fontWeight: '700', fontSize: '0.95rem' }}>
                      {partName}
                    </span>
                    <span style={{ 
                      color: trendColor, 
                      fontSize: '0.85rem', 
                      fontWeight: '600' 
                    }}>
                      {annualGrowthRate > 0 ? '↑' : annualGrowthRate < 0 ? '↓' : '→'} {Math.abs(changePercent)}%
                    </span>
                  </div>
                  <div style={{ color: '#cbd5e1', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                    2025: <strong style={{ color: '#ffffff' }}>{current.toLocaleString('tr-TR')}</strong> adet
                  </div>
                  <div style={{ color: '#cbd5e1', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                    2026 Tahmini: <strong style={{ color: trendColor }}>{Math.round(predicted).toLocaleString('tr-TR')}</strong> adet
                  </div>
                  <div style={{ 
                    padding: '0.5rem',
                    background: 'rgba(59, 130, 246, 0.1)',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    color: '#cbd5e1',
                    fontStyle: 'italic'
                  }}>
                    {annualGrowthRate > 0 
                      ? `⚠️ Yıllık ortalama %${Math.abs(changePercent)} artış göz önünde bulundurularak stok planlaması yapılmalı`
                      : annualGrowthRate < 0 
                      ? `✅ Yıllık ortalama %${Math.abs(changePercent)} azalış bekleniyor`
                      : 'Stok seviyesi sabit kalabilir'}
                  </div>
                </div>
              )
            })}
          </div>
          
        </div>
      </div>

      {/* Düşük Stok Uyarıları */}
      {criticalStockItems.length > 0 && (
        <div style={{ 
          marginBottom: '2rem',
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.1) 100%)',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          borderRadius: '16px',
          padding: '2rem',
          boxShadow: '0 8px 32px rgba(239, 68, 68, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          position: 'relative',
          zIndex: 1,
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: '-50px',
            right: '-50px',
            width: '150px',
            height: '150px',
            background: 'radial-gradient(circle, rgba(239, 68, 68, 0.2) 0%, transparent 70%)',
            borderRadius: '50%',
            filter: 'blur(40px)',
            pointerEvents: 'none'
          }} />
          <div style={{ 
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            paddingBottom: '1.5rem',
            marginBottom: '1.5rem',
            position: 'relative',
            zIndex: 1
          }}>
            <h3 style={{ 
              color: '#ef4444',
              margin: 0,
              fontSize: '1.5rem',
              fontWeight: '700',
              letterSpacing: '-0.3px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span>⚠️</span>
              <span>Düşük Stok Uyarıları</span>
            </h3>
          </div>
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '1rem',
            position: 'relative',
            zIndex: 1
          }}>
            {criticalStockItems.map(item => {
              const stock = Number(item.stock) || 0
              const minStock = Number(item.min_stock) || 0
              const stockPercent = minStock > 0 ? Math.round((stock / minStock) * 100) : 0
              
              // Parça ikonları ve renkleri
              const partIcons = {
                'Motor Yağı': '🛢️',
                'Filtre Seti': '🔧',
                'Fren Balata': '🛑',
                'Lastik': '🛞',
                'Akü': '⚡',
                'Frigo Dorse Motoru': '❄️'
              }
              const partColors = {
                'Motor Yağı': '#3b82f6',
                'Filtre Seti': '#8b5cf6',
                'Fren Balata': '#ef4444',
                'Lastik': '#f59e0b',
                'Akü': '#10b981',
                'Frigo Dorse Motoru': '#06b6d4'
              }
              const partColor = partColors[item.name] || '#ef4444'
              const partIcon = partIcons[item.name] || '⚠️'
              
              return (
                <div
                  key={item.id}
                  style={{
                    padding: '1.5rem',
                    background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.1) 100%)',
                    borderRadius: '12px',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(239, 68, 68, 0.3)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.2)'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    marginBottom: '1rem'
                  }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: `linear-gradient(135deg, ${partColor} 0%, ${partColor}dd 100%)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.25rem',
                      boxShadow: `0 4px 12px ${partColor}40`
                    }}>
                      {partIcon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: '1rem',
                        fontWeight: '700',
                        color: '#ffffff',
                        marginBottom: '0.25rem'
                      }}>
                        {item.name || 'İsimsiz'}
                      </div>
                      <div style={{
                        fontSize: '0.75rem',
                        color: '#94a3b8',
                        fontWeight: '500'
                      }}>
                        {item.category || 'Diğer'}
                      </div>
                    </div>
                    <div style={{
                      padding: '0.5rem 0.75rem',
                      background: 'rgba(239, 68, 68, 0.2)',
                      borderRadius: '8px',
                      border: '1px solid rgba(239, 68, 68, 0.4)'
                    }}>
                      <div style={{
                        fontSize: '0.7rem',
                        color: '#ef4444',
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        Kritik
                      </div>
                    </div>
                  </div>
                  
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '0.75rem',
                    marginBottom: '1rem'
                  }}>
                    <div style={{
                      padding: '0.75rem',
                      background: 'rgba(15, 23, 42, 0.6)',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      <div style={{
                        fontSize: '0.7rem',
                        color: '#94a3b8',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        marginBottom: '0.25rem'
                      }}>
                        Mevcut Stok
                      </div>
                      <div style={{
                        fontSize: '1.25rem',
                        fontWeight: '700',
                        color: '#ef4444',
                        lineHeight: '1'
                      }}>
                        {stock.toLocaleString('tr-TR')}
                      </div>
                    </div>
                    <div style={{
                      padding: '0.75rem',
                      background: 'rgba(15, 23, 42, 0.6)',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      <div style={{
                        fontSize: '0.7rem',
                        color: '#94a3b8',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        marginBottom: '0.25rem'
                      }}>
                        Min. Stok
                      </div>
                      <div style={{
                        fontSize: '1.25rem',
                        fontWeight: '700',
                        color: '#ffffff',
                        lineHeight: '1'
                      }}>
                        {minStock.toLocaleString('tr-TR')}
                      </div>
                    </div>
                  </div>
                  
                  <div style={{
                    marginBottom: '0.75rem'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '0.5rem'
                    }}>
                      <div style={{
                        fontSize: '0.75rem',
                        color: '#94a3b8',
                        fontWeight: '600'
                      }}>
                        Stok Seviyesi
                      </div>
                      <div style={{
                        fontSize: '0.875rem',
                        fontWeight: '700',
                        color: stockPercent < 100 ? '#ef4444' : '#f59e0b'
                      }}>
                        %{stockPercent}
                      </div>
                    </div>
                    <div style={{
                      width: '100%',
                      height: '8px',
                      background: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${Math.min(100, stockPercent)}%`,
                        height: '100%',
                        background: stockPercent < 100 
                          ? 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)'
                          : 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 0 8px rgba(239, 68, 68, 0.6)'
                      }} />
                    </div>
                  </div>
                  
                  <div style={{
                    padding: '0.75rem',
                    background: 'rgba(239, 68, 68, 0.1)',
                    borderRadius: '8px',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    textAlign: 'center'
                  }}>
                    <div style={{
                      fontSize: '0.875rem',
                      fontWeight: '700',
                      color: '#ef4444',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      marginBottom: item.criticalReason ? '0.5rem' : '0'
                    }}>
                      ⚠️ Acil Tedarik Gerekli
                    </div>
                    {item.criticalReason && (
                      <div style={{
                        fontSize: '0.75rem',
                        color: '#fca5a5',
                        fontWeight: '500',
                        fontStyle: 'italic',
                        marginTop: '0.5rem'
                      }}>
                        📌 Nedeni: {item.criticalReason}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}


      {/* Parça Alımı Simülasyonu */}
      <div style={{
        background: 'rgba(15, 23, 42, 0.9)',
        border: '1px solid rgba(59, 130, 246, 0.3)',
        borderRadius: '16px',
        padding: '2rem',
        boxShadow: '0 8px 32px rgba(59, 130, 246, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(10px)',
        marginBottom: '2rem',
        position: 'relative',
        zIndex: 1,
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: '-30%',
          right: '-20%',
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(80px)',
          pointerEvents: 'none',
          zIndex: 0
        }} />
        <div style={{ 
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          paddingBottom: '1.5rem',
          marginBottom: '1.5rem',
          position: 'relative',
          zIndex: 1
        }}>
          <h3 style={{ 
            color: '#ffffff',
            margin: 0,
            fontSize: '1.5rem',
            fontWeight: '700',
            letterSpacing: '-0.3px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span>🛒</span>
            <span>Parça Alımı Simülasyonu</span>
          </h3>
        </div>
        <div style={{ padding: '1.75rem' }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
            gap: '1.25rem',
            marginBottom: '1.5rem'
          }}>
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.6rem', 
                color: '#cbd5e1',
                fontWeight: '600',
                fontSize: '0.9rem'
              }}>
                Parça Seçin
              </label>
              <select
                value={simulationPart?.id || ''}
                onChange={(e) => {
                  const selected = spareParts.find(p => p.id === Number(e.target.value))
                  setSimulationPart(selected || null)
                  if (selected) {
                    setSimulationQuantity(0)
                    setSimulationResult(null)
                  } else {
                    setSimulationQuantity(0)
                    setSimulationResult(null)
                  }
                }}
                style={{
                  width: '100%',
                  padding: '0.85rem',
                  borderRadius: '10px',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  background: 'rgba(30, 38, 57, 0.6)',
                  color: '#ffffff',
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  backdropFilter: 'blur(5px)'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'rgba(139, 92, 246, 0.5)'
                  e.target.style.background = 'rgba(30, 38, 57, 0.8)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(139, 92, 246, 0.3)'
                  e.target.style.background = 'rgba(30, 38, 57, 0.6)'
                }}
              >
                <option value="">Parça seçin...</option>
                {spareParts.map(part => (
                  <option key={part.id} value={part.id}>
                    {part.name} (Mevcut: {Number(part.stock) || 0}, Min: {Number(part.min_stock) || 0})
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.6rem', 
                color: '#cbd5e1',
                fontWeight: '600',
                fontSize: '0.9rem'
              }}>
                Alınacak Miktar
              </label>
              <input
                type="number"
                min="0"
                value={simulationQuantity === 0 ? '' : simulationQuantity}
                onChange={(e) => {
                  const value = e.target.value
                  const qty = value === '' ? 0 : Math.max(0, Number(value) || 0)
                  setSimulationQuantity(qty)
                  if (simulationPart && qty > 0) {
                    runSimulation(simulationPart, qty)
                  } else {
                    setSimulationResult(null)
                  }
                }}
                placeholder="Miktar girin..."
                style={{
                  width: '100%',
                  padding: '0.85rem',
                  borderRadius: '10px',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  background: 'rgba(30, 38, 57, 0.6)',
                  color: '#ffffff',
                  fontSize: '0.95rem',
                  transition: 'all 0.2s ease',
                  backdropFilter: 'blur(5px)'
                }}
                disabled={!simulationPart}
                onFocus={(e) => {
                  if (simulationPart) {
                    e.target.style.borderColor = 'rgba(139, 92, 246, 0.5)'
                    e.target.style.background = 'rgba(30, 38, 57, 0.8)'
                  }
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(139, 92, 246, 0.3)'
                  e.target.style.background = 'rgba(30, 38, 57, 0.6)'
                }}
              />
            </div>
          </div>
          
          {simulationResult && (
            <div style={{
              padding: '1.75rem',
              background: 'linear-gradient(135deg, rgba(30, 38, 57, 0.7) 0%, rgba(15, 23, 42, 0.7) 100%)',
              borderRadius: '12px',
              border: `1px solid ${simulationResult.status === 'optimal' ? 'rgba(16, 185, 129, 0.4)' :
                      simulationResult.status === 'warning' ? 'rgba(245, 158, 11, 0.4)' :
                      'rgba(239, 68, 68, 0.4)'}`,
              backdropFilter: 'blur(10px)',
              boxShadow: `0 4px 20px rgba(0, 0, 0, 0.3), 0 0 0 1px ${simulationResult.status === 'optimal' ? 'rgba(16, 185, 129, 0.1)' :
                      simulationResult.status === 'warning' ? 'rgba(245, 158, 11, 0.1)' :
                      'rgba(239, 68, 68, 0.1)'}`,
              marginTop: '1rem'
            }}>
              <h4 style={{ 
                color: '#ffffff', 
                marginBottom: '1rem',
                fontSize: '1.1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                {simulationResult.status === 'optimal' ? '✅' :
                 simulationResult.status === 'warning' ? '⚠️' : '❌'}
                Simülasyon Sonuçları
              </h4>
              
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                gap: '1rem',
                marginBottom: '1rem'
              }}>
                <div style={{
                  padding: '1.15rem',
                  background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0.08) 100%)',
                  borderRadius: '10px',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  backdropFilter: 'blur(5px)',
                  boxShadow: '0 2px 8px rgba(59, 130, 246, 0.15)'
                }}>
                  <div style={{ color: '#cbd5e1', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                    Mevcut Stok
                  </div>
                  <div style={{ color: '#ffffff', fontSize: '1.25rem', fontWeight: '700' }}>
                    {simulationResult.currentStock}
                  </div>
                </div>
                
                <div style={{
                  padding: '1.15rem',
                  background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0.08) 100%)',
                  borderRadius: '10px',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  backdropFilter: 'blur(5px)',
                  boxShadow: '0 2px 8px rgba(59, 130, 246, 0.15)'
                }}>
                  <div style={{ color: '#cbd5e1', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                    Alınacak Miktar
                  </div>
                  <div style={{ color: '#3b82f6', fontSize: '1.25rem', fontWeight: '700' }}>
                    +{simulationResult.purchaseQuantity}
                  </div>
                </div>
                
                <div style={{
                  padding: '1.15rem',
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.08) 100%)',
                  borderRadius: '10px',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  backdropFilter: 'blur(5px)',
                  boxShadow: '0 2px 8px rgba(16, 185, 129, 0.15)'
                }}>
                  <div style={{ color: '#cbd5e1', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                    Yeni Stok
                  </div>
                  <div style={{ color: '#10b981', fontSize: '1.25rem', fontWeight: '700' }}>
                    {simulationResult.newStock}
                  </div>
                </div>
                
                <div style={{
                  padding: '1.15rem',
                  background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(139, 92, 246, 0.08) 100%)',
                  borderRadius: '10px',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  backdropFilter: 'blur(5px)',
                  boxShadow: '0 2px 8px rgba(139, 92, 246, 0.15)'
                }}>
                  <div style={{ color: '#cbd5e1', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                    Toplam Maliyet
                  </div>
                  <div style={{ color: '#8b5cf6', fontSize: '1.25rem', fontWeight: '700' }}>
                    {simulationResult.totalCost.toLocaleString('tr-TR')} ₺
                  </div>
                </div>
              </div>
              
              <div style={{
                padding: '1.25rem',
                background: simulationResult.status === 'optimal' 
                  ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.08) 100%)' :
                  simulationResult.status === 'warning' 
                  ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(245, 158, 11, 0.08) 100%)' :
                  'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(239, 68, 68, 0.08) 100%)',
                borderRadius: '10px',
                border: `1px solid ${simulationResult.status === 'optimal' ? 'rgba(16, 185, 129, 0.4)' :
                        simulationResult.status === 'warning' ? 'rgba(245, 158, 11, 0.4)' :
                        'rgba(239, 68, 68, 0.4)'}`,
                marginBottom: '1.25rem',
                backdropFilter: 'blur(5px)',
                boxShadow: `0 2px 12px ${simulationResult.status === 'optimal' ? 'rgba(16, 185, 129, 0.2)' :
                        simulationResult.status === 'warning' ? 'rgba(245, 158, 11, 0.2)' :
                        'rgba(239, 68, 68, 0.2)'}`
              }}>
                <div style={{ 
                  color: simulationResult.status === 'optimal' ? '#10b981' :
                         simulationResult.status === 'warning' ? '#f59e0b' : '#ef4444',
                  fontWeight: '600',
                  marginBottom: '0.5rem',
                  fontSize: '1rem'
                }}>
                  {simulationResult.status === 'optimal' ? '✅ Optimal Stok Seviyesi' :
                   simulationResult.status === 'warning' ? '⚠️ Dikkat Gerekli' : '❌ Sorunlu Durum'}
                </div>
                <div style={{ color: '#cbd5e1', fontSize: '0.95rem', lineHeight: '1.6' }}>
                  {simulationResult.message}
                </div>
              </div>
              
              {simulationResult.recommendations && simulationResult.recommendations.length > 0 && (
                <div>
                  <h5 style={{ color: '#ffffff', marginBottom: '0.75rem', fontSize: '0.95rem' }}>
                    💡 Öneriler:
                  </h5>
                  <ul style={{ 
                    listStyle: 'none', 
                    padding: 0, 
                    margin: 0,
                    color: '#cbd5e1',
                    lineHeight: '1.8'
                  }}>
                    {simulationResult.recommendations.map((rec, idx) => (
                      <li key={idx} style={{ 
                        marginBottom: '0.5rem',
                        paddingLeft: '1.5rem',
                        position: 'relative'
                      }}>
                        <span style={{
                          position: 'absolute',
                          left: 0,
                          color: '#3b82f6'
                        }}>•</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Yedek Parça Listesi */}
      <div style={{
        background: 'rgba(15, 23, 42, 0.9)',
        border: '1px solid rgba(59, 130, 246, 0.3)',
        borderRadius: '16px',
        padding: '2rem',
        boxShadow: '0 8px 32px rgba(59, 130, 246, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(10px)',
        position: 'relative',
        zIndex: 1,
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: '-30%',
          left: '-20%',
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(80px)',
          pointerEvents: 'none',
          zIndex: 0
        }} />
        <div style={{ 
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          paddingBottom: '1.5rem',
          marginBottom: '1.5rem',
          position: 'relative',
          zIndex: 1
        }}>
          <h3 style={{ 
            color: '#ffffff',
            margin: 0,
            fontSize: '1.5rem',
            fontWeight: '700',
            letterSpacing: '-0.3px'
          }}>
            Yedek Parça Envanteri
          </h3>
        </div>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem'
        }}>
          {spareParts.map(part => {
            const stock = Number(part.stock) || 0
            const minStock = Number(part.min_stock) || 0
            const unitPrice = Number(part.unit_price) || 0
            const totalPrice = stock * unitPrice
            const daysRemaining = calculateDaysRemaining(part)
            const stockStatus = stock <= minStock ? 'critical' : stock <= minStock * 1.5 ? 'warning' : 'good'
            
            // Parça ikonları ve renkleri
            const partIcons = {
              'Motor Yağı': '🛢️',
              'Filtre Seti': '🔧',
              'Fren Balata': '🛑',
              'Lastik': '🛞',
              'Akü': '⚡',
              'Frigo Dorse Motoru': '❄️'
            }
            const partColors = {
              'Motor Yağı': '#3b82f6',
              'Filtre Seti': '#8b5cf6',
              'Fren Balata': '#ef4444',
              'Lastik': '#f59e0b',
              'Akü': '#10b981',
              'Frigo Dorse Motoru': '#06b6d4'
            }
            const partColor = partColors[part.name] || '#3b82f6'
            const partIcon = partIcons[part.name] || '📦'
            
            return (
              <div
                key={part.id}
                style={{
                  padding: '1.125rem',
                  background: `linear-gradient(135deg, ${partColor}15 0%, rgba(15, 23, 42, 0.9) 100%)`,
                  borderRadius: '10px',
                  border: `1px solid ${partColor}40`,
                  boxShadow: `0 3px 12px ${partColor}20, inset 0 1px 0 rgba(255, 255, 255, 0.05)`,
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateX(4px)'
                  e.currentTarget.style.borderColor = `${partColor}60`
                  e.currentTarget.style.boxShadow = `0 5px 16px ${partColor}30, inset 0 1px 0 rgba(255, 255, 255, 0.05)`
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateX(0)'
                  e.currentTarget.style.borderColor = `${partColor}40`
                  e.currentTarget.style.boxShadow = `0 3px 12px ${partColor}20, inset 0 1px 0 rgba(255, 255, 255, 0.05)`
                }}
              >
                {/* Dekoratif blur */}
                <div style={{
                  position: 'absolute',
                  top: '-20%',
                  right: '-10%',
                  width: '120px',
                  height: '120px',
                  background: `radial-gradient(circle, ${partColor}10 0%, transparent 70%)`,
                  borderRadius: '50%',
                  filter: 'blur(35px)',
                  pointerEvents: 'none'
                }} />
                
                {/* Liste Satırı */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'auto 1fr auto auto auto auto auto',
                  gap: '1.125rem',
                  alignItems: 'center',
                  position: 'relative',
                  zIndex: 1
                }}>
                  {/* İkon */}
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '9px',
                    background: `linear-gradient(135deg, ${partColor} 0%, ${partColor}dd 100%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.35rem',
                    boxShadow: `0 3px 10px ${partColor}40`,
                    flexShrink: 0
                  }}>
                    {partIcon}
                  </div>
                  
                  {/* Parça Adı ve Kategori */}
                  <div style={{ minWidth: '140px' }}>
                    <div style={{
                      fontSize: '1.05rem',
                      fontWeight: '700',
                      color: '#ffffff',
                      marginBottom: '0.2rem',
                      letterSpacing: '-0.3px'
                    }}>
                      {part.name || 'İsimsiz'}
                    </div>
                    <div style={{
                      fontSize: '0.8rem',
                      color: '#94a3b8',
                      fontWeight: '500'
                    }}>
                      {part.category || 'Diğer'}
                    </div>
                  </div>
                  
                  {/* Stok Bilgileri */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.2rem',
                    minWidth: '110px'
                  }}>
                    <div style={{
                      fontSize: '0.75rem',
                      color: '#94a3b8',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Stok
                    </div>
                    <div style={{
                      fontSize: '1.2rem',
                      fontWeight: '700',
                      color: '#ffffff',
                      lineHeight: '1'
                    }}>
                      {stock.toLocaleString('tr-TR')}
                    </div>
                    <div style={{
                      fontSize: '0.75rem',
                      color: '#64748b',
                      fontWeight: '500'
                    }}>
                      Min: {minStock.toLocaleString('tr-TR')}
                    </div>
                  </div>
                  
                  {/* Birim Fiyat */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.2rem',
                    minWidth: '95px'
                  }}>
                    <div style={{
                      fontSize: '0.75rem',
                      color: '#94a3b8',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Birim Fiyat
                    </div>
                    <div style={{
                      fontSize: '1rem',
                      fontWeight: '600',
                      color: '#cbd5e1'
                    }}>
                      {unitPrice.toLocaleString('tr-TR')} ₺
                    </div>
                  </div>
                  
                  {/* Toplam Değer */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.2rem',
                    minWidth: '125px'
                  }}>
                    <div style={{
                      fontSize: '0.75rem',
                      color: '#94a3b8',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Toplam Değer
                    </div>
                    <div style={{
                      fontSize: '1.2rem',
                      fontWeight: '700',
                      color: partColor,
                      lineHeight: '1'
                    }}>
                      {totalPrice.toLocaleString('tr-TR')} ₺
                    </div>
                  </div>
                  
                  {/* Kalan Ömür */}
                  {daysRemaining !== null && (
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.4rem',
                      minWidth: '135px'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.5rem'
                      }}>
                        <div style={{
                          fontSize: '0.75rem',
                          color: '#94a3b8',
                          fontWeight: '600',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          Kalan Ömür
                        </div>
                        <div style={{
                          fontSize: '1.1rem',
                          fontWeight: '700',
                          color: daysRemaining < 30 ? '#ef4444' :
                                 daysRemaining < 60 ? '#f59e0b' : '#10b981',
                          lineHeight: '1'
                        }}>
                          {daysRemaining} Gün
                        </div>
                      </div>
                      <div style={{
                        width: '100%',
                        height: '6px',
                        background: 'rgba(255, 255, 255, 0.1)',
                        borderRadius: '3px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          width: `${Math.min(100, (daysRemaining / 90) * 100)}%`,
                          height: '100%',
                          background: daysRemaining < 30 ? '#ef4444' :
                                     daysRemaining < 60 ? '#f59e0b' : '#10b981',
                          transition: 'all 0.3s ease',
                          boxShadow: `0 0 6px ${
                            daysRemaining < 30 ? 'rgba(239, 68, 68, 0.6)' :
                            daysRemaining < 60 ? 'rgba(245, 158, 11, 0.6)' :
                            'rgba(16, 185, 129, 0.6)'
                          }`
                        }} />
                      </div>
                    </div>
                  )}
                  
                  {/* Durum Badge */}
                  <div style={{
                    padding: '0.45rem 0.65rem',
                    background: stockStatus === 'critical' 
                      ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.1) 100%)'
                      : stockStatus === 'warning'
                      ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(217, 119, 6, 0.1) 100%)'
                      : 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.1) 100%)',
                    borderRadius: '7px',
                    border: `1px solid ${
                      stockStatus === 'critical' ? 'rgba(239, 68, 68, 0.4)' :
                      stockStatus === 'warning' ? 'rgba(245, 158, 11, 0.4)' :
                      'rgba(16, 185, 129, 0.4)'
                    }`,
                    flexShrink: 0
                  }}>
                    <div style={{
                      fontSize: '0.75rem',
                      color: stockStatus === 'critical' ? '#ef4444' :
                             stockStatus === 'warning' ? '#f59e0b' : '#10b981',
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      whiteSpace: 'nowrap'
                    }}>
                      {stockStatus === 'critical' ? 'Düşük' :
                       stockStatus === 'warning' ? 'Orta' : 'Yeterli'}
                    </div>
                  </div>
                  
                  {/* Tedarikçi ve İşlem */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.4rem',
                    minWidth: '170px'
                  }}>
                    <div style={{
                      fontSize: '0.75rem',
                      color: '#94a3b8',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      marginBottom: '0.2rem'
                    }}>
                      Tedarikçi
                    </div>
                    <div style={{
                      fontSize: '0.9rem',
                      color: '#ffffff',
                      fontWeight: '600',
                      marginBottom: '0.4rem'
                    }}>
                      {part.supplier || 'Belirtilmemiş'}
                    </div>
                    <button
                      onClick={() => {
                        const suppliers = [
                          { name: 'Tedarikçi A', price: unitPrice, deliveryDays: 2 },
                          { name: 'Tedarikçi B', price: Math.round(unitPrice * 0.9), deliveryDays: 15 }
                        ]
                        setQuickProcurementModal({ part, suppliers })
                      }}
                      style={{
                        padding: '0.55rem 0.9rem',
                        background: `linear-gradient(135deg, ${partColor}20 0%, ${partColor}10 100%)`,
                        border: `1px solid ${partColor}40`,
                        borderRadius: '7px',
                        color: partColor,
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: '700',
                        transition: 'all 0.3s ease',
                        whiteSpace: 'nowrap',
                        boxShadow: `0 2px 8px ${partColor}20`
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = `linear-gradient(135deg, ${partColor}30 0%, ${partColor}20 100%)`
                        e.currentTarget.style.borderColor = `${partColor}60`
                        e.currentTarget.style.boxShadow = `0 4px 12px ${partColor}30`
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = `linear-gradient(135deg, ${partColor}20 0%, ${partColor}10 100%)`
                        e.currentTarget.style.borderColor = `${partColor}40`
                        e.currentTarget.style.boxShadow = `0 2px 8px ${partColor}20`
                      }}
                    >
                      🛒 Hızlı Tedarik
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Hızlı Tedarik Simülasyonu Modal */}
      {quickProcurementModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '2rem'
        }}
        onClick={() => setQuickProcurementModal(null)}
        >
          <div 
            style={{
              background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
              borderRadius: '12px',
              padding: '2rem',
              maxWidth: '700px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ color: '#ffffff', fontSize: '1.5rem', fontWeight: '700', margin: 0 }}>
                🛒 {quickProcurementModal.part.name} Siparişi
              </h3>
              <button
                onClick={() => setQuickProcurementModal(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#cbd5e1',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  borderRadius: '6px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(239, 68, 68, 0.2)'
                  e.target.style.color = '#ef4444'
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'transparent'
                  e.target.style.color = '#cbd5e1'
                }}
              >
                ✕
              </button>
            </div>

            {/* Sistem Önerisi */}
            <div style={{
              padding: '1rem',
              background: 'rgba(59, 130, 246, 0.1)',
              borderRadius: '8px',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              marginBottom: '1.5rem'
            }}>
              <div style={{ color: '#3b82f6', fontWeight: '600', marginBottom: '0.5rem' }}>
                💡 Sistem Önerisi
              </div>
              <div style={{ color: '#cbd5e1', fontSize: '0.875rem' }}>
                Ortalama tüketim hızına göre 3 aylık stok için{' '}
                <strong style={{ color: '#ffffff' }}>
                  {Math.round((quickProcurementModal.part.min_stock || 20) * 6)} adet
                </strong>{' '}
                almalısın.
              </div>
            </div>

            {/* Tedarikçi Karşılaştırması */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ color: '#ffffff', fontSize: '1rem', marginBottom: '1rem' }}>
                Tedarikçi Seçenekleri
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {quickProcurementModal.suppliers.map((supplier, index) => {
                  const recommendedQty = Math.round((quickProcurementModal.part.min_stock || 20) * 6)
                  const totalCost = recommendedQty * supplier.price
                  const daysRemaining = calculateDaysRemaining(quickProcurementModal.part)
                  const isRecommended = daysRemaining && daysRemaining > supplier.deliveryDays && index === 1
                  
                  return (
                    <div
                      key={index}
                      style={{
                        padding: '1.5rem',
                        background: isRecommended 
                          ? 'rgba(16, 185, 129, 0.1)' 
                          : 'rgba(30, 30, 46, 0.5)',
                        borderRadius: '8px',
                        border: `1px solid ${isRecommended ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
                        position: 'relative'
                      }}
                    >
                      {isRecommended && (
                        <div style={{
                          position: 'absolute',
                          top: '0.5rem',
                          right: '0.5rem',
                          background: '#10b981',
                          color: '#ffffff',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: '600'
                        }}>
                          ✅ ÖNERİLEN
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                        <div>
                          <div style={{ color: '#ffffff', fontWeight: '700', fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                            {supplier.name}
                          </div>
                          <div style={{ color: '#cbd5e1', fontSize: '0.875rem' }}>
                            {supplier.price.toLocaleString('tr-TR')} ₺/adet • Teslimat: {supplier.deliveryDays} Gün
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ color: '#cbd5e1', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                            Toplam (120 adet)
                          </div>
                          <div style={{ color: '#ffffff', fontWeight: '700', fontSize: '1.25rem' }}>
                            {totalCost.toLocaleString('tr-TR')} ₺
                          </div>
                        </div>
                      </div>
                      
                      {isRecommended && (
                        <div style={{
                          padding: '0.75rem',
                          background: 'rgba(16, 185, 129, 0.2)',
                          borderRadius: '6px',
                          marginTop: '0.5rem'
                        }}>
                          <div style={{ color: '#10b981', fontSize: '0.875rem', fontWeight: '600' }}>
                            ✅ KDS Kararı:
                          </div>
                          <div style={{ color: '#cbd5e1', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                            Stokta seni {daysRemaining} gün idare edecek mal var. Acelesi yok. {supplier.name}'yi seç ve{' '}
                            <strong style={{ color: '#ffffff' }}>
                              {(quickProcurementModal.suppliers[0].price * recommendedQty - totalCost).toLocaleString('tr-TR')} ₺
                            </strong>{' '}
                            tasarruf et.
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Kapat Butonu */}
            <button
              onClick={() => setQuickProcurementModal(null)}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'rgba(59, 130, 246, 0.2)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: '6px',
                color: '#3b82f6',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(59, 130, 246, 0.3)'
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(59, 130, 246, 0.2)'
              }}
            >
              Kapat
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default SpareParts
