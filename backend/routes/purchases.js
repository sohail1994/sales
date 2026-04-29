const router = require('express').Router();
const ctrl = require('../controllers/purchaseController');
const auth = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');

router.get('/',             auth, roleGuard('admin','manager'), ctrl.getAll);
router.get('/:id',          auth, roleGuard('admin','manager'), ctrl.getOne);
router.post('/',            auth, roleGuard('admin','manager'), ctrl.create);
router.post('/:id/payment', auth, roleGuard('admin','manager'), ctrl.addPayment);

module.exports = router;
