const db = require("../../dbManager")

//This middleware HAS to be run after tokenValidator, otherwise req won't have the required info.
module.exports = async function (req, res, next) {
    const {UID} = req.token.payload
    const user = await db.findUserByUID(UID)
    if(!user) return res.status(400).json({error: "Invalid JWT token"});
    if (user.isSuspended) return res.status(403).json({error: 'User is suspended'});
    next()
}