import { useState, useEffect } from 'react'

function DriversManagement() {
  const [drivers, setDrivers] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingDriver, setEditingDriver] = useState(null)
  const [formData, setFormData] = useState({
    name: '', phone: '', email: '', license_number: '', license_expiry: '',
    vehicle_id: '', region: '', status: 'active', hire_date: ''
  })

  const loadData = async () => {
    try {
      const timestamp = new Date().getTime()
      const [driversRes, vehiclesRes] = await Promise.all([
        fetch(`/api/drivers?_t=${timestamp}`, { cache: 'no-store', headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache', 'Expires': '0' } }),
        fetch(`/api/vehicles?_t=${timestamp}`, { cache: 'no-store', headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache', 'Expires': '0' } })
      ])
      const driversData = await driversRes.json()
      const vehiclesData = await vehiclesRes.json()
      setDrivers(driversData.data || driversData || [])
      setVehicles(vehiclesData.data || vehiclesData || [])
    } catch (err) {
      console.error('Veri yükleme hatası:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const url = editingDriver ? `/api/drivers/${editingDriver.id}` : '/api/drivers'
      const method = editingDriver ? 'PUT' : 'POST'
      
      const payload = {
        ...formData,
        vehicle_id: formData.vehicle_id ? parseInt(formData.vehicle_id) : null
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const result = await response.json()
      if (result.success) {
        await loadData()
        setShowForm(false)
        setEditingDriver(null)
        setFormData({
          name: '', phone: '', email: '', license_number: '', license_expiry: '',
          vehicle_id: '', region: '', status: 'active', hire_date: ''
        })
        alert(editingDriver ? 'Şoför güncellendi' : 'Şoför eklendi')
      } else {
        alert('Hata: ' + (result.message || 'Bilinmeyen hata'))
      }
    } catch (err) {
      console.error('Form gönderme hatası:', err)
      alert('Hata oluştu: ' + err.message)
    }
  }

  const handleEdit = (driver) => {
    setEditingDriver(driver)
    setFormData({
      name: driver.name || '',
      phone: driver.phone || '',
      email: driver.email || '',
      license_number: driver.license_number || '',
      license_expiry: driver.license_expiry || '',
      vehicle_id: driver.vehicle_id || '',
      region: driver.region || '',
      status: driver.status || 'active',
      hire_date: driver.hire_date || ''
    })
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Bu şoförü silmek istediğinizden emin misiniz?')) return
    try {
      const response = await fetch(`/api/drivers/${id}`, { method: 'DELETE' })
      const result = await response.json()
      if (result.success) {
        await loadData()
        alert('Şoför silindi')
      } else {
        alert('Hata: ' + (result.message || 'Bilinmeyen hata'))
      }
    } catch (err) {
      console.error('Silme hatası:', err)
      alert('Hata oluştu: ' + err.message)
    }
  }

  if (loading) return <div>Yükleniyor...</div>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 className="card-title" style={{ margin: 0 }}>👤 Şoför Yönetimi</h2>
        <button onClick={() => { setShowForm(true); setEditingDriver(null); setFormData({ name: '', phone: '', email: '', license_number: '', license_expiry: '', vehicle_id: '', region: '', status: 'active', hire_date: '' }) }} className="btn btn-primary">
          + Yeni Şoför Ekle
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div className="card-header">
            <h3 className="card-title">{editingDriver ? 'Şoför Düzenle' : 'Yeni Şoför Ekle'}</h3>
            <button onClick={() => { setShowForm(false); setEditingDriver(null) }} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
          </div>
          <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Ad Soyad *</label>
                <input type="text" className="form-input" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="form-label">Telefon</label>
                <input type="text" className="form-input" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">E-posta</label>
                <input type="email" className="form-input" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Ehliyet No</label>
                <input type="text" className="form-input" value={formData.license_number} onChange={(e) => setFormData({...formData, license_number: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Ehliyet Bitiş Tarihi</label>
                <input type="date" className="form-input" value={formData.license_expiry} onChange={(e) => setFormData({...formData, license_expiry: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Araç</label>
                <select className="form-input" value={formData.vehicle_id} onChange={(e) => setFormData({...formData, vehicle_id: e.target.value})}>
                  <option value="">Araç Seçiniz</option>
                  {vehicles.filter(v => v.type === 'ceki').map(v => (
                    <option key={v.id} value={v.id}>{v.plate} - {v.brand} {v.model}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Bölge</label>
                <select className="form-input" value={formData.region} onChange={(e) => setFormData({...formData, region: e.target.value})}>
                  <option value="">Seçiniz</option>
                  <option value="marmara">Marmara</option>
                  <option value="ege">Ege</option>
                  <option value="ic-anadolu">İç Anadolu</option>
                  <option value="karadeniz">Karadeniz</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Durum</label>
                <select className="form-input" value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}>
                  <option value="active">Aktif</option>
                  <option value="inactive">Pasif</option>
                  <option value="on_leave">İzinli</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">İşe Başlama Tarihi</label>
                <input type="date" className="form-input" value={formData.hire_date} onChange={(e) => setFormData({...formData, hire_date: e.target.value})} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button type="submit" className="btn btn-primary">{editingDriver ? 'Güncelle' : 'Ekle'}</button>
              <button type="button" className="btn btn-secondary" onClick={() => { setShowForm(false); setEditingDriver(null) }}>İptal</button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Şoför Listesi</h3>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Ad Soyad</th>
              <th>Telefon</th>
              <th>Ehliyet No</th>
              <th>Araç</th>
              <th>Bölge</th>
              <th>Durum</th>
              <th>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {drivers.map(driver => (
              <tr key={driver.id}>
                <td><strong>{driver.name}</strong></td>
                <td>{driver.phone || '-'}</td>
                <td>{driver.license_number || '-'}</td>
                <td>{driver.vehicle_plate || '-'}</td>
                <td>{driver.region || '-'}</td>
                <td>
                  <span className={`badge ${
                    driver.status === 'active' ? 'badge-success' :
                    driver.status === 'on_leave' ? 'badge-warning' : 'badge-danger'
                  }`}>
                    {driver.status === 'active' ? 'Aktif' : driver.status === 'on_leave' ? 'İzinli' : 'Pasif'}
                  </span>
                </td>
                <td>
                  <button onClick={() => handleEdit(driver)} style={{ marginRight: '0.5rem', padding: '0.25rem 0.5rem', fontSize: '0.85rem' }} className="btn btn-secondary">Düzenle</button>
                  <button onClick={() => handleDelete(driver.id)} style={{ padding: '0.25rem 0.5rem', fontSize: '0.85rem', background: '#dc3545', color: 'white', border: 'none' }} className="btn">Sil</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default DriversManagement



