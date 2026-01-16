const express = require('express');
const router = express.Router();
const warehouseController = require('../controllers/WarehouseController');

router.get('/warehouses', warehouseController.getAllWarehouses);
router.get('/warehouses/:id', warehouseController.getWarehouseById);
router.post('/warehouses', warehouseController.createWarehouse);

module.exports = router;