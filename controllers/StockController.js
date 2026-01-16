const Stock = require('../models/Stock');

class StockController {
    // GET /api/stocks
    async getAllStocks(req, res) {
        try {
            const stocks = await Stock.findAll();
            res.status(200).json(stocks);
        } catch (error) {
            res.status(500).json({ error: 'Sunucu hatası' });
        }
    }

    // GET /api/stocks/:id
    async getStockById(req, res) {
        try {
            const { id } = req.params;
            const stock = await Stock.findById(id);
            if (!stock) {
                return res.status(404).json({ error: 'Stok bulunamadı' });
            }
            res.status(200).json(stock);
        } catch (error) {
            res.status(500).json({ error: 'Sunucu hatası' });
        }
    }

    // POST /api/stocks
    async createStock(req, res) {
        try {
            const stockData = req.body;
            const id = await Stock.create(stockData);
            res.status(201).json({ message: 'Stok oluşturuldu', id });
        } catch (error) {
            res.status(500).json({ error: 'Sunucu hatası' });
        }
    }

    // PUT /api/stocks/:id
    async updateStock(req, res) {
        try {
            const { id } = req.params;
            const stockData = req.body;

            // İş kuralı: Yedek parça stok miktarı minimum seviyenin altındaysa sevkiyat veya sipariş oluşturulamaz
            const existingStock = await Stock.findById(id);
            if (!existingStock) {
                return res.status(404).json({ error: 'Stok bulunamadı' });
            }
            if (stockData.quantity < existingStock.minimumLevel) {
                return res.status(400).json({ error: 'Stok miktarı minimum seviyenin altına düşürülemez' });
            }

            const success = await Stock.update(id, stockData);
            if (!success) {
                return res.status(404).json({ error: 'Stok güncellenemedi' });
            }
            res.status(200).json({ message: 'Stok güncellendi' });
        } catch (error) {
            res.status(500).json({ error: 'Sunucu hatası' });
        }
    }

    // DELETE /api/stocks/:id
    async deleteStock(req, res) {
        try {
            const { id } = req.params;
            const success = await Stock.delete(id);
            if (!success) {
                return res.status(404).json({ error: 'Stok bulunamadı' });
            }
            res.status(200).json({ message: 'Stok silindi' });
        } catch (error) {
            res.status(500).json({ error: 'Sunucu hatası' });
        }
    }
}

module.exports = new StockController();