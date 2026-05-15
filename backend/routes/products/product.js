const express = require('express');
const tokenValidatorMiddleware = require("../../middleware/auth/tokenValidator");
const userAuthMiddleware = require("../../middleware/auth/userValidator");
const sellerAuthMiddleware = require("../../middleware/auth/sellerValidator");
const router = express.Router();
const createProduct = require('./create')
const editProduct = require('./edit')
const findProductByID = require("./find")
const deleteProduct = require("./delete")
const searchProducts = require("./search")
const createReview = require('./reviews/create')
const getReviews = require('./reviews/get')
const reportProduct = require('./report')

router.use('/search', searchProducts)
router.use('/', findProductByID)
router.use('/', getReviews)
router.use('/', tokenValidatorMiddleware)
router.use('/', userAuthMiddleware)
// report endpoint should be accessible to authenticated users (buyers), not only sellers
router.use('/', reportProduct)
router.use('/', sellerAuthMiddleware)
router.use('/', createProduct)
router.use('/', editProduct)
router.use('/', deleteProduct)
// mount reviews creation at /:id/reviews
router.use('/', createReview)

module.exports = router;