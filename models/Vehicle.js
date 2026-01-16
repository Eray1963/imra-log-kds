class Vehicle {
    constructor(id, plate, status, capacity) {
        this.id = id;
        this.plate = plate;
        this.status = status; // 'available' or 'maintenance'
        this.capacity = capacity;
    }
}

module.exports = Vehicle;