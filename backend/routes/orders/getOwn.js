const express = require('express');
const router = express.Router();
const db = require("../../dbManager");
const ITEMS_PER_PAGE = 12

//The router inherently requires the use of tokenValidator and userValidator, as otherwise there won't be any UID
router.get('/', async function (req, res) {
    const UID = req.token.payload.UID
    const user = await db.findUserByUID(UID)

    let { page } = req.query
    if(!page) page = 1;
    let pageInt = parseInt(page) || 1
    if(isNaN(pageInt)) pageInt = 1

    if (!user) return res.status(404).json({error: 'User not found'})
    else if(user.isSuspended) return res.status(404).json({error: 'User not found'})
    else {
        const orderIDs = user.orders
        if(!orderIDs) return res.status(404).json({error: 'No purchases found'})
        const search = await db.getOrders(orderIDs, (pageInt-1), ITEMS_PER_PAGE)
        if(!search) return res.status(404).json({error: 'No purchases found'})
        const orders = search.result
        if (!orders || orders.length === 0) {
            if(search.count === 0)return res.status(404).json({error: 'No results found. Try broader search terms.'})
            else return res.status(400).json({error: 'Result page out of range.'})
        }
        else {
            let returnOrders = []
            for (let i = 0; i < orders.length; i++) {
                returnOrders.push({
                    saleID: orders[i]._id,
                    productID: orders[i].productID,
                    //category: products[i].category,
                    //condition: products[i].condition,
                    sellerID: orders[i].sellerID,
                    //description: products[i].description,
                    shippingAddress: orders[i].shippingAddress,
                    amount: orders[i].amount,
                    status: orders[i].status,
                    //sellerID: products[i].sellerID,

                })
            }
            return res.json({
                count: search.count,
                pages: Math.ceil(search.count/ITEMS_PER_PAGE),
                page: pageInt,
                results: Object.assign({}, returnOrders)
            })
        }
    }
})

module.exports = router;
