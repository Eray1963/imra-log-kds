const db = require('../config/db');

class Stock {
    // CREATE: Yeni stok ekle
    static async create(stockData) {
        const { name, quantity, minimumLevel } = stockData;
        const [result] = await db.query(
            'INSERT INTO stocks (name, quantity, minimumLevel) VALUES (?, ?, ?)',
            [name, quantity, minimumLevel]
        );
        return result.insertId;
    }

    // READ: Tüm stokları getir
    static async findAll() {
        const [rows] = await db.query('SELECT * FROM stocks');
        return rows;
    }

    // READ: ID'ye göre stok getir
    static async findById(id) {
        const [rows] = await db.query('SELECT * FROM stocks WHERE id = ?', [id]);
        return rows[0] || null;
    }

    // UPDATE: Stok güncelle
    static async update(id, stockData) {
        const { name, quantity, minimumLevel } = stockData;
        const [result] = await db.query(
            'UPDATE stocks SET name = ?, quantity = ?, minimumLevel = ? WHERE id = ?',
            [name, quantity, minimumLevel, id]
        );
        return result.affectedRows > 0;
    }

    // DELETE: Stok sil
    static async delete(id) {
        const [result] = await db.query('DELETE FROM stocks WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }
}

module.exports = Stock;