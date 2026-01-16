// const db = require('../db/mysql_connect');
const Warehouse = require('../models/Warehouse');

// Mock data
let warehouses = [
    new Warehouse(1, 'Ana Depo', 10000, 9500),
    new Warehouse(2, 'Yan Depo', 5000, 3000)
];
let nextId = 3;

class WarehouseService {
    // Get all warehouses
    async getAllWarehouses() {
        return warehouses;
    }

    // Get warehouse by id
    async getWarehouseById(id) {
        return warehouses.find(w => w.id == id) || null;
    }

    // Create warehouse
    async createWarehouse(warehouseData) {
        const { name, capacity, currentUsage } = warehouseData;
        const warehouse = new Warehouse(nextId++, name, capacity, currentUsage);
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