const db = require('../config/db');

class SparePart {
    static async findAll() {
        const [rows] = await db.query('SELECT * FROM yedek_parcalar');
        return rows;
    }

    static async findById(id) {
        const [rows] = await db.query('SELECT * FROM yedek_parcalar WHERE id = ?', [id]);
        return rows[0];
    }

    static async create(data) {
        const { part_name, quantity, min_stock, price } = data;
        const [result] = await db.query(
            'INSERT INTO yedek_parcalar (part_name, quantity, min_stock, price) VALUES (?, ?, ?, ?)',
            [part_name, quantity, min_stock, price]
        );
        return result.insertId;
    }

    static async update(id, data) {
        const { part_name, quantity, min_stock, price } = data;
        await db.query(
            'UPDATE yedek_parcalar SET part_name = ?, quantity = ?, min_stock = ?, price = ? WHERE id = ?',
            [part_name, quantity, min_stock, price, id]
        );
    }

    static async remove(id) {
        await db.query('DELETE FROM yedek_parcalar WHERE id = ?', [id]);
    }
}

module.exports = SparePart;