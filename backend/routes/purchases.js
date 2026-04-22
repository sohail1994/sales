const router = require('express').Router();
const ctrl = require('../controllers/purchaseController');
const auth = require('../middleware/auth');

router.get('/',              auth, ctrl.getAll);
router.get('/:id',           auth, ctrl.getOne);
router.post('/',             auth, ctrl.create);
router.post('/:id/payment',  auth, ctrl.addPayment);

module.exports = router;
