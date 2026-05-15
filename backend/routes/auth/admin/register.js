const jwt = require('jsonwebtoken');
const db = require("../../../dbManager")
const bcrypt = require('bcrypt')

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';
const saltRounds = process.env.BCRYPT_SALT_ROUNDS || 10;
//Helper file for creating admins. Not actually a router but left here for convenience.
module.exports = async function (username, password) {
    if (!username || !password) return "All fields are required"

    //Check that our new user doesn't use the same username or email as someone else
    const existingUser = await db.findAdmin({username: username})
    if (existingUser) return "User already exists"

    const hashedPassword = await bcrypt.hash(password, saltRounds)

    const user = {
        username: username,
        password: hashedPassword,
        role : "admin",
        permissions : ["all"]
    }

    await db.addAdmin(user)

    const payload = {UID: user._id, role: user.role, permissions: user.permissions};
    return jwt.sign(payload, JWT_SECRET, {expiresIn: '1h'});
}