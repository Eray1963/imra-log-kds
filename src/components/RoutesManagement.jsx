import { useState, useEffect, useRef } from 'react'

function RoutesManagement() {
  const [selectedRegion, setSelectedRegion] = useState(null)
  const [hoveredRegion, setHoveredRegion] = useState(null)
  const [selectedColorClass, setSelectedColorClass] = useState(null) // Seçilen renk class'ı (st7, st6, st3, vb.)
  const [showAllRegions, setShowAllRegions] = useState(false) // Tüm bölgeleri göster modu
  const [svgContent, setSvgContent] = useState(null)
  const svgRef = useRef(null)
  const regionGroupsRef = useRef({}) // Bölge isimlerini <g> elementlerine map eder
  const colorPathsRef = useRef({}) // Renk class'larına göre path'leri saklar (st1: [path1, path2], st2: [path3, path4], vb.)
  const selectedColorClassRef = useRef(null) // Closure sorununu çözmek için ref

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
    'st6': 'Marmara',        // Turuncu
    'st7': 'Ege',            // Kırmızı
    'st5': 'Akdeniz',        // Yeşil
    'st1': 'Güneydoğu Anadolu', // Pembe
    'st3': 'Doğu Anadolu',   // Turkuaz
    'st4': 'Karadeniz',      // Kırmızı/Turuncu
    'st2': 'İç Anadolu'      // Mavi
  }

  // Renklendirme fonksiyonu - Seçilen renge göre path'leri koyu mor renkte parlat
  const updateColors = () => {
    const colorPaths = colorPathsRef.current
    if (!colorPaths || Object.keys(colorPaths).length === 0) return

    // Tüm renk class'ları için path'leri işle
    Object.entries(colorPaths).forEach(([colorClass, paths]) => {
      paths.forEach(path => {
        // Eğer "Tüm Bölgeleri Göster" modu aktifse, tüm path'leri mor yap
        if (showAllRegions) {
          path.style.fill = '#7C3AED' // Koyu mor
          path.style.opacity = '1'
          path.style.filter = 'brightness(1.2) drop-shadow(0 0 12px rgba(124, 58, 237, 0.6))'
          path.style.stroke = '#A78BFA'
          path.style.strokeWidth = '2'
        } else if (selectedColorClass === colorClass) {
          // Seçilen renk class'ına sahip path'leri koyu mor renkte parlat
          path.style.fill = '#7C3AED' // Koyu mor
          path.style.opacity = '1'
          path.style.filter = 'brightness(1.2) drop-shadow(0 0 12px rgba(124, 58, 237, 0.6))'
          path.style.stroke = '#A78BFA'
          path.style.strokeWidth = '2'
        } else {
          // Diğer durumlarda normal koyu renkte görünsün
          path.style.fill = '#475569' // Daha açık gri-mavi (daha görünür)
          path.style.opacity = '1'
          path.style.filter = 'none'
          path.style.stroke = 'none'
        }
      })
    })
  }

  // SVG dosyasını yükle
  useEffect(() => {
    fetch('/TR-BOLGE.svg')
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        return response.text()
      })
      .then(text => {
        // HTML içinde SVG varsa ayıkla
        let svgText = text
        if (text.includes('<!DOCTYPE') || text.includes('<html')) {
          const svgMatch = text.match(/<svg[\s\S]*?<\/svg>/i)
          if (svgMatch) {
            svgText = svgMatch[0]
          }
        }
        
        if (svgText && svgText.trim().startsWith('<svg')) {
          setSvgContent(svgText)
        }
      })
      .catch(error => {
        console.error('SVG yükleme hatası:', error)
      })
  }, [])

  // SVG yüklendikten sonra bölgeleri grupla ve tıklanabilir yap
  useEffect(() => {
    if (!svgContent || !svgRef.current) {
      return
    }

    const timeout = setTimeout(() => {
      const svgContainer = svgRef.current
      if (!svgContainer) return

      // SVG içeriğini DOM'a ekle
      svgContainer.innerHTML = svgContent

      // SVG elementini bul
      const svg = svgContainer.querySelector('svg')
      if (!svg) return

      // SVG stillendir
      svg.style.width = '100%'
      svg.style.height = 'auto'
      svg.style.display = 'block'
      svg.style.maxWidth = '100%'

      // Tüm text elementlerine pointer-events: none ver
      const texts = svg.querySelectorAll('text')
      texts.forEach(text => {
        text.style.pointerEvents = 'none'
      })

      // Tüm path elementlerini bul
      const paths = svg.querySelectorAll('path')
      
      // Text elementlerinden bölge isimlerini ve konumlarını al
      const regionTexts = []
      texts.forEach(text => {
        const textContent = text.textContent?.trim()
        if (!textContent) return
        
        const regionNames = Object.keys(regionMap)
        const matchedRegion = regionNames.find(region => 
          textContent.includes(region) || 
          textContent.toLowerCase().includes(region.toLowerCase())
        )
        
        if (matchedRegion) {
          const transform = text.getAttribute('transform')
          let x = 0, y = 0
          
          if (transform) {
            if (transform.includes('matrix')) {
              const match = transform.match(/matrix\(([^)]+)\)/)
              if (match) {
                const values = match[1].split(/\s+/).map(v => parseFloat(v))
                x = values[4] || 0
                y = values[5] || 0
              }
            } else if (transform.includes('translate')) {
              const match = transform.match(/translate\(([^,]+),([^)]+)\)/)
              if (match) {
                x = parseFloat(match[1]) || 0
                y = parseFloat(match[2]) || 0
              }
            }
          }
          
          regionTexts.push({ name: matchedRegion, x, y })
        }
      })
      
      // Her bölge için bir <g> grubu oluştur
      const regionGroups = {}
      const regionPathMap = {}
      
      Object.keys(regionMap).forEach(regionName => {
        const regionId = regionMap[regionName]
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g')
        group.setAttribute('data-region', regionId)
        group.setAttribute('id', `region-${regionId}`)
        group.style.cursor = 'pointer'
        group.style.transition = 'all 0.3s ease'
        svg.appendChild(group)
        regionGroups[regionName] = group
        regionPathMap[regionName] = []
      })
      
      // Path'leri renk class'larına göre kaydet
      const colorPaths = {}
      
      // Path'leri bölgelere eşleştir ve gruplara taşı, aynı zamanda path'lere tıklama event'i ekle
      paths.forEach(path => {
        try {
          // Path'in renk class'ını al ve kaydet
          const className = path.getAttribute('class') || ''
          const colorClassMatch = className.match(/st\d+/)
          if (colorClassMatch) {
            const colorClass = colorClassMatch[0]
            if (!colorPaths[colorClass]) {
              colorPaths[colorClass] = []
            }
            colorPaths[colorClass].push(path)
          }
          
          const bbox = path.getBBox()
          const centerX = bbox.x + bbox.width / 2
          const centerY = bbox.y + bbox.height / 2
          
          // En yakın text elementini bul
          let closestRegion = null
          let minDistance = Infinity
          
          regionTexts.forEach(regionText => {
            const distance = Math.sqrt(
              Math.pow(centerX - regionText.x, 2) + Math.pow(centerY - regionText.y, 2)
            )
            if (distance < minDistance) {
              minDistance = distance
              closestRegion = regionText.name
            }
          })
          
          if (closestRegion && regionGroups[closestRegion]) {
            // Path'i ilgili gruba taşı
            regionGroups[closestRegion].appendChild(path)
            regionPathMap[closestRegion].push(path)
          }
          
          // Path'e tıklama event'i ekle - renge göre parlatma için
          const pathClickHandler = (e) => {
            e.stopPropagation() // Grup event'ini tetiklemesin
            const className = path.getAttribute('class') || ''
            const colorClassMatch = className.match(/st\d+/)
            if (colorClassMatch) {
              const colorClass = colorClassMatch[0]
              // Tüm renkler: mavi (st2), kırmızı/turuncu (st4), yeşil (st5), turuncu (st6), kırmızı (st7), turkuaz (st3), pembe (st1)
              if (colorClass === 'st1' || colorClass === 'st2' || colorClass === 'st3' || 
                  colorClass === 'st4' || colorClass === 'st5' || colorClass === 'st6' || colorClass === 'st7') {
                // Toggle: Eğer aynı bölge zaten seçiliyse, seçimi kaldır (ref kullanarak güncel değeri kontrol et)
                if (selectedColorClassRef.current === colorClass) {
                  setSelectedColorClass(null)
                  setSelectedRegion(null)
                  setShowAllRegions(false)
                } else {
                  setSelectedColorClass(colorClass)
                  setShowAllRegions(false) // Tek bölge seçildiğinde "tüm bölgeler" modunu kapat
                  // Renge göre bölgeyi de güncelle
                  const regionName = colorToRegionMap[colorClass]
                  if (regionName) {
                    setSelectedRegion(regionName)
                  }
                }
                console.log('Renk tıklandı:', colorClass, 'Bölge:', colorToRegionMap[colorClass])
              }
            }
          }
          
          path.style.cursor = 'pointer'
          path.addEventListener('click', pathClickHandler)
        } catch (err) {
          // getBBox() hata verebilir, devam et
        }
      })
      
      // Renk class'larına göre path'leri kaydet
      colorPathsRef.current = colorPaths
      
      regionGroupsRef.current = regionGroups
      
      // Her <g> grubuna event listener ekle
      Object.entries(regionGroups).forEach(([regionName, group]) => {
        const regionId = regionMap[regionName]
        
        // Click handler - Bu handler artık kullanılmıyor çünkü path'ler üzerinden tıklama yapıyoruz
        // Ama yine de toggle mantığını koruyoruz
        const clickHandler = (e) => {
          e.stopPropagation()
          const region = e.currentTarget.dataset.region
          // Region ID'den bölge ismini bul
          const regionNameFromId = Object.entries(regionMap).find(([name, id]) => id === region)?.[0]
          if (regionNameFromId) {
            // Bölge ismine göre renk class'ını bul
            const colorClass = Object.entries(colorToRegionMap).find(([color, region]) => region === regionNameFromId)?.[0]
            if (colorClass) {
              // Toggle: Eğer aynı bölge zaten seçiliyse, seçimi kaldır
              if (selectedColorClassRef.current === colorClass) {
                setSelectedColorClass(null)
                setSelectedRegion(null)
                setShowAllRegions(false)
              } else {
                setSelectedColorClass(colorClass)
                setShowAllRegions(false) // Tek bölge seçildiğinde "tüm bölgeler" modunu kapat
                setSelectedRegion(regionNameFromId)
              }
            }
            console.log('Bölge tıklandı:', regionNameFromId)
          }
        }
        
        // Hover handlers
        const mouseEnterHandler = () => {
          const regionNameFromId = Object.entries(regionMap).find(([name, id]) => id === group.dataset.region)?.[0]
          if (regionNameFromId) {
            setHoveredRegion(regionNameFromId)
          }
        }
        
        const mouseLeaveHandler = () => {
          setHoveredRegion(null)
        }
        
        group.addEventListener('click', clickHandler)
        group.addEventListener('mouseenter', mouseEnterHandler)
        group.addEventListener('mouseleave', mouseLeaveHandler)
      })
      
      // İlk renklendirmeyi uygula
      setTimeout(() => {
        updateColors()
      }, 50)
    }, 100)

    return () => clearTimeout(timeout)
  }, [svgContent])

  // selectedColorClass değiştiğinde ref'i güncelle
  useEffect(() => {
    selectedColorClassRef.current = selectedColorClass
  }, [selectedColorClass])

  // Renklendirme ve vurgulama
  useEffect(() => {
    updateColors()
  }, [selectedRegion, hoveredRegion, selectedColorClass, showAllRegions])

  // Tüm bölgeleri seç/kaldır fonksiyonu
  const toggleAllRegions = () => {
    if (showAllRegions || selectedColorClass) {
      // Eğer tüm bölgeler gösteriliyorsa veya bir bölge seçiliyse, tüm seçimleri kaldır
      setShowAllRegions(false)
      setSelectedColorClass(null)
      setSelectedRegion(null)
    } else {
      // Eğer hiçbir bölge seçili değilse, tüm bölgeleri göster
      setShowAllRegions(true)
      setSelectedColorClass(null)
      setSelectedRegion(null)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
      color: '#cbd5e1',
      padding: '2rem'
    }}>
      {/* SVG Harita */}
      <div style={{
        width: '100%',
        maxWidth: '1200px',
        margin: '0 auto',
        background: 'rgba(30, 41, 59, 0.5)',
        borderRadius: '12px',
        padding: '1rem',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
        minHeight: '500px'
      }}>
        {svgContent ? (
          <div
            ref={svgRef}
            style={{
              width: '100%',
              display: 'block'
            }}
          />
        ) : (
          <div style={{
            padding: '3rem',
            textAlign: 'center',
            color: '#94a3b8'
          }}>
            Harita yükleniyor...
          </div>
        )}
      </div>

      {/* Tüm Bölgeleri Seç/Kaldır Kontrolü */}
      <div style={{
        width: '100%',
        maxWidth: '1200px',
        margin: '2rem auto 0',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <button
          onClick={toggleAllRegions}
          style={{
            padding: '0.875rem 2rem',
            background: (showAllRegions || selectedColorClass)
              ? 'rgba(124, 58, 237, 0.9)' 
              : 'rgba(71, 85, 105, 0.8)',
            color: '#fff',
            border: (showAllRegions || selectedColorClass) 
              ? '2px solid #A78BFA' 
              : '2px solid rgba(71, 85, 105, 0.5)',
            borderRadius: '12px',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: (showAllRegions || selectedColorClass)
              ? '0 0 15px rgba(124, 58, 237, 0.5), 0 4px 6px rgba(0, 0, 0, 0.2)'
              : '0 2px 4px rgba(0, 0, 0, 0.2)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)'
            e.currentTarget.style.boxShadow = (showAllRegions || selectedColorClass)
              ? '0 0 20px rgba(124, 58, 237, 0.6), 0 6px 12px rgba(0, 0, 0, 0.3)'
              : '0 4px 8px rgba(0, 0, 0, 0.3)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)'
            e.currentTarget.style.boxShadow = (showAllRegions || selectedColorClass)
              ? '0 0 15px rgba(124, 58, 237, 0.5), 0 4px 6px rgba(0, 0, 0, 0.2)'
              : '0 2px 4px rgba(0, 0, 0, 0.2)'
          }}
        >
          {selectedRegion 
            ? selectedRegion 
            : showAllRegions 
              ? 'Tüm Bölgeler' 
              : 'Tüm Bölgeleri Göster'}
        </button>
      </div>
    </div>
  )
}

export default RoutesManagement
