const db = require('../db/mysql_connect');
const Warehouse = require('../models/Warehouse');

// Fallback mock data
let warehouses = [
    new Warehouse(1, 'Ana Depo', 10000, 9500),
    new Warehouse(2, 'Yan Depo', 5000, 3000)
];
let nextId = 3;

class WarehouseService {
    async _query(sql, params = []) {
        try {
            return await db.query(sql, params);
        } catch (error) {
            console.log('DB error, using mock data:', error.message);
            return null;
        }
    }

    // Get all warehouses
    async getAllWarehouses() {
        const result = await this._query('SELECT * FROM warehouses');
        if (result) {
            const [rows] = result;
            return rows.map(row => new Warehouse(row.id, row.name, row.capacity, row.currentUsage));
        }
        return warehouses;
    }

    // Get warehouse by id
    async getWarehouseById(id) {
        const result = await this._query('SELECT * FROM warehouses WHERE id = ?', [id]);
        if (result) {
            const [rows] = result;
            if (rows.length === 0) return null;
            const row = rows[0];
            return new Warehouse(row.id, row.name, row.capacity, row.currentUsage);
        }
        return warehouses.find(w => w.id == id) || null;
    }

    // Create warehouse
    async createWarehouse(warehouseData) {
        const result = await this._query('INSERT INTO warehouses (name, capacity, currentUsage) VALUES (?, ?, ?)', [warehouseData.name, warehouseData.capacity, warehouseData.currentUsage]);
        if (result) {
            const [res] = result;
            return res.insertId;
        }
        const warehouse = new Warehouse(nextId++, warehouseData.name, warehouseData.capacity, warehouseData.currentUsage);
        warehouses.push(warehouse);
        return warehouse.id;
    }

    // Opsiyonel: Depo doluluk oranı %90 üzerindeyse öneri
    checkCapacitySuggestion(warehouse) {
        const usageRatio = warehouse.currentUsage / warehouse.capacity;
        if (usageRatio > 0.9) {
            return 'Depo kapasitesi %90\'ın üzerinde. Kapasite artırımı önerilir.';
        }
        return null;
    }
}

module.exports = new WarehouseService();