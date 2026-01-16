const Vehicle = require('../models/Vehicle');

class VehicleController {
    // GET /api/vehicles
    async getAllVehicles(req, res) {
        try {
            const vehicles = await Vehicle.findAll();
            res.status(200).json(vehicles);
        } catch (error) {
            res.status(500).json({ error: 'Sunucu hatası' });
        }
    }

    // GET /api/vehicles/:id
    async getVehicleById(req, res) {
        try {
            const { id } = req.params;
            const vehicle = await Vehicle.findById(id);
            if (!vehicle) {
                return res.status(404).json({ error: 'Araç bulunamadı' });
            }
            res.status(200).json(vehicle);
        } catch (error) {
            res.status(500).json({ error: 'Sunucu hatası' });
        }
    }

    // POST /api/vehicles
    async createVehicle(req, res) {
        try {
            const vehicleData = req.body;
            const id = await Vehicle.create(vehicleData);
            res.status(201).json({ message: 'Araç oluşturuldu', id });
        } catch (error) {
            res.status(500).json({ error: 'Sunucu hatası' });
        }
    }

    // PUT /api/vehicles/:id
    async updateVehicle(req, res) {
        try {
            const { id } = req.params;
            const vehicleData = req.body;

            // İş kuralı: Bakımda olan araç görevlendirilemez / güncellenemez
            const existingVehicle = await Vehicle.findById(id);
            if (!existingVehicle) {
                return res.status(404).json({ error: 'Araç bulunamadı' });
            }
            if (existingVehicle.status === 'maintenance') {
                return res.status(400).json({ error: 'Bakımda olan araç güncellenemez' });
            }

            const success = await Vehicle.update(id, vehicleData);
            if (!success) {
                return res.status(404).json({ error: 'Araç güncellenemedi' });
            }
            res.status(200).json({ message: 'Araç güncellendi' });
        } catch (error) {
            res.status(500).json({ error: 'Sunucu hatası' });
        }
    }

    // DELETE /api/vehicles/:id
    async deleteVehicle(req, res) {
        try {
            const { id } = req.params;
            const success = await Vehicle.delete(id);
            if (!success) {
                return res.status(404).json({ error: 'Araç bulunamadı' });
            }
            res.status(200).json({ message: 'Araç silindi' });
        } catch (error) {
            res.status(500).json({ error: 'Sunucu hatası' });
        }
    }

    // POST /api/vehicles/:id/load-stock
    async loadStock(req, res) {
        try {
            const { id } = req.params;
            const { stockId, quantity } = req.body;

            const result = await Vehicle.loadStock(id, stockId, quantity);
            res.status(200).json(result);
        } catch (error) {
            if (error.message === 'Araç bulunamadı' || error.message === 'Stok bulunamadı') {
                return res.status(404).json({ error: error.message });
            }
            if (error.message === 'Araç kapasitesi yetersiz' || error.message === 'Yetersiz stok miktarı') {
                return res.status(400).json({ error: error.message });
            }
            res.status(500).json({ error: 'Sunucu hatası' });
        }
    }
}

module.exports = new VehicleController();