const express = require('express')
const router = express.Router()
const db = require('../../dbManager')
const ITEMS_PER_PAGE = 12

// DELETE /api/admin/products/:productID
router.delete('/:productID', async function (req, res) {
    const { productID } = req.params
    if(!productID) return res.status(400).json({ error: 'Product not found' })

    try {
        const product = await db.findProductRawByID(productID)
        if(!product) return res.status(400).json({ error: 'Product not found' })
        if(product.deleted) return res.status(409).json({ error: 'Product is already deleted' })

        await db.softDeleteProduct(productID)
        return res.status(200).json({ message: 'Product deleted successfully' })
    }
    catch (e) {
        console.error('Error deleting product by admin:', e)
        return res.status(500).json({ error: 'Internal server error' })
    }
})

// GET /api/admin/products?page=X&query=... (includes soft-deleted products)
// Allows similar searching as the normal product search (mostly unused as the frontend doesn't send any filters, could be used at some point in the future)
router.get('/', async function (req, res) {
    let { page, query, categories, fromPrice, toPrice, conditions, minRating, sellerID } = req.query
    if(!page) page = 1
    let pageInt = parseInt(page) || 1
    if(isNaN(pageInt)) pageInt = 1

    const fullQuery = {}
    const minRatingVal = parseInt(minRating) || NaN
    if(categories) fullQuery["category"] = { $in: categories.split(',') }
    if(conditions) fullQuery["condition"] = { $in: conditions.split(',') }
    if(fromPrice || toPrice) {
        let fromPriceVal = parseInt(fromPrice) || NaN
        let toPriceVal = parseInt(toPrice) || NaN
        fullQuery["price"] = {}
        if(!isNaN(fromPriceVal)) fullQuery.price["$gte"] = fromPriceVal
        if(!isNaN(toPriceVal)) fullQuery.price["$lte"] = toPriceVal
    }
    if(!isNaN(minRatingVal)) fullQuery["rating"] = {$gte: minRatingVal}
    if(query){
        if(query) fullQuery["$or"] = [ { name: { $regex: query } }, { description: { $regex: query } } ]
    }
    if(sellerID) fullQuery["sellerID"] = sellerID

    const search = await db.findProductsAdmin(fullQuery, (pageInt-1), ITEMS_PER_PAGE)
    if (!search || !search.result) return res.status(500).json({ error: 'Internal server error' })
    const products = search.result
    if (products.length === 0) {
        if (search.count === 0) return res.status(404).json({ error: 'No results found.' })
        else return res.status(400).json({ error: 'Result page out of range.' })
    }

    const returnProducts = products.map(p => ({
        productID: p._id,
        name: p.name,
        price: p.price,
        rating: p.rating || null,
        image: (p.images || {})[0] || null,
        stock: p.stock,
        sellerID: p.sellerID,
        deleted: !!p.deleted
    }))

    return res.json({
        count: search.count,
        pages: Math.ceil(search.count/ITEMS_PER_PAGE),
        page: pageInt,
        results: Object.assign({}, returnProducts)
    })
})

module.exports = router

