const db = require('../config/db');

class Vehicle {
    static async findAll() {
        const [rows] = await db.query('SELECT * FROM vehicles');
        return rows;
    }

    static async findById(id) {
        const [rows] = await db.query('SELECT * FROM vehicles WHERE id = ?', [id]);
        return rows[0];
    }

    static async create(data) {
        const { plate_number, driver_name, capacity, status } = data;
        const [result] = await db.query(
            'INSERT INTO vehicles (plate_number, driver_name, capacity, status) VALUES (?, ?, ?, ?)',
            [plate_number, driver_name, capacity, status]
        );
        return result.insertId;
    }

    static async update(id, data) {
        const { plate_number, driver_name, capacity, status } = data;
        await db.query(
            'UPDATE vehicles SET plate_number = ?, driver_name = ?, capacity = ?, status = ? WHERE id = ?',
            [plate_number, driver_name, capacity, status, id]
        );
    }

    static async remove(id) {
        await db.query('DELETE FROM vehicles WHERE id = ?', [id]);
    }
}

module.exports = Vehicle;