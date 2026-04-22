const router = require('express').Router();
const ctrl = require('../controllers/inventoryController');
const auth = require('../middleware/auth');

router.get('/',           auth, ctrl.getStock);
router.get('/low-stock',  auth, ctrl.getLowStock);
router.get('/value',      auth, ctrl.getStockValue);
router.post('/adjust',    auth, ctrl.adjustStock);

module.exports = router;
