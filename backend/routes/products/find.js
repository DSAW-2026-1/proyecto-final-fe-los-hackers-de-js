const express = require('express');
const router = express.Router();
const db = require("../../dbManager");

router.get('/:id', async function (req, res) {
    const ID = req.params.id
    const product = await db.findProductByID(ID)

    if (!product) return res.status(404).json({error: 'Product not found'})
    else return res.json({
            name: product.name,
            category: product.category,
            condition: product.condition,
            price: product.price,
            description: product.description,
            images: product.images,
            stock: product.stock,
            sellerID: product.sellerID,
            rating: product.rating || null,
        })
});

module.exports = router;
