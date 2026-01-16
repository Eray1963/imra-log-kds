const db = require('../config/db');

class Vehicle {
    static async findAll() {
        const [rows] = await db.query('SELECT * FROM vehicles');
        return rows;
    }

    static async findById(id) {
        const [rows] = await db.query('SELECT * FROM vehicles WHERE id = ?', [id]);
        return rows[0] || null;
    }

    static async create(data) {
        const { plate, status, capacity } = data;
        const [result] = await db.query(
            'INSERT INTO vehicles (plate, status, capacity) VALUES (?, ?, ?)',
            [plate, status, capacity]
        );
        return result.insertId;
    }

    static async update(id, data) {
        const { plate, status, capacity } = data;
        const [result] = await db.query(
            'UPDATE vehicles SET plate = ?, status = ?, capacity = ? WHERE id = ?',
            [plate, status, capacity, id]
        );
        return result.affectedRows > 0;
    }

    static async delete(id) {
        const [result] = await db.query('DELETE FROM vehicles WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }
}

module.exports = Vehicle;