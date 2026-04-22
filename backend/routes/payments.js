const router = require('express').Router();
const ctrl = require('../controllers/paymentController');
const auth = require('../middleware/auth');

router.get('/',                 auth, ctrl.getAll);
router.get('/reminders',        auth, ctrl.getReminders);
router.post('/reminders',       auth, ctrl.createReminder);
router.put('/reminders/:id',    auth, ctrl.updateReminder);
router.delete('/reminders/:id', auth, ctrl.deleteReminder);

module.exports = router;
