const router = require('express').Router();
const ctrl = require('../controllers/saleController');
const auth = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');

router.get('/',                auth, ctrl.getAll);
router.get('/:id',             auth, ctrl.getOne);
router.get('/:id/invoice-pdf', auth, ctrl.getInvoicePDF);
router.post('/',               auth, ctrl.create);
router.post('/:id/payment',    auth, ctrl.addPayment);
// Cancel requires manager or admin approval
router.put('/:id/cancel',      auth, roleGuard('admin','manager'), ctrl.cancelSale);

module.exports = router;
