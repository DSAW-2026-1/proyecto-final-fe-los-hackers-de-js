const db = require("../../dbManager");

module.exports = async function (req, res, next) {
    const {UID} = req.token.payload
    const user = await db.findUserByUID(UID)
    if(!user) return res.status(400).json({error: "Invalid JWT token"});
    if (user.isSuspended) return res.status(403).json({error: 'User is suspended'});
    if (!user.isSeller) return res.status(403).json({error: 'You are not allowed to do this'});
    next()
};