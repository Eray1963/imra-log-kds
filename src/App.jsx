import { useState, useEffect } from 'react'
import './App.css'

// Components
import Login from './components/Login'
import Overview from './components/Overview'
import FleetManagement from './components/FleetManagement'
import FleetExpansion from './components/FleetExpansion'
import SpareParts from './components/SpareParts'
import WarehouseManagement from './components/WarehouseManagement'
import ScenarioSimulation from './components/ScenarioSimulation'
function App() {
  const [activeTab, setActiveTab] = useState('overview')
  const [health, setHealth] = useState(null)
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showLogoAnimation, setShowLogoAnimation] = useState(false)
  const [isFirstLogin, setIsFirstLogin] = useState(false)

  useEffect(() => {
    // Check if user is already logged in
    const savedUser = localStorage.getItem('user')
    const savedToken = localStorage.getItem('token')
    
    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser))
      setIsAuthenticated(true)
    }

    // Check API health
    fetch('/api/health')
      .then(res => res.json())
      .then(data => setHealth(data))
      .catch(err => console.error('API hatası:', err))
  }, [])

  const handleLogin = (userData) => {
    setUser(userData)
    setIsFirstLogin(true)
    setShowLogoAnimation(true)
    
    // Animasyon süresi: 1.5 saniye tam ekranda, sonra küçülme ve sidebar'a geçiş
    setTimeout(() => {
      setIsAuthenticated(true)
      setTimeout(() => {
        setShowLogoAnimation(false)
        setTimeout(() => {
          setIsFirstLogin(false)
        }, 600)
      }, 800) // Küçülme animasyonu için ekstra süre
    }, 1500)
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    setIsAuthenticated(false)
  }

  // Show login screen if not authenticated
  if (!isAuthenticated && !showLogoAnimation) {
    return <Login onLogin={handleLogin} />
  }

  // Show logo animation during login transition
  if (showLogoAnimation) {
    return (
      <div 
        className="logo-animation-container"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}
      >
        <img
          src="/logo.png"
          alt="İMRA LOJİSTİK"
          className="logo-animation"
          style={{
            width: '600px',
            maxWidth: '80vw',
            borderRadius: '24px',
            objectFit: 'contain',
            filter: 'brightness(1.1) contrast(1.15) drop-shadow(0 8px 32px rgba(59, 130, 246, 0.3))'
          }}
        />
      </div>
    )
  }

  const handleTabChange = (tabId) => {
    if (tabId === activeTab) return
    setActiveTab(tabId)
  }

  const tabs = [
    { id: 'overview', label: 'Genel Bakış', icon: '📊' },
    { id: 'fleet-expansion', label: 'Filo', icon: '📈' },
    { id: 'spare-parts', label: 'Yedek Parça', icon: '🔧' },
    { id: 'warehouse', label: 'Depo', icon: '🏭' },
    { id: 'scenarios', label: 'Senaryolar (Döviz/Enflasyon)', icon: '💹' }
  ]

  return (
    <div className="App">
      <header className="app-header">
        <div className="header-content">
          <div className="header-logo">
            <h1>İMRA LOJİSTİK</h1>
            <p className="header-subtitle">Kurumsal Lojistik Karar Destek Sistemi</p>
          </div>
          <div className="header-actions">
            <div className="header-user-card">
              <div className="header-user-avatar">
                <div className="header-user-avatar-inner">
                  {(user?.name || user?.username || 'Admin')[0].toUpperCase()}
                </div>
                <div className="header-user-status"></div>
              </div>
              <div className="header-user-info">
                <span className="header-user-name">
                  {user?.name || user?.username || 'Admin Kullanıcı'}
                </span>
                <span className="header-user-role">Yönetici</span>
              </div>
              <div className="header-divider"></div>
              <button
                onClick={handleLogout}
                className="header-logout-btn"
                title="Çıkış Yap"
              >
                <svg 
                  width="18" 
                  height="18" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  style={{ display: 'block' }}
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="app-layout">
        <aside className="sidebar">
          <div className="sidebar-logo">
            <img
              src="/logo.png"
              alt="İMRA LOJİSTİK"
              className={isFirstLogin ? 'sidebar-logo-enter' : ''}
              style={{
                width: '100%',
                maxWidth: '200px',
                borderRadius: '12px',
                objectFit: 'contain',
                display: 'block',
                margin: '0 auto',
                opacity: 0.95,
                filter: 'brightness(1.05) contrast(1.1) drop-shadow(0 2px 12px rgba(139, 92, 246, 0.4))',
                transition: 'all 0.3s ease',
                mixBlendMode: 'normal',
                backgroundColor: 'transparent'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '1'
                e.currentTarget.style.filter = 'brightness(1.1) contrast(1.15) drop-shadow(0 4px 16px rgba(139, 92, 246, 0.6))'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '0.95'
                e.currentTarget.style.filter = 'brightness(1.05) contrast(1.1) drop-shadow(0 2px 12px rgba(139, 92, 246, 0.4))'
              }}
            />
          </div>
          <div className="sidebar-menu-section">
            <nav className="sidebar-nav">
              {tabs.map(tab => {
                const getStatusColor = (status) => {
                  switch(status) {
                    case 'normal': return '#22c55e'
                    case 'warning': return '#eab308'
                    case 'critical': return '#dc2626'
                    default: return '#22c55e'
                  }
                }
                return (
                  <button
                    key={tab.id}
                    className={`sidebar-tab ${activeTab === tab.id ? 'active' : ''}`}
                    onClick={() => handleTabChange(tab.id)}
                    data-status={tab.status}
                  >
                    <span className="sidebar-tab-icon">{tab.icon}</span>
                    <span className="sidebar-tab-label">{tab.label}</span>
                    <span className="sidebar-tab-arrow">▶</span>
                    <span 
                      className="sidebar-tab-status" 
                      style={{ color: getStatusColor(tab.status) }}
                    >
                      ●
                    </span>
                  </button>
                )
              })}
            </nav>
          </div>
        </aside>

        <main className="main-content" style={{ padding: 0 }}>
          {activeTab === 'overview' && <Overview onNavigate={handleTabChange} />}
          {activeTab === 'fleet-expansion' && <FleetManagement />}
          {activeTab === 'warehouse' && <WarehouseManagement />}
          {activeTab === 'spare-parts' && <SpareParts />}
          {activeTab === 'scenarios' && <ScenarioSimulation />}
        </main>
      </div>
    </div>
  )
}

export default App


