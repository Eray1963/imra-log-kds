import { useState, useEffect } from 'react'
import OrderDetails from './OrderDetails'

function OrdersManagement() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedOrderId, setSelectedOrderId] = useState(null)

  useEffect(() => {
    loadOrders()
  }, [])

  const loadOrders = async () => {
    try {
      // Since we don't have a list endpoint yet, we'll use mock data
      // In a real scenario, you'd fetch from /api/orders
      setOrders([
        { id: 1, orderNumber: 'ORD-001', customerName: 'ABC Şirketi', orderDate: new Date(), status: 'active', totalAmount: 5000 },
        { id: 2, orderNumber: 'ORD-002', customerName: 'XYZ Ltd.', orderDate: new Date(), status: 'active', totalAmount: 7500 },
        { id: 3, orderNumber: 'ORD-003', customerName: 'Test Müşteri', orderDate: new Date(), status: 'active', totalAmount: 3200 }
      ])
    } catch (err) {
      console.error('Siparişler yüklenirken hata:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{
        height: '100vh',
        background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ fontSize: '1rem', color: '#cbd5e1' }}>Yükleniyor...</div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
      color: '#cbd5e1',
      padding: '2rem'
    }}>
      <h2 className="card-title" style={{ marginBottom: '2rem', color: '#ffffff' }}>
        📦 Sipariş Yönetimi
      </h2>

      <div className="card" style={{
        background: 'rgba(30, 30, 46, 0.8)',
        border: '1px solid rgba(59, 130, 246, 0.2)'
      }}>
        <div className="card-header" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <h3 className="card-title" style={{ color: '#ffffff' }}>Sipariş Listesi</h3>
        </div>
        <table className="table" style={{ color: '#cbd5e1' }}>
          <thead>
            <tr>
              <th style={{
                background: 'rgba(59, 130, 246, 0.1)',
                color: '#ffffff',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
              }}>Sipariş No</th>
              <th style={{
                background: 'rgba(59, 130, 246, 0.1)',
                color: '#ffffff',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
              }}>Müşteri</th>
              <th style={{
                background: 'rgba(59, 130, 246, 0.1)',
                color: '#ffffff',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
              }}>Tarih</th>
              <th style={{
                background: 'rgba(59, 130, 246, 0.1)',
                color: '#ffffff',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
              }}>Tutar</th>
              <th style={{
                background: 'rgba(59, 130, 246, 0.1)',
                color: '#ffffff',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
              }}>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <td style={{ padding: '1rem' }}>
                  <strong style={{ color: '#3b82f6' }}>{order.orderNumber}</strong>
                </td>
                <td style={{ padding: '1rem' }}>{order.customerName}</td>
                <td style={{ padding: '1rem' }}>
                  {new Date(order.orderDate).toLocaleDateString('tr-TR')}
                </td>
                <td style={{ padding: '1rem' }}>
                  {order.totalAmount.toLocaleString('tr-TR')} ₺
                </td>
                <td style={{ padding: '1rem' }}>
                  <button
                    onClick={() => setSelectedOrderId(order.id)}
                    className="btn"
                    style={{
                      background: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      padding: '0.5rem 1rem',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Detaylar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedOrderId && (
        <OrderDetails
          orderId={selectedOrderId}
          onClose={() => setSelectedOrderId(null)}
        />
      )}
    </div>
  )
}

export default OrdersManagement
