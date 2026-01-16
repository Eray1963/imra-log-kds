const Vehicle = require('../models/Vehicle');

class VehicleController {
    async getAllVehicles(req, res) {
        try {
            const vehicles = await Vehicle.findAll();
            res.status(200).json(vehicles);
        } catch (error) {
            res.status(500).json({ error: 'Sunucu hatası' });
        }
    }

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

    async createVehicle(req, res) {
        try {
            const vehicleData = req.body;
            const id = await Vehicle.create(vehicleData);
            res.status(201).json({ message: 'Araç oluşturuldu', id });
        } catch (error) {
            res.status(500).json({ error: 'Sunucu hatası' });
        }
    }

    async updateVehicle(req, res) {
        try {
            const { id } = req.params;
            const vehicleData = req.body;
            const success = await Vehicle.update(id, vehicleData);
            if (!success) {
                return res.status(404).json({ error: 'Araç güncellenemedi' });
            }
            res.status(200).json({ message: 'Araç güncellendi' });
        } catch (error) {
            res.status(500).json({ error: 'Sunucu hatası' });
        }
    }

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
}

module.exports = new VehicleController();