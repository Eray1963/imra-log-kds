const db = require('../config/db');

class Warehouse {
    static async findAll() {
        const [rows] = await db.query('SELECT * FROM depo_doluluk');
        return rows;
    }

    static async findById(id) {
        const [rows] = await db.query('SELECT * FROM depo_doluluk WHERE id = ?', [id]);
        return rows[0];
    }

    static async create(data) {
        const { warehouse_name, capacity, current_load, utilization_percent } = data;
        const [result] = await db.query(
            'INSERT INTO depo_doluluk (warehouse_name, capacity, current_load, utilization_percent) VALUES (?, ?, ?, ?)',
            [warehouse_name, capacity, current_load, utilization_percent]
        );
        return result.insertId;
    }

    static async update(id, data) {
        const { warehouse_name, capacity, current_load, utilization_percent } = data;
        await db.query(
            'UPDATE depo_doluluk SET warehouse_name = ?, capacity = ?, current_load = ?, utilization_percent = ? WHERE id = ?',
            [warehouse_name, capacity, current_load, utilization_percent, id]
        );
    }

    static async remove(id) {
        await db.query('DELETE FROM depo_doluluk WHERE id = ?', [id]);
    }
}

module.exports = Warehouse;