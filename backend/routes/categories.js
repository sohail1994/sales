const router = require('express').Router();
const ctrl = require('../controllers/categoryController');
const auth = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');

router.get('/',       auth, ctrl.getAll);
router.post('/',      auth, roleGuard('admin','manager'), ctrl.create);
router.put('/:id',    auth, roleGuard('admin','manager'), ctrl.update);
router.delete('/:id', auth, roleGuard('admin','manager'), ctrl.remove);

module.exports = router;
