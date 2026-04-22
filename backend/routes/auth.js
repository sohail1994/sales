const router = require('express').Router();
const ctrl = require('../controllers/authController');
const auth = require('../middleware/auth');

router.post('/login', ctrl.login);
router.get('/profile', auth, ctrl.profile);
router.put('/change-password', auth, ctrl.changePassword);
router.get('/users', auth, ctrl.getUsers);
router.post('/users', auth, ctrl.createUser);
router.put('/users/:id', auth, ctrl.updateUser);

module.exports = router;
