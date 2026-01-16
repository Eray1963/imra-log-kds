const db = require('../config/db');

class Warehouse {
    // CREATE: Yeni depo ekle
    static async create(warehouseData) {
        const { name, capacity, currentUsage } = warehouseData;
        const [result] = await db.query(
            'INSERT INTO warehouses (name, capacity, currentUsage) VALUES (?, ?, ?)',
            [name, capacity, currentUsage]
        );
        return result.insertId;
    }

    // READ: Tüm depoları getir
    static async findAll() {
        const [rows] = await db.query('SELECT * FROM warehouses');
        return rows;
    }

    // READ: ID'ye göre depo getir
    static async findById(id) {
        const [rows] = await db.query('SELECT * FROM warehouses WHERE id = ?', [id]);
        return rows[0] || null;
    }
}

module.exports = Warehouse;