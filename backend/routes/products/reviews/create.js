const express = require('express');
const router = express.Router();
const db = require("../../../dbManager")
const notifications = require("../../../services/notifications")

// POST /api/products/:id/reviews/
router.post('/:id/reviews', async(req, res) => {
    const ID = req.params.id
    const UID = req.token.payload.UID
    const {rating, title, body} = req.body || {};

    if (rating === undefined || title === undefined || body === undefined) return res.status(400).json({error: "Missing or malformed review"});
    const ratingInt = (typeof rating === "string")? parseInt(rating) : (typeof rating === "number")? Math.round(rating) : (typeof rating === "bigint")? Number(rating) : null
    if(!Number.isInteger(ratingInt) || ratingInt < 1 || ratingInt > 5) return res.status(400).json({error: "Invalid rating"});

    if(typeof title !== 'string' || typeof body !== 'string' || title.trim().length === 0 || body.trim().length === 0) return res.status(400).json({error: "Missing or malformed review"});
    // basic XSS check: disallow angle brackets and script tags
    const lowerBody = (title + '\n' + body).toLowerCase()
    if(lowerBody.includes('<') || lowerBody.includes('>') || /<\s*script/.test(lowerBody)) return res.status(400).json({error: "Missing or malformed review"});

    const product = await db.findProductByID(ID)
    if (!product) return res.status(404).json({error: 'Product not found'})

    const user = await db.findUserByUID(UID)
    if (!user) return res.status(400).json({error: 'User not found'})
    if(user.isSuspended) return res.status(400).json({error: 'User not found'})

    // verify purchase
    const orderIDs = user.orders
    if (!orderIDs || orderIDs.length === 0) return res.status(403).json({error: "You cannot review an item you haven't bought"})
    // find an order for this user that contains this product
    const order = await db.findOrder({productID: product._id, _id: {$in: orderIDs}})
    if (!order) return res.status(403).json({error: "You cannot review an item you haven't bought"})

    // verify no existing review by this buyer for this product
    const existing = await db.findReview({buyerID: user._id, productID: product._id})
    if (existing) return res.status(409).json({error: 'You have already reviewed this product'})

    const review = {
        buyerID: user._id,
        productID: product._id,
        sellerID: product.sellerID,
        rating: ratingInt,
        title: title.trim(),
        body: body.trim(),
        reviewDate: new Date()
    }

    const success = await db.addReview(review)

    if(!success) return res.status(500).json({error: 'Failed to create review'})
    // Create notification for the seller about the new review
    try {
        const seller = await db.findUserByUID(String(product.sellerID))
        const buyerName = (user && (user.username || user.email)) || 'Un comprador'
        const productName = product.name || 'tu producto'
        const message = `${buyerName} dejó una reseña de ${ratingInt} estrellas sobre \"${productName}\"`

        if (seller) {
            await notifications.createNotification({
                userID: String(seller._id || product.sellerID),
                type: 'review',
                title: 'Nueva reseña',
                message,
                topicID: product._id
            })
        }
    }
    catch (e){
        console.error('Failed to create seller notification for review:', e)
    }

    return res.status(201).json({message: 'Review created'})
});

module.exports = router;