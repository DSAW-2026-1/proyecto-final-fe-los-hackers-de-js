const express = require('express');
const tokenValidatorMiddleware = require("../../middleware/auth/tokenValidator");
const userAuthMiddleware = require("../../middleware/auth/userValidator");
const router = express.Router();
const checkout = require("./checkout")

router.use('/', tokenValidatorMiddleware)
router.use('/', userAuthMiddleware)
router.use('/checkout', checkout)

module.exports = router;