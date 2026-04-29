/**
 * roleGuard(...roles)
 * Usage: router.post('/', auth, roleGuard('admin','manager'), ctrl.create)
 * Must always be placed AFTER the auth middleware so req.user is set.
 */
module.exports = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      message: `Access denied. Required role: ${roles.join(' or ')}.`
    });
  }
  next();
};
