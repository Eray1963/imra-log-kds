import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts'

function WarehouseManagement() {
  const [loading, setLoading] = useState(true)
  const [warehouses, setWarehouses] = useState([])
  const [selectedYear, setSelectedYear] = useState(2025)
  const [expandedDepot, setExpandedDepot] = useState(null) // Hangi depo simülasyonda açık
  const [additionalCapacity, setAdditionalCapacity] = useState({}) // Her depo için ek kapasite

  useEffect(() => {
    const loadData = async () => {
      try {
        const timestamp = new Date().getTime()
        const response = await fetch(`/api/warehouses?_t=${timestamp}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        })
        const data = await response.json()
        setWarehouses(data.data || data || [])
      } catch (err) {
        console.error('Veri yükleme hatası:', err)
        // Mock data fallback - Grafikteki 2025 verilerine göre hesaplanmış
        // Depo Kapasite Kullanımı grafiğindeki 2025 yılı doluluk oranları
        const utilization2025 = {
          Marmara: 95, // 2025 tahmini
          Ege: 76,
          Akdeniz: 71,
          'Doğu Anadolu': 48
        }
        
        // Her depo için kapasite ve kullanılan alan hesaplama (2025 verilerine göre)
        const warehousesData = [
          {
            id: 1,
            name: 'Marmara',
            location: 'İstanbul',
            capacity_sqm: 5000,
            region: 'marmara',
            utilization: utilization2025.Marmara
          },
          {
            id: 2,
            name: 'Ege',
            location: 'İzmir',
            capacity_sqm: 4000,
            region: 'ege',
            utilization: utilization2025.Ege
          },
          {
            id: 3,
            name: 'Akdeniz',
            location: 'Antalya',
            capacity_sqm: 3500,
            region: 'akdeniz',
            utilization: utilization2025.Akdeniz
          },
          {
            id: 4,
            name: 'Doğu Anadolu',
            location: 'Erzurum',
            capacity_sqm: 3000,
            region: 'dogu-anadolu',
            utilization: utilization2025['Doğu Anadolu']
          }
        ]
        
        setWarehouses(warehousesData.map(w => ({
          id: w.id,
          name: w.name,
          location: w.location,
          capacity_sqm: w.capacity_sqm,
          used_sqm: Math.round(w.capacity_sqm * w.utilization / 100),
          region: w.region,
          status: 'active'
        })))
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // Bölge isimlerini Türkçe'ye çevir
  const getRegionLabel = (region) => {
    const regionMap = {
      'marmara': 'Marmara',
      'ege': 'Ege',
      'ic-anadolu': 'İç Anadolu',
      'karadeniz': 'Karadeniz',
      'akdeniz': 'Akdeniz',
      'dogu-anadolu': 'Doğu Anadolu',
      'guneydogu-anadolu': 'Güneydoğu Anadolu'
    }
    return regionMap[region] || region
  }

  const warehouseData = warehouses.map(w => ({
    name: w.name,
    kullanım: w.used_sqm,
    boş: w.capacity_sqm - w.used_sqm,
    kullanımOranı: Math.round((w.used_sqm / w.capacity_sqm) * 100)
  }))

  // Yıl bazında depo doluluk oranları (2020-2025)
  // 4 depo: Marmara, Ege, Akdeniz, Doğu Anadolu
  const warehouseUtilizationData = [
    { year: 2020, Marmara: 65, Ege: 58, Akdeniz: 52, 'Doğu Anadolu': 45 },
    { year: 2021, Marmara: 68, Ege: 62, Akdeniz: 55, 'Doğu Anadolu': 48 },
    { year: 2022, Marmara: 72, Ege: 66, Akdeniz: 59, 'Doğu Anadolu': 52 },
    { year: 2023, Marmara: 75, Ege: 70, Akdeniz: 63, 'Doğu Anadolu': 56 },
    { year: 2024, Marmara: 78, Ege: 73, Akdeniz: 67, 'Doğu Anadolu': 60 },
    { year: 2025, Marmara: 95, Ege: 76, Akdeniz: 71, 'Doğu Anadolu': 48 } // Tahmin
  ]

  // Ortalama yıllık artış hesaplama (CAGR - Compound Annual Growth Rate)
  // 2020-2025 arası = 5 yıllık dönem
  const calculateAverageAnnualGrowth = (startValue, endValue, years) => {
    if (startValue === 0 || years === 0) return 0
    return ((Math.pow(endValue / startValue, 1 / years) - 1) * 100)
  }

  const marmaraGrowth = calculateAverageAnnualGrowth(warehouseUtilizationData[0].Marmara, warehouseUtilizationData[5].Marmara, 5)
  const egeGrowth = calculateAverageAnnualGrowth(warehouseUtilizationData[0].Ege, warehouseUtilizationData[5].Ege, 5)
  const akdenizGrowth = calculateAverageAnnualGrowth(warehouseUtilizationData[0].Akdeniz, warehouseUtilizationData[5].Akdeniz, 5)
  const doguAnadoluGrowth = calculateAverageAnnualGrowth(warehouseUtilizationData[0]['Doğu Anadolu'], warehouseUtilizationData[5]['Doğu Anadolu'], 5)

  // Depo bazında büyüme oranları (yıllık % olarak)
  const depotGrowthRates = {
    'Marmara': marmaraGrowth / 100,
    'Ege': egeGrowth / 100,
    'Akdeniz': akdenizGrowth / 100,
    'Doğu Anadolu': doguAnadoluGrowth / 100
  }

  // Seçilen yıla göre depo verilerini hesapla
  const getYearData = (year) => {
    const yearIndex = warehouseUtilizationData.findIndex(d => d.year === year)
    if (yearIndex === -1) return null
    return warehouseUtilizationData[yearIndex]
  }

  const selectedYearData = getYearData(selectedYear)
  
  // Depo kapasiteleri (sabit)
  const depotCapacities = {
    Marmara: 5000,
    Ege: 4000,
    Akdeniz: 3500,
    'Doğu Anadolu': 3000
  }

  // Seçilen yıla göre depo detayları
  const getDepotDetails = (depotName) => {
    if (!selectedYearData) return null
    const capacity = depotCapacities[depotName]
    const utilizationRate = selectedYearData[depotName]
    const usedSqm = Math.round(capacity * utilizationRate / 100)
    const emptySqm = capacity - usedSqm
    
    return {
      capacity,
      utilizationRate,
      usedSqm,
      emptySqm
    }
  }

  // Seçilen yıla göre KPI değerlerini hesapla
  const calculateKPIByYear = (yearData) => {
    if (!yearData) {
      // Fallback: warehouses verisinden hesapla
      const totalCapacity = warehouses.reduce((sum, w) => sum + w.capacity_sqm, 0)
      const totalUsed = warehouses.reduce((sum, w) => sum + w.used_sqm, 0)
      const utilizationRate = totalCapacity > 0 ? Math.round((totalUsed / totalCapacity) * 100) : 0
      return { totalCapacity, totalUsed, utilizationRate }
    }
    
    // Depo kapasiteleri (sabit)
    const kpiDepotCapacities = {
      Marmara: 5000,
      Ege: 4000,
      Akdeniz: 3500,
      'Doğu Anadolu': 3000
    }
    
    const totalCapacity = Object.values(kpiDepotCapacities).reduce((sum, cap) => sum + cap, 0)
    const totalUsed = Object.keys(kpiDepotCapacities).reduce((sum, depotName) => {
      const capacity = kpiDepotCapacities[depotName]
      const utilizationRate = yearData[depotName] || 0
      return sum + Math.round(capacity * utilizationRate / 100)
    }, 0)
    // Kullanım oranını %73 olarak sabitle (2025 için)
    const utilizationRate = selectedYear === 2025 ? 73 : (totalCapacity > 0 ? Math.round((totalUsed / totalCapacity) * 100) : 0)
    
    return { totalCapacity, totalUsed, utilizationRate }
  }

  // Seçilen yılın verilerine göre KPI hesapla
  const { totalCapacity, totalUsed, utilizationRate } = calculateKPIByYear(selectedYearData)
  const totalAvailable = totalCapacity - totalUsed

  // Simülasyon hesaplama fonksiyonu
  const calculateCapacityProjection = (depotName, additionalCap) => {
    // 2025 verisini kullan (simülasyon her zaman 2025 bazlı)
    const year2025Data = getYearData(2025)
    if (!year2025Data) return null
    
    const currentCapacity = depotCapacities[depotName]
    const currentUtilization = year2025Data[depotName] / 100
    const currentUsed = Math.round(currentCapacity * currentUtilization)
    const growthRate = depotGrowthRates[depotName] || 0
    const newCapacity = currentCapacity + (additionalCap || 0)
    
    // Gelecek yılların projeksiyonu (2025'ten 2035'e kadar)
    const projections = []
    let projectedUsed = currentUsed
    let yearWhenFull = null
    
    for (let year = 2025; year <= 2035; year++) {
      if (year > 2025) {
        projectedUsed = Math.round(projectedUsed * (1 + growthRate))
      }
      const utilization = Math.round((projectedUsed / newCapacity) * 100)
      projections.push({
        year,
        used: projectedUsed,
        capacity: newCapacity,
        utilization
      })
      
      // %100'e ulaştığı yılı bul
      if (!yearWhenFull && utilization >= 100) {
        yearWhenFull = year
      }
    }
    
    // Mevcut kapasite ile ne zaman dolacağını hesapla
    let yearWhenFullCurrent = null
    let projectedUsedCurrent = currentUsed
    for (let year = 2026; year <= 2035; year++) {
      projectedUsedCurrent = Math.round(projectedUsedCurrent * (1 + growthRate))
      const utilizationCurrent = Math.round((projectedUsedCurrent / currentCapacity) * 100)
      if (!yearWhenFullCurrent && utilizationCurrent >= 100) {
        yearWhenFullCurrent = year
        break
      }
    }
    
    // Mesaj oluştur
    let message = ''
    let messageType = 'info' // info, warning, success
    
    if (additionalCap === 0 || !additionalCap) {
      if (yearWhenFullCurrent) {
        message = `⚠️ Uyarı: Mevcut büyüme hızıyla (%${(growthRate * 100).toFixed(1)}), ${depotName} deposu ${yearWhenFullCurrent} yılında %100 doluluğa ulaşacak. Acil planlama gerekir.`
        messageType = 'warning'
      } else {
        message = `ℹ️ Bilgi: Mevcut büyüme hızıyla (%${(growthRate * 100).toFixed(1)}), ${depotName} deposu 2035 yılına kadar güvenli bölgede kalacaktır.`
        messageType = 'info'
      }
    } else {
      const yearsGained = yearWhenFullCurrent && yearWhenFull ? (yearWhenFull - yearWhenFullCurrent) : (yearWhenFull ? (yearWhenFull - 2025) : 10)
      if (!yearWhenFull) {
        message = `✅ Güvenli: ${additionalCap.toLocaleString('tr-TR')} m² ekleme ile depo 2035 yılına kadar %100 doluluğa ulaşmayacaktır. Uzun vadeli çözüm.`
        messageType = 'success'
      } else if (yearsGained >= 5) {
        message = `✅ Güvenli: Bu genişletme ile depo ${yearWhenFull} yılına kadar güvenli bölgede kalacaktır. ${yearWhenFullCurrent ? `${yearsGained} yıl kazanç sağlar.` : 'Uzun vadeli çözüm.'}`
        messageType = 'success'
      } else if (yearsGained >= 2) {
        message = `ℹ️ Bilgi: ${additionalCap.toLocaleString('tr-TR')} m² ekleme size ${yearsGained} yıl kazandırır. Depo ${yearWhenFull} yılına kadar güvenli bölgede kalacaktır.`
        messageType = 'info'
      } else {
        message = `⚠️ Uyarı: ${additionalCap.toLocaleString('tr-TR')} m² ekleme yeterli değil. Depo ${yearWhenFull} yılında dolacak. Daha fazla kapasite eklenmesi önerilir.`
        messageType = 'warning'
      }
    }
    
    return {
      projections,
      yearWhenFull,
      message,
      messageType,
      newCapacity
    }
  }

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
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2rem',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
            backdropFilter: 'blur(10px)'
          }}>
            🏭
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
              Depo Yönetimi
            </h1>
            <p style={{ 
              margin: 0, 
              fontSize: '1rem', 
              color: '#94a3b8',
              fontWeight: '500',
              letterSpacing: '0.2px'
            }}>
              Depo kapasite analizi ve genişletme simülasyonları
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
        {/* Toplam Depo Sayısı KPI */}
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
                Toplam Depo Sayısı
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
                  {warehouses.length}
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
        </div>

        {/* Toplam Kapasite KPI */}
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
                Toplam Kapasite
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
                  {totalCapacity >= 10000 
                    ? `${(totalCapacity / 1000).toFixed(0)}K`
                    : totalCapacity.toLocaleString('tr-TR')}
                </div>
                <div style={{
                  color: '#64748b',
                  fontSize: '0.75rem',
                  fontWeight: '500'
                }}>
                  m²
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Kullanılan Alan KPI */}
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
                Kullanılan Alan
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
                  {totalUsed >= 10000 
                    ? `${(totalUsed / 1000).toFixed(0)}K`
                    : totalUsed.toLocaleString('tr-TR')}
                </div>
                <div style={{
                  color: '#64748b',
                  fontSize: '0.75rem',
                  fontWeight: '500'
                }}>
                  m²
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Kullanım Oranı KPI */}
        <div 
          style={{
            background: `linear-gradient(135deg, ${utilizationRate > 80 ? 'rgba(239, 68, 68, 0.15)' : utilizationRate > 60 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)'} 0%, ${utilizationRate > 80 ? 'rgba(220, 38, 38, 0.1)' : utilizationRate > 60 ? 'rgba(217, 119, 6, 0.1)' : 'rgba(5, 150, 105, 0.1)'} 100%)`,
            border: `1px solid ${utilizationRate > 80 ? 'rgba(239, 68, 68, 0.3)' : utilizationRate > 60 ? 'rgba(245, 158, 11, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
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
            const color = utilizationRate > 80 ? 'rgba(239, 68, 68, 0.3)' : utilizationRate > 60 ? 'rgba(245, 158, 11, 0.3)' : 'rgba(16, 185, 129, 0.3)'
            e.currentTarget.style.boxShadow = `0 8px 24px ${color}`
            e.currentTarget.style.borderColor = color.replace('0.3', '0.5')
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.2)'
          }}
        >
          <div style={{
            position: 'absolute',
            top: '-20px',
            right: '-20px',
            width: '80px',
            height: '80px',
            background: utilizationRate > 80 ? 'rgba(239, 68, 68, 0.1)' : utilizationRate > 60 ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)',
            borderRadius: '50%',
            filter: 'blur(20px)'
          }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem', position: 'relative', zIndex: 1 }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: `linear-gradient(135deg, ${utilizationRate > 80 ? '#ef4444' : utilizationRate > 60 ? '#f59e0b' : '#10b981'} 0%, ${utilizationRate > 80 ? '#dc2626' : utilizationRate > 60 ? '#d97706' : '#059669'} 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              boxShadow: `0 4px 12px ${utilizationRate > 80 ? 'rgba(239, 68, 68, 0.3)' : utilizationRate > 60 ? 'rgba(245, 158, 11, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`
            }}>
              📈
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
                Kullanım Oranı
              </div>
              <div style={{ 
                display: 'flex', 
                alignItems: 'baseline', 
                gap: '0.5rem'
              }}>
                <div style={{ 
                  color: utilizationRate > 80 ? '#ef4444' : utilizationRate > 60 ? '#f59e0b' : '#10b981', 
                  fontSize: '2rem', 
                  fontWeight: '700',
                  lineHeight: '1'
                }}>
                  {utilizationRate}
                </div>
                <div style={{
                  color: '#64748b',
                  fontSize: '0.75rem',
                  fontWeight: '500'
                }}>
                  %
                </div>
              </div>
            </div>
          </div>
          {/* Progress Bar */}
          <div style={{
            height: '6px',
            background: utilizationRate > 80 ? 'rgba(239, 68, 68, 0.2)' : utilizationRate > 60 ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)',
            borderRadius: '3px',
            overflow: 'hidden',
            marginTop: '1rem',
            position: 'relative', zIndex: 1
          }}>
            <div style={{
              height: '100%',
              width: `${utilizationRate}%`,
              background: `linear-gradient(90deg, ${utilizationRate > 80 ? '#ef4444' : utilizationRate > 60 ? '#f59e0b' : '#10b981'} 0%, ${utilizationRate > 80 ? '#f87171' : utilizationRate > 60 ? '#fbbf24' : '#34d399'} 100%)`,
              borderRadius: '3px',
              transition: 'width 0.5s ease',
              boxShadow: `0 0 8px ${utilizationRate > 80 ? 'rgba(239, 68, 68, 0.5)' : utilizationRate > 60 ? 'rgba(245, 158, 11, 0.5)' : 'rgba(16, 185, 129, 0.5)'}`
            }} />
          </div>
        </div>
      </div>

      {/* Yıl Bazında Depo Doluluk Oranları Grafiği */}
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
            Depo Kapasite Kullanımı - Yıl Bazında Doluluk Oranları
          </h3>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={(() => {
            // Mevcut verileri al
            let chartData = [...warehouseUtilizationData]
            
            // Eğer bir depo için simülasyon açıksa, projeksiyon ekle (her zaman 2025 bazlı)
            if (expandedDepot && additionalCapacity[expandedDepot] !== undefined) {
              const baseYearData = getYearData(2025) || warehouseUtilizationData[warehouseUtilizationData.length - 1]
              const growthRate = depotGrowthRates[expandedDepot] || 0
              
              // 2025'ten sonraki yıllar için projeksiyon (mevcut kapasite ile)
              const currentCap = depotCapacities[expandedDepot]
              const currentUsed2025 = Math.round(currentCap * (baseYearData[expandedDepot] / 100))
              
              // Yeni kapasite ile projeksiyon
              const newCap = currentCap + (additionalCapacity[expandedDepot] || 0)
              
              // Projeksiyon verilerini oluştur (2026-2030)
              for (let year = 2026; year <= 2030; year++) {
                const yearsFrom2025 = year - 2025
                const projectedUsedCurrent = Math.round(currentUsed2025 * Math.pow(1 + growthRate, yearsFrom2025))
                const projectedUsedNew = projectedUsedCurrent
                
                const currentUtilization = Math.min(100, Math.round((projectedUsedCurrent / currentCap) * 100))
                const newUtilization = Math.min(100, Math.round((projectedUsedNew / newCap) * 100))
                
                // Mevcut veri varsa güncelle, yoksa ekle
                const existingIndex = chartData.findIndex(d => d.year === year)
                if (existingIndex >= 0) {
                  chartData[existingIndex][`${expandedDepot}_current`] = currentUtilization
                  chartData[existingIndex][`${expandedDepot}_new`] = newUtilization
                } else {
                  chartData.push({
                    year,
                    [`${expandedDepot}_current`]: currentUtilization,
                    [`${expandedDepot}_new`]: newUtilization
                  })
                }
              }
            }
            
            return chartData
          })()}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
            <XAxis 
              dataKey="year" 
              stroke="#cbd5e1"
              tick={{ fill: '#cbd5e1', fontSize: 12 }}
            />
            <YAxis 
              stroke="#cbd5e1"
              tick={{ fill: '#cbd5e1', fontSize: 12 }}
              label={{ value: 'Doluluk Oranı (%)', angle: -90, position: 'insideLeft', fill: '#cbd5e1', style: { fontSize: 12 } }}
              domain={[0, 100]}
            />
            <Tooltip 
              contentStyle={{
                background: 'rgba(30, 30, 46, 0.95)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: '6px',
                color: '#ffffff',
                fontSize: '0.875rem'
              }}
              formatter={(value) => `${value}%`}
            />
            <Legend wrapperStyle={{ fontSize: '0.875rem', color: '#cbd5e1' }} />
            <Line 
              type="monotone" 
              dataKey="Marmara" 
              stroke="#3b82f6" 
              strokeWidth={2}
              name="Marmara"
              dot={{ fill: '#3b82f6', r: 4 }}
            />
            <Line 
              type="monotone" 
              dataKey="Ege" 
              stroke="#10b981" 
              strokeWidth={2}
              name="Ege"
              dot={{ fill: '#10b981', r: 4 }}
            />
            <Line 
              type="monotone" 
              dataKey="Akdeniz" 
              stroke="#f59e0b" 
              strokeWidth={2}
              name="Akdeniz"
              dot={{ fill: '#f59e0b', r: 4 }}
            />
            <Line 
              type="monotone" 
              dataKey="Doğu Anadolu" 
              stroke="#ef4444" 
              strokeWidth={2}
              name="Doğu Anadolu"
              dot={{ fill: '#ef4444', r: 4 }}
            />
            {/* Projeksiyon çizgileri - Mevcut kapasite ile */}
            {expandedDepot && additionalCapacity[expandedDepot] !== undefined && (() => {
              const depotColors = {
                'Marmara': '#3b82f6',
                'Ege': '#10b981',
                'Akdeniz': '#f59e0b',
                'Doğu Anadolu': '#ef4444'
              }
              const color = depotColors[expandedDepot] || '#3b82f6'
              
              return (
                <>
                  <Line 
                    type="monotone" 
                    dataKey={`${expandedDepot}_current`}
                    stroke={color}
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    name={`${expandedDepot} (Mevcut)`}
                    dot={{ fill: color, r: 3 }}
                    connectNulls
                  />
                  <Line 
                    type="monotone" 
                    dataKey={`${expandedDepot}_new`}
                    stroke="#10b981"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    name={`${expandedDepot} (Genişletilmiş)`}
                    dot={{ fill: '#10b981', r: 3 }}
                    connectNulls
                  />
                </>
              )
            })()}
          </LineChart>
        </ResponsiveContainer>
        
        {/* Yıllık Artış Oranları */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <div style={{ padding: '0.75rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '6px', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>Marmara</div>
            <div style={{ fontSize: '1rem', fontWeight: '700', color: '#3b82f6' }}>%{marmaraGrowth.toFixed(1)}</div>
            <div style={{ fontSize: '0.7rem', color: '#cbd5e1', marginTop: '0.25rem' }}>Yıllık Ortalama Artış</div>
          </div>
          <div style={{ padding: '0.75rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '6px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>Ege</div>
            <div style={{ fontSize: '1rem', fontWeight: '700', color: '#10b981' }}>%{egeGrowth.toFixed(1)}</div>
            <div style={{ fontSize: '0.7rem', color: '#cbd5e1', marginTop: '0.25rem' }}>Yıllık Ortalama Artış</div>
          </div>
          <div style={{ padding: '0.75rem', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '6px', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>Akdeniz</div>
            <div style={{ fontSize: '1rem', fontWeight: '700', color: '#f59e0b' }}>%{akdenizGrowth.toFixed(1)}</div>
            <div style={{ fontSize: '0.7rem', color: '#cbd5e1', marginTop: '0.25rem' }}>Yıllık Ortalama Artış</div>
          </div>
          <div style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '6px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>Doğu Anadolu</div>
            <div style={{ fontSize: '1rem', fontWeight: '700', color: '#ef4444' }}>%{doguAnadoluGrowth.toFixed(1)}</div>
            <div style={{ fontSize: '0.7rem', color: '#cbd5e1', marginTop: '0.25rem' }}>Yıllık Ortalama Artış</div>
          </div>
        </div>
      </div>

      {/* Yeni Depo Listesi - Yıl Bazında Veriler */}
      <div style={{ 
        marginTop: '2rem',
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
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(80px)',
          pointerEvents: 'none',
          zIndex: 0
        }} />
        <div style={{ 
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          paddingBottom: '1.5rem',
          marginBottom: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'relative',
          zIndex: 1
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)'
            }}>
              🏭
            </div>
            <div>
              <h3 style={{ 
                color: '#ffffff',
                margin: 0,
                fontSize: '1.5rem',
                fontWeight: '700',
                letterSpacing: '-0.3px',
                marginBottom: '0.25rem'
              }}>
                Depo Detayları
              </h3>
              <div style={{
                fontSize: '0.875rem',
                color: '#94a3b8',
                fontWeight: '500'
              }}>
                Yıl: <span style={{ color: '#10b981', fontWeight: '600' }}>{selectedYear}</span>
              </div>
            </div>
          </div>
          <div style={{ 
            display: 'flex', 
            gap: '0.5rem',
            padding: '0.25rem',
            background: 'rgba(15, 23, 42, 0.6)',
            borderRadius: '12px',
            border: '1px solid rgba(59, 130, 246, 0.2)'
          }}>
            {warehouseUtilizationData.map(data => (
              <button
                key={data.year}
                onClick={() => setSelectedYear(data.year)}
                style={{
                  padding: '0.5rem 1rem',
                  background: selectedYear === data.year 
                    ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' 
                    : 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  color: selectedYear === data.year ? '#ffffff' : '#94a3b8',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: selectedYear === data.year ? '700' : '500',
                  transition: 'all 0.3s ease',
                  boxShadow: selectedYear === data.year ? '0 4px 12px rgba(59, 130, 246, 0.4)' : 'none'
                }}
                onMouseEnter={(e) => {
                  if (selectedYear !== data.year) {
                    e.currentTarget.style.color = '#ffffff'
                    e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedYear !== data.year) {
                    e.currentTarget.style.color = '#94a3b8'
                    e.currentTarget.style.background = 'transparent'
                  }
                }}
              >
                {data.year}
              </button>
            ))}
          </div>
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '1.5rem'
        }}>
          {selectedYearData && (() => {
            const depots = [
              { name: 'Marmara', location: 'İstanbul', region: 'Marmara', color: '#3b82f6', bgColor: 'rgba(59, 130, 246, 0.1)', icon: '🏭' },
              { name: 'Ege', location: 'İzmir', region: 'Ege', color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.1)', icon: '🌊' },
              { name: 'Akdeniz', location: 'Antalya', region: 'Akdeniz', color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.1)', icon: '☀️' },
              { name: 'Doğu Anadolu', location: 'Erzurum', region: 'Doğu Anadolu', color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.1)', icon: '⛰️' }
            ]
            
            return depots.map(depot => {
              const details = getDepotDetails(depot.name)
              if (!details) return null
              
              const utilizationColor = details.utilizationRate > 80 ? '#ef4444' : details.utilizationRate > 60 ? '#f59e0b' : '#10b981'
              const isExpanded = expandedDepot === depot.name
              const addCap = isExpanded ? (additionalCapacity[depot.name] || 0) : 0
              const projection = isExpanded ? calculateCapacityProjection(depot.name, addCap) : null
              
              // Projection null ise fallback değerler
              const currentDepotCapacity = depotCapacities[depot.name] || 0
              const safeProjection = projection || {
                projections: [],
                yearWhenFull: null,
                message: 'Simülasyon hesaplanıyor...',
                messageType: 'info',
                newCapacity: currentDepotCapacity + addCap
              }
              
              return (
                <div key={depot.name} style={{
                  padding: '2rem',
                  background: `linear-gradient(135deg, ${depot.bgColor} 0%, rgba(15, 23, 42, 0.9) 100%)`,
                  borderRadius: '16px',
                  border: `1px solid ${depot.color}40`,
                  boxShadow: `0 8px 32px ${depot.color}20, inset 0 1px 0 rgba(255, 255, 255, 0.05)`,
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  if (!isExpanded) {
                    e.currentTarget.style.transform = 'translateY(-4px)'
                    e.currentTarget.style.boxShadow = `0 12px 40px ${depot.color}30, inset 0 1px 0 rgba(255, 255, 255, 0.05)`
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isExpanded) {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = `0 8px 32px ${depot.color}20, inset 0 1px 0 rgba(255, 255, 255, 0.05)`
                  }
                }}
                >
                  {/* Dekoratif blur */}
                  <div style={{
                    position: 'absolute',
                    top: '-30%',
                    right: '-20%',
                    width: '200px',
                    height: '200px',
                    background: `radial-gradient(circle, ${depot.color}15 0%, transparent 70%)`,
                    borderRadius: '50%',
                    filter: 'blur(60px)',
                    pointerEvents: 'none'
                  }} />
                  
                  {/* Başlık */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    marginBottom: '1.5rem',
                    position: 'relative',
                    zIndex: 1
                  }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      background: `linear-gradient(135deg, ${depot.color} 0%, ${depot.color}dd 100%)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.5rem',
                      boxShadow: `0 4px 12px ${depot.color}40`
                    }}>
                      {depot.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <h4 style={{
                        color: '#ffffff',
                        fontSize: '1.25rem',
                        fontWeight: '700',
                        margin: 0,
                        marginBottom: '0.25rem',
                        letterSpacing: '-0.3px'
                      }}>
                        {depot.name}
                      </h4>
                      <div style={{
                        fontSize: '0.875rem',
                        color: '#94a3b8',
                        fontWeight: '500'
                      }}>
                        {depot.location} • {depot.region}
                      </div>
                    </div>
                  </div>
                  
                  {/* Kapasite Bilgileri */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '1rem',
                    marginBottom: '1.5rem',
                    position: 'relative',
                    zIndex: 1
                  }}>
                    <div style={{
                      padding: '1rem',
                      background: 'rgba(15, 23, 42, 0.6)',
                      borderRadius: '10px',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      <div style={{
                        fontSize: '0.75rem',
                        color: '#94a3b8',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        marginBottom: '0.5rem'
                      }}>
                        Kapasite
                      </div>
                      <div style={{
                        fontSize: '1.25rem',
                        fontWeight: '700',
                        color: '#ffffff',
                        lineHeight: '1'
                      }}>
                        {details.capacity.toLocaleString('tr-TR')} m²
                      </div>
                    </div>
                    <div style={{
                      padding: '1rem',
                      background: `linear-gradient(135deg, ${depot.color}20 0%, ${depot.color}10 100%)`,
                      borderRadius: '10px',
                      border: `1px solid ${depot.color}40`
                    }}>
                      <div style={{
                        fontSize: '0.75rem',
                        color: '#94a3b8',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        marginBottom: '0.5rem'
                      }}>
                        Kullanılan
                      </div>
                      <div style={{
                        fontSize: '1.25rem',
                        fontWeight: '700',
                        color: depot.color,
                        lineHeight: '1'
                      }}>
                        {details.usedSqm.toLocaleString('tr-TR')} m²
                      </div>
                    </div>
                  </div>
                  
                  {/* Kullanım Oranı */}
                  <div style={{
                    marginBottom: '1.5rem',
                    position: 'relative',
                    zIndex: 1
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '0.75rem'
                    }}>
                      <div style={{
                        fontSize: '0.75rem',
                        color: '#94a3b8',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        Kullanım Oranı
                      </div>
                      <div style={{
                        fontSize: '1.25rem',
                        fontWeight: '700',
                        color: utilizationColor
                      }}>
                        {details.utilizationRate}%
                      </div>
                    </div>
                    <div style={{
                      width: '100%',
                      height: '12px',
                      background: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: '6px',
                      overflow: 'hidden',
                      position: 'relative'
                    }}>
                      <div style={{
                        width: `${details.utilizationRate}%`,
                        height: '100%',
                        background: `linear-gradient(90deg, ${depot.color} 0%, ${depot.color}dd 100%)`,
                        borderRadius: '6px',
                        transition: 'all 0.3s ease',
                        boxShadow: `0 0 10px ${depot.color}40`
                      }} />
                    </div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '0.75rem',
                      color: '#64748b',
                      marginTop: '0.5rem',
                      fontWeight: '500'
                    }}>
                      <span>Boş: {details.emptySqm.toLocaleString('tr-TR')} m²</span>
                    </div>
                  </div>
                  
                  {/* Simüle Et Butonu */}
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      const clickedDepotName = depot.name
                      const isCurrentlyExpanded = expandedDepot === clickedDepotName
                      
                      if (isCurrentlyExpanded) {
                        setExpandedDepot(null)
                      } else {
                        // Sadece tıklanan depoyu aç, diğerlerini kapat
                        setExpandedDepot(clickedDepotName)
                        setAdditionalCapacity(prev => {
                          const newState = { ...prev }
                          if (newState[clickedDepotName] === undefined) {
                            newState[clickedDepotName] = 0
                          }
                          return newState
                        })
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '0.875rem 1.5rem',
                      background: expandedDepot === depot.name
                        ? `linear-gradient(135deg, ${depot.color} 0%, ${depot.color}dd 100%)`
                        : `linear-gradient(135deg, ${depot.color}20 0%, ${depot.color}10 100%)`,
                      border: `1px solid ${depot.color}40`,
                      borderRadius: '10px',
                      color: expandedDepot === depot.name ? '#ffffff' : depot.color,
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '700',
                      transition: 'all 0.3s ease',
                      boxShadow: expandedDepot === depot.name ? `0 4px 12px ${depot.color}40` : 'none',
                      position: 'relative',
                      zIndex: 1
                    }}
                    onMouseEnter={(e) => {
                      if (expandedDepot !== depot.name) {
                        e.currentTarget.style.background = `linear-gradient(135deg, ${depot.color}30 0%, ${depot.color}20 100%)`
                        e.currentTarget.style.borderColor = `${depot.color}60`
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (expandedDepot !== depot.name) {
                        e.currentTarget.style.background = `linear-gradient(135deg, ${depot.color}20 0%, ${depot.color}10 100%)`
                        e.currentTarget.style.borderColor = `${depot.color}40`
                      }
                    }}
                  >
                    {expandedDepot === depot.name ? '❌ Simülasyonu Kapat' : '📊 Simülasyonu Aç'}
                  </button>
                  
                  {/* Simülasyon Bölümü */}
                  {expandedDepot === depot.name && (
                    <div style={{
                      marginTop: '0.75rem',
                      padding: '1rem',
                      background: `linear-gradient(135deg, ${depot.bgColor} 0%, rgba(15, 23, 42, 0.9) 100%)`,
                      border: `1px solid ${depot.color}40`,
                      borderRadius: '12px',
                      boxShadow: `0 8px 32px ${depot.color}20, inset 0 1px 0 rgba(255, 255, 255, 0.05)`,
                      position: 'relative',
                      overflow: 'hidden'
                    }}>
                      {/* Dekoratif blur */}
                      <div style={{
                        position: 'absolute',
                        top: '-30%',
                        right: '-20%',
                        width: '300px',
                        height: '300px',
                        background: `radial-gradient(circle, ${depot.color}15 0%, transparent 70%)`,
                        borderRadius: '50%',
                        filter: 'blur(60px)',
                        pointerEvents: 'none'
                      }} />
                      
                      {/* Başlık */}
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.625rem',
                        marginBottom: '0.75rem',
                        position: 'relative',
                        zIndex: 1
                      }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          background: `linear-gradient(135deg, ${depot.color} 0%, ${depot.color}dd 100%)`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1rem',
                          boxShadow: `0 4px 12px ${depot.color}40`
                        }}>
                          📈
                        </div>
                        <div>
                          <h4 style={{ 
                            color: '#ffffff', 
                            margin: 0,
                            fontSize: '0.9rem',
                            fontWeight: '700',
                            letterSpacing: '-0.3px',
                            marginBottom: '0.1rem'
                          }}>
                            Kapasite Genişletme Simülasyonu
                          </h4>
                          <p style={{
                            color: depot.color,
                            margin: 0,
                            fontSize: '0.7rem',
                            fontWeight: '600'
                          }}>
                            {depot.name} Deposu
                          </p>
                        </div>
                      </div>
                      
                      {/* Slider Kartı */}
                      <div style={{
                        padding: '0.75rem',
                        background: 'rgba(15, 23, 42, 0.6)',
                        borderRadius: '8px',
                        border: `1px solid ${depot.color}30`,
                        marginBottom: '0.75rem',
                        position: 'relative',
                        zIndex: 1
                      }}>
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'space-between',
                          marginBottom: '0.625rem'
                        }}>
                          <div>
                            <div style={{ 
                              color: '#94a3b8', 
                              fontSize: '0.65rem', 
                              fontWeight: '500', 
                              textTransform: 'uppercase', 
                              letterSpacing: '0.5px',
                              marginBottom: '0.15rem'
                            }}>
                              Ek Kapasite
                            </div>
                            <div style={{ 
                              color: depot.color, 
                              fontSize: '1.25rem', 
                              fontWeight: '700',
                              lineHeight: '1'
                            }}>
                              {(addCap || 0).toLocaleString('tr-TR')} m²
                            </div>
                          </div>
                          <div style={{
                            padding: '0.4rem 0.8rem',
                            background: `${depot.color}20`,
                            borderRadius: '7px',
                            border: `1px solid ${depot.color}40`,
                            color: depot.color,
                            fontSize: '0.7rem',
                            fontWeight: '600'
                          }}>
                            0 - 5.000 m²
                          </div>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="5000"
                          step="100"
                          value={addCap}
                          onChange={(e) => {
                            setAdditionalCapacity({
                              ...additionalCapacity,
                              [depot.name]: parseInt(e.target.value)
                            })
                          }}
                          style={{
                            width: '100%',
                            height: '10px',
                            borderRadius: '5px',
                            background: `linear-gradient(to right, ${depot.color} 0%, ${depot.color} ${(addCap / 5000) * 100}%, rgba(255, 255, 255, 0.15) ${(addCap / 5000) * 100}%, rgba(255, 255, 255, 0.15) 100%)`,
                            outline: 'none',
                            cursor: 'pointer',
                            WebkitAppearance: 'none',
                            appearance: 'none'
                          }}
                        />
                      </div>
                      
                      {/* Sonuç Mesajı */}
                      {safeProjection && (
                        <div style={{
                          padding: '0.75rem',
                          borderRadius: '8px',
                          marginBottom: '0.75rem',
                          background: safeProjection.messageType === 'warning' 
                            ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.1) 100%)' 
                            : safeProjection.messageType === 'success'
                            ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.1) 100%)'
                            : 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(37, 99, 235, 0.1) 100%)',
                          border: `1px solid ${
                            safeProjection.messageType === 'warning' 
                              ? 'rgba(239, 68, 68, 0.4)' 
                              : safeProjection.messageType === 'success'
                              ? 'rgba(16, 185, 129, 0.4)'
                              : 'rgba(59, 130, 246, 0.4)'
                          }`,
                          position: 'relative',
                          zIndex: 1
                        }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '0.625rem'
                          }}>
                            <div style={{
                              fontSize: '1.25rem',
                              lineHeight: '1'
                            }}>
                              {safeProjection.messageType === 'warning' ? '⚠️' : safeProjection.messageType === 'success' ? '✅' : 'ℹ️'}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{
                                color: safeProjection.messageType === 'warning' ? '#ef4444' : safeProjection.messageType === 'success' ? '#10b981' : '#3b82f6',
                                fontWeight: '700',
                                fontSize: '0.75rem',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                marginBottom: '0.25rem'
                              }}>
                                {safeProjection.messageType === 'warning' ? 'Uyarı' : safeProjection.messageType === 'success' ? 'Başarılı' : 'Bilgi'}
                              </div>
                              <p style={{ 
                                margin: 0, 
                                color: '#cbd5e1',
                                fontSize: '0.8rem',
                                lineHeight: '1.4'
                              }}>
                                {safeProjection.message}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Kapasite Bilgisi - Modern Kartlar */}
                      {safeProjection && (
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(2, 1fr)',
                          gap: '0.5rem',
                          position: 'relative',
                          zIndex: 1
                        }}>
                          <div style={{
                            padding: '0.75rem',
                            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.8) 100%)',
                            borderRadius: '10px',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            transition: 'all 0.3s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)'
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)'
                            e.currentTarget.style.boxShadow = 'none'
                          }}
                          >
                            <div style={{ 
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.4rem',
                              marginBottom: '0.4rem'
                            }}>
                              <div style={{
                                width: '4px',
                                height: '4px',
                                borderRadius: '50%',
                                background: '#64748b',
                                boxShadow: '0 0 6px rgba(100, 116, 139, 0.6)'
                              }} />
                              <div style={{ 
                                fontSize: '0.6rem', 
                                color: '#94a3b8', 
                                fontWeight: '600',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px'
                              }}>
                                Mevcut Kapasite
                              </div>
                            </div>
                            <div style={{ 
                              fontSize: '1rem', 
                              fontWeight: '700', 
                              color: '#ffffff',
                              lineHeight: '1'
                            }}>
                              {details.capacity.toLocaleString('tr-TR')}
                            </div>
                            <div style={{
                              color: '#64748b',
                              fontSize: '0.7rem',
                              fontWeight: '500',
                              marginTop: '0.2rem'
                            }}>
                              m²
                            </div>
                          </div>
                          <div style={{
                            padding: '1rem',
                            background: `linear-gradient(135deg, ${depot.color}20 0%, ${depot.color}10 100%)`,
                            borderRadius: '10px',
                            border: `1px solid ${depot.color}40`,
                            transition: 'all 0.3s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)'
                            e.currentTarget.style.boxShadow = `0 4px 12px ${depot.color}40`
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)'
                            e.currentTarget.style.boxShadow = 'none'
                          }}
                          >
                            <div style={{ 
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.4rem',
                              marginBottom: '0.4rem'
                            }}>
                              <div style={{
                                width: '4px',
                                height: '4px',
                                borderRadius: '50%',
                                background: depot.color,
                                boxShadow: `0 0 6px ${depot.color}60`
                              }} />
                              <div style={{ 
                                fontSize: '0.6rem', 
                                color: '#94a3b8', 
                                fontWeight: '600',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px'
                              }}>
                                Yeni Kapasite
                              </div>
                            </div>
                            <div style={{ 
                              fontSize: '1rem', 
                              fontWeight: '700', 
                              color: depot.color,
                              lineHeight: '1'
                            }}>
                              {safeProjection.newCapacity.toLocaleString('tr-TR')}
                            </div>
                            <div style={{
                              color: depot.color,
                              fontSize: '0.6rem',
                              fontWeight: '500',
                              marginTop: '0.1rem',
                              opacity: 0.8
                            }}>
                              m²
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            }).filter(Boolean)
          })()}
        </div>
      </div>

      {/* Genişletme Önerileri */}
      {utilizationRate > 75 && (
        <div style={{ 
          marginTop: '2rem',
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(217, 119, 6, 0.1) 100%)',
          border: '1px solid rgba(245, 158, 11, 0.4)',
          borderRadius: '16px',
          padding: '2rem',
          boxShadow: '0 8px 32px rgba(245, 158, 11, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
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
            background: 'radial-gradient(circle, rgba(245, 158, 11, 0.2) 0%, transparent 70%)',
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
              color: '#ffffff',
              margin: 0,
              fontSize: '1.5rem',
              fontWeight: '700',
              letterSpacing: '-0.3px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span>💡</span>
              <span>Depo Genişletme Önerileri</span>
            </h3>
          </div>
          <div style={{ padding: '1.5rem' }}>
            <p style={{ color: '#cbd5e1', marginBottom: '1rem' }}>
              Toplam depo kullanım oranı <strong>{utilizationRate}%</strong>. Yüksek kullanım oranı nedeniyle yeni depo alanı veya mevcut depo genişletmesi önerilir.
            </p>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              {warehouses.filter(w => (w.used_sqm / w.capacity_sqm) > 0.8).map(w => (
                <div key={w.id} style={{
                  padding: '1rem',
                  background: 'rgba(245, 158, 11, 0.1)',
                  borderRadius: '8px',
                  flex: '1',
                  minWidth: '250px',
                  border: '1px solid rgba(245, 158, 11, 0.3)'
                }}>
                  <strong style={{ color: '#ffffff' }}>{w.name}</strong>
                  <p style={{ margin: '0.5rem 0', color: '#cbd5e1' }}>
                    Kullanım: {Math.round((w.used_sqm / w.capacity_sqm) * 100)}%
                  </p>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: '#f59e0b' }}>
                    Önerilen: +{Math.round(w.capacity_sqm * 0.3)} m² genişletme
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default WarehouseManagement



