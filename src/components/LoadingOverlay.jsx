import './LoadingOverlay.css'

function LoadingOverlay({ show }) {
  if (!show) return null

  return (
    <div className="loading-overlay">
      <div className="loading-content">
        <div className="truck-tire">
          <svg width="80" height="80" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="35" fill="none" stroke="#667eea" strokeWidth="4" className="tire-outer" />
            <circle cx="40" cy="40" r="25" fill="none" stroke="#764ba2" strokeWidth="3" className="tire-inner" />
            <line x1="40" y1="15" x2="40" y2="25" stroke="#667eea" strokeWidth="2" className="spoke" />
            <line x1="40" y1="55" x2="40" y2="65" stroke="#667eea" strokeWidth="2" className="spoke" />
            <line x1="15" y1="40" x2="25" y2="40" stroke="#667eea" strokeWidth="2" className="spoke" />
            <line x1="55" y1="40" x2="65" y2="40" stroke="#667eea" strokeWidth="2" className="spoke" />
            <line x1="25" y1="25" x2="30" y2="30" stroke="#667eea" strokeWidth="2" className="spoke" />
            <line x1="55" y1="55" x2="50" y2="50" stroke="#667eea" strokeWidth="2" className="spoke" />
            <line x1="25" y1="55" x2="30" y2="50" stroke="#667eea" strokeWidth="2" className="spoke" />
            <line x1="55" y1="25" x2="50" y2="30" stroke="#667eea" strokeWidth="2" className="spoke" />
          </svg>
        </div>
        <p className="loading-text">Yükleniyor...</p>
      </div>
    </div>
  )
}

export default LoadingOverlay



