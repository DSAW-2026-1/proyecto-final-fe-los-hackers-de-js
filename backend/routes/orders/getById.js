const express = require('express');
const router = express.Router();
const db = require('../../dbManager');

router.get('/:saleID', async function (req, res) {
    const UID = req.token.payload.UID
    const { saleID } = req.params

    const sale = await db.findOrderByID(saleID)
    if(!sale) return res.status(404).json({error: 'No sale matching this saleID found'})

    if(String(sale.buyerID) !== String(UID) && String(sale.sellerID) !== String(UID))
        return res.status(403).json({error: 'You are not allowed to do this'})

    return res.json({
        saleID: sale._id,
        productID: sale.productID,
        sellerID: sale.sellerID,
        buyerID: sale.buyerID,
        shippingAddress: sale.shippingAddress,
        amount: sale.amount,
        status: sale.status
    })
})

module.exports = router;
