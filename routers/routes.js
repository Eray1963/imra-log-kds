
const router = require('express').Router();
const VehicleController = require('../controllers/VehicleController');
const StockController = require('../controllers/StockController');
const WarehouseController = require('../controllers/WarehouseController');

// Vehicle routes
router.get('/vehicles', VehicleController.getAllVehicles);
router.get('/vehicles/:id', VehicleController.getVehicleById);
router.post('/vehicles', VehicleController.createVehicle);
router.put('/vehicles/:id', VehicleController.updateVehicle);
router.delete('/vehicles/:id', VehicleController.deleteVehicle);

// Stock routes
router.get('/stocks', StockController.getAllStocks);
router.get('/stocks/:id', StockController.getStockById);
router.post('/stocks', StockController.createStock);
router.put('/stocks/:id', StockController.updateStock);
router.delete('/stocks/:id', StockController.deleteStock);

// Warehouse routes
router.get('/warehouses', WarehouseController.getAllWarehouses);
router.get('/warehouses/:id', WarehouseController.getWarehouseById);
router.post('/warehouses', WarehouseController.createWarehouse);

module.exports = router;
