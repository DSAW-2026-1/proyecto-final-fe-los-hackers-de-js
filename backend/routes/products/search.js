const express = require('express');
const router = express.Router();
const db = require("../../dbManager");
const ITEMS_PER_PAGE = 12

router.get('/', async function (req, res) {
    let {
        page, query, categories, fromPrice, toPrice, conditions, searchDescription, minRating, sellerID, includeOutOfStock
    } = req.query
    const fullQuery = {}
    if(!page) page = 1;
    let pageInt = parseInt(page) || 1
    if(isNaN(pageInt)) pageInt = 1
    //if(!query && !categories && !fromPrice && !toPrice && !conditions && !minRating) return res.status("400")
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
    if(!isNaN(minRatingVal)){
        fullQuery["rating"] = {$gte: minRatingVal}
    }
    if(query){
        //TODO: Sanitize this
        if(searchDescription){
            fullQuery["$or"] = [
                {name: {$regex: query}},
                {description: {$regex: query}}
            ]
        }
        else fullQuery["name"] = {$regex: query}
    }
    if(sellerID) fullQuery["sellerID"] = sellerID
    if(!includeOutOfStock) fullQuery["stock"] = {$gt: 0}
    //TODO: Probably not the quickest way of paginating
    const search = await db.findProducts(fullQuery, (pageInt-1), ITEMS_PER_PAGE)
    let products = search.result
    if (!products || products.length === 0) {
        if(search.count === 0)return res.status(404).json({error: 'No results found. Try broader search terms.'})
        else return res.status(400).json({error: 'Result page out of range.'})
    }
    else {
        let returnProducts = []
        for (let i = 0; i < products.length; i++) {
            returnProducts.push({
                productID: products[i]._id,
                name: products[i].name,
                //category: products[i].category,
                //condition: products[i].condition,
                price: products[i].price,
                //description: products[i].description,
                rating: products[i].rating || null,
                image: products[i].images["0"],
                stock: products[i].stock,
                //sellerID: products[i].sellerID,

            })
        }
        return res.json({
            count: search.count,
            pages: Math.ceil(search.count/ITEMS_PER_PAGE),
            page: pageInt,
            results: Object.assign({}, returnProducts)
        })
    }
});

module.exports = router;
