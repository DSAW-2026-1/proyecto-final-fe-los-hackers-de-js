const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';
const jwt = require('jsonwebtoken');

module.exports = function (req, res, next){
    const authHeader = req.headers.authorization || '';
    const token = (authHeader.startsWith('Bearer ') && authHeader.split(' ')[1]) || req.query.token;

    if (!token) return res.status(400).json({error: "No JWT token provided"});
    try {
        const payload = jwt.verify(token, JWT_SECRET)
        if (!payload) return res.status(400).json({error: "Invalid JWT token"});

        req.token = {
            raw: token,
            payload: payload
        };

        next()
    }
    catch (e){
        return res.status(400).json({error: "Invalid JWT token"});
    }
}