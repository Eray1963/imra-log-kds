const Warehouse = require('../models/Warehouse');

class WarehouseController {
    async getAllWarehouses(req, res) {
        try {
            const warehouses = await Warehouse.findAll();
            res.json(warehouses);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async getWarehouseById(req, res) {
        try {
            const { id } = req.params;
            const warehouse = await Warehouse.findById(id);
            if (!warehouse) {
                return res.status(404).json({ error: 'Warehouse not found' });
            }
            res.json(warehouse);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async createWarehouse(req, res) {
        try {
            const id = await Warehouse.create(req.body);
            res.status(201).json({ id });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async updateWarehouse(req, res) {
        try {
            const { id } = req.params;
            await Warehouse.update(id, req.body);
            res.json({ message: 'Warehouse updated successfully' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async deleteWarehouse(req, res) {
        try {
            const { id } = req.params;
            const warehouse = await Warehouse.findById(id);
            if (!warehouse) {
                return res.status(404).json({ error: 'Warehouse not found' });
            }

            // Business rule: If utilization is >= 90%, block deletion
            if (warehouse.utilization_percent >= 90) {
                return res.status(400).json({ error: 'Cannot delete: warehouse utilization is above 90%' });
            }

            await Warehouse.delete(id);
            res.json({ message: 'Warehouse deleted successfully' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    async deleteWarehouse(req, res) {
        try {
            const { id } = req.params;
            const warehouse = await Warehouse.findById(id);
            if (!warehouse) {
                return res.status(404).json({ error: 'Warehouse not found' });
            }

            // Business rule: If utilization is >= 90%, block deletion
            if (warehouse.utilization_percent >= 90) {
                return res.status(400).json({ error: 'Cannot delete: warehouse utilization is above 90%' });
            }

            await Warehouse.remove(id);
            res.json({ message: 'Warehouse deleted successfully' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = new WarehouseController();

            // İş kuralı: Kapasite %90 üzerindeyse depo silinemez
            if (warehouse.utilization_percent >= 90) {
                return res.status(400).json({ error: 'Depo kapasitesi %90 üzerinde, silinemez' });
            }

            const success = await Warehouse.delete(id);
            if (!success) {
                return res.status(404).json({ error: 'Depo silinemedi' });
            }
            res.status(200).json({ message: 'Depo silindi' });
        } catch (error) {
            res.status(500).json({ error: 'Sunucu hatası' });
        }
    }
}

module.exports = new WarehouseController();