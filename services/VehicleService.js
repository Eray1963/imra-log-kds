// const db = require('../db/mysql_connect');
const Vehicle = require('../models/Vehicle');

// Mock data
let vehicles = [
    new Vehicle(1, '34ABC123', 'available', 1000),
    new Vehicle(2, '34DEF456', 'maintenance', 1500)
];
let nextId = 3;

class VehicleService {
    // Get all vehicles
    async getAllVehicles() {
        return vehicles;
    }

    // Get vehicle by id
    async getVehicleById(id) {
        return vehicles.find(v => v.id == id) || null;
    }

    // Create vehicle
    async createVehicle(vehicleData) {
        const { plate, status, capacity } = vehicleData;
        const vehicle = new Vehicle(nextId++, plate, status, capacity);
        vehicles.push(vehicle);
        return vehicle.id;
    }

    // Update vehicle - İş kuralı: Bakımda olan araç güncellenemez
    async updateVehicle(id, vehicleData) {
        const index = vehicles.findIndex(v => v.id == id);
        if (index === -1) throw new Error('Vehicle not found');
        if (vehicles[index].status === 'maintenance') throw new Error('Cannot update a vehicle under maintenance');

        const { plate, status, capacity } = vehicleData;
        vehicles[index] = new Vehicle(id, plate, status, capacity);
        return vehicles[index];
    }

    // Delete vehicle
    async deleteVehicle(id) {
        const index = vehicles.findIndex(v => v.id == id);
        if (index === -1) throw new Error('Vehicle not found');
        vehicles.splice(index, 1);
    }
}

module.exports = new VehicleService();