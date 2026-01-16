const SparePart = require('../models/SparePart');

class SparePartController {
    async getAllSpareParts(req, res) {
        try {
            const spareParts = await SparePart.findAll();
            res.status(200).json(spareParts);
        } catch (error) {
            res.status(500).json({ error: 'Sunucu hatası' });
        }
    }

    async getSparePartById(req, res) {
        try {
            const { id } = req.params;
            const sparePart = await SparePart.findById(id);
            if (!sparePart) {
                return res.status(404).json({ error: 'Yedek parça bulunamadı' });
            }
            res.status(200).json(sparePart);
        } catch (error) {
            res.status(500).json({ error: 'Sunucu hatası' });
        }
    }

    async createSparePart(req, res) {
        try {
            const sparePartData = req.body;
            const id = await SparePart.create(sparePartData);
            res.status(201).json({ message: 'Yedek parça oluşturuldu', id });
        } catch (error) {
            res.status(500).json({ error: 'Sunucu hatası' });
        }
    }

    async updateSparePart(req, res) {
        try {
            const { id } = req.params;
            const sparePartData = req.body;

            // İş kuralı: Yedek parça stok seviyesi minimumun altındaysa sipariş oluşturulamaz
            const existingSparePart = await SparePart.findById(id);
            if (!existingSparePart) {
                return res.status(404).json({ error: 'Yedek parça bulunamadı' });
            }
            if (sparePartData.stock < existingSparePart.min_stock) {
                return res.status(400).json({ error: 'Stok seviyesi minimumun altında, sipariş oluşturulamaz' });
            }

            const success = await SparePart.update(id, sparePartData);
            if (!success) {
                return res.status(404).json({ error: 'Yedek parça güncellenemedi' });
            }
            res.status(200).json({ message: 'Yedek parça güncellendi' });
        } catch (error) {
            res.status(500).json({ error: 'Sunucu hatası' });
        }
    }

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