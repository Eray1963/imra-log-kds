const express = require('express');
const router = express.Router();
const stockController = require('../controllers/StockController');

router.get('/stocks', stockController.getAllStocks);
router.get('/stocks/:id', stockController.getStockById);
router.post('/stocks', stockController.createStock);
router.put('/stocks/:id', stockController.updateStock);
router.put('/stocks/:id/reduce', stockController.reduceStock);
router.delete('/stocks/:id', stockController.deleteStock);

module.exports = router;