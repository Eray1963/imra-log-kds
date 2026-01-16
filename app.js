const express = require('express');
const path = require('path');
const app = express();
require('dotenv').config();
const cors = require('cors');
const db = require('./db/mysql_connect'); // DB bağlantısını test için ekle

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

const port = process.env.PORT || 3001;
const router = require('./routers');
app.use('/api', router);

// Geçici test endpoint
app.get('/test', (req, res) => {
    res.status(200).json({ message: 'OK' });
});

// DB bağlantısını test et, hata varsa server düşürme
(async () => {
    try {
        await db.query('SELECT 1');
        console.log('MySQL bağlantısı başarılı.');
    } catch (error) {
        console.log('MySQL bağlantı hatası:', error.message, '- Mock veri kullanılacak.');
    }
})();

app.listen(port, () => {
    console.log(`Sunucu port ${port} üzerinde çalışıyor...`);
});
