const VehicleService = require('../services/VehicleService');

class VehicleController {
    async getAllVehicles(req, res) {
        try {
            const vehicles = await VehicleService.getAllVehicles();
            res.status(200).json(vehicles);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async getVehicleById(req, res) {
        try {
            const { id } = req.params;
            const vehicle = await VehicleService.getVehicleById(id);
            if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });
            res.status(200).json(vehicle);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async createVehicle(req, res) {
        try {
            const vehicleData = req.body;
            const id = await VehicleService.createVehicle(vehicleData);
            res.status(201).json({ message: 'Vehicle created', id });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async updateVehicle(req, res) {
        try {
            const { id } = req.params;
            const vehicleData = req.body;
            const vehicle = await VehicleService.updateVehicle(id, vehicleData);
            res.status(200).json(vehicle);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }

    async deleteVehicle(req, res) {
        try {
            const { id } = req.params;
            await VehicleService.deleteVehicle(id);
            res.status(200).json({ message: 'Vehicle deleted' });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
}

module.exports = new VehicleController();