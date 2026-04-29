const router = require('express').Router();
const ctrl = require('../controllers/reportController');
const auth = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');

router.get('/dashboard',     auth, ctrl.getDashboard);  // all roles (filtered by role in controller)
router.get('/sales',         auth, roleGuard('admin','manager'), ctrl.getSalesReport);
router.get('/purchases',     auth, roleGuard('admin','manager'), ctrl.getPurchaseReport);
router.get('/profit-loss',   auth, roleGuard('admin','manager'), ctrl.getProfitLoss);
router.get('/inventory',     auth, roleGuard('admin','manager'), ctrl.getInventoryReport);
router.get('/customer-due',  auth, roleGuard('admin','manager'), ctrl.getCustomerDue);
router.get('/batch-stock',   auth, roleGuard('admin','manager'), ctrl.getBatchReport);
router.get('/purchase-bill', auth, roleGuard('admin','manager'), ctrl.getPurchaseBillReport);

module.exports = router;
