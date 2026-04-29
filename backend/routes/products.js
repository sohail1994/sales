const router = require('express').Router();
const ctrl      = require('../controllers/productController');
const suCtrl    = require('../controllers/saleUnitController');
const auth      = require('../middleware/auth');
const upload    = require('../middleware/upload');
const roleGuard = require('../middleware/roleGuard');

router.get('/',                       auth, ctrl.getAll);
router.get('/barcode/:barcode',       auth, ctrl.getByBarcode);
router.get('/:id',                    auth, ctrl.getOne);
router.get('/:barcode/barcode-image', ctrl.getBarcodeImage);
// Admin + Manager only
router.post('/',     auth, roleGuard('admin','manager'), upload.single('image'), ctrl.create);
router.put('/:id',   auth, roleGuard('admin','manager'), upload.single('image'), ctrl.update);
router.delete('/:id',auth, roleGuard('admin','manager'), ctrl.remove);

// Sale Units sub-routes  GET/POST /products/:productId/sale-units
router.get('/:productId/sale-units',        auth, suCtrl.getByProduct);
router.post('/:productId/sale-units',       auth, roleGuard('admin','manager'), suCtrl.create);
router.put('/:productId/sale-units/:id',    auth, roleGuard('admin','manager'), suCtrl.update);
router.delete('/:productId/sale-units/:id', auth, roleGuard('admin','manager'), suCtrl.remove);

module.exports = router;
