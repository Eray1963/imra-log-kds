import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Leaflet marker icon fix
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

// Türkiye şehir koordinatları
const cityCoordinates = {
  'istanbul': [41.0082, 28.9784],
  'izmir': [38.4237, 27.1428],
  'ankara': [39.9334, 32.8597],
  'bursa': [40.1826, 29.0665],
  'antalya': [36.8841, 30.7056],
  'konya': [37.8746, 32.4932],
  'adana': [37.0000, 35.3213],
  'gaziantep': [37.0662, 37.3833],
  'samsun': [41.2867, 36.3300],
  'erzurum': [39.9043, 41.2679],
  'marmara': [40.5, 28.5],
  'ege': [38.5, 27.5],
  'karadeniz': [41.0, 36.0],
  'dogu-anadolu': [39.0, 41.0]
}

// Bölge isimlerini Türkçe'ye çevir
const getRegionLabel = (region) => {
  const regionMap = {
    'marmara': 'Marmara',
    'ege': 'Ege',
    'ic-anadolu': 'İç Anadolu',
    'karadeniz': 'Karadeniz',
    'akdeniz': 'Akdeniz',
    'dogu-anadolu': 'Doğu Anadolu',
    'guneydogu-anadolu': 'Güneydoğu Anadolu',
    'Marmara': 'Marmara',
    'Ege': 'Ege',
    'İç Anadolu': 'İç Anadolu',
    'Karadeniz': 'Karadeniz',
    'Akdeniz': 'Akdeniz',
    'Doğu Anadolu': 'Doğu Anadolu',
    'Güneydoğu Anadolu': 'Güneydoğu Anadolu'
  }
  return regionMap[region] || region
}

function MapComponent({ vehicles, drivers, onVehicleClick, selectedVehicleId }) {
  const mapContainer = useRef(null)
  const map = useRef(null)
  const markersRef = useRef([])
  const routeLayerRef = useRef(null)
  const [routeInfo, setRouteInfo] = useState(null)
  const [loading, setLoading] = useState(false)

  // Leaflet map initialization
  useEffect(() => {
    if (map.current) return
    
    if (!mapContainer.current) return

    try {
      map.current = L.map(mapContainer.current).setView([39.9334, 32.8597], 6) // Ankara center

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(map.current)

      console.log('✅ Harita başlatıldı')
    } catch (error) {
      console.error('Harita başlatma hatası:', error)
    }

    return () => {
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [])

  // Araçlar için konum belirleme
  const getVehicleLocation = (vehicle) => {
    const region = vehicle.region
    if (cityCoordinates[region]) {
      const base = cityCoordinates[region]
      return [
        base[0] + (Math.random() - 0.5) * 0.3,
        base[1] + (Math.random() - 0.5) * 0.3
      ]
    }
    return [41.0082, 28.9784] // Default Istanbul
  }

  // Araç için şoför bul
  const getVehicleDriver = (vehicleId) => {
    return drivers.find(d => (d.vehicle_id || d.vehicleId) === vehicleId)
  }

  // Araç marker'larını ekle
  useEffect(() => {
    if (!map.current || !vehicles || vehicles.length === 0) return

    // Önceki marker'ları temizle
    markersRef.current.forEach(marker => marker.remove())
    markersRef.current = []

    vehicles.forEach(vehicle => {
      const location = getVehicleLocation(vehicle)
      const driver = getVehicleDriver(vehicle.id)
      
      const color = vehicle.status === 'active' ? 'green' : 
                    vehicle.status === 'maintenance' ? 'orange' : 'red'
      
      const icon = L.divIcon({
        className: 'custom-vehicle-marker',
        html: `<div style="
          width: 20px;
          height: 20px;
          background-color: ${color};
          border: 2px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        "></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      })
      
      const marker = L.marker(location, { icon })
        .addTo(map.current)
        .bindPopup(`
          <div style="min-width: 200px;">
            <h4 style="margin-bottom: 0.5rem;">🚛 ${vehicle.plate}</h4>
            <p><strong>Marka/Model:</strong> ${vehicle.brand} ${vehicle.model}</p>
            <p><strong>Bölge:</strong> ${getRegionLabel(vehicle.region)}</p>
            <p><strong>Sektör:</strong> ${vehicle.sector}</p>
            <p><strong>Durum:</strong> ${vehicle.status === 'active' ? 'Aktif' : 'Bakımda'}</p>
            ${driver ? `
              <hr style="margin: 0.5rem 0;" />
              <p><strong>Şoför:</strong> ${driver.name}</p>
              <p><strong>Telefon:</strong> ${driver.phone}</p>
            ` : ''}
          </div>
        `)
      
      marker.on('click', () => {
        onVehicleClick({ vehicle, driver, location })
      })
      
      markersRef.current.push(marker)
    })
  }, [vehicles, drivers, onVehicleClick])

  // Seçili araç için rota yükleme
  useEffect(() => {
    if (selectedVehicleId && map.current) {
      const loadRoute = async () => {
        setLoading(true)
        try {
          const response = await fetch(`/api/vehicles/${selectedVehicleId}/route`)
          const data = await response.json()
          
          if (data.success && data.data) {
            const routeData = data.data
            
            // Önceki route'u temizle
            if (routeLayerRef.current) {
              map.current.removeLayer(routeLayerRef.current)
              routeLayerRef.current = null
            }
            
            // Start ve end koordinatları
            let startCoords, endCoords
            
            if (routeData.start_coords && routeData.end_coords) {
              startCoords = Array.isArray(routeData.start_coords) 
                ? routeData.start_coords 
                : [routeData.start_coords[1] || routeData.start_coords.lat, routeData.start_coords[0] || routeData.start_coords.lng]
              endCoords = Array.isArray(routeData.end_coords)
                ? routeData.end_coords
                : [routeData.end_coords[1] || routeData.end_coords.lat, routeData.end_coords[0] || routeData.end_coords.lng]
            } else {
              // Fallback: şehir isimlerinden koordinatları al
              startCoords = cityCoordinates[routeData.start_city?.toLowerCase()] || [41.0082, 28.9784]
              endCoords = cityCoordinates[routeData.end_city?.toLowerCase()] || [39.9334, 32.8597]
            }
            
            // Basit polyline rota çiz
            const routeLine = L.polyline([startCoords, endCoords], {
              color: '#667eea',
              weight: 5,
              opacity: 0.8,
              dashArray: '10, 5'
            }).addTo(map.current)
            
            routeLayerRef.current = routeLine
            
            // Başlangıç ve bitiş işaretçileri
            const startMarker = L.marker(startCoords, {
              icon: L.divIcon({
                className: 'route-marker',
                html: '<div style="font-size: 20px;">📍</div>',
                iconSize: [30, 30],
                iconAnchor: [15, 30]
              })
            }).addTo(map.current)
            startMarker.bindPopup(`<strong>📍 ${routeData.start_city}</strong>`)
            
            const endMarker = L.marker(endCoords, {
              icon: L.divIcon({
                className: 'route-marker',
                html: '<div style="font-size: 20px;">🏁</div>',
                iconSize: [30, 30],
                iconAnchor: [15, 30]
              })
            }).addTo(map.current)
            endMarker.bindPopup(`<strong>🏁 ${routeData.end_city}</strong>`)
            
            // Haritayı rotaya göre yakınlaştır
            const bounds = L.latLngBounds([startCoords, endCoords])
            map.current.fitBounds(bounds, { padding: [50, 50] })
            
            // Rota bilgileri
            const distance = routeData.distance_km || routeData.real_distance_km || 'Belirtilmemiş'
            const duration = routeData.real_duration_min || routeData.estimated_time_hours ? Math.round(routeData.estimated_time_hours * 60) : 'Belirtilmemiş'
            
            setRouteInfo({
              start_city: routeData.start_city,
              end_city: routeData.end_city,
              distance_km: distance,
              duration_min: duration
            })
            
            // TODO: Gerçek yol rotası burada daha sonra uygulanacak
            // Şimdilik şehirler arası basit düz çizgi polyline kullanılıyor
            
          }
        } catch (error) {
          console.error('Rota yükleme hatası:', error)
          setRouteInfo(null)
        } finally {
          setLoading(false)
        }
      }
      
      loadRoute()
    } else {
      // Rota seçilmediğinde temizle
      if (routeLayerRef.current) {
        map.current?.removeLayer(routeLayerRef.current)
        routeLayerRef.current = null
      }
      
      // Rota işaretçilerini temizle
      map.current?.eachLayer((layer) => {
        if (layer.options && layer.options.icon && layer.options.icon.options && layer.options.icon.options.className === 'route-marker') {
          map.current.removeLayer(layer)
        }
      })
      
      setRouteInfo(null)
    }
  }, [selectedVehicleId])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '600px' }}>
      <div 
        ref={mapContainer} 
        style={{ 
          width: '100%', 
          height: '100%',
          minHeight: '600px',
          position: 'relative'
        }} 
      />
      
      {routeInfo && (
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          background: 'white',
          padding: '1rem',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          zIndex: 1000,
          minWidth: '250px'
        }}>
          <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem' }}>🛣️ Rota Bilgileri</h4>
          <p style={{ margin: '0.25rem 0' }}><strong>Başlangıç:</strong> {routeInfo.start_city}</p>
          <p style={{ margin: '0.25rem 0' }}><strong>Varış:</strong> {routeInfo.end_city}</p>
          <hr style={{ margin: '0.5rem 0' }} />
          <p style={{ margin: '0.25rem 0' }}><strong>Mesafe:</strong> {routeInfo.distance_km} km</p>
          <p style={{ margin: '0.25rem 0' }}><strong>Süre:</strong> {routeInfo.duration_min} dakika</p>
        </div>
      )}
      
      {loading && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'white',
          padding: '1rem 2rem',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          zIndex: 1000
        }}>
          🛣️ Rota yükleniyor...
        </div>
      )}
    </div>
  )
}

export default MapComponent



