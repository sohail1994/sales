const router = require('express').Router();
const ctrl   = require('../controllers/customerController');
const auth   = require('../middleware/auth');
const upload = require('../middleware/upload');
const roleGuard = require('../middleware/roleGuard');

router.get('/',           auth, ctrl.getAll);
router.get('/:id',        auth, ctrl.getOne);
router.get('/:id/ledger', auth, ctrl.getLedger);
router.post('/',          auth, upload.single('image'), ctrl.create);
router.put('/:id',        auth, upload.single('image'), ctrl.update);
router.delete('/:id',     auth, roleGuard('admin','manager'), ctrl.remove);

module.exports = router;
