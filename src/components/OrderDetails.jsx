import { useState, useEffect } from 'react'

function OrderDetails({ orderId, onClose }) {
  const [order, setOrder] = useState(null)
  const [cargoStatus, setCargoStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (orderId) {
      loadOrderDetails()
      loadCargoStatus()
    }
  }, [orderId])

  const loadOrderDetails = async () => {
    try {
      const response = await fetch(`/api/orders/${orderId}`)
      const data = await response.json()
      if (data.success) {
        setOrder(data.data)
      } else {
        setError(data.message || 'Sipariş bilgileri yüklenemedi')
      }
    } catch (err) {
      console.error('Sipariş detayları yükleme hatası:', err)
      setError('Sipariş bilgileri yüklenirken bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const loadCargoStatus = async () => {
    try {
      const response = await fetch(`/api/orders/${orderId}/cargo-status`)
      const data = await response.json()
      if (data.success) {
        setCargoStatus(data.data)
      }
    } catch (err) {
      console.error('Kargo durumu yükleme hatası:', err)
    }
  }

  const getCargoStatusLabel = (status) => {
    const statusMap = {
      'pending': 'Beklemede',
      'in_transit': 'Yolda',
      'delivered': 'Teslim Edildi',
      'cancelled': 'İptal Edildi',
      'preparing': 'Hazırlanıyor',
      'out_for_delivery': 'Teslimata Çıktı'
    }
    return statusMap[status] || status
  }

  const getCargoStatusColor = (status) => {
    const colorMap = {
      'pending': '#f59e0b',
      'in_transit': '#3b82f6',
      'delivered': '#10b981',
      'cancelled': '#ef4444',
      'preparing': '#8b5cf6',
      'out_for_delivery': '#06b6d4'
    }
    return colorMap[status] || '#6b7280'
  }

  if (loading) {
    return (
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
      }}>
        <div style={{
          background: 'rgba(30, 30, 46, 0.95)',
          padding: '2rem',
          borderRadius: '8px',
          color: '#cbd5e1'
        }}>
          Yükleniyor...
        </div>
      </div>
    )
  }

  if (error && !order) {
    return (
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
      }} onClick={onClose}>
        <div className="card" style={{
          maxWidth: '600px',
          width: '90%',
          maxHeight: '80vh',
          overflow: 'auto'
        }} onClick={(e) => e.stopPropagation()}>
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <p style={{ color: '#ef4444', marginBottom: '1rem' }}>{error}</p>
            <button onClick={onClose} className="btn" style={{ background: '#3b82f6' }}>
              Kapat
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
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
    }} onClick={onClose}>
      <div className="card" style={{
        maxWidth: '700px',
        width: '90%',
        maxHeight: '90vh',
        overflow: 'auto',
        background: 'rgba(30, 30, 46, 0.95)',
        border: '1px solid rgba(59, 130, 246, 0.2)'
      }} onClick={(e) => e.stopPropagation()}>
        <div className="card-header" style={{
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1rem 1.5rem'
        }}>
          <h3 className="card-title" style={{ color: '#ffffff', margin: 0 }}>
            📦 Sipariş Detayları
          </h3>
          <button
            onClick={onClose}
            style={{
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
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.2)'}
            onMouseOut={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.1)'}
          >
            ×
          </button>
        </div>

        <div style={{ padding: '1.5rem', color: '#cbd5e1' }}>
          {order && (
            <>
              <h4 style={{ marginBottom: '1rem', color: '#3b82f6' }}>Sipariş Bilgileri</h4>
              <table className="table" style={{ marginBottom: '1.5rem', color: '#cbd5e1' }}>
                <tbody>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <td style={{ padding: '0.75rem', width: '40%' }}>
                      <strong style={{ color: '#ffffff' }}>Sipariş No</strong>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      {order.orderNumber || `ORD-${order.id}`}
                    </td>
                  </tr>
                  {order.customerName && (
                    <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      <td style={{ padding: '0.75rem' }}>
                        <strong style={{ color: '#ffffff' }}>Müşteri</strong>
                      </td>
                      <td style={{ padding: '0.75rem' }}>{order.customerName}</td>
                    </tr>
                  )}
                  {order.orderDate && (
                    <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      <td style={{ padding: '0.75rem' }}>
                        <strong style={{ color: '#ffffff' }}>Sipariş Tarihi</strong>
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        {new Date(order.orderDate).toLocaleDateString('tr-TR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </td>
                    </tr>
                  )}
                  {order.status && (
                    <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      <td style={{ padding: '0.75rem' }}>
                        <strong style={{ color: '#ffffff' }}>Sipariş Durumu</strong>
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <span className="badge badge-success">
                          {order.status === 'active' ? 'Aktif' : order.status}
                        </span>
                      </td>
                    </tr>
                  )}
                  {order.totalAmount !== undefined && (
                    <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      <td style={{ padding: '0.75rem' }}>
                        <strong style={{ color: '#ffffff' }}>Toplam Tutar</strong>
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        {order.totalAmount.toLocaleString('tr-TR')} ₺
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Kargo Durumu Bölümü */}
              {cargoStatus && (
                <>
                  <h4 style={{
                    marginBottom: '1rem',
                    marginTop: '2rem',
                    color: '#3b82f6',
                    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                    paddingTop: '1rem'
                  }}>
                    🚚 Kargo Durumu
                  </h4>
                  <div style={{
                    padding: '1rem',
                    background: 'rgba(59, 130, 246, 0.1)',
                    borderRadius: '8px',
                    border: `1px solid ${getCargoStatusColor(cargoStatus.cargoStatus)}`,
                    marginBottom: '1rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{
                          fontSize: '0.9rem',
                          color: '#cbd5e1',
                          marginBottom: '0.5rem'
                        }}>
                          Durum
                        </div>
                        <div style={{
                          fontSize: '1.2rem',
                          fontWeight: 'bold',
                          color: getCargoStatusColor(cargoStatus.cargoStatus)
                        }}>
                          {getCargoStatusLabel(cargoStatus.cargoStatus)}
                        </div>
                      </div>
                      <div style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '50%',
                        background: `${getCargoStatusColor(cargoStatus.cargoStatus)}20`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.5rem'
                      }}>
                        {cargoStatus.cargoStatus === 'delivered' && '✓'}
                        {cargoStatus.cargoStatus === 'in_transit' && '🚚'}
                        {cargoStatus.cargoStatus === 'pending' && '⏳'}
                        {cargoStatus.cargoStatus === 'cancelled' && '✕'}
                        {cargoStatus.cargoStatus === 'preparing' && '📦'}
                        {cargoStatus.cargoStatus === 'out_for_delivery' && '🚛'}
                      </div>
                    </div>
                    {cargoStatus.lastUpdated && (
                      <div style={{
                        marginTop: '0.75rem',
                        fontSize: '0.85rem',
                        color: '#94a3b8'
                      }}>
                        Son Güncelleme: {new Date(cargoStatus.lastUpdated).toLocaleString('tr-TR')}
                      </div>
                    )}
                  </div>

                  {/* Türkiye Haritası */}
                  <div style={{
                    marginTop: '1.5rem',
                    padding: '1rem',
                    background: 'rgba(15, 23, 42, 0.5)',
                    borderRadius: '8px',
                    border: '1px solid rgba(59, 130, 246, 0.2)'
                  }}>
                    <h5 style={{
                      color: '#ffffff',
                      marginBottom: '1rem',
                      fontSize: '1rem',
                      fontWeight: '600'
                    }}>
                      🗺️ Kargo Konumu
                    </h5>
                    <div style={{
                      width: '100%',
                      height: '300px',
                      position: 'relative',
                      borderRadius: '6px',
                      overflow: 'hidden',
                      background: 'rgba(30, 30, 46, 0.8)'
                    }}>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 1000 500"
                        width="100%"
                        height="100%"
                        preserveAspectRatio="xMidYMid meet"
                        style={{ display: 'block' }}
                      >
                        <g transform="translate(-338, 15.3) scale(0.5263)">
                          {/* Marmara Bölgesi */}
                          <path
                            d="M395.2,153.6c1-0.2,2-0.2,3-0.4c1.5-0.3,3.3-0.3,4.3-1.8c0.6-0.9,0.6-1.9,0.8-2.8c0.2-0.8,1.1-1.4,1.5-2.2c0.5-1,1.1-1.6,2.2-1.9c1.2-0.3,2.2-0.7,3.2-1.5c0.9-0.6,1.5-1.2,1.8-2.2c0.2-0.5,0.2-1,0.4-1.5c0.2-0.4,0.6-0.7,0.9-1.1c0.6-0.9,0.6-1.9,1.6-2.5c0.5-0.3,1.1-0.2,1.5-0.6c0.6-0.4,0.1-1,0.6-1.5c0.3-0.3,1.1-0.2,1.5,0c0.5,0.3,1.5,1.9,2,0.7c0.4-0.9-0.6-1.9-0.3-2.8c0.3-0.9,1.2-1.3,2-1.7c0.5-0.2,1-0.4,1.5-0.5c0.6-0.1,1.2-0.1,1.8-0.3c1-0.4,0.8-1.7,0.5-2.4c-0.3-0.8-1.4-1.5-1.2-2.5c0.2-1,1.4-0.9,2.1-1.4c1.8-1.4,0.5-4.2-0.5-5.6c-0.5-0.8-1.2-1.4-1.7-2.3c-1.2-2.1,0.5-3.4,1.4-5.2c0.5-0.9-0.1-0.8-0.9-1c-0.8-0.2-0.5-1-0.2-1.7c0.2-0.4,0.5-0.7,0.7-1c0.3-0.6,0.2-1.1,0.2-1.7c-0.1-1-0.5-1.6-0.5-2.6c0-1,0.5-1.7,0.8-2.7c0.1-0.4,0-0.9,0-1.4c0-0.5,0.2-0.8,0.4-1.2c0.4-0.9,0.4-1.9,0.4-2.9c0-0.7,0-1.6,0.4-2.2c0.6-0.9,1.3-0.6,2.2-0.5c0.5,0.1,1,0.1,1.6,0.1c1.1,0,2.3,0.1,3.3-0.1c0.6-0.1,1-0.2,1.5-0.6c0.8-0.8,1.6-1.3,2.7-1.7c1.1-0.4,2-0.5,2.8-1.5c0.9-1.2,2.1-2,2.9-3.2c0.3-0.4,0.4-0.9,0.7-1.2c0.7-0.9,2-0.6,2.9-0.4c1.3,0.2,2.3,0.5,3.4,1.1c1,0.5,2,0.9,3,0.2c0.4-0.3,0.7-0.8,1-1.3c0.4-0.6,0.9-1.1,1.1-1.8c1-2.4,1.1-4.9,0.6-7.4c-0.1-0.6-0.4-1-0.5-1.6c0-0.6,0-1.2,0.1-1.7c0.1-0.6,0.2-1.2,0.1-1.9c-0.1-0.6-0.4-1.2-0.5-1.8c-0.2-1.2,0.1-2.4-0.1-3.6c-0.1-1-0.8-2.2-0.6-3.3c0.1-0.6,0.5-0.9,0.5-1.5c0-0.5-0.1-0.9-0.2-1.4c-0.1-0.5-0.1-1,0-1.5c0.1-0.5,0.4-0.8,0.5-1.3c0.4-1.7-1.8-1.4-2.7-1.8c-0.9-0.4-2.1-0.6-2.8-1.3c-1.5-1.2-2.1-3.5-2.8-5.2c-0.5-1.2-1-2-2.1-2.7c-0.9-0.6-1.7-1.2-2.4-1.9c-0.7-0.7-1.6-1.2-2.4-1.7c-0.5-0.3-1-0.4-1.5-0.7c-1.4-0.8-2.6-2.1-4.1-2.7c-0.4-0.2-0.8-0.2-1.2-0.4c-0.2-0.1-1-0.2-1.1-0.3c-0.4-0.4,0.1-2,0.1-2.5c0-0.6,0-1.2,0-1.8c0-1.9,0.7-3.9,1.4-5.7c1-2.6,3.7-2.6,6-2.2c1.1,0.2,2.3,0.3,3.4,0.6c1,0.2,2,0.1,3,0c1.1-0.1,2.1-0.4,3.2-0.8c2.1-0.7,4.7-1.8,5.8-3.9c0.2-0.4,0.6-0.6,0.9-1c0.5-0.7,0-1.9,0.3-2.7c0.2-0.9,0.8-1.6,0.5-2.6c-0.1-0.4-0.6-0.7-0.7-1.1c-0.1-0.7,0.8-1.5,1.1-2c0.5-0.7,1.1-1.6,1.9-2.1c0.9-0.5,2.2-0.6,3.1-0.8c1.2-0.2,2.4-0.1,3.5,0.1c0.6,0.1,1.3,0.3,1.9,0.5c0.6,0.2,1.1,0.6,1.7,0.8c1.1,0.4,2.2-0.2,3.2-0.6c0.5-0.2,0.9-0.5,1.4-0.7c0.6-0.3,1.4-0.3,2.1-0.3c0.6,0,1.3,0.1,2,0.2c1,0.2,1.5,0.7,2.5,0.3c0.9-0.3,1.9-0.2,2.8-0.4c0.7-0.2,1.3-0.6,2.1-0.7c0.7-0.1,1.4,0.1,2.1-0.1c0.4-0.1,0.8-0.5,1.2-0.7c0.4-0.2,0.8-0.2,1.1-0.4c1.1-0.4,2.3-0.4,3.4-1.1c1.6-0.9,3.6-2.5,4.2-4.3c0.5-1.4,1.1-2.4,2.2-3.3c0.9-0.7,2.4-0.9,3.5-1c2.2-0.1,3.6,1,5.3,2.1c0.8,0.5,2,0.6,2.9,0.9c0.5,0.2,1,0.3,1.4,0.5c0.5,0.2,0.8,0.6,1.3,0.9c1.1,0.7,1.3-0.8,1.5-1.6c0.3-1,0.2-2,1.2-2.7c1.9-1.4,3.8-0.1,5.6,0.6c0.5,0.2,1.1,0.3,1.7,0.5c0.5,0.2,0.8,0.6,1.2,1c0.8,0.8,1.2,1.8,2.1,2.5c0.9,0.6,1.6,1.3,2.3,2.2c0.6,0.8,1.5,1.4,2,2.3c0.7,1,0.6,2.5,1.4,3.4c0.2,0.3,0.8,0.7,1.1,1c0.4,0.4,0.8,0.8,1.1,1.2c1.4,1.4,3.4,2.2,5,3.4c0.9,0.7,1.4,0.9,2.5,0.8c0.7,0,1.1,0,1.3,0.6c0.2,0.5,0.2,0.9,0.5,1.3c0.3,0.5,0.5,1,0.8,1.5c0.5,0.9,0.9,1.8,1.2,2.8c0.1,0.4,0.2,0.7,0.6,0.7c0.2,0,0.7-0.1,0.8-0.2c0.5-0.5-0.1-1.2,0.8-1.4c0-0.4,0-0.8,0.1-1.1c0.1-0.2,0.2-0.9,0.3-1c0.3-0.2,1-0.1,1.4-0.2c0.4-0.1,0.7-0.6,1-0.6c0.5,0,0.6,0.5,1.2,0.3c0.6-0.3,0.4-0.7,0.6-1.2c0.3-0.8,1.8-0.7,2.5-0.7c0.6,0,0.8,0.1,1.3,0.3c0.4,0.1,0.8,0.2,1.1-0.2c0.1-0.2,0-0.4,0.2-0.7c0.1-0.1,0.4-0.3,0.6-0.4c0.4-0.2,1-0.3,1.4-0.5c0.4-0.1,0.9-0.3,1.4-0.3c0.5,0,0.9,0.2,1.4,0.2c0.5,0.1,1-0.1,1.4,0.1c0.5,0.1,0.8,0.6,1.2,0.8c0.5,0.2,0.6,0.6,1.1,0.8c0.6,0.4,1.4,0,1.8,0.7c0.1,0.2,0,0.3,0.2,0.5c0.1,0.1,0.4,0.2,0.5,0.2c0.7,0.3,1.6,0.3,2.4,0.3c0.9-0.1,1.6-0.4,0.9-1.3c-0.5-0.7-0.3-1.3-0.5-2.1c-0.3-0.9-0.6-1.7,0.6-2c0.6-0.1,1.1-0.2,1.6-0.4c0.5-0.3,0.8-0.4,1.4-0.2c0.8,0.2,1.6,0.7,2.4,1.1c0.9,0.4,1.4,1.3,1.3,2.3c0.3,0,0.6,0,0.9-0.1c0.3-0.1,0.4-0.4,0.7-0.5c0.4-0.2,1.1-0.2,1.6-0.3c0,0.4,0.7,0.5,1,0.5c0.2,0,0.3,0.1,0.5,0c0.2,0,0.2-0.2,0.4-0.2c0.5,0.1,0.5,0.6,1,0.2c0.4-0.3,0.4-0.7,1.1-0.6c1.4,0.2,2.6,1,4,1.3c0.2,0,0.4,0,0.7,0.1c0.2-0.5,0.6-0.9,0.5-1.6c0-0.5-0.5-1.2-0.6-1.7c-0.3-1.2-0.7-2.4-1.2-3.6c-0.3-0.7-0.8-1.1-1.2-1.7c-0.3-0.5-0.3-1-0.5-1.5c-0.5-1.2-1.4-2.1-2-3.2c-0.6-1.1-1.1-2.5-2-3.1c-0.6-0.3-1.5,0-2-0.7c-0.5-0.5-0.4-1.4-0.5-2.1c-0.3-1.7-0.9-1.8-2-3.1c-0.5-0.6-0.6-0.9-1.2-1.4c-0.5-0.4-1.2-0.1-1.6-0.8c0.3-0.4,0.1-0.6,0.3-1c-0.3,0-0.5-0.2-0.8-0.2c0.1-0.7-0.3-1.4-0.5-2c-0.2-0.3-0.3-0.7-0.5-1c-0.1-0.2-0.2-0.4-0.3-0.6H338v142.3c0.2,0,0.3,0,0.5,0c0.2,0,0.4,0,0.6,0c0.4,0,0.8,0.1,1.1,0.2c0.7,0.2,1.5,0.4,2.2,0.7c0.7,0.3,1.4,0.7,2,1.1c1.6,1.1,3,3.5,5,3.8c1.1,0.2,1.8-0.5,2.7-0.6c0.9-0.1,1.8,0.3,2.6,0.5c1.9,0.3,3.1,0.9,4.9,1.7c1.6,0.8,3.6,1.4,5.3,1.8c1.9,0.5,4.1-0.1,6.1,0.2c0.8,0.1,1.6,0.5,2.5,0.6c1,0.1,2-0.1,2.9,0c2,0.2,3.9,1,6,1.1c1.6,0.1,3.6,0.1,5,0.9c0.7,0.4,4.5,5.2,4.3,2.2c0.1,0,0.3,0,0.3,0c0.1,0.3,0.4,0.5,0.5,0.9c0.8,0.2,0.5-0.6,1.1-0.8c0.5-0.1,0.5,0.1,1,0.3c0.8,0.3,1.4,0.4,2.4,0.4c-0.2,0.8-1.2,0.7-1.8,1c-0.5,0.2-1.3,1.2-1.7,0.2c-1.3-0.2-1.1,1-0.6,1.7c0.2,0.3,0.6,0.4,0.8,0.8c0.2,0.3,0.2,0.8,0.4,1.2c0.8,1,1.3,0.9,1.9,0.2c0.4-0.4,0-0.6,0.6-0.8c0.4-0.1,1,0.1,1.3,0.1c0.4,1.9-2.4,1.7-3.3,2.5c-0.5,0.4-0.9,1.3-0.7,2.1c0.4,1,1,0.5,1.9,0.6c-0.1,0.7-1.6,1.2-1.7,2c0,0.1,0,0.2,0,0.2c0.1,0,0.3-0.1,0.4-0.2C394.9,153.7,395,153.6,395.2,153.6z"
                            fill="rgba(59, 130, 246, 0.3)"
                            stroke="#3b82f6"
                            strokeWidth="2"
                          />
                          {/* Ege Bölgesi */}
                          <path
                            d="M400,200 L600,200 L600,350 L400,350 Z"
                            fill="rgba(139, 92, 246, 0.3)"
                            stroke="#8b5cf6"
                            strokeWidth="2"
                          />
                          {/* Karadeniz Bölgesi */}
                          <path
                            d="M400,50 L600,50 L600,200 L400,200 Z"
                            fill="rgba(59, 130, 246, 0.3)"
                            stroke="#3b82f6"
                            strokeWidth="2"
                          />
                          {/* İç Anadolu Bölgesi */}
                          <path
                            d="M600,200 L800,200 L800,350 L600,350 Z"
                            fill="rgba(16, 185, 129, 0.3)"
                            stroke="#10b981"
                            strokeWidth="2"
                          />
                          {/* Akdeniz Bölgesi */}
                          <path
                            d="M600,350 L800,350 L800,500 L600,500 Z"
                            fill="rgba(245, 158, 11, 0.3)"
                            stroke="#f59e0b"
                            strokeWidth="2"
                          />
                          {/* Doğu Anadolu Bölgesi */}
                          <path
                            d="M800,100 L1000,100 L1000,300 L800,300 Z"
                            fill="rgba(239, 68, 68, 0.3)"
                            stroke="#ef4444"
                            strokeWidth="2"
                          />
                          {/* Güneydoğu Anadolu Bölgesi */}
                          <path
                            d="M800,300 L1000,300 L1000,450 L800,450 Z"
                            fill="rgba(236, 72, 153, 0.3)"
                            stroke="#ec4899"
                            strokeWidth="2"
                          />
                          {/* Kargo konumu marker (örnek: İstanbul) */}
                          {cargoStatus.cargoStatus === 'in_transit' && (
                            <circle
                              cx="600"
                              cy="80"
                              r="8"
                              fill="#3b82f6"
                              stroke="#ffffff"
                              strokeWidth="2"
                            >
                              <animate
                                attributeName="r"
                                values="8;12;8"
                                dur="2s"
                                repeatCount="indefinite"
                              />
                              <animate
                                attributeName="opacity"
                                values="1;0.5;1"
                                dur="2s"
                                repeatCount="indefinite"
                              />
                            </circle>
                          )}
                          {cargoStatus.cargoStatus === 'delivered' && (
                            <circle
                              cx="600"
                              cy="80"
                              r="10"
                              fill="#10b981"
                              stroke="#ffffff"
                              strokeWidth="2"
                            />
                          )}
                        </g>
                      </svg>
                    </div>
                    <div style={{
                      marginTop: '0.75rem',
                      fontSize: '0.85rem',
                      color: '#94a3b8',
                      textAlign: 'center'
                    }}>
                      {cargoStatus.cargoStatus === 'in_transit' && '📍 Kargo şu anda yolda - Marmara Bölgesi'}
                      {cargoStatus.cargoStatus === 'delivered' && '✓ Kargo teslim edildi'}
                      {cargoStatus.cargoStatus === 'pending' && '⏳ Kargo hazırlanıyor'}
                      {cargoStatus.cargoStatus === 'preparing' && '📦 Kargo depoda hazırlanıyor'}
                      {cargoStatus.cargoStatus === 'out_for_delivery' && '🚛 Kargo teslimata çıktı'}
                    </div>
                  </div>
                </>
              )}

              {!cargoStatus && (
                <div style={{
                  padding: '1rem',
                  background: 'rgba(107, 114, 128, 0.1)',
                  borderRadius: '8px',
                  textAlign: 'center',
                  color: '#94a3b8',
                  marginTop: '2rem'
                }}>
                  Kargo durumu yükleniyor...
                </div>
              )}
            </>
          )}

          {!order && !loading && (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
              Sipariş bilgileri bulunamadı
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default OrderDetails
