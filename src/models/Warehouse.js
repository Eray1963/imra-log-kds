const db = require('../config/db');

class Warehouse {
    static async findAll() {
        const [rows] = await db.query('SELECT * FROM depo_doluluk');
        return rows;
    }

    static async findById(id) {
        const [rows] = await db.query('SELECT * FROM depo_doluluk WHERE id = ?', [id]);
        return rows[0] || null;
    }

    static async create(data) {
        const { year, region, region_id, utilization_percent } = data;
        const [result] = await db.query(
            'INSERT INTO depo_doluluk (year, region, region_id, utilization_percent) VALUES (?, ?, ?, ?)',
            [year, region, region_id, utilization_percent]
        );
        return result.insertId;
    }

    static async update(id, data) {
        const { year, region, region_id, utilization_percent } = data;
        const [result] = await db.query(
            'UPDATE depo_doluluk SET year = ?, region = ?, region_id = ?, utilization_percent = ? WHERE id = ?',
            [year, region, region_id, utilization_percent, id]
        );
        return result.affectedRows > 0;
    }

    static async delete(id) {
        const [result] = await db.query('DELETE FROM depo_doluluk WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }
}

module.exports = Warehouse;