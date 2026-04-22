const router = require('express').Router();
const ctrl   = require('../controllers/productController');
const auth   = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/',                       auth, ctrl.getAll);
router.get('/barcode/:barcode',       auth, ctrl.getByBarcode);
router.get('/:id',                    auth, ctrl.getOne);
router.get('/:barcode/barcode-image', ctrl.getBarcodeImage);  // public: no auth needed for img
router.post('/',                      auth, upload.single('image'), ctrl.create);
router.put('/:id',                    auth, upload.single('image'), ctrl.update);
router.delete('/:id',                 auth, ctrl.remove);

module.exports = router;
