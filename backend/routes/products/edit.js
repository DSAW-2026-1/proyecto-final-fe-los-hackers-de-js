const express = require('express');
const router = express.Router();
const db = require("../../dbManager")
const VALID_CATEGORIES = [
    "Tecnología",
    "Libros",
    "Ropa",
    "Deportes",
    "Hogar",
    "Accesorios",
    "Otros"
];

const VALID_CONDITIONS = [
    "Nuevo",
    "Como nuevo",
    "Usado",
    "Aceptable" //TODO: This condition is vague AF, should probably replace
];

router.patch('/:id', async(req, res) => {
    const UID = req.token.payload.UID
    const productID = req.params.id
    const product = await db.findProductByID(productID)

    if(!product) return res.status(404).json({error: 'Product not found'})
    if(!(product.sellerID === UID)) return res.status(403).json({error: 'You are not allowed to do this'})

    const errorMsg = "Incomplete or malformed request"
    let {name, category, condition, price, description, images, stock} = req.body || {};

    if (!name && !category && !condition && !price && !description && !images && !stock) return res.status(400).json({error: errorMsg});
    const imageArray = (images)? Object.values(images) : []
    if(imageArray.length < 1) images = null

    const priceInt = (typeof price === "string")? parseInt(price) : (typeof price === "number")? Math.round(price) : (typeof price === "bigint")? price : null
    const stockInt = (typeof stock === "string")? parseInt(stock) : (typeof stock === "number")? Math.round(stock) : (typeof stock === "bigint")? stock : null

    if((priceInt <= 0 && price) || (stockInt < 0 && !(stock === undefined))) return res.status(400).json({error: errorMsg});

    //TODO: Use bigInt to handle insanely large numbers. Not really necessary since MAX_SAFE_INTEGER is 9,007,199,254,740,991 but could be done theoretically.
    if(priceInt > Number.MAX_SAFE_INTEGER || stockInt > Number.MAX_SAFE_INTEGER) return res.status(400).json({error: (errorMsg + ". Reason: Price or stock higher than supported maximum.")});

    if(category && !VALID_CATEGORIES.includes(category)) return res.status(400).json({error: errorMsg});
    if(condition && !VALID_CONDITIONS.includes(condition)) return res.status(400).json({error: errorMsg});

    let newData = {}
    if(name) newData["name"] = name
    if(category) newData["category"] = category
    if(condition) newData["condition"] = condition
    if(priceInt) newData["price"] = priceInt
    if(description) newData["description"] = description
    if(!(stockInt === null)) newData["stock"] = stockInt

    //TODO: Check for malformed image array data (where it uses a non number for image object or tries to leave a gap in the image numbers)
    const result = await db.updateProduct(productID, newData, images)
    if(result) return res.json({ body: "Product updated" })
    else return res.status(500).json({ error: "The server encountered an error updating the product" })
});

module.exports = router;