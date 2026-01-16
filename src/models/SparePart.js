const db = require('../config/db');

class SparePart {
    static async findAll() {
        const [rows] = await db.query('SELECT * FROM yedek_parcalar');
        return rows;
    }

    static async findById(id) {
        const [rows] = await db.query('SELECT * FROM yedek_parcalar WHERE id = ?', [id]);
        return rows[0] || null;
    }

    static async create(data) {
        const { name, category, region_id, supplier, stock, min_stock, unit_price, total_value, remaining_life_days, stock_level } = data;
        const [result] = await db.query(
            'INSERT INTO yedek_parcalar (name, category, region_id, supplier, stock, min_stock, unit_price, total_value, remaining_life_days, stock_level) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [name, category, region_id, supplier, stock, min_stock, unit_price, total_value, remaining_life_days, stock_level]
        );
        return result.insertId;
    }

    static async update(id, data) {
        const { name, category, region_id, supplier, stock, min_stock, unit_price, total_value, remaining_life_days, stock_level } = data;
        const [result] = await db.query(
            'UPDATE yedek_parcalar SET name = ?, category = ?, region_id = ?, supplier = ?, stock = ?, min_stock = ?, unit_price = ?, total_value = ?, remaining_life_days = ?, stock_level = ? WHERE id = ?',
            [name, category, region_id, supplier, stock, min_stock, unit_price, total_value, remaining_life_days, stock_level, id]
        );
        return result.affectedRows > 0;
    }

    static async delete(id) {
        const [result] = await db.query('DELETE FROM yedek_parcalar WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }
}

module.exports = SparePart;