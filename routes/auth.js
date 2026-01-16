import express from 'express';
const router = express.Router();

// Basit kullanıcı veritabanı (gerçek uygulamada MySQL'de olmalı)
const users = [
  {
    id: 1,
    username: 'admin',
    password: 'admin123',
    name: 'Admin Kullanıcı',
    role: 'admin',
    email: 'admin@lojistik-kds.com'
  },
  {
    id: 2,
    username: 'yonetici',
    password: 'yonetici123',
    name: 'Yönetici',
    role: 'manager',
    email: 'yonetici@lojistik-kds.com'
  }
];

// Login
router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Kullanıcı adı ve şifre gereklidir' 
      });
    }

    const user = users.find(u => u.username === username && u.password === password);

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Kullanıcı adı veya şifre hatalı' 
      });
    }

    // Basit token (gerçek uygulamada JWT kullanılmalı)
    const token = Buffer.from(`${user.id}:${user.username}:${Date.now()}`).toString('base64');

    res.json({
      success: true,
      token: token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login hatası:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Sunucu hatası: ' + error.message 
    });
  }
});

export default router;



