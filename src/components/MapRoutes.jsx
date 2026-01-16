import { useState, useEffect } from 'react'
import MapComponent from './MapComponent'

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

function MapRoutes() {
  const [vehicles, setVehicles] = useState([])
  const [drivers, setDrivers] = useState([])
  const [selectedVehicle, setSelectedVehicle] = useState(null)
  const [selectedVehicleId, setSelectedVehicleId] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const timestamp = new Date().getTime()
        const [vehiclesRes, driversRes] = await Promise.all([
          fetch(`/api/vehicles?_t=${timestamp}`, { cache: 'no-store', headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache', 'Expires': '0' } }).catch(() => ({ json: () => ({ success: false, data: [] }) })),
          fetch(`/api/drivers?_t=${timestamp}`, { cache: 'no-store', headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache', 'Expires': '0' } }).catch(() => ({ json: () => ({ success: false, data: [] }) }))
        ])

        const vehiclesData = await vehiclesRes.json()
        const driversData = await driversRes.json()

        setVehicles(vehiclesData.data || vehiclesData || [])
        setDrivers(driversData.data || driversData || [])
      } catch (err) {
        console.error('Veri yükleme hatası:', err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
      color: '#cbd5e1',
      padding: '2rem'
    }}>
      <h2 className="card-title" style={{ marginBottom: '2rem', color: '#ffffff' }}>🗺️ Harita & Rotalar</h2>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header">
          <h3 className="card-title">Harita</h3>
          <div style={{ fontSize: '0.9rem', color: '#cbd5e1' }}>
            {vehicles.filter(v => v.status === 'active').length} aktif araç gösteriliyor
          </div>
        </div>
        <div style={{ height: '600px', width: '100%', minHeight: '500px', borderRadius: '8px', overflow: 'hidden', position: 'relative' }}>
          <MapComponent
            vehicles={vehicles.filter(v => v.status === 'active')}
            drivers={drivers}
            onVehicleClick={(data) => {
              setSelectedVehicle(data)
              setSelectedVehicleId(data.vehicle.id)
            }}
            selectedVehicleId={selectedVehicleId}
          />
        </div>
      </div>

      {/* Türkiye Haritası */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header">
          <h3 className="card-title">Türkiye Haritası - Bölge Talep Analizi</h3>
        </div>
        <div style={{ padding: '1.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <img 
            src="/turkey-map.png" 
            alt="Türkiye Haritası" 
            style={{
              width: '100%',
              maxWidth: '800px',
              height: 'auto',
              borderRadius: '12px',
              objectFit: 'contain',
              display: 'block'
            }}
          />
        </div>
      </div>

      {/* Araç Detay Modal */}
      {selectedVehicle && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }} onClick={() => setSelectedVehicle(null)}>
          <div className="card" style={{ maxWidth: '600px', width: '90%', maxHeight: '80vh', overflow: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setSelectedVehicle(null)} style={{
              float: 'right',
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: '#ffffff',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>×</button>
            <div className="card-header" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <h3 className="card-title" style={{ color: '#ffffff' }}>🚛 Araç Detayları</h3>
            </div>
            <div style={{ marginTop: '1rem', color: '#cbd5e1' }}>
              <h4 style={{ marginBottom: '1rem', color: '#3b82f6' }}>Araç Bilgileri</h4>
              <table className="table" style={{ marginBottom: '1.5rem', color: '#cbd5e1' }}>
                <tbody>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <td style={{ padding: '0.75rem' }}><strong style={{ color: '#ffffff' }}>Plaka</strong></td>
                    <td style={{ padding: '0.75rem' }}>{selectedVehicle.vehicle.plate}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <td style={{ padding: '0.75rem' }}><strong style={{ color: '#ffffff' }}>Marka/Model</strong></td>
                    <td style={{ padding: '0.75rem' }}>{selectedVehicle.vehicle.brand} {selectedVehicle.vehicle.model}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <td style={{ padding: '0.75rem' }}><strong style={{ color: '#ffffff' }}>Tip</strong></td>
                    <td style={{ padding: '0.75rem' }}>{selectedVehicle.vehicle.type === 'ceki' ? 'Çekici' : 'Dorse'}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <td style={{ padding: '0.75rem' }}><strong style={{ color: '#ffffff' }}>Bölge</strong></td>
                    <td style={{ padding: '0.75rem' }}>{getRegionLabel(selectedVehicle.vehicle.region)}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <td style={{ padding: '0.75rem' }}><strong style={{ color: '#ffffff' }}>Durum</strong></td>
                    <td style={{ padding: '0.75rem' }}>{selectedVehicle.vehicle.status === 'active' ? 'Aktif' : 'Bakımda'}</td>
                  </tr>
                </tbody>
              </table>

              {selectedVehicle.driver && (
                <>
                  <h4 style={{ marginBottom: '1rem', color: '#3b82f6', marginTop: '1.5rem' }}>👥 Şoför Bilgileri</h4>
                  <table className="table" style={{ color: '#cbd5e1' }}>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                        <td style={{ padding: '0.75rem' }}><strong style={{ color: '#ffffff' }}>İsim</strong></td>
                        <td style={{ padding: '0.75rem' }}>{selectedVehicle.driver.name}</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                        <td style={{ padding: '0.75rem' }}><strong style={{ color: '#ffffff' }}>Telefon</strong></td>
                        <td style={{ padding: '0.75rem' }}>{selectedVehicle.driver.phone || 'Belirtilmemiş'}</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                        <td style={{ padding: '0.75rem' }}><strong style={{ color: '#ffffff' }}>Ehliyet No</strong></td>
                        <td style={{ padding: '0.75rem' }}>{selectedVehicle.driver.license_number || 'Belirtilmemiş'}</td>
                      </tr>
                    </tbody>
                  </table>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MapRoutes



