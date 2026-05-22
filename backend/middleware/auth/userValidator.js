// Minimal user validator stub for local development.
// This placeholder preserves the middleware interface and lets requests pass through.

module.exports = function userValidator(req, res, next) {
  // Real implementation may fetch user info from DB and attach to req.user
  return next();
};
