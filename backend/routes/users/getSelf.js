const express = require('express');
const router = express.Router();
const db = require("../../dbManager");

//The router inherently requires the use of tokenValidator and userValidator, as otherwise there won't be any UID
router.get('/', async function (req, res) {
    const UID = req.token.payload.UID
    const user = await db.findUserByUID(UID)

    if (!user) return res.status(404).json({error: 'User not found'})
    else if(user.isSuspended) return res.status(404).json({error: 'User not found'})
    else return res.json({
            username: user.username,
            email: user.email,
            isSeller: user.isSeller,
            career: user.career || null,
            photo: user.photo || null,
            reputation: user.reputation || null,
            sales: user.sales || 0
        })
});

module.exports = router;
