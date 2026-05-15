const db = require("../../dbManager")

//This middleware HAS to be run after tokenValidator, otherwise req won't have the required info.
module.exports = async function (req, res, next) {
    const {UID} = req.token.payload
    const admin = await db.findAdminByUID(UID)
    if(!admin) {
        //Logic for checking if our token is actually for a regular user for the error msg
        const user = await db.findUserByUID(UID)
        if(user) {
            const msg = "User tried to escalate privileges to the admin dashboard using their JWT token."
            console.log("WARN: "+msg+" (UID: "+ user._id+")")
            await db.log("WARN", "AdminValidator", msg, {
                UID: user._id,
                username: user.username,
                email: user.email
            })
            return res.status(403).json({error: "Attempted to use user JWT token for admin access. This incident will be recorded"});
        }
        else return res.status(400).json({error: "Invalid JWT token"});
    }
    else next()
}