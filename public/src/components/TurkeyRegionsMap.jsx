import { useState, useEffect } from 'react'

/**
 * TurkeyRegionsMap Component
 * 
 * A flat SVG-based Turkey map divided into 7 geographical regions.
 * Uses GeoJSON data converted to SVG paths for real geographic shapes.
 * 
 * Features:
 * - Real geographic boundaries (from GeoJSON)
 * - 7 distinct region colors
 * - Hover effects (darken region)
 * - Click interaction (log region, set state, highlight)
 * - No external map tiles
 * - Clean, textbook-style map
 */

// Region colors - each region has a fixed, distinct color
const REGION_COLORS = {
  'Marmara': '#3b82f6',      // Blue
  'Ege': '#10b981',          // Green
  'Akdeniz': '#f59e0b',      // Orange
  'İç Anadolu': '#8b5cf6',   // Purple
  'Karadeniz': '#06b6d4',    // Cyan
  'Doğu Anadolu': '#ef4444', // Red
  'Güneydoğu Anadolu': '#ec4899' // Pink
}

// SVG viewBox bounds for Turkey (longitude, latitude)
const TURKEY_BOUNDS = {
  minLng: 25.5,
  maxLng: 45.0,
  minLat: 35.5,
  maxLat: 42.5
}

// Convert GeoJSON coordinates to SVG path
function geoJsonToSvgPath(coordinates, width, height) {
  if (!coordinates || coordinates.length === 0) return ''
  
  const [lng, lat] = coordinates[0]
  const x = ((lng - TURKEY_BOUNDS.minLng) / (TURKEY_BOUNDS.maxLng - TURKEY_BOUNDS.minLng)) * width
  const y = height - ((lat - TURKEY_BOUNDS.minLat) / (TURKEY_BOUNDS.maxLat - TURKEY_BOUNDS.minLat)) * height
  
  let path = `M ${x} ${y}`
  
  for (let i = 1; i < coordinates.length; i++) {
    const [lng, lat] = coordinates[i]
    const x = ((lng - TURKEY_BOUNDS.minLng) / (TURKEY_BOUNDS.maxLng - TURKEY_BOUNDS.minLng)) * width
    const y = height - ((lat - TURKEY_BOUNDS.minLat) / (TURKEY_BOUNDS.maxLat - TURKEY_BOUNDS.minLat)) * height
    path += ` L ${x} ${y}`
  }
  
  path += ' Z'
  return path
}

function TurkeyRegionsMap({ onRegionClick, selectedRegion = null }) {
  const [hoveredRegion, setHoveredRegion] = useState(null)
  const [regionsData, setRegionsData] = useState([])
  const [loading, setLoading] = useState(true)

  // Load GeoJSON data
  useEffect(() => {
    const loadGeoJSON = async () => {
      try {
        const response = await fetch('/turkey-regions.geojson')
        const geoJson = await response.json()
        
        // Convert GeoJSON features to SVG-ready data
        const regions = geoJson.features.map(feature => {
          const coordinates = feature.geometry.coordinates[0] // Polygon coordinates
          const regionName = feature.properties.name_tr
          
          return {
            name: regionName,
            code: feature.properties.code,
            path: geoJsonToSvgPath(coordinates, 1000, 700), // SVG dimensions
            color: REGION_COLORS[regionName] || '#94a3b8'
          }
        })
        
        setRegionsData(regions)
        setLoading(false)
      } catch (error) {
        console.error('GeoJSON yükleme hatası:', error)
        setLoading(false)
      }
    }
    
    loadGeoJSON()
  }, [])

  const handleRegionClick = (regionName, regionCode) => {
    console.log('Bölge tıklandı:', regionName, 'Kod:', regionCode)
    
    if (onRegionClick) {
      onRegionClick({
        regionName,
        regionCode
      })
    }
  }

  const getRegionStyle = (regionName, color) => {
    const isSelected = selectedRegion === regionName
    const isHovered = hoveredRegion === regionName
    
    return {
      fill: color,
      fillOpacity: isSelected ? 0.7 : isHovered ? 0.6 : 0.4,
      stroke: isSelected ? '#ffffff' : isHovered ? '#ffffff' : '#1e293b',
      strokeWidth: isSelected ? 2.5 : isHovered ? 2 : 1.5,
      cursor: 'pointer',
      transition: 'all 0.2s ease'
    }
  }

  // Calculate label positions (approximate centers)
  const getLabelPosition = (regionName) => {
    const positions = {
      'Marmara': { x: 500, y: 200 },
      'Ege': { x: 300, y: 400 },
      'Akdeniz': { x: 600, y: 550 },
      'İç Anadolu': { x: 550, y: 350 },
      'Karadeniz': { x: 700, y: 250 },
      'Doğu Anadolu': { x: 900, y: 300 },
      'Güneydoğu Anadolu': { x: 850, y: 500 }
    }
    return positions[regionName] || { x: 500, y: 400 }
  }

  if (loading) {
    return (
      <div style={{
        width: '100%',
        height: '500px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(15, 23, 42, 0.3)',
        borderRadius: '12px',
        color: '#cbd5e1'
      }}>
        Harita yükleniyor...
      </div>
    )
  }

  return (
    <div style={{
      width: '100%',
      maxWidth: '1000px',
      margin: '0 auto',
      background: 'rgba(15, 23, 42, 0.3)',
      borderRadius: '12px',
      padding: '1.5rem',
      border: '1px solid rgba(255, 255, 255, 0.1)'
    }}>
      <svg
        viewBox="0 0 1000 700"
        preserveAspectRatio="xMidYMid meet"
        style={{
          width: '100%',
          height: 'auto',
          display: 'block',
          background: 'transparent'
        }}
      >
        {/* Render each region */}
        {regionsData.map((region) => {
          const style = getRegionStyle(region.name, region.color)
          const labelPos = getLabelPosition(region.name)
          const isSelected = selectedRegion === region.name
          
          return (
            <g key={region.name}>
              <path
                d={region.path}
                {...style}
                onMouseEnter={() => setHoveredRegion(region.name)}
                onMouseLeave={() => setHoveredRegion(null)}
                onClick={() => handleRegionClick(region.name, region.code)}
              />
              
              {/* Region label */}
              <text
                x={labelPos.x}
                y={labelPos.y}
                fill={isSelected ? '#ffffff' : '#cbd5e1'}
                fontSize="24"
                fontWeight={isSelected ? '700' : '600'}
                textAnchor="middle"
                pointerEvents="none"
                style={{
                  textShadow: '0 2px 4px rgba(0, 0, 0, 0.8)',
                  userSelect: 'none'
                }}
              >
                {region.name}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

export default TurkeyRegionsMap
