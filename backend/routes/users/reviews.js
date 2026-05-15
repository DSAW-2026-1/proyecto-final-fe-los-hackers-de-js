const express = require('express');
const router = express.Router();
const db = require("../../dbManager")
const ITEMS_PER_PAGE = 12

// GET /api/users/:id/reviews
router.get('/:id/reviews', async (req, res) => {
    const UID = req.params.id
    const user = await db.findUserByUID(UID)
    if (!user) return res.status(404).json({error: 'User not found'})

    let { page } = req.query
    if(!page) page = 1;
    let pageInt = parseInt(page) || 1
    if(isNaN(pageInt)) pageInt = 1

    const reviews = await db.findReviewsBySeller(UID, (pageInt-1), ITEMS_PER_PAGE)
    if (reviews === null) return res.status(500).json({error: 'Failed to fetch reviews'})
    if (!reviews.result || reviews.count === 0) return res.status(204).json({message: 'No reviews'})
    if (reviews.result.length === 0) return res.status(400).json({error: 'Result page out of range.'})

    const result = {}
    reviews.result.forEach((r, i) => {
        result[i] = {
            buyerID: (r.buyerID && r.buyerID.toString) ? r.buyerID.toString() : r.buyerID,
            productID: (r.productID && r.productID.toString) ? r.productID.toString() : r.productID,
            rating: r.rating,
            reviewTitle: r.title,
            reviewBody: r.body,
            reviewDate: (r.reviewDate && r.reviewDate.toISOString) ? r.reviewDate.toISOString() : r.reviewDate
        }
    })

    return res.json({
        count: reviews.count,
        pages: Math.ceil(reviews.count/ITEMS_PER_PAGE),
        page: pageInt,
        results: result
    })
})

module.exports = router;
