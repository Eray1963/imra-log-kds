const express = require('express');
const path = require('path');
const cors = require('cors');
const db = require('./src/config/db');
const vehicleRoutes = require('./src/routes/vehicleRoutes');
const sparePartRoutes = require('./src/routes/sparePartRoutes');
const warehouseRoutes = require('./src/routes/warehouseRoutes');

const app = express();

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

app.use('/api', vehicleRoutes);
app.use('/api', sparePartRoutes);
app.use('/api', warehouseRoutes);

// DB bağlantısını test et
(async () => {
    try {
        await db.query('SELECT 1');
        console.log('MySQL connected');
    } catch (error) {
        console.error('MySQL connection error:', error.message);
    }
})();

module.exports = app;
