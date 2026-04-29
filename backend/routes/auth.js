const router = require('express').Router();
const ctrl = require('../controllers/authController');
const auth = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');

router.post('/login', ctrl.login);
router.get('/profile', auth, ctrl.profile);
router.put('/change-password', auth, ctrl.changePassword);
// Admin only — user management
router.get('/users',       auth, roleGuard('admin'), ctrl.getUsers);
router.post('/users',      auth, roleGuard('admin'), ctrl.createUser);
router.put('/users/:id',   auth, roleGuard('admin'), ctrl.updateUser);

module.exports = router;
