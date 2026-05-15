const express = require('express');
const tokenValidatorMiddleware = require("../../middleware/auth/tokenValidator");
const userAuthMiddleware = require("../../middleware/auth/userValidator");
const router = express.Router();
const orders = require('./getOwn')
const getById = require('./getById')

router.use('/', tokenValidatorMiddleware)
router.use('/', userAuthMiddleware)
router.use('/status', orders)

router.use('/', getById)

module.exports = router;

/*
POSSIBLE SHIPPING STATUS:
Pending
Confirmed
In transit
Delivered
Cancelled
*/