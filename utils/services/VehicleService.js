const db = require('../db/mysql_connect');
const Vehicle = require('../models/Vehicle');

// Fallback mock data
let vehicles = [
    new Vehicle(1, '34ABC123', 'available', 1000),
    new Vehicle(2, '34DEF456', 'maintenance', 1500)
];
let nextId = 3;

class VehicleService {
    async _query(sql, params = []) {
        try {
            return await db.query(sql, params);
        } catch (error) {
            console.log('DB error, using mock data:', error.message);
            return null; // Indicate DB failure
        }
    }

    // Get all vehicles
    async getAllVehicles() {
        const result = await this._query('SELECT * FROM vehicles');
        if (result) {
            const [rows] = result;
            return rows.map(row => new Vehicle(row.id, row.plate, row.status, row.capacity));
        }
        return vehicles;
    }

    // Get vehicle by id
    async getVehicleById(id) {
        const result = await this._query('SELECT * FROM vehicles WHERE id = ?', [id]);
        if (result) {
            const [rows] = result;
            if (rows.length === 0) return null;
            const row = rows[0];
            return new Vehicle(row.id, row.plate, row.status, row.capacity);
        }
        return vehicles.find(v => v.id == id) || null;
    }

    // Create vehicle
    async createVehicle(vehicleData) {
        const result = await this._query('INSERT INTO vehicles (plate, status, capacity) VALUES (?, ?, ?)', [vehicleData.plate, vehicleData.status, vehicleData.capacity]);
        if (result) {
            const [res] = result;
            return res.insertId;
        }
        const vehicle = new Vehicle(nextId++, vehicleData.plate, vehicleData.status, vehicleData.capacity);
        vehicles.push(vehicle);
        return vehicle.id;
    }

    // Update vehicle - İş kuralı: Bakımda olan araç güncellenemez
    async updateVehicle(id, vehicleData) {
        const existingVehicle = await this.getVehicleById(id);
        if (!existingVehicle) throw new Error('Vehicle not found');
        if (existingVehicle.status === 'maintenance') throw new Error('Cannot update a vehicle under maintenance');

        const updateResult = await this._query('UPDATE vehicles SET plate = ?, status = ?, capacity = ? WHERE id = ?', [vehicleData.plate, vehicleData.status, vehicleData.capacity, id]);
        if (updateResult) {
            return await this.getVehicleById(id);
        }
        const index = vehicles.findIndex(v => v.id == id);
        vehicles[index] = new Vehicle(id, vehicleData.plate, vehicleData.status, vehicleData.capacity);
        return vehicles[index];
    }

    // Delete vehicle
    async deleteVehicle(id) {
        const existingVehicle = await this.getVehicleById(id);
        if (!existingVehicle) throw new Error('Vehicle not found');
        const deleteResult = await this._query('DELETE FROM vehicles WHERE id = ?', [id]);
        if (deleteResult) {
            return;
        }
        const index = vehicles.findIndex(v => v.id == id);
        vehicles.splice(index, 1);
    }
}

module.exports = new VehicleService();