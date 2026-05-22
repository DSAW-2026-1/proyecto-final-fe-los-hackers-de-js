// Minimal token validator stub for local development.
// Decodes JWT payload without verifying signature and attaches it to `req.token.payload`.

module.exports = function tokenValidator(req, res, next) {
  try {
    const authHeader = req.headers['authorization'] || req.headers['Authorization'] || '';
    let token = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (token) {
      const parts = token.split('.');
      if (parts.length >= 2) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
        req.token = { payload };
        return next();
      }
    }
  } catch (e) {
    // ignore parse errors — leave empty payload
  }

  req.token = { payload: {} };
  next();
};
