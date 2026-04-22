const router = require('express').Router();
const ctrl = require('../controllers/reportController');
const auth = require('../middleware/auth');

router.get('/dashboard',   auth, ctrl.getDashboard);
router.get('/sales',       auth, ctrl.getSalesReport);
router.get('/purchases',   auth, ctrl.getPurchaseReport);
router.get('/profit-loss', auth, ctrl.getProfitLoss);
router.get('/inventory',   auth, ctrl.getInventoryReport);
router.get('/customer-due',auth, ctrl.getCustomerDue);

module.exports = router;
