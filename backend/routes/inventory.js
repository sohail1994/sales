const router = require('express').Router();
const ctrl = require('../controllers/inventoryController');
const auth = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');

router.get('/',          auth, roleGuard('admin','manager'), ctrl.getStock);
router.get('/low-stock', auth, roleGuard('admin','manager'), ctrl.getLowStock);
router.get('/value',     auth, roleGuard('admin','manager'), ctrl.getStockValue);
router.post('/adjust',   auth, roleGuard('admin','manager'), ctrl.adjustStock);

module.exports = router;
