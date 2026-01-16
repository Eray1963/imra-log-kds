import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useEffect } from 'react'

function RealDemandMap({ selectedYear, regionDemand }) {
  // Bölge koordinatları ve talep verileri
  const regions = [
    {
      name: 'Marmara',
      position: [41.0, 28.9],
      demand: regionDemand['Marmara'] || 0
    },
    {
      name: 'Ege',
      position: [38.4, 27.1],
      demand: regionDemand['Ege'] || 0
    },
    {
      name: 'Akdeniz',
      position: [36.9, 30.7],
      demand: regionDemand['Akdeniz'] || 0
    },
    {
      name: 'İç Anadolu',
      position: [39.9, 32.8],
      demand: regionDemand['İç Anadolu'] || 0
    },
    {
      name: 'Karadeniz',
      position: [41.2, 36.3],
      demand: regionDemand['Karadeniz'] || 0
    },
    {
      name: 'Doğu Anadolu',
      position: [39.7, 39.5],
      demand: regionDemand['Doğu Anadolu'] || 0
    },
    {
      name: 'Güneydoğu Anadolu',
      position: [37.1, 37.3],
      demand: regionDemand['Güneydoğu Anadolu'] || 0
    }
  ]

  // Maksimum talep değerini bul
  const maxDemand = Math.max(...regions.map(r => r.demand), 1)

  // Talep seviyesine göre renk belirle
  const getDemandColor = (demand) => {
    const ratio = demand / maxDemand
    if (ratio < 0.33) return '#3b82f6' // Düşük - Mavi
    if (ratio < 0.66) return '#f59e0b' // Orta - Turuncu
    return '#ef4444' // Yüksek - Kırmızı
  }

  // Talep seviyesi metni
  const getDemandLevel = (demand) => {
    const ratio = demand / maxDemand
    if (ratio < 0.33) return 'Düşük'
    if (ratio < 0.66) return 'Orta'
    return 'Yüksek'
  }

  // Radius hesapla (talep miktarına göre)
  const getRadius = (demand) => {
    const minRadius = 8
    const maxRadius = 25
    const ratio = demand / maxDemand
    return minRadius + (ratio * (maxRadius - minRadius))
  }

  // Leaflet icon hatası için düzeltme
  useEffect(() => {
    delete L.Icon.Default.prototype._getIconUrl
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    })
  }, [])

  return (
    <div style={{ width: '100%', height: '600px', borderRadius: '8px', overflow: 'hidden' }}>
      <MapContainer
        center={[39.0, 35.0]}
        zoom={6}
        style={{ height: '100%', width: '100%', zIndex: 0 }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {regions.map((region, index) => (
          <CircleMarker
            key={index}
            center={region.position}
            radius={getRadius(region.demand)}
            pathOptions={{
              fillColor: getDemandColor(region.demand),
              color: '#ffffff',
              weight: 2,
              opacity: 0.9,
              fillOpacity: 0.7
            }}
            eventHandlers={{
              mouseover: (e) => {
                e.target.setStyle({
                  fillOpacity: 0.9,
                  weight: 3
                })
              },
              mouseout: (e) => {
                e.target.setStyle({
                  fillOpacity: 0.7,
                  weight: 2
                })
              }
            }}
          >
            <Tooltip 
              permanent={false}
              className="custom-tooltip"
            >
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: '700', marginBottom: '0.25rem' }}>{region.name}</div>
                <div style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>
                  Talep Seviyesi: <span style={{ color: getDemandColor(region.demand) }}>{getDemandLevel(region.demand)}</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#cbd5e1', marginTop: '0.25rem' }}>
                  {selectedYear} Talep Tahmini
                </div>
              </div>
            </Tooltip>
            
            <Popup 
              className="custom-popup"
            >
              <div style={{ padding: '0.5rem', minWidth: '200px' }}>
                <h3 style={{ 
                  margin: '0 0 0.75rem 0', 
                  color: '#ffffff', 
                  fontSize: '1.1rem',
                  fontWeight: '700',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                  paddingBottom: '0.5rem'
                }}>
                  {region.name} Bölgesi
                </h3>
                <div style={{ marginBottom: '0.5rem' }}>
                  <div style={{ color: '#cbd5e1', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                    Talep Miktarı: <strong style={{ color: '#ffffff' }}>{region.demand.toLocaleString('tr-TR')}</strong>
                  </div>
                  <div style={{ color: '#cbd5e1', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                    Talep Seviyesi: <span style={{ color: getDemandColor(region.demand), fontWeight: '700' }}>{getDemandLevel(region.demand)}</span>
                  </div>
                  <div style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>
                    Yıl: <strong style={{ color: '#ffffff' }}>{selectedYear}</strong>
                  </div>
                </div>
                <div style={{ 
                  marginTop: '0.75rem', 
                  padding: '0.75rem', 
                  background: 'rgba(59, 130, 246, 0.1)', 
                  borderRadius: '6px',
                  border: '1px solid rgba(59, 130, 246, 0.2)'
                }}>
                  <div style={{ color: '#cbd5e1', fontSize: '0.85rem', fontStyle: 'italic' }}>
                    Bu bölge için filo / dorse / depo önerisi
                  </div>
                </div>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  )
}

export default RealDemandMap
