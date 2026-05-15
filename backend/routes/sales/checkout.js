const express = require('express');
const router = express.Router();
const db = require("../../dbManager")
const notifications = require("../../services/notifications");
router.post('/', async(req, res) => {
    const UID = req.token.payload.UID
    const errorMsg = "Incomplete or malformed request"
    const {products, shippingAddress} = req.body || {};

    if (!products || !shippingAddress) return res.status(400).json({error: errorMsg});
    const buyer = await db.findUserByUID(UID)
    if(!buyer) return res.status(400).json({error: "User not found"})
    //Validate everything first
    const validated = []
    const productArray = Object.values(products)
    for (let i = 0; i < productArray.length; i++) {
        let productAmount = (typeof productArray[i].amount === "string")? parseInt(productArray[i].amount) : (typeof productArray[i].amount === "number")? Math.round(productArray[i].amount) : (typeof productArray[i].amount === "bigint")? productArray[i].amount : null
        if(!productArray[i].productID || !productAmount || productAmount <= 0) return res.status(400).json({error: errorMsg});
        let product = await db.findProductByID(productArray[i].productID)
        if(!product) return res.status(404).json({error: "Product "+productArray[i].productID+" not found"});
        if(product.sellerID === UID) return res.status(400).json({error: "You cannot buy your own products"});
        if(product.stock < productAmount) return res.status(400).json({error: "Not enough stock for buying "+productArray[i].productID});
        validated.push({
            productID: product._id,
            product,
            amount: productAmount
        })
    }
    //If everything is valid then start processing each request
    for (let i = 0; i < validated.length; i++) {
        const order = {
            productID: validated[i].productID,
            sellerID: validated[i].product.sellerID,
            buyerID: UID,
            shippingAddress: shippingAddress,
            amount: validated[i].amount,
            status: "Pending",
        }
        let success = await db.addOrder(order)
        if(success) {
            await db.updateProduct(validated[i].productID, {stock: (validated[i].product.stock - validated[i].amount)})
            try{
                //Create notification for seller
                await notifications.createNotification({
                    userID: validated[i].product.sellerID,
                    type: "purchase",
                    title: "Nueva venta",
                    message: buyer.username + " compró "+validated[i].amount+" de tu \"" + validated[i].product.name + "\". Revisa los detalles para coordinar la entrega.",
                    topicID: order._id,
                })
            }
            catch (e){
                console.error('Failed to create seller notification for purchase:', e)
            }
        }
        else return res.status(500).json({error: "Unable to finalize transaction. Some orders were not processed."});
    }
    return res.json({body: "Transaction completed successfully"})
});

module.exports = router;