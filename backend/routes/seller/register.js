const express = require('express');
const router = express.Router();
const db = require("../../dbManager");
const jwt = require("jsonwebtoken");
const tokenValidatorMiddleware = require("../../middleware/auth/tokenValidator");
const userAuthMiddleware = require("../../middleware/auth/userValidator");
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';

router.use('/', tokenValidatorMiddleware);
router.use('/', userAuthMiddleware);
//The router inherently requires the use of tokenValidator and userValidator, as otherwise there won't be any UID
router.patch('/', async function (req, res) {
    const UID = req.token.payload.UID
    const user = await db.findUserByUID(UID)

    if (!user) return res.status(404).json({error: 'User not found'})
    if(user.isSuspended) return res.status(404).json({error: 'User not found'})
    if(user.isSeller) return res.status(409).json({error: 'User is already a seller'})
    else {
        let success = await db.updateUser(UID, {isSeller: true})
        if(success) {
            const payload = {UID: user._id, isSeller: true};
            const token = jwt.sign(payload, JWT_SECRET, {expiresIn: '1h'});
            return res.json({token});
        }
        else return res.status(500).json({error: 'Failed to update user'})
    }
});

module.exports = router;