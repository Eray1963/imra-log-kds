const WarehouseService = require('../services/WarehouseService');

class WarehouseController {
    async getAllWarehouses(req, res) {
        try {
            const warehouses = await WarehouseService.getAllWarehouses();
            // Opsiyonel öneri ekle
            const warehousesWithSuggestion = warehouses.map(wh => {
                const suggestion = WarehouseService.checkCapacitySuggestion(wh);
                return { ...wh, suggestion };
            });
            res.status(200).json(warehousesWithSuggestion);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async getWarehouseById(req, res) {
        try {
            const { id } = req.params;
            const warehouse = await WarehouseService.getWarehouseById(id);
            if (!warehouse) return res.status(404).json({ error: 'Warehouse not found' });
            const suggestion = WarehouseService.checkCapacitySuggestion(warehouse);
            res.status(200).json({ ...warehouse, suggestion });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async createWarehouse(req, res) {
        try {
            const warehouseData = req.body;
            const id = await WarehouseService.createWarehouse(warehouseData);
            res.status(201).json({ message: 'Warehouse created', id });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = new WarehouseController();