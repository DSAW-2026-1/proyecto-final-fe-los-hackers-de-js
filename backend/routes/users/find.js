const express = require('express');
const router = express.Router();
const db = require("../../dbManager");

router.get('/:id', async function (req, res) {
    const UID = req.params.id
    const user = await db.findUserByUID(UID)

    if (!user) return res.status(404).json({error: 'User not found'})
    else if(user.isSuspended) return res.status(404).json({error: 'User not found'})
    else return res.json({
        username: user.username,
        isSeller: user.isSeller,
        career: user.career || null,
        photo: user.photo || null,
        reputation: user.reputation || null,
        sales: user.sales || 0
    })
});

module.exports = router;
