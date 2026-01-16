const StockService = require('../services/StockService');

class StockController {
    async getAllStocks(req, res) {
        try {
            const stocks = await StockService.getAllStocks();
            res.status(200).json(stocks);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async getStockById(req, res) {
        try {
            const { id } = req.params;
            const stock = await StockService.getStockById(id);
            if (!stock) return res.status(404).json({ error: 'Stock not found' });
            res.status(200).json(stock);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async createStock(req, res) {
        try {
            const stockData = req.body;
            const id = await StockService.createStock(stockData);
            res.status(201).json({ message: 'Stock created', id });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async updateStock(req, res) {
        try {
            const { id } = req.params;
            const stockData = req.body;
            const stock = await StockService.updateStock(id, stockData);
            res.status(200).json(stock);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }

    async deleteStock(req, res) {
        try {
            const { id } = req.params;
            await StockService.deleteStock(id);
            res.status(200).json({ message: 'Stock deleted' });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
}

module.exports = new StockController();