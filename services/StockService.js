// const db = require('../db/mysql_connect');
const Stock = require('../models/Stock');

// Mock data
let stocks = [
    new Stock(1, 'Motor Yağı', 50, 10),
    new Stock(2, 'Fren Balatası', 5, 20)
];
let nextId = 3;

class StockService {
    // Get all stocks
    async getAllStocks() {
        return stocks;
    }

    // Get stock by id
    async getStockById(id) {
        return stocks.find(s => s.id == id) || null;
    }

    // Create stock
    async createStock(stockData) {
        const { name, quantity, minimumLevel } = stockData;
        const stock = new Stock(nextId++, name, quantity, minimumLevel);
        stocks.push(stock);
        return stock.id;
    }

    // Update stock - İş kuralı: Stok miktarı minimum seviyenin altındaysa güncellenemez
    async updateStock(id, stockData) {
        const index = stocks.findIndex(s => s.id == id);
        if (index === -1) throw new Error('Stock not found');
        const { name, quantity, minimumLevel } = stockData;
        if (quantity < stocks[index].minimumLevel) throw new Error('Cannot update stock below minimum level');

        stocks[index] = new Stock(id, name, quantity, minimumLevel);
        return stocks[index];
    }

    // Delete stock
    async deleteStock(id) {
        const index = stocks.findIndex(s => s.id == id);
        if (index === -1) throw new Error('Stock not found');
        stocks.splice(index, 1);
    }
}

module.exports = new StockService();