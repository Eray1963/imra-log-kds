const Vehicle = require('../models/Vehicle');

class VehicleController {
    async getAllVehicles(req, res) {
        try {
            const vehicles = await Vehicle.findAll();
            res.json(vehicles);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async getVehicleById(req, res) {
        try {
            const { id } = req.params;
            const vehicle = await Vehicle.findById(id);
            if (!vehicle) {
                return res.status(404).json({ error: 'Vehicle not found' });
            }
            res.json(vehicle);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async createVehicle(req, res) {
        try {
            const id = await Vehicle.create(req.body);
            res.status(201).json({ id });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async updateVehicle(req, res) {
        try {
            const { id } = req.params;
            await Vehicle.update(id, req.body);
            res.json({ message: 'Vehicle updated successfully' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async deleteVehicle(req, res) {
        try {
            const { id } = req.params;
            await Vehicle.remove(id);
            res.json({ message: 'Vehicle deleted successfully' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = new VehicleController();