import { useState, useEffect } from 'react'

function SuppliersManagement() {
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState(null)
  const [formData, setFormData] = useState({
    name: '', contact_person: '', phone: '', email: '', address: '', region: '', status: 'active'
  })

  const loadData = async () => {
    try {
      const timestamp = new Date().getTime()
      const response = await fetch(`/api/suppliers?_t=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })
      const data = await response.json()
      setSuppliers(data.data || data || [])
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
      const url = editingSupplier ? `/api/suppliers/${editingSupplier.id}` : '/api/suppliers'
      const method = editingSupplier ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const result = await response.json()
      if (result.success) {
        await loadData()
        setShowForm(false)
        setEditingSupplier(null)
        setFormData({
          name: '', contact_person: '', phone: '', email: '', address: '', region: '', status: 'active'
        })
        alert(editingSupplier ? 'Tedarikçi güncellendi' : 'Tedarikçi eklendi')
      } else {
        alert('Hata: ' + (result.message || 'Bilinmeyen hata'))
      }
    } catch (err) {
      console.error('Form gönderme hatası:', err)
      alert('Hata oluştu: ' + err.message)
    }
  }

  const handleEdit = (supplier) => {
    setEditingSupplier(supplier)
    setFormData({
      name: supplier.name || '',
      contact_person: supplier.contact_person || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      address: supplier.address || '',
      region: supplier.region || '',
      status: supplier.status || 'active'
    })
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Bu tedarikçiyi silmek istediğinizden emin misiniz?')) return
    try {
      const response = await fetch(`/api/suppliers/${id}`, { method: 'DELETE' })
      const result = await response.json()
      if (result.success) {
        await loadData()
        alert('Tedarikçi silindi')
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
        <h2 className="card-title" style={{ margin: 0 }}>🏢 Tedarikçi Yönetimi</h2>
        <button onClick={() => { setShowForm(true); setEditingSupplier(null); setFormData({ name: '', contact_person: '', phone: '', email: '', address: '', region: '', status: 'active' }) }} className="btn btn-primary">
          + Yeni Tedarikçi Ekle
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div className="card-header">
            <h3 className="card-title">{editingSupplier ? 'Tedarikçi Düzenle' : 'Yeni Tedarikçi Ekle'}</h3>
            <button onClick={() => { setShowForm(false); setEditingSupplier(null) }} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
          </div>
          <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Tedarikçi Adı *</label>
                <input type="text" className="form-input" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="form-label">İletişim Kişisi</label>
                <input type="text" className="form-input" value={formData.contact_person} onChange={(e) => setFormData({...formData, contact_person: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Telefon</label>
                <input type="text" className="form-input" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">E-posta</label>
                <input type="email" className="form-input" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Adres</label>
                <textarea className="form-input" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} rows="3" />
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
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button type="submit" className="btn btn-primary">{editingSupplier ? 'Güncelle' : 'Ekle'}</button>
              <button type="button" className="btn btn-secondary" onClick={() => { setShowForm(false); setEditingSupplier(null) }}>İptal</button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Tedarikçi Listesi</h3>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Ad</th>
              <th>İletişim Kişisi</th>
              <th>Telefon</th>
              <th>E-posta</th>
              <th>Bölge</th>
              <th>Durum</th>
              <th>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.map(supplier => (
              <tr key={supplier.id}>
                <td><strong>{supplier.name}</strong></td>
                <td>{supplier.contact_person || '-'}</td>
                <td>{supplier.phone || '-'}</td>
                <td>{supplier.email || '-'}</td>
                <td>{supplier.region || '-'}</td>
                <td>
                  <span className={`badge ${supplier.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                    {supplier.status === 'active' ? 'Aktif' : 'Pasif'}
                  </span>
                </td>
                <td>
                  <button onClick={() => handleEdit(supplier)} style={{ marginRight: '0.5rem', padding: '0.25rem 0.5rem', fontSize: '0.85rem' }} className="btn btn-secondary">Düzenle</button>
                  <button onClick={() => handleDelete(supplier.id)} style={{ padding: '0.25rem 0.5rem', fontSize: '0.85rem', background: '#dc3545', color: 'white', border: 'none' }} className="btn">Sil</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default SuppliersManagement



