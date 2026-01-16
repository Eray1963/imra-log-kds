const db = require('../db/mysql_connect');
const Stock = require('../models/Stock');

// Fallback mock data
let stocks = [
    new Stock(1, 'Motor Yağı', 50, 10),
    new Stock(2, 'Fren Balatası', 5, 20)
];
let nextId = 3;

class StockService {
    async _query(sql, params = []) {
        try {
            return await db.query(sql, params);
        } catch (error) {
            console.log('DB error, using mock data:', error.message);
            return null;
        }
    }

    // Get all stocks
    async getAllStocks() {
        const result = await this._query('SELECT * FROM stocks');
        if (result) {
            const [rows] = result;
            return rows.map(row => new Stock(row.id, row.name, row.quantity, row.minimumLevel));
        }
        return stocks;
    }

    // Get stock by id
    async getStockById(id) {
        const result = await this._query('SELECT * FROM stocks WHERE id = ?', [id]);
        if (result) {
            const [rows] = result;
            if (rows.length === 0) return null;
            const row = rows[0];
            return new Stock(row.id, row.name, row.quantity, row.minimumLevel);
        }
        return stocks.find(s => s.id == id) || null;
    }

    // Create stock
    async createStock(stockData) {
        const result = await this._query('INSERT INTO stocks (name, quantity, minimumLevel) VALUES (?, ?, ?)', [stockData.name, stockData.quantity, stockData.minimumLevel]);
        if (result) {
            const [res] = result;
            return res.insertId;
        }
        const stock = new Stock(nextId++, stockData.name, stockData.quantity, stockData.minimumLevel);
        stocks.push(stock);
        return stock.id;
    }

    // Update stock - İş kuralı: Stok miktarı minimum seviyenin altındaysa güncellenemez
    async updateStock(id, stockData) {
        const existingStock = await this.getStockById(id);
        if (!existingStock) throw new Error('Stock not found');
        if (stockData.quantity < existingStock.minimumLevel) throw new Error('Cannot update stock below minimum level');

        const updateResult = await this._query('UPDATE stocks SET name = ?, quantity = ?, minimumLevel = ? WHERE id = ?', [stockData.name, stockData.quantity, stockData.minimumLevel, id]);
        if (updateResult) {
            return await this.getStockById(id);
        }
        const index = stocks.findIndex(s => s.id == id);
        stocks[index] = new Stock(id, stockData.name, stockData.quantity, stockData.minimumLevel);
        return stocks[index];
    }

    // Delete stock
    async deleteStock(id) {
        const existingStock = await this.getStockById(id);
        if (!existingStock) throw new Error('Stock not found');
        const deleteResult = await this._query('DELETE FROM stocks WHERE id = ?', [id]);
        if (deleteResult) {
            return;
        }
        const index = stocks.findIndex(s => s.id == id);
        stocks.splice(index, 1);
    }
}

module.exports = new StockService();