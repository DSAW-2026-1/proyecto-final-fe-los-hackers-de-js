const express = require('express');
const router = express.Router();
const db = require("../../../dbManager")
const ITEMS_PER_PAGE = 12
// GET /api/products/:id/reviews
router.get('/:id/reviews', async (req, res) => {
    const ID = req.params.id
    const product = await db.findProductByID(ID)
    if (!product) return res.status(404).json({error: 'Product not found'})

    let { page } = req.query
    if(!page) page = 1;
    let pageInt = parseInt(page) || 1
    if(isNaN(pageInt)) pageInt = 1

    const reviewIDs = product.reviews || []
    if (!reviewIDs || reviewIDs.length === 0) return res.status(204).json({message: 'No reviews'})

    const reviews = await db.getReviews(reviewIDs, (page-1), ITEMS_PER_PAGE)

    if (reviews === null || reviews.count === 0) return res.status(500).json({error: 'Failed to fetch reviews'})
    if(!reviews.result || reviews.result.length === 0) return res.status(400).json({error: 'Result page out of range.'})
    const result = {}
    reviews.result.forEach((r, i) => {
        result[i] = {
            buyerID: (r.buyerID && r.buyerID.toString) ? r.buyerID.toString() : r.buyerID,
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
