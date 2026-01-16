const Warehouse = require('../models/Warehouse');

class WarehouseController {
    async getAllWarehouses(req, res) {
        try {
            const warehouses = await Warehouse.findAll();
            res.status(200).json(warehouses);
        } catch (error) {
            res.status(500).json({ error: 'Sunucu hatası' });
        }
    }

    async getWarehouseById(req, res) {
        try {
            const { id } = req.params;
            const warehouse = await Warehouse.findById(id);
            if (!warehouse) {
                return res.status(404).json({ error: 'Depo bulunamadı' });
            }
            res.status(200).json(warehouse);
        } catch (error) {
            res.status(500).json({ error: 'Sunucu hatası' });
        }
    }

    async createWarehouse(req, res) {
        try {
            const warehouseData = req.body;
            const id = await Warehouse.create(warehouseData);
            res.status(201).json({ message: 'Depo oluşturuldu', id });
        } catch (error) {
            res.status(500).json({ error: 'Sunucu hatası' });
        }
    }

    async updateWarehouse(req, res) {
        try {
            const { id } = req.params;
            const warehouseData = req.body;
            const success = await Warehouse.update(id, warehouseData);
            if (!success) {
                return res.status(404).json({ error: 'Depo güncellenemedi' });
            }
            res.status(200).json({ message: 'Depo güncellendi' });
        } catch (error) {
            res.status(500).json({ error: 'Sunucu hatası' });
        }
    }

    async deleteWarehouse(req, res) {
        try {
            const { id } = req.params;
            const warehouse = await Warehouse.findById(id);
            if (!warehouse) {
                return res.status(404).json({ error: 'Depo bulunamadı' });
            }

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