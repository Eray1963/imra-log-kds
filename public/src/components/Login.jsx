import { useState, useEffect, useRef } from 'react'
import './Login.css'
import LoadingOverlay from './LoadingOverlay'

function Login({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [ambientGradient, setAmbientGradient] = useState(null)
  const containerRef = useRef(null)

  // Fotoğrafın renklerini analiz et ve ambient lighting efekti oluştur
  useEffect(() => {
    const analyzeImageColors = () => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.src = '/login-background.png'
      
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        canvas.width = img.width
        canvas.height = img.height
        ctx.drawImage(img, 0, 0)
        
        // Üst kenardan renk örnekleri al (ilk %15'lik kısım - daha geniş alan)
        const topSampleHeight = Math.max(20, Math.floor(img.height * 0.15))
        const topColors = []
        const sampleStep = Math.max(1, Math.floor(img.width / 40))
        
        // Üst kısımdan daha fazla örnek al, ağırlıklı ortalama için
        for (let y = 0; y < topSampleHeight; y += 1) {
          // Y'ye göre ağırlık - kenara yakın olanlar daha önemli
          const weight = 1 - (y / topSampleHeight) * 0.5
          for (let x = 0; x < img.width; x += sampleStep) {
            const pixelData = ctx.getImageData(x, y, 1, 1).data
            const brightness = (pixelData[0] + pixelData[1] + pixelData[2]) / 3
            // Daha yumuşak filtreleme - çok karanlık olmayanları al
            if (brightness > 5) {
              // Ağırlıklı renk ekle
              for (let i = 0; i < Math.ceil(weight * 3); i++) {
                topColors.push([pixelData[0], pixelData[1], pixelData[2]])
              }
            }
          }
        }
        
        // Alt kenardan renk örnekleri al (son %15'lik kısım)
        const bottomSampleHeight = Math.max(20, Math.floor(img.height * 0.15))
        const bottomColors = []
        for (let y = img.height - bottomSampleHeight; y < img.height; y += 1) {
          // Y'ye göre ağırlık - kenara yakın olanlar daha önemli
          const weight = 1 - ((img.height - y) / bottomSampleHeight) * 0.5
          for (let x = 0; x < img.width; x += sampleStep) {
            const pixelData = ctx.getImageData(x, y, 1, 1).data
            const brightness = (pixelData[0] + pixelData[1] + pixelData[2]) / 3
            if (brightness > 5) {
              // Ağırlıklı renk ekle
              for (let i = 0; i < Math.ceil(weight * 3); i++) {
                bottomColors.push([pixelData[0], pixelData[1], pixelData[2]])
              }
            }
          }
        }
        
        // Eğer yeterli renk örneği yoksa varsayılan kullan
        if (topColors.length === 0 || bottomColors.length === 0) {
          return
        }
        
        // Ortalama renkleri hesapla
        const avgTopColor = topColors.reduce(
          (acc, color) => [
            acc[0] + color[0],
            acc[1] + color[1],
            acc[2] + color[2]
          ],
          [0, 0, 0]
        ).map(sum => Math.floor(sum / topColors.length))
        
        const avgBottomColor = bottomColors.reduce(
          (acc, color) => [
            acc[0] + color[0],
            acc[1] + color[1],
            acc[2] + color[2]
          ],
          [0, 0, 0]
        ).map(sum => Math.floor(sum / bottomColors.length))
        
        // Yumuşak ambient lighting için renkleri hafifçe koyulaştır ve doygunluğu hafifçe artır
        const createAmbientColor = (rgb, darkenFactor = 0.55, saturateFactor = 1.1) => {
          // HSL dönüşümü için RGB'yi normalize et
          const r = rgb[0] / 255
          const g = rgb[1] / 255
          const b = rgb[2] / 255
          
          const max = Math.max(r, g, b)
          const min = Math.min(r, g, b)
          let h, s, l = (max + min) / 2
          
          if (max === min) {
            h = s = 0
          } else {
            const d = max - min
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
            switch (max) {
              case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
              case g: h = ((b - r) / d + 2) / 6; break
              case b: h = ((r - g) / d + 4) / 6; break
            }
          }
          
          // Yumuşak doygunluk artışı ve hafif koyulaştırma
          s = Math.min(0.85, s * saturateFactor) // Maksimum doygunluk sınırı
          l = Math.max(0.08, Math.min(0.25, l * darkenFactor)) // Çok koyu veya açık olmasın
          
          // RGB'ye geri dönüştür
          const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1
            if (t > 1) t -= 1
            if (t < 1/6) return p + (q - p) * 6 * t
            if (t < 1/2) return q
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6
            return p
          }
          
          let r2, g2, b2
          if (s === 0) {
            r2 = g2 = b2 = l
          } else {
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s
            const p = 2 * l - q
            r2 = hue2rgb(p, q, h + 1/3)
            g2 = hue2rgb(p, q, h)
            b2 = hue2rgb(p, q, h - 1/3)
          }
          
          return [
            Math.max(0, Math.min(255, Math.floor(r2 * 255))),
            Math.max(0, Math.min(255, Math.floor(g2 * 255))),
            Math.max(0, Math.min(255, Math.floor(b2 * 255)))
          ]
        }
        
        const topAmbient = createAmbientColor(avgTopColor, 0.55, 1.1)
        const bottomAmbient = createAmbientColor(avgBottomColor, 0.55, 1.1)
        
        // Çok yumuşak gradient oluştur - ambient lighting efekti
        const gradient = `linear-gradient(180deg, 
          rgb(${topAmbient[0]}, ${topAmbient[1]}, ${topAmbient[2]}) 0%,
          rgb(${topAmbient[0]}, ${topAmbient[1]}, ${topAmbient[2]}) 8%,
          rgba(${topAmbient[0]}, ${topAmbient[1]}, ${topAmbient[2]}, 0.85) 12%,
          rgba(${topAmbient[0]}, ${topAmbient[1]}, ${topAmbient[2]}, 0.65) 16%,
          rgba(${topAmbient[0]}, ${topAmbient[1]}, ${topAmbient[2]}, 0.4) 18%,
          rgba(${topAmbient[0]}, ${topAmbient[1]}, ${topAmbient[2]}, 0.15) 19%,
          transparent 20%,
          transparent 80%,
          rgba(${bottomAmbient[0]}, ${bottomAmbient[1]}, ${bottomAmbient[2]}, 0.15) 81%,
          rgba(${bottomAmbient[0]}, ${bottomAmbient[1]}, ${bottomAmbient[2]}, 0.4) 82%,
          rgba(${bottomAmbient[0]}, ${bottomAmbient[1]}, ${bottomAmbient[2]}, 0.65) 84%,
          rgba(${bottomAmbient[0]}, ${bottomAmbient[1]}, ${bottomAmbient[2]}, 0.85) 88%,
          rgb(${bottomAmbient[0]}, ${bottomAmbient[1]}, ${bottomAmbient[2]}) 92%,
          rgb(${bottomAmbient[0]}, ${bottomAmbient[1]}, ${bottomAmbient[2]}) 100%
        )`
        
        setAmbientGradient(gradient)
      }
      
      img.onerror = () => {
        // Hata durumunda varsayılan gradient kullan
        setAmbientGradient(null)
      }
    }
    
    analyzeImageColors()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      })

      if (!response.ok) {
        try {
          const errorData = await response.json()
          setError(errorData.message || `Sunucu hatası: ${response.status}`)
        } catch (parseError) {
          setError(`Sunucu hatası: ${response.status} ${response.statusText}`)
        }
        setLoading(false)
        return
      }

      const data = await response.json()

      if (data.success) {
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
        onLogin(data.user)
      } else {
        setError(data.message || 'Giriş başarısız')
      }
    } catch (err) {
      console.error('Login error:', err)
      setError(`Bağlantı hatası: ${err.message}. Backend'in çalıştığından emin olun.`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div 
      className="login-container" 
      ref={containerRef}
      style={ambientGradient ? {
        '--ambient-gradient': ambientGradient
      } : undefined}
    >
      <LoadingOverlay show={loading} />
      <div className="login-box">
        <div className="login-header">
          <img
            src="/logo.png"
            alt="İMRA LOJİSTİK"
            style={{
              width: '100%',
              maxWidth: '280px',
              borderRadius: '16px',
              objectFit: 'contain',
              display: 'block',
              margin: '0 auto 1.5rem auto',
              opacity: 0.9,
              filter: 'brightness(1.1) contrast(1.15) drop-shadow(0 4px 16px rgba(0, 0, 0, 0.5))',
              transition: 'all 0.3s ease'
            }}
          />
        </div>
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label className="form-label">Kullanıcı Adı</label>
            <input
              type="text"
              className="form-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Kullanıcı adınızı girin"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Şifre</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Şifrenizi girin"
              required
            />
          </div>

          {error && (
            <div className="login-error">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            className="btn btn-primary login-button"
            disabled={loading}
          >
            {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Login



