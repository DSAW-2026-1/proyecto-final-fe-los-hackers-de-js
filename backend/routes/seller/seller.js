const express = require('express');
const tokenValidatorMiddleware = require("../../middleware/auth/tokenValidator");
const router = express.Router();
const registerAsSeller = require('./register')
const sellerShippingStatusRouter = require("./shipping/status");
const sellerShippingUpdateRouter = require("./shipping/update");
const sellerAuthMiddleware = require("../../middleware/auth/sellerValidator");

router.use('/register', registerAsSeller)
router.use('/', tokenValidatorMiddleware)
router.use('/', sellerAuthMiddleware)
router.use('/shipping/status', sellerShippingStatusRouter)
router.use('/shipping', sellerShippingUpdateRouter)

module.exports = router;