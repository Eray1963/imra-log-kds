const express = require('express');
const router = express.Router();
const sparePartController = require('../controllers/sparePartController');

router.get('/spare-parts', sparePartController.getAllSpareParts);
router.get('/spare-parts/:id', sparePartController.getSparePartById);
router.post('/spare-parts', sparePartController.createSparePart);
router.put('/spare-parts/:id', sparePartController.updateSparePart);
router.delete('/spare-parts/:id', sparePartController.deleteSparePart);

module.exports = router;