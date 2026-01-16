const SparePart = require('../models/SparePart');

class SparePartController {
    async getAllSpareParts(req, res) {
        try {
            const spareParts = await SparePart.findAll();
            res.json(spareParts);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async getSparePartById(req, res) {
        try {
            const { id } = req.params;
            const sparePart = await SparePart.findById(id);
            if (!sparePart) {
                return res.status(404).json({ error: 'Spare part not found' });
            }
            res.json(sparePart);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async createSparePart(req, res) {
        try {
            const id = await SparePart.create(req.body);
            res.status(201).json({ id });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async updateSparePart(req, res) {
        try {
            const { id } = req.params;
            const existingPart = await SparePart.findById(id);
            if (!existingPart) {
                return res.status(404).json({ error: 'Spare part not found' });
            }

            // Business rule: If quantity is below min_stock, block update
            if (req.body.quantity < existingPart.min_stock) {
                return res.status(400).json({ error: 'Cannot update: quantity is below minimum stock level' });
            }

            await SparePart.update(id, req.body);
            res.json({ message: 'Spare part updated successfully' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async deleteSparePart(req, res) {
        try {
            const { id } = req.params;
            await SparePart.delete(id);
            res.json({ message: 'Spare part deleted successfully' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    async deleteSparePart(req, res) {
        try {
            const { id } = req.params;
            await SparePart.remove(id);
            res.json({ message: 'Spare part deleted successfully' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = new SparePartController();

    async deleteSparePart(req, res) {
        try {
            const { id } = req.params;
            const success = await SparePart.delete(id);
            if (!success) {
                return res.status(404).json({ error: 'Yedek parça bulunamadı' });
            }
            res.status(200).json({ message: 'Yedek parça silindi' });
        } catch (error) {
            res.status(500).json({ error: 'Sunucu hatası' });
        }
    }
}

module.exports = new SparePartController();