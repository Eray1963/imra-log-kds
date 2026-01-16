import { useState, useMemo, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, Area } from 'recharts'
import { calculateInflationForecast, runInflationSimulation, getScenarioData } from '../kds/forecastSimulationEngine'
import { getHistoricalInflation, getDollarRates, getEuroRates } from '../services/dataService'

function ScenarioSimulation() {
  const [currentInflation, setCurrentInflation] = useState(25)
  const [estimatedInflation, setEstimatedInflation] = useState(32)
  const [fxRate, setFxRate] = useState(30)
  const [vehiclePrice, setVehiclePrice] = useState(2500000)
  
  // API'den çekilen veriler - Başlangıçta fallback veri ile
  const [historicalData, setHistoricalData] = useState([
    { year: 2020, inflation: 14.60 },
    { year: 2021, inflation: 36.08 },
    { year: 2022, inflation: 64.27 },
    { year: 2023, inflation: 64.77 },
    { year: 2024, inflation: 44.38 },
    { year: 2025, inflation: 31.07 }
  ])
  const [dollarData, setDollarData] = useState([
    { year: 2020, rate: 7.02, change: 0 },
    { year: 2021, rate: 8.90, change: 26.8 },
    { year: 2022, rate: 16.57, change: 86.2 },
    { year: 2023, rate: 23.77, change: 43.5 },
    { year: 2024, rate: 32.51, change: 36.8 },
    { year: 2025, rate: 40.50, change: 24.6 }
  ])
  const [euroData, setEuroData] = useState([
    { year: 2020, rate: 8.04, change: 0 },
    { year: 2021, rate: 10.51, change: 30.7 },
    { year: 2022, rate: 17.38, change: 65.4 },
    { year: 2023, rate: 25.76, change: 48.2 },
    { year: 2024, rate: 35.60, change: 38.2 },
    { year: 2025, rate: 43.20, change: 21.3 }
  ])
  const [dataLoading, setDataLoading] = useState(true)
  
  // Forecasting & Simulation state
  const [forecast2025, setForecast2025] = useState(0)
  const [inflationAssumption2025, setInflationAssumption2025] = useState(0)
  const simulationResult = useMemo(() => {
    if (inflationAssumption2025 > 0) {
      return runInflationSimulation(2025, inflationAssumption2025)
    }
    return null
  }, [inflationAssumption2025])
  const [scenarioData, setScenarioData] = useState(null)
  
  // API'den veri yükleme
  useEffect(() => {
    const loadData = async () => {
      try {
        setDataLoading(true)
        const [historical, dollar, euro] = await Promise.all([
          getHistoricalInflation(),
          getDollarRates(),
          getEuroRates()
        ])
        
        setHistoricalData(historical)
        setDollarData(dollar)
        setEuroData(euro)
        
        // Enflasyon tahmini hesapla
        if (historical.length > 0) {
          const rates = historical.map(d => d.inflation)
          const avgIncrease = (rates[rates.length - 1] - rates[0]) / (rates.length - 1)
          const lastRate = rates[rates.length - 1]
          const forecast = Math.max(20, Math.min(60, lastRate + avgIncrease * 0.5))
          const roundedForecast = Math.round(forecast * 10) / 10
          setForecast2025(roundedForecast)
          setInflationAssumption2025(roundedForecast)
          
          // Senaryo verilerini güncelle
          const scenarios = {
            optimistic: {
              inflation: 25,
              ...runInflationSimulation(2025, 25),
              label: 'İyimser'
            },
            expected: {
              inflation: roundedForecast,
              ...runInflationSimulation(2025, roundedForecast),
              label: 'Beklenen'
            },
            pessimistic: {
              inflation: 50,
              ...runInflationSimulation(2025, 50),
              label: 'Kötümser'
            }
          }
          setScenarioData(scenarios)
        }
      } catch (error) {
        console.error('Error loading scenario data:', error)
        // Fallback to hardcoded data (veritabanındaki değerler)
        setHistoricalData([
          { year: 2020, inflation: 14.60 },
          { year: 2021, inflation: 36.08 },
          { year: 2022, inflation: 64.27 },
          { year: 2023, inflation: 64.77 },
          { year: 2024, inflation: 44.38 },
          { year: 2025, inflation: 31.07 }
        ])
        setDollarData([
          { year: 2020, rate: 7.02, change: 0 },
          { year: 2021, rate: 8.90, change: 26.8 },
          { year: 2022, rate: 16.57, change: 86.2 },
          { year: 2023, rate: 23.77, change: 43.5 },
          { year: 2024, rate: 32.51, change: 36.8 },
          { year: 2025, rate: 40.50, change: 24.6 }
        ])
        setEuroData([
          { year: 2020, rate: 8.04, change: 0 },
          { year: 2021, rate: 10.51, change: 30.7 },
          { year: 2022, rate: 17.38, change: 65.4 },
          { year: 2023, rate: 25.76, change: 48.2 },
          { year: 2024, rate: 35.60, change: 38.2 },
          { year: 2025, rate: 43.20, change: 21.3 }
        ])
        // Enflasyon tahmini hesapla
        const rates = [14.60, 36.08, 64.27, 64.77, 44.38, 31.07]
        const avgIncrease = (rates[rates.length - 1] - rates[0]) / (rates.length - 1)
        const lastRate = rates[rates.length - 1]
        const forecast = Math.max(20, Math.min(60, lastRate + avgIncrease * 0.5))
        const roundedForecast = Math.round(forecast * 10) / 10
        setForecast2025(roundedForecast)
        setInflationAssumption2025(roundedForecast)
        // Senaryo verilerini güncelle
        const { runInflationSimulation, getScenarioData } = require('../kds/forecastSimulationEngine')
        const scenarios = {
          optimistic: {
            inflation: 25,
            ...runInflationSimulation(2025, 25),
            label: 'İyimser'
          },
          expected: {
            inflation: roundedForecast,
            ...runInflationSimulation(2025, roundedForecast),
            label: 'Beklenen'
          },
          pessimistic: {
            inflation: 50,
            ...runInflationSimulation(2025, 50),
            label: 'Kötümser'
          }
        }
        setScenarioData(scenarios)
      } finally {
        setDataLoading(false)
      }
    }
    loadData()
  }, [])
  
  // Ortalama yıllık artış hesaplama (CAGR - Compound Annual Growth Rate)
  // Son 5 yıl (2020-2024) = 4 yıllık dönem
  const calculateAverageAnnualGrowth = (startValue, endValue, years) => {
    if (startValue === 0 || years === 0) return 0
    return ((Math.pow(endValue / startValue, 1 / years) - 1) * 100)
  }
  
  const dollarAvgGrowth = useMemo(() => {
    const data = dollarData && dollarData.length > 0 ? dollarData : [
      { year: 2020, rate: 7.02, change: 0 },
      { year: 2021, rate: 8.90, change: 26.8 },
      { year: 2022, rate: 16.57, change: 86.2 },
      { year: 2023, rate: 23.77, change: 43.5 },
      { year: 2024, rate: 32.51, change: 36.8 },
      { year: 2025, rate: 40.50, change: 24.6 }
    ]
    if (data.length >= 2) {
      return calculateAverageAnnualGrowth(data[0].rate, data[data.length - 2].rate, 4)
    }
    return 0
  }, [dollarData])
  
  const euroAvgGrowth = useMemo(() => {
    const data = euroData && euroData.length > 0 ? euroData : [
      { year: 2020, rate: 8.04, change: 0 },
      { year: 2021, rate: 10.51, change: 30.7 },
      { year: 2022, rate: 17.38, change: 65.4 },
      { year: 2023, rate: 25.76, change: 48.2 },
      { year: 2024, rate: 35.60, change: 38.2 },
      { year: 2025, rate: 43.20, change: 21.3 }
    ]
    if (data.length >= 2) {
      return calculateAverageAnnualGrowth(data[0].rate, data[data.length - 2].rate, 4)
    }
    return 0
  }, [euroData])
  
  useEffect(() => {
    // Update estimated inflation when assumption changes
    setEstimatedInflation(inflationAssumption2025)
  }, [inflationAssumption2025])

  // Otomatik hesaplama - parametreler değiştiğinde
  const results = useMemo(() => {
    // Hesaplamalar
    const fxFactor = fxRate / 28
    const currentInflationFactor = (100 + currentInflation) / 100
    const estimatedInflationFactor = (100 + estimatedInflation) / 100
    
    // Şimdi al (mevcut enflasyon ile)
    const costNow = vehiclePrice * fxFactor * currentInflationFactor
    
    // 6 ay sonra (tahmini enflasyon ile)
    const cost3Months = vehiclePrice * fxFactor * estimatedInflationFactor
    
    const difference = cost3Months - costNow
    const differencePercent = (difference / costNow) * 100
    
    // Öneri mantığı
    const recommendation = differencePercent > 15 ? 'HEMEN AL' :
                          differencePercent > 10 ? 'KISMI AL' : 'BEKLE'
    
    const riskLevel = differencePercent > 20 ? 'YÜKSEK' :
                     differencePercent > 10 ? 'ORTA' : 'DÜŞÜK'
    
    return {
      costNow,
      cost3Months,
      difference,
      differencePercent,
      recommendation,
      riskLevel
    }
  }, [currentInflation, estimatedInflation, fxRate, vehiclePrice])

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
            💹
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
              Senaryolar (Döviz/Enflasyon)
            </h1>
            <p style={{ 
              margin: 0, 
              fontSize: '1rem', 
              color: '#94a3b8',
              fontWeight: '500',
              letterSpacing: '0.2px'
            }}>
              Enflasyon ve döviz kuru simülasyonları ile karar destek analizi
            </p>
          </div>
        </div>
      </div>
      
      {/* Forecasting & Simulation Module - Compact */}
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
            Enflasyon / Dolar / Euro Grafikleri
          </h3>
        </div>
        <div style={{ padding: '0', position: 'relative', zIndex: 1 }}>
          {/* Enflasyon Grafiği - Premium ve Estetik */}
          <div style={{ 
            marginBottom: '1rem',
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.05) 0%, rgba(220, 38, 38, 0.02) 100%)',
            borderRadius: '20px',
            padding: '1.5rem',
            border: '1px solid rgba(239, 68, 68, 0.15)',
            boxShadow: 'inset 0 2px 8px rgba(239, 68, 68, 0.1)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Arka plan dekoratif efektler */}
            <div style={{
              position: 'absolute',
              top: '20%',
              left: '10%',
              width: '200px',
              height: '200px',
              background: 'radial-gradient(circle, rgba(239, 68, 68, 0.08) 0%, transparent 70%)',
              borderRadius: '50%',
              filter: 'blur(60px)',
              pointerEvents: 'none',
              zIndex: 0
            }} />
            <div style={{
              position: 'absolute',
              bottom: '10%',
              right: '15%',
              width: '150px',
              height: '150px',
              background: 'radial-gradient(circle, rgba(245, 101, 101, 0.06) 0%, transparent 70%)',
              borderRadius: '50%',
              filter: 'blur(50px)',
              pointerEvents: 'none',
              zIndex: 0
            }} />
            
            <ResponsiveContainer width="100%" height={450}>
              <LineChart 
                data={
                  historicalData && historicalData.length > 0 
                    ? historicalData.map(d => ({ year: d.year, inflation: d.inflation }))
                    : [
                        { year: 2020, inflation: 14.60 },
                        { year: 2021, inflation: 36.08 },
                        { year: 2022, inflation: 64.27 },
                        { year: 2023, inflation: 64.77 },
                        { year: 2024, inflation: 44.38 },
                        { year: 2025, inflation: 31.07 }
                      ]
                }
                margin={{ top: 30, right: 40, left: 30, bottom: 30 }}
              >
                <defs>
                  {/* Gelişmiş gradient - Enflasyon için kırmızı-turuncu tonları */}
                  <linearGradient id="inflationGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity={0.6}/>
                    <stop offset="20%" stopColor="#f97316" stopOpacity={0.5}/>
                    <stop offset="40%" stopColor="#ef4444" stopOpacity={0.35}/>
                    <stop offset="60%" stopColor="#dc2626" stopOpacity={0.25}/>
                    <stop offset="80%" stopColor="#ef4444" stopOpacity={0.15}/>
                    <stop offset="100%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                  
                  {/* İkinci katman gradient - daha yumuşak geçiş */}
                  <linearGradient id="inflationGradientSecondary" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f97316" stopOpacity={0.3}/>
                    <stop offset="50%" stopColor="#ef4444" stopOpacity={0.2}/>
                    <stop offset="100%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                  
                  {/* Gelişmiş glow efekti */}
                  <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                  
                  {/* Çizgi için gradient */}
                  <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#f97316" stopOpacity={0.8}/>
                    <stop offset="50%" stopColor="#ef4444" stopOpacity={1}/>
                    <stop offset="100%" stopColor="#dc2626" stopOpacity={0.9}/>
                  </linearGradient>
                  
                  {/* Nokta için radial gradient */}
                  <radialGradient id="dotGradient" cx="50%" cy="50%">
                    <stop offset="0%" stopColor="#ffffff" stopOpacity={1}/>
                    <stop offset="70%" stopColor="#ef4444" stopOpacity={1}/>
                    <stop offset="100%" stopColor="#dc2626" stopOpacity={1}/>
                  </radialGradient>
                </defs>
                
                {/* Grid - daha ince ve zarif */}
                <CartesianGrid 
                  strokeDasharray="2 4" 
                  stroke="rgba(239, 68, 68, 0.12)" 
                  vertical={false}
                  strokeWidth={1.5}
                  dot={false}
                />
                
                {/* X Ekseni - daha belirgin */}
                <XAxis 
                  dataKey="year" 
                  stroke="rgba(239, 68, 68, 0.4)"
                  tick={{ 
                    fill: '#f1f5f9', 
                    fontSize: 13, 
                    fontWeight: '700',
                    letterSpacing: '0.5px'
                  }}
                  axisLine={{ 
                    stroke: 'rgba(239, 68, 68, 0.5)', 
                    strokeWidth: 2.5 
                  }}
                  tickLine={{ 
                    stroke: 'rgba(239, 68, 68, 0.5)', 
                    strokeWidth: 2,
                    length: 8
                  }}
                  tickMargin={12}
                />
                
                {/* Y Ekseni - daha belirgin */}
                <YAxis 
                  stroke="rgba(239, 68, 68, 0.4)"
                  tick={{ 
                    fill: '#f1f5f9', 
                    fontSize: 13, 
                    fontWeight: '700',
                    letterSpacing: '0.3px'
                  }}
                  label={{ 
                    value: 'Enflasyon Oranı (%)', 
                    angle: -90, 
                    position: 'insideLeft', 
                    fill: '#f1f5f9', 
                    style: { 
                      fontSize: 14, 
                      fontWeight: '800', 
                      letterSpacing: '1px',
                      textShadow: '0 2px 8px rgba(239, 68, 68, 0.3)'
                    } 
                  }}
                  axisLine={{ 
                    stroke: 'rgba(239, 68, 68, 0.5)', 
                    strokeWidth: 2.5 
                  }}
                  tickLine={{ 
                    stroke: 'rgba(239, 68, 68, 0.5)', 
                    strokeWidth: 2,
                    length: 8
                  }}
                  tickMargin={12}
                  domain={['dataMin - 8', 'dataMax + 8']}
                />
                
                {/* Tooltip - premium tasarım */}
                <Tooltip 
                  contentStyle={{
                    background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.98) 100%)',
                    border: '2px solid rgba(239, 68, 68, 0.7)',
                    borderRadius: '16px',
                    color: '#ffffff',
                    fontSize: '0.95rem',
                    padding: '16px 20px',
                    boxShadow: '0 12px 40px rgba(239, 68, 68, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(20px)',
                    minWidth: '180px'
                  }}
                  labelStyle={{ 
                    color: '#f1f5f9', 
                    fontWeight: '800',
                    marginBottom: '12px',
                    fontSize: '1.1rem',
                    letterSpacing: '0.8px',
                    textTransform: 'uppercase',
                    borderBottom: '2px solid rgba(239, 68, 68, 0.5)',
                    paddingBottom: '8px'
                  }}
                  itemStyle={{
                    color: '#ef4444',
                    fontWeight: '800',
                    fontSize: '1.25rem',
                    textShadow: '0 2px 8px rgba(239, 68, 68, 0.4)'
                  }}
                  formatter={(value) => [`${value.toFixed(1)}%`, '📈 Enflasyon']}
                  separator=": "
                  cursor={{ 
                    stroke: '#ef4444', 
                    strokeWidth: 3, 
                    strokeDasharray: '8 4',
                    strokeOpacity: 0.6
                  }}
                />
                
                {/* İkinci katman area - daha yumuşak geçiş */}
                <Area 
                  type="monotone" 
                  dataKey="inflation" 
                  fill="url(#inflationGradientSecondary)" 
                  stroke="none"
                  animationDuration={2000}
                  animationEasing="ease-out"
                />
                
                {/* Ana area - gradient doldurma */}
                <Area 
                  type="monotone" 
                  dataKey="inflation" 
                  fill="url(#inflationGradient)" 
                  stroke="none"
                  animationDuration={2000}
                  animationEasing="ease-out"
                />
                
                {/* Ana çizgi - gradient ve kalın */}
                <Line 
                  type="monotone" 
                  dataKey="inflation" 
                  stroke="url(#lineGradient)" 
                  strokeWidth={5}
                  dot={{ 
                    fill: 'url(#dotGradient)', 
                    r: 8, 
                    strokeWidth: 4, 
                    stroke: '#ffffff',
                    filter: 'url(#glow)',
                    opacity: 0.95
                  }}
                  activeDot={{ 
                    r: 12, 
                    strokeWidth: 4, 
                    stroke: '#ffffff',
                    fill: '#dc2626',
                    filter: 'url(#glow)',
                    style: {
                      boxShadow: '0 0 20px rgba(239, 68, 68, 0.8)'
                    }
                  }}
                  animationDuration={2000}
                  animationEasing="ease-out"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Dolar ve Euro Grafikleri - Yan Yana */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginTop: '1.5rem' }}>
            {/* Dolar Grafiği */}
            <div style={{ background: 'rgba(30, 30, 46, 0.4)', borderRadius: '6px', padding: '0.75rem', minHeight: '300px' }}>
              <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.875rem', color: '#ffffff', fontWeight: '600' }}>💵 Dolar (USD/TRY)</h4>
              <ResponsiveContainer width="100%" height={250} minHeight={250}>
                <LineChart data={dollarData && dollarData.length > 0 ? dollarData : [
                  { year: 2020, rate: 7.02, change: 0 },
                  { year: 2021, rate: 8.90, change: 26.8 },
                  { year: 2022, rate: 16.57, change: 86.2 },
                  { year: 2023, rate: 23.77, change: 43.5 },
                  { year: 2024, rate: 32.51, change: 36.8 },
                  { year: 2025, rate: 40.50, change: 24.6 }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                  <XAxis 
                    dataKey="year" 
                    stroke="#cbd5e1"
                    tick={{ fill: '#cbd5e1', fontSize: 10 }}
                  />
                  <YAxis 
                    yAxisId="left"
                    stroke="#10b981"
                    tick={{ fill: '#10b981', fontSize: 10 }}
                    label={{ value: 'Kur (TRY)', angle: -90, position: 'insideLeft', fill: '#10b981', style: { fontSize: 10 } }}
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    stroke="#f59e0b"
                    tick={{ fill: '#f59e0b', fontSize: 10 }}
                    label={{ value: 'Değişim (%)', angle: 90, position: 'insideRight', fill: '#f59e0b', style: { fontSize: 10 } }}
                  />
                  <Tooltip 
                    contentStyle={{
                      background: 'rgba(30, 30, 46, 0.95)',
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                      borderRadius: '6px',
                      color: '#ffffff',
                      fontSize: '0.75rem'
                    }}
                    formatter={(value, name) => {
                      if (name === 'rate') return `${value} TRY`
                      if (name === 'change') return `${value > 0 ? '+' : ''}${value}%`
                      return value
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '0.7rem', color: '#cbd5e1' }} />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="rate" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    name="Dolar Kuru"
                    dot={{ fill: '#10b981', r: 4 }}
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="change" 
                    stroke="#f59e0b" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    name="Yıllık Değişim (%)"
                    dot={{ fill: '#f59e0b', r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
              <div style={{ marginTop: '0.75rem', padding: '0.5rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '4px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#cbd5e1', textAlign: 'center' }}>
                  <strong style={{ color: '#10b981' }}>2020-2025 Ortalama Yıllık Artış: %{dollarAvgGrowth.toFixed(1)}</strong>
                </p>
              </div>
            </div>

            {/* Euro Grafiği */}
            <div style={{ background: 'rgba(30, 30, 46, 0.4)', borderRadius: '6px', padding: '0.75rem', minHeight: '300px' }}>
              <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.875rem', color: '#ffffff', fontWeight: '600' }}>💶 Euro (EUR/TRY)</h4>
              <ResponsiveContainer width="100%" height={250} minHeight={250}>
                <LineChart 
                  data={euroData && euroData.length > 0 ? euroData : [
                    { year: 2020, rate: 8.04, change: 0 },
                    { year: 2021, rate: 10.51, change: 30.7 },
                    { year: 2022, rate: 17.38, change: 65.4 },
                    { year: 2023, rate: 25.76, change: 48.2 },
                    { year: 2024, rate: 35.60, change: 38.2 },
                    { year: 2025, rate: 43.20, change: 21.3 }
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                  <XAxis 
                    dataKey="year" 
                    stroke="#cbd5e1"
                    tick={{ fill: '#cbd5e1', fontSize: 10 }}
                  />
                  <YAxis 
                    yAxisId="left"
                    stroke="#3b82f6"
                    tick={{ fill: '#3b82f6', fontSize: 10 }}
                    label={{ value: 'Kur (TRY)', angle: -90, position: 'insideLeft', fill: '#3b82f6', style: { fontSize: 10 } }}
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    stroke="#f59e0b"
                    tick={{ fill: '#f59e0b', fontSize: 10 }}
                    label={{ value: 'Değişim (%)', angle: 90, position: 'insideRight', fill: '#f59e0b', style: { fontSize: 10 } }}
                  />
                  <Tooltip 
                    contentStyle={{
                      background: 'rgba(30, 30, 46, 0.95)',
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                      borderRadius: '6px',
                      color: '#ffffff',
                      fontSize: '0.75rem'
                    }}
                    formatter={(value, name) => {
                      if (name === 'rate') return `${value} TRY`
                      if (name === 'change') return `${value > 0 ? '+' : ''}${value}%`
                      return value
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '0.7rem', color: '#cbd5e1' }} />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="rate" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    name="Euro Kuru"
                    dot={{ fill: '#3b82f6', r: 4 }}
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="change" 
                    stroke="#f59e0b" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    name="Yıllık Değişim (%)"
                    dot={{ fill: '#f59e0b', r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
              <div style={{ marginTop: '0.75rem', padding: '0.5rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '4px', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#cbd5e1', textAlign: 'center' }}>
                  <strong style={{ color: '#3b82f6' }}>2020-2025 Ortalama Yıllık Artış: %{euroAvgGrowth.toFixed(1)}</strong>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Senaryo Simülasyonu Açıklama */}
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
            <span>📊</span>
            <span>Senaryo Simülasyonu</span>
          </h3>
        </div>
        <div style={{ padding: '0', position: 'relative', zIndex: 1 }}>
          <p style={{ color: '#cbd5e1', lineHeight: '1.6' }}>
            Farklı senaryoları test ederek karar destek analizi yapın. Enflasyon, kur, talep artışı gibi parametreleri değiştirerek olası sonuçları görün.
          </p>
        </div>
      </div>

      {/* İnteraktif Simülasyon */}
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
            <span>🎛️</span>
            <span>İnteraktif Simülasyon</span>
          </h3>
        </div>
        <div style={{ padding: '0', position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '1.5rem'
          }}>
            {/* Mevcut Enflasyon Kartı */}
            <div style={{
              padding: '2rem',
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(37, 99, 235, 0.1) 100%)',
              borderRadius: '16px',
              border: '1px solid rgba(59, 130, 246, 0.4)',
              boxShadow: '0 8px 32px rgba(59, 130, 246, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
              position: 'relative',
              overflow: 'hidden',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)'
              e.currentTarget.style.boxShadow = '0 12px 40px rgba(59, 130, 246, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 8px 32px rgba(59, 130, 246, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
            }}
            >
              <div style={{
                position: 'absolute',
                top: '-20%',
                right: '-20%',
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
                gap: '0.75rem',
                marginBottom: '1.5rem',
                position: 'relative',
                zIndex: 1
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.25rem',
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)'
                }}>
                  📈
                </div>
                <div>
                  <div style={{
                    fontSize: '0.75rem',
                    color: '#94a3b8',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: '0.25rem'
                  }}>
                    Mevcut Enflasyon
                  </div>
                  <div style={{
                    fontSize: '2rem',
                    fontWeight: '700',
                    color: '#3b82f6',
                    lineHeight: '1'
                  }}>
                    {currentInflation}%
                  </div>
                </div>
              </div>
              <div style={{ position: 'relative', zIndex: 1 }}>
                <input
                  type="range"
                  min="20"
                  max="100"
                  step="0.5"
                  value={currentInflation}
                  onChange={(e) => setCurrentInflation(parseFloat(e.target.value))}
                  style={{
                    width: '100%',
                    height: '10px',
                    borderRadius: '5px',
                    background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((currentInflation - 20) / 80) * 100}%, rgba(255, 255, 255, 0.15) ${((currentInflation - 20) / 80) * 100}%, rgba(255, 255, 255, 0.15) 100%)`,
                    outline: 'none',
                    cursor: 'pointer',
                    WebkitAppearance: 'none',
                    appearance: 'none'
                  }}
                />
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.75rem',
                  color: '#94a3b8',
                  marginTop: '0.75rem',
                  fontWeight: '500'
                }}>
                  <span>20%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>

            {/* Tahmini Enflasyon Kartı */}
            <div style={{
              padding: '2rem',
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(217, 119, 6, 0.1) 100%)',
              borderRadius: '16px',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              boxShadow: '0 8px 32px rgba(245, 158, 11, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
              position: 'relative',
              overflow: 'hidden',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)'
              e.currentTarget.style.boxShadow = '0 12px 40px rgba(245, 158, 11, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 8px 32px rgba(245, 158, 11, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
            }}
            >
              <div style={{
                position: 'absolute',
                top: '-20%',
                right: '-20%',
                width: '150px',
                height: '150px',
                background: 'radial-gradient(circle, rgba(245, 158, 11, 0.2) 0%, transparent 70%)',
                borderRadius: '50%',
                filter: 'blur(40px)',
                pointerEvents: 'none'
              }} />
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: '1.5rem',
                position: 'relative',
                zIndex: 1
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.25rem',
                  boxShadow: '0 4px 12px rgba(245, 158, 11, 0.4)'
                }}>
                  🔮
                </div>
                <div>
                  <div style={{
                    fontSize: '0.75rem',
                    color: '#94a3b8',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: '0.25rem'
                  }}>
                    Tahmini Enflasyon
                  </div>
                  <div style={{
                    fontSize: '2rem',
                    fontWeight: '700',
                    color: '#f59e0b',
                    lineHeight: '1'
                  }}>
                    {estimatedInflation}%
                  </div>
                </div>
              </div>
              <div style={{ position: 'relative', zIndex: 1 }}>
                <input
                  type="range"
                  min="20"
                  max="100"
                  step="0.5"
                  value={estimatedInflation}
                  onChange={(e) => setEstimatedInflation(parseFloat(e.target.value))}
                  style={{
                    width: '100%',
                    height: '10px',
                    borderRadius: '5px',
                    background: `linear-gradient(to right, #f59e0b 0%, #f59e0b ${((estimatedInflation - 20) / 80) * 100}%, rgba(255, 255, 255, 0.15) ${((estimatedInflation - 20) / 80) * 100}%, rgba(255, 255, 255, 0.15) 100%)`,
                    outline: 'none',
                    cursor: 'pointer',
                    WebkitAppearance: 'none',
                    appearance: 'none'
                  }}
                />
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.75rem',
                  color: '#94a3b8',
                  marginTop: '0.75rem',
                  fontWeight: '500'
                }}>
                  <span>20%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>

            {/* Döviz Kuru Kartı */}
            <div style={{
              padding: '2rem',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.1) 100%)',
              borderRadius: '16px',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              boxShadow: '0 8px 32px rgba(16, 185, 129, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
              position: 'relative',
              overflow: 'hidden',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)'
              e.currentTarget.style.boxShadow = '0 12px 40px rgba(16, 185, 129, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 8px 32px rgba(16, 185, 129, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
            }}
            >
              <div style={{
                position: 'absolute',
                top: '-20%',
                right: '-20%',
                width: '150px',
                height: '150px',
                background: 'radial-gradient(circle, rgba(16, 185, 129, 0.2) 0%, transparent 70%)',
                borderRadius: '50%',
                filter: 'blur(40px)',
                pointerEvents: 'none'
              }} />
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: '1.5rem',
                position: 'relative',
                zIndex: 1
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.25rem',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)'
                }}>
                  💵
                </div>
                <div>
                  <div style={{
                    fontSize: '0.75rem',
                    color: '#94a3b8',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: '0.25rem'
                  }}>
                    Döviz Kuru
                  </div>
                  <div style={{
                    fontSize: '2rem',
                    fontWeight: '700',
                    color: '#10b981',
                    lineHeight: '1'
                  }}>
                    {fxRate}
                  </div>
                  <div style={{
                    fontSize: '0.75rem',
                    color: '#64748b',
                    fontWeight: '500',
                    marginTop: '0.25rem'
                  }}>
                    USD/TRY
                  </div>
                </div>
              </div>
              <div style={{ position: 'relative', zIndex: 1 }}>
                <input
                  type="range"
                  min="28"
                  max="100"
                  step="0.5"
                  value={fxRate}
                  onChange={(e) => setFxRate(parseFloat(e.target.value))}
                  style={{
                    width: '100%',
                    height: '10px',
                    borderRadius: '5px',
                    background: `linear-gradient(to right, #10b981 0%, #10b981 ${((fxRate - 28) / 72) * 100}%, rgba(255, 255, 255, 0.15) ${((fxRate - 28) / 72) * 100}%, rgba(255, 255, 255, 0.15) 100%)`,
                    outline: 'none',
                    cursor: 'pointer',
                    WebkitAppearance: 'none',
                    appearance: 'none'
                  }}
                />
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.75rem',
                  color: '#94a3b8',
                  marginTop: '0.75rem',
                  fontWeight: '500'
                }}>
                  <span>28</span>
                  <span>100</span>
                </div>
              </div>
            </div>

            {/* Ürün Fiyatı Kartı */}
            <div style={{
              padding: '2rem',
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(124, 58, 237, 0.1) 100%)',
              borderRadius: '16px',
              border: '1px solid rgba(139, 92, 246, 0.4)',
              boxShadow: '0 8px 32px rgba(139, 92, 246, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
              position: 'relative',
              overflow: 'hidden',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)'
              e.currentTarget.style.boxShadow = '0 12px 40px rgba(139, 92, 246, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 8px 32px rgba(139, 92, 246, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
            }}
            >
              <div style={{
                position: 'absolute',
                top: '-20%',
                right: '-20%',
                width: '150px',
                height: '150px',
                background: 'radial-gradient(circle, rgba(139, 92, 246, 0.2) 0%, transparent 70%)',
                borderRadius: '50%',
                filter: 'blur(40px)',
                pointerEvents: 'none'
              }} />
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: '1.5rem',
                position: 'relative',
                zIndex: 1
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.25rem',
                  boxShadow: '0 4px 12px rgba(139, 92, 246, 0.4)'
                }}>
                  💰
                </div>
                <div>
                  <div style={{
                    fontSize: '0.75rem',
                    color: '#94a3b8',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: '0.25rem'
                  }}>
                    Ürün Fiyatı
                  </div>
                  <div style={{
                    fontSize: '1.75rem',
                    fontWeight: '700',
                    color: '#8b5cf6',
                    lineHeight: '1'
                  }}>
                    {vehiclePrice.toLocaleString('tr-TR')} ₺
                  </div>
                </div>
              </div>
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <input
                    type="range"
                    min="1000000"
                    max="5000000"
                    step="50000"
                    value={vehiclePrice}
                    onChange={(e) => setVehiclePrice(parseFloat(e.target.value))}
                    style={{
                      flex: 1,
                      height: '10px',
                      borderRadius: '5px',
                      background: `linear-gradient(to right, #8b5cf6 0%, #8b5cf6 ${((vehiclePrice - 1000000) / 4000000) * 100}%, rgba(255, 255, 255, 0.15) ${((vehiclePrice - 1000000) / 4000000) * 100}%, rgba(255, 255, 255, 0.15) 100%)`,
                      outline: 'none',
                      cursor: 'pointer',
                      WebkitAppearance: 'none',
                      appearance: 'none'
                    }}
                  />
                  <input
                    type="number"
                    value={vehiclePrice}
                    onChange={(e) => setVehiclePrice(parseFloat(e.target.value) || 0)}
                    min="0"
                    step="50000"
                    style={{
                      width: '180px',
                      padding: '0.75rem',
                      fontSize: '0.9rem',
                      background: 'rgba(15, 23, 42, 0.6)',
                      border: '1px solid rgba(139, 92, 246, 0.3)',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontWeight: '600',
                      outline: 'none'
                    }}
                  />
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.75rem',
                  color: '#94a3b8',
                  fontWeight: '500'
                }}>
                  <span>1.000.000 ₺</span>
                  <span>5.000.000 ₺</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sonuçlar - Otomatik Gösteriliyor */}
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
            <span>📊</span>
            <span>Senaryo Analiz Sonuçları</span>
          </h3>
        </div>
        <div style={{ padding: '0', position: 'relative', zIndex: 1 }}>
          {/* Öneri Etiketi - Modern Kart */}
          {(() => {
            const recColor = results.recommendation === 'HEMEN AL' ? '#10b981' :
                            results.recommendation === 'KISMI AL' ? '#f59e0b' : '#3b82f6'
            const riskColor = results.riskLevel === 'YÜKSEK' ? '#ef4444' :
                             results.riskLevel === 'ORTA' ? '#f59e0b' : '#10b981'
            
            return (
              <div style={{
                padding: '2rem',
                background: `linear-gradient(135deg, ${recColor}15 0%, ${recColor}08 100%)`,
                borderRadius: '16px',
                marginBottom: '2rem',
                border: `1px solid ${recColor}40`,
                boxShadow: `0 8px 32px ${recColor}20, inset 0 1px 0 rgba(255, 255, 255, 0.05)`,
                position: 'relative',
                overflow: 'hidden'
              }}>
                {/* Dekoratif blur */}
                <div style={{
                  position: 'absolute',
                  top: '-30%',
                  right: '-20%',
                  width: '200px',
                  height: '200px',
                  background: `radial-gradient(circle, ${recColor}20 0%, transparent 70%)`,
                  borderRadius: '50%',
                  filter: 'blur(60px)',
                  pointerEvents: 'none'
                }} />
                
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'flex-start',
                  marginBottom: '1rem',
                  position: 'relative',
                  zIndex: 1
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      marginBottom: '0.75rem'
                    }}>
                      <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '12px',
                        background: `linear-gradient(135deg, ${recColor} 0%, ${recColor}dd 100%)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.5rem',
                        boxShadow: `0 4px 12px ${recColor}40`
                      }}>
                        {results.recommendation === 'HEMEN AL' ? '✅' : results.recommendation === 'KISMI AL' ? '⚠️' : '⏳'}
                      </div>
                      <div>
                        <div style={{ 
                          fontSize: '0.75rem', 
                          color: '#94a3b8', 
                          fontWeight: '600',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          marginBottom: '0.25rem'
                        }}>
                          Öneri
                        </div>
                        <h4 style={{ 
                          margin: 0, 
                          fontSize: '1.5rem', 
                          color: '#ffffff',
                          fontWeight: '700',
                          letterSpacing: '-0.3px'
                        }}>
                          {results.recommendation}
                        </h4>
                      </div>
                    </div>
                  </div>
                  <div style={{
                    padding: '0.75rem 1.25rem',
                    background: `linear-gradient(135deg, ${riskColor}20 0%, ${riskColor}10 100%)`,
                    borderRadius: '12px',
                    border: `1px solid ${riskColor}40`,
                    backdropFilter: 'blur(10px)'
                  }}>
                    <div style={{
                      fontSize: '0.75rem',
                      color: '#94a3b8',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      marginBottom: '0.25rem'
                    }}>
                      Risk Seviyesi
                    </div>
                    <div style={{
                      fontSize: '1rem',
                      fontWeight: '700',
                      color: riskColor
                    }}>
                      {results.riskLevel}
                    </div>
                  </div>
                </div>
                <p style={{ 
                  margin: 0, 
                  color: '#cbd5e1',
                  fontSize: '0.95rem',
                  lineHeight: '1.6',
                  position: 'relative',
                  zIndex: 1
                }}>
                  {results.recommendation === 'HEMEN AL' && 'Maliyet farkı önemli. Daha yüksek gelecek maliyetlerden kaçınmak için şimdi satın alın.'}
                  {results.recommendation === 'KISMI AL' && 'Kritik öğeleri şimdi kısmen satın almayı düşünün, diğerleri için bekleyin.'}
                  {results.recommendation === 'BEKLE' && 'Maliyet farkı yönetilebilir. 6 ay beklenebilir.'}
                </p>
              </div>
            )
          })()}

          {/* Yan Yana Karşılaştırma Kartları - Modern Tasarım */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(2, 1fr)', 
            gap: '1.5rem',
            marginBottom: '2rem'
          }}>
            {/* Şimdi Al Kartı */}
            <div style={{ 
              padding: '2rem',
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(37, 99, 235, 0.1) 100%)',
              borderRadius: '16px',
              border: '1px solid rgba(59, 130, 246, 0.4)',
              boxShadow: '0 8px 32px rgba(59, 130, 246, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
              position: 'relative',
              overflow: 'hidden',
              transition: 'all 0.3s ease',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)'
              e.currentTarget.style.boxShadow = '0 12px 40px rgba(59, 130, 246, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 8px 32px rgba(59, 130, 246, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
            }}
            >
              <div style={{
                position: 'absolute',
                top: '-20%',
                right: '-20%',
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
                gap: '0.75rem',
                marginBottom: '1.5rem',
                position: 'relative',
                zIndex: 1
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.25rem',
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)'
                }}>
                  💰
                </div>
                <h4 style={{ 
                  margin: 0, 
                  color: '#3b82f6',
                  fontSize: '1.1rem',
                  fontWeight: '700',
                  letterSpacing: '-0.3px'
                }}>
                  Şimdi Al
                </h4>
              </div>
              <div style={{ 
                fontSize: '2rem', 
                fontWeight: '700', 
                color: '#3b82f6',
                marginBottom: '1rem',
                lineHeight: '1',
                position: 'relative',
                zIndex: 1
              }}>
                {results.costNow.toLocaleString('tr-TR')} ₺
              </div>
              <div style={{
                padding: '1rem',
                background: 'rgba(15, 23, 42, 0.6)',
                borderRadius: '10px',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                position: 'relative',
                zIndex: 1
              }}>
                <div style={{ 
                  color: '#94a3b8', 
                  fontSize: '0.8rem',
                  fontWeight: '500',
                  marginBottom: '0.5rem'
                }}>
                  Mevcut enflasyon: <span style={{ color: '#3b82f6', fontWeight: '600' }}>{currentInflation}%</span>
                </div>
                <div style={{ 
                  color: '#94a3b8', 
                  fontSize: '0.8rem',
                  fontWeight: '500'
                }}>
                  Döviz kuru: <span style={{ color: '#3b82f6', fontWeight: '600' }}>{fxRate} TRY/USD</span>
                </div>
              </div>
            </div>

            {/* 3 Ay Sonra Kartı */}
            <div style={{ 
              padding: '2rem',
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.1) 100%)',
              borderRadius: '16px',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              boxShadow: '0 8px 32px rgba(239, 68, 68, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
              position: 'relative',
              overflow: 'hidden',
              transition: 'all 0.3s ease',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)'
              e.currentTarget.style.boxShadow = '0 12px 40px rgba(239, 68, 68, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 8px 32px rgba(239, 68, 68, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
            }}
            >
              <div style={{
                position: 'absolute',
                top: '-20%',
                right: '-20%',
                width: '150px',
                height: '150px',
                background: 'radial-gradient(circle, rgba(239, 68, 68, 0.2) 0%, transparent 70%)',
                borderRadius: '50%',
                filter: 'blur(40px)',
                pointerEvents: 'none'
              }} />
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: '1.5rem',
                position: 'relative',
                zIndex: 1
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.25rem',
                  boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)'
                }}>
                  ⏰
                </div>
                <h4 style={{ 
                  margin: 0, 
                  color: '#ef4444',
                  fontSize: '1.1rem',
                  fontWeight: '700',
                  letterSpacing: '-0.3px'
                }}>
                  6 Ay Sonra
                </h4>
              </div>
              <div style={{ 
                fontSize: '2rem', 
                fontWeight: '700', 
                color: '#ef4444',
                marginBottom: '1rem',
                lineHeight: '1',
                position: 'relative',
                zIndex: 1
              }}>
                {results.cost3Months.toLocaleString('tr-TR')} ₺
              </div>
              <div style={{
                padding: '1rem',
                background: 'rgba(15, 23, 42, 0.6)',
                borderRadius: '10px',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                position: 'relative',
                zIndex: 1
              }}>
                <div style={{ 
                  color: '#94a3b8', 
                  fontSize: '0.8rem',
                  fontWeight: '500',
                  marginBottom: '0.5rem'
                }}>
                  Tahmini enflasyon: <span style={{ color: '#ef4444', fontWeight: '600' }}>{estimatedInflation}%</span>
                </div>
                <div style={{ 
                  color: '#94a3b8', 
                  fontSize: '0.8rem',
                  fontWeight: '500'
                }}>
                  Döviz kuru: <span style={{ color: '#ef4444', fontWeight: '600' }}>{fxRate} TRY/USD</span>
                </div>
              </div>
            </div>
          </div>

          {/* Maliyet Farkı - Modern Kart */}
          <div style={{ 
            padding: '2rem',
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.1) 100%)',
            borderRadius: '16px',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            boxShadow: '0 8px 32px rgba(239, 68, 68, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
            marginBottom: '2rem',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: '-30%',
              right: '-20%',
              width: '200px',
              height: '200px',
              background: 'radial-gradient(circle, rgba(239, 68, 68, 0.2) 0%, transparent 70%)',
              borderRadius: '50%',
              filter: 'blur(60px)',
              pointerEvents: 'none'
            }} />
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
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)'
              }}>
                💸
              </div>
              <h4 style={{ 
                margin: 0, 
                color: '#ffffff',
                fontSize: '1.25rem',
                fontWeight: '700',
                letterSpacing: '-0.3px'
              }}>
                Tahmini Maliyet Farkı
              </h4>
            </div>
            <div style={{ 
              fontSize: '2.5rem', 
              fontWeight: '700', 
              color: '#ef4444',
              marginBottom: '0.75rem',
              lineHeight: '1',
              position: 'relative',
              zIndex: 1
            }}>
              +{results.difference.toLocaleString('tr-TR')} ₺
            </div>
            <div style={{ 
              fontSize: '1.1rem', 
              color: '#cbd5e1',
              marginBottom: '1rem',
              fontWeight: '600',
              position: 'relative',
              zIndex: 1
            }}>
              (%{results.differencePercent.toFixed(2)} artış)
            </div>
            <div style={{
              padding: '1rem',
              background: 'rgba(15, 23, 42, 0.6)',
              borderRadius: '10px',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              position: 'relative',
              zIndex: 1
            }}>
              <p style={{ 
                margin: 0, 
                color: '#cbd5e1', 
                fontSize: '0.9rem',
                lineHeight: '1.6'
              }}>
                Bu, şimdi almak yerine 6 ay beklerseniz oluşacak ek maliyeti temsil eder.
              </p>
            </div>
          </div>

          {/* Detaylı Öneriler - Modern Tasarım */}
          <div style={{ 
            marginTop: '2rem',
            padding: '2rem',
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.8) 100%)',
            borderRadius: '16px',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            boxShadow: '0 8px 32px rgba(59, 130, 246, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: '-30%',
              right: '-20%',
              width: '200px',
              height: '200px',
              background: 'radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%)',
              borderRadius: '50%',
              filter: 'blur(60px)',
              pointerEvents: 'none'
            }} />
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              marginBottom: '2rem',
              position: 'relative',
              zIndex: 1
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                boxShadow: '0 4px 12px rgba(139, 92, 246, 0.4)'
              }}>
                💡
              </div>
              <h3 style={{ 
                margin: 0,
                color: '#ffffff',
                fontSize: '1.5rem',
                fontWeight: '700',
                letterSpacing: '-0.3px'
              }}>
                Detaylı Öneriler
              </h3>
            </div>
            <div style={{ position: 'relative', zIndex: 1 }}>
              {/* Filo Alım Etkisi */}
              <div style={{ 
                marginBottom: '1.5rem', 
                padding: '1.5rem', 
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.05) 100%)',
                border: '1px solid rgba(59, 130, 246, 0.3)', 
                borderRadius: '12px',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateX(4px)'
                e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.5)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateX(0)'
                e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.3)'
              }}
              >
                <h5 style={{ 
                  marginBottom: '0.75rem',
                  color: '#3b82f6',
                  fontSize: '1rem',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <span>📊</span>
                  Filo Alım Etkisi
                </h5>
                <p style={{ 
                  margin: '0 0 1rem 0', 
                  color: '#cbd5e1',
                  fontSize: '0.9rem',
                  lineHeight: '1.6'
                }}>
                  Eğer döviz kuru {fxRate} ve mevcut enflasyon {currentInflation}% ise, şimdi alırsanız:
                </p>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '0.75rem'
                }}>
                  <div style={{
                    padding: '0.75rem',
                    background: 'rgba(15, 23, 42, 0.6)',
                    borderRadius: '8px',
                    border: '1px solid rgba(59, 130, 246, 0.2)'
                  }}>
                    <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Araç Maliyeti</div>
                    <div style={{ color: '#3b82f6', fontWeight: '700', fontSize: '0.95rem' }}>
                      {results.costNow.toLocaleString('tr-TR')} ₺
                    </div>
                  </div>
                  <div style={{
                    padding: '0.75rem',
                    background: 'rgba(15, 23, 42, 0.6)',
                    borderRadius: '8px',
                    border: '1px solid rgba(59, 130, 246, 0.2)'
                  }}>
                    <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Döviz Etkisi</div>
                    <div style={{ color: '#3b82f6', fontWeight: '700', fontSize: '0.95rem' }}>
                      %{((fxRate / 28 - 1) * 100).toFixed(1)}
                    </div>
                  </div>
                  <div style={{
                    padding: '0.75rem',
                    background: 'rgba(15, 23, 42, 0.6)',
                    borderRadius: '8px',
                    border: '1px solid rgba(59, 130, 246, 0.2)'
                  }}>
                    <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Enflasyon Etkisi</div>
                    <div style={{ color: '#3b82f6', fontWeight: '700', fontSize: '0.95rem' }}>
                      %{currentInflation}
                    </div>
                  </div>
                </div>
              </div>

              {/* 6 Ay Sonraki Tahmin */}
              <div style={{ 
                marginBottom: '1.5rem', 
                padding: '1.5rem', 
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.05) 100%)',
                border: '1px solid rgba(239, 68, 68, 0.3)', 
                borderRadius: '12px',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateX(4px)'
                e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateX(0)'
                e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)'
              }}
              >
                <h5 style={{ 
                  marginBottom: '0.75rem',
                  color: '#ef4444',
                  fontSize: '1rem',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <span>🔮</span>
                  6 Ay Sonraki Tahmin
                </h5>
                <p style={{ 
                  margin: '0 0 1rem 0', 
                  color: '#cbd5e1',
                  fontSize: '0.9rem',
                  lineHeight: '1.6'
                }}>
                  Eğer tahmini enflasyon {estimatedInflation}% olursa ve döviz kuru {fxRate} kalırsa:
                </p>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '0.75rem'
                }}>
                  <div style={{
                    padding: '0.75rem',
                    background: 'rgba(15, 23, 42, 0.6)',
                    borderRadius: '8px',
                    border: '1px solid rgba(239, 68, 68, 0.2)'
                  }}>
                    <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Araç Maliyeti</div>
                    <div style={{ color: '#ef4444', fontWeight: '700', fontSize: '0.95rem' }}>
                      {results.cost3Months.toLocaleString('tr-TR')} ₺
                    </div>
                  </div>
                  <div style={{
                    padding: '0.75rem',
                    background: 'rgba(15, 23, 42, 0.6)',
                    borderRadius: '8px',
                    border: '1px solid rgba(239, 68, 68, 0.2)'
                  }}>
                    <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Ek Maliyet</div>
                    <div style={{ color: '#ef4444', fontWeight: '700', fontSize: '0.95rem' }}>
                      +{results.difference.toLocaleString('tr-TR')} ₺
                    </div>
                  </div>
                  <div style={{
                    padding: '0.75rem',
                    background: 'rgba(15, 23, 42, 0.6)',
                    borderRadius: '8px',
                    border: '1px solid rgba(239, 68, 68, 0.2)'
                  }}>
                    <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Yüzde Artış</div>
                    <div style={{ color: '#ef4444', fontWeight: '700', fontSize: '0.95rem' }}>
                      %{results.differencePercent.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Karar Önerisi */}
              {(() => {
                const recColor = results.recommendation === 'HEMEN AL' ? '#10b981' :
                                results.recommendation === 'KISMI AL' ? '#f59e0b' : '#3b82f6'
                return (
                  <div style={{ 
                    padding: '1.5rem', 
                    background: `linear-gradient(135deg, ${recColor}15 0%, ${recColor}08 100%)`,
                    borderRadius: '12px',
                    border: `1px solid ${recColor}40`
                  }}>
                    <h5 style={{ 
                      marginBottom: '0.75rem',
                      color: recColor,
                      fontSize: '1rem',
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <span>🎯</span>
                      Karar Önerisi
                    </h5>
                    <p style={{ 
                      margin: 0, 
                      color: '#cbd5e1',
                      fontSize: '0.95rem',
                      lineHeight: '1.7'
                    }}>
                      {results.recommendation === 'HEMEN AL' && 
                        `Maliyet farkı %${results.differencePercent.toFixed(2)} ile önemli seviyede. Daha yüksek gelecek maliyetlerden kaçınmak için şimdi satın almanız önerilir. Beklemeniz durumunda ${results.difference.toLocaleString('tr-TR')} ₺ ek maliyet oluşacaktır.`}
                      {results.recommendation === 'KISMI AL' && 
                        `Maliyet farkı %${results.differencePercent.toFixed(2)} ile orta seviyede. Kritik öğeleri şimdi kısmen satın almayı düşünün, diğerleri için bekleyebilirsiniz. Bu strateji ile hem maliyet riskini azaltır hem de likiditeyi korursunuz.`}
                      {results.recommendation === 'BEKLE' && 
                        `Maliyet farkı %${results.differencePercent.toFixed(2)} ile yönetilebilir seviyede. 6 ay bekleyebilirsiniz. Bu süre içinde piyasa koşullarını gözlemleyerek daha uygun bir zamanlama yapabilirsiniz.`}
                    </p>
                  </div>
                )
              })()}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ScenarioSimulation



