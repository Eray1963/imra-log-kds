const Warehouse = require('../models/Warehouse');

class WarehouseController {
    // GET /api/warehouses
    async getAllWarehouses(req, res) {
        try {
            const warehouses = await Warehouse.findAll();
            // Opsiyonel: Doluluk önerisi
            const warehousesWithSuggestion = warehouses.map(wh => {
                const suggestion = wh.currentUsage / wh.capacity > 0.9 ? 'Depo kapasitesi %90\'ın üzerinde. Kapasite artırımı önerilir.' : null;
                return { ...wh, suggestion };
            });
            res.status(200).json(warehousesWithSuggestion);
        } catch (error) {
            res.status(500).json({ error: 'Sunucu hatası' });
        }
    }

    // GET /api/warehouses/:id
    async getWarehouseById(req, res) {
        try {
            const { id } = req.params;
            const warehouse = await Warehouse.findById(id);
            if (!warehouse) {
                return res.status(404).json({ error: 'Depo bulunamadı' });
            }
            const suggestion = warehouse.currentUsage / warehouse.capacity > 0.9 ? 'Depo kapasitesi %90\'ın üzerinde. Kapasite artırımı önerilir.' : null;
            res.status(200).json({ ...warehouse, suggestion });
        } catch (error) {
            res.status(500).json({ error: 'Sunucu hatası' });
        }
    }

    // POST /api/warehouses
    async createWarehouse(req, res) {
        try {
            const warehouseData = req.body;

            // İş kuralı: Kapasitesi dolu depo yeni kayıt alamaz
            // Yeni depo için currentUsage kontrolü, ama yeni olduğu için belki genel kontrol
            // Belki tüm depoların toplam kullanımını kontrol, ama basit tut.
            // Kullanıcı "kapasitesi dolu depo yeni kayıt alamaz" dedi, belki yeni depo eklenirken genel kapasite kontrolü.
            // Ama basit: Yeni depo eklenirken currentUsage > capacity ise hata.
            if (warehouseData.currentUsage > warehouseData.capacity) {
                return res.status(400).json({ error: 'Depo kapasitesi aşılmış, yeni kayıt alınamaz' });
            }

            const id = await Warehouse.create(warehouseData);
            res.status(201).json({ message: 'Depo oluşturuldu', id });
        } catch (error) {
            res.status(500).json({ error: 'Sunucu hatası' });
        }
    }
}

module.exports = new WarehouseController();