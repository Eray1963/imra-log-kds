import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import L from 'leaflet'

// Leaflet icon fix
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

// Türkiye bölge koordinatları
const regionCoordinates = {
  'marmara': { lat: 41.0082, lng: 28.9784, name: 'Marmara' },
  'ege': { lat: 38.4237, lng: 27.1428, name: 'Ege' },
  'ic-anadolu': { lat: 39.9334, lng: 32.8597, name: 'İç Anadolu' },
  'karadeniz': { lat: 41.0015, lng: 35.3213, name: 'Karadeniz' },
  'akdeniz': { lat: 36.8841, lng: 30.7056, name: 'Akdeniz' },
  'dogu-anadolu': { lat: 38.4237, lng: 38.3656, name: 'Doğu Anadolu' },
  'guneydogu-anadolu': { lat: 37.0662, lng: 37.3833, name: 'Güneydoğu Anadolu' }
}

function RegionalMap({ regionalIntensityData }) {
  if (!regionalIntensityData || regionalIntensityData.length === 0) {
    return (
      <div style={{ 
        height: '100%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        color: '#aaa'
      }}>
        Harita verisi yükleniyor...
      </div>
    )
  }

  const maxIntensity = Math.max(...regionalIntensityData.map(i => i.intensity || 0), 1)

  return (
    <MapContainer
      center={[39.0, 35.0]}
      zoom={6}
      style={{ height: '100%', width: '100%' }}
      zoomControl={true}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      {regionalIntensityData.map((item) => {
        const coords = regionCoordinates[item.region]
        if (!coords) return null
        
        const intensity = item.intensity || 0
        const opacity = Math.min(1, intensity / maxIntensity)
        const radius = 15 + (opacity * 25)
        const colorIntensity = Math.floor(255 * (1 - opacity))
        const fillColor = `rgb(${255 - colorIntensity}, ${102 + colorIntensity}, ${234 - colorIntensity})`
        
        return (
          <CircleMarker
            key={item.region}
            center={[coords.lat, coords.lng]}
            radius={radius}
            pathOptions={{
              fillColor: fillColor,
              color: '#667eea',
              weight: 2,
              opacity: 1,
              fillOpacity: Math.max(0.4, opacity)
            }}
          >
            <Popup>
              <div style={{ color: '#333', fontSize: '0.9rem', minWidth: '150px' }}>
                <strong>{coords.name}</strong><br/>
                Araç Sayısı: {item.vehicleCount || 0}<br/>
                Rota Sayısı: {item.routeCount || 0}<br/>
                Toplam KM: {item.totalKm?.toLocaleString('tr-TR') || 0} km<br/>
                Ort. KM/Rota: {item.avgKmPerRoute?.toFixed(0) || 0} km
              </div>
            </Popup>
          </CircleMarker>
        )
      })}
    </MapContainer>
  )
}

export default RegionalMap



