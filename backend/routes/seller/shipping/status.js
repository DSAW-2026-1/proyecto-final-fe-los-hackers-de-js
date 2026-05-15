const express = require('express');
const router = express.Router();
const db = require("../../../dbManager");

const ITEMS_PER_PAGE = 12

router.get('/', async function (req, res) {
    const UID = req.token.payload.UID
    const user = await db.findUserByUID(UID)

    let { page } = req.query
    if(!page) page = 1;
    let pageInt = parseInt(page) || 1
    if(isNaN(pageInt)) pageInt = 1

    if (!user) return res.status(400).json({error: 'User not found'})
    else if(user.isSuspended) return res.status(400).json({error: 'User not found'})
    else {
        const saleIDs = user.saleData
        if(!saleIDs || saleIDs.length === 0) return res.status(404).json({error: 'No sales found'})
        const search = await db.getOrders(saleIDs, (pageInt-1), ITEMS_PER_PAGE)
        const active = await db.countOrders(saleIDs, {status: {$nin: ["Delivered", "Cancelled"]}})
        if(!search) return res.status(404).json({error: 'No sales found'})
        const orders = search.result
        if (!orders || orders.length === 0) {
            if(search.count === 0) return res.status(404).json({error: 'No sales found'})
            else return res.status(400).json({error: 'Result page out of range'})
        }
        else {
            let returnResults = []
            for (let i = 0; i < orders.length; i++) {
                returnResults.push({
                    saleID: orders[i]._id,
                    productID: orders[i].productID,
                    buyerID: orders[i].buyerID,
                    shippingAddress: orders[i].shippingAddress,
                    amount: orders[i].amount,
                    status: orders[i].status,
                })
            }
            return res.json({
                count: search.count,
                active,
                pages: Math.ceil(search.count/ITEMS_PER_PAGE),
                page: pageInt,
                results: Object.assign({}, returnResults)
            })
        }
    }
})

module.exports = router;
