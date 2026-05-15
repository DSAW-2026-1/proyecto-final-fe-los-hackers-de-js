const express = require('express');
const router = express.Router();
const db = require("../../../dbManager");

const ALLOWED_STATUSES = ["Pending", "Confirmed", "In transit", "Delivered", "Cancelled"]

function getFriendlyStatus(dbStatus){
    switch (dbStatus){
        case "Pending":
            return "Pendiente"
        case "Confirmed":
            return "Confirmado"
        case "In transit":
            return "En tránsito"
        case "Delivered":
            return "Entregado"
        case "Cancelled":
            return "Cancelado"
        default:
            return dbStatus
    }
}
router.patch('/:saleID', async function (req, res) {
    const UID = req.token.payload.UID
    const { saleID } = req.params
    const { status } = req.body || {}

    if (!status) return res.status(400).json({error: 'Missing status in request body'})
    if (!ALLOWED_STATUSES.includes(status)) return res.status(400).json({error: 'Invalid shipping status'})

    const sale = await db.findOrderByID(saleID)
    if(!sale) return res.status(404).json({error: 'No sale matching this saleID found'})

    // Compare IDs as strings to avoid ObjectId mismatches
    if(String(sale.sellerID) !== String(UID)) return res.status(403).json({error: 'You are not allowed to do this'})

    const success = await db.updateOrder(saleID, {status: status})
    if(!success) return res.status(500).json({error: 'Failed to update sale status'})

    // Create notification for buyer about the status update
    try {
        const product = await db.findProductByID(sale.productID)
        const productName = (product && (product.name)) || 'producto'
        const amount = sale.amount || 1
        const title = `Producto ${getFriendlyStatus(status).toLowerCase()}`
        const message = `Tu pedido "${amount}x ${productName}" ha sido marcado como "${getFriendlyStatus(status)}" por el vendedor.`

        await require('../../../services/notifications').createNotification({
            userID: String(sale.buyerID),
            type: 'orderUpdate',
            title: title,
            message: message,
            topicID: String(sale._id || saleID)
        })
    }
    catch (e) {
        console.error('Failed to create buyer notification for order status update:', e)
    }

    return res.json({message: 'Updated successfully'})
})

module.exports = router;
