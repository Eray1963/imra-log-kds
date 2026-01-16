const db = require('../config/db');

class Vehicle {
    // CREATE: Yeni araç ekle
    static async create(vehicleData) {
        const { plate, status, capacity } = vehicleData;
        const [result] = await db.query(
            'INSERT INTO vehicles (plate, status, capacity) VALUES (?, ?, ?)',
            [plate, status, capacity]
        );
        return result.insertId;
    }

    // READ: Tüm araçları getir
    static async findAll() {
        const [rows] = await db.query('SELECT * FROM vehicles');
        return rows;
    }

    // READ: ID'ye göre araç getir
    static async findById(id) {
        const [rows] = await db.query('SELECT * FROM vehicles WHERE id = ?', [id]);
        return rows[0] || null;
    }

    // UPDATE: Araç güncelle
    static async update(id, vehicleData) {
        const { plate, status, capacity } = vehicleData;
        const [result] = await db.query(
            'UPDATE vehicles SET plate = ?, status = ?, capacity = ? WHERE id = ?',
            [plate, status, capacity, id]
        );
        return result.affectedRows > 0;
    }

    // DELETE: Araç sil
    static async delete(id) {
        const [result] = await db.query('DELETE FROM vehicles WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }

    // LOAD STOCK: Araç kapasitesi kontrolü ile stok yükle
    static async loadStock(vehicleId, stockId, quantity) {
        const vehicle = await this.findById(vehicleId);
        if (!vehicle) throw new Error('Araç bulunamadı');

        const stock = await db.query('SELECT * FROM stocks WHERE id = ?', [stockId]);
        if (!stock[0][0]) throw new Error('Stok bulunamadı');

        const stockItem = stock[0][0];
        const loadWeight = quantity * stockItem.weight;

        if (loadWeight > vehicle.capacity) {
            throw new Error('Araç kapasitesi yetersiz');
        }

        // Stok azalt
        const newQuantity = stockItem.quantity - quantity;
        if (newQuantity < 0) throw new Error('Yetersiz stok miktarı');

        await db.query('UPDATE stocks SET quantity = ? WHERE id = ?', [newQuantity, stockId]);

        return { message: 'Stok başarıyla yüklendi' };
    }
}

module.exports = Vehicle;