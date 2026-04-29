const router = require('express').Router();
const ctrl   = require('../controllers/damageController');
const auth   = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');

router.get('/',        auth, roleGuard('admin','manager'), ctrl.getAll);
router.get('/report',  auth, roleGuard('admin','manager'), ctrl.getReport);
router.get('/:id',     auth, roleGuard('admin','manager'), ctrl.getOne);
router.post('/',       auth, roleGuard('admin','manager'), ctrl.create);
router.delete('/:id',  auth, roleGuard('admin','manager'), ctrl.remove);

module.exports = router;
