const express = require('express');
const router = express.Router();
const db = require("../../dbManager")

router.delete('/:id', async(req, res) => {
    const UID = req.token.payload.UID
    const productID = req.params.id
    const product = await db.findProductByID(productID)

    if(!product) return res.status(404).json({error: 'Product not found'})
    if(!(product.sellerID === UID)) return res.status(403).json({error: 'You are not allowed to do this'})

    await db.softDeleteProduct(productID)
    return res.json({ body: "Product deleted" })
});

module.exports = router;