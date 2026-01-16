const express = require('express');
const router = express.Router();
const vehicleController = require('../controllers/VehicleController');

router.get('/vehicles', vehicleController.getAllVehicles);
router.get('/vehicles/:id', vehicleController.getVehicleById);
router.post('/vehicles', vehicleController.createVehicle);
router.post('/vehicles/:id/load-stock', vehicleController.loadStock);
router.put('/vehicles/:id', vehicleController.updateVehicle);
router.delete('/vehicles/:id', vehicleController.deleteVehicle);

module.exports = router;