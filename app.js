const express = require('express');
const path = require('path');
const app = express();
require('dotenv').config();
const cors = require('cors');
const db = require('./config/db'); // DB bağlantısı

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

const port = process.env.PORT || 3001;

// Routes
app.use('/api', require('./routes/vehicles'));
app.use('/api', require('./routes/stocks'));
app.use('/api', require('./routes/warehouses'));

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
