const express = require('express');
const router = express.Router();
const getNotifications = require("./get");
const readAll = require("./readAll");
const unreadCount = require("./unreadCount");
const tokenValidatorMiddleware = require("../../middleware/auth/tokenValidator");
const userAuthMiddleware = require("../../middleware/auth/userValidator");
const updateReadStatus = require('./updateReadStatus')

router.use('/', tokenValidatorMiddleware)
router.use('/', userAuthMiddleware)
router.use('/', getNotifications)
router.use('/unreadCount', unreadCount)
router.use('/readAll', readAll)
router.use('/', updateReadStatus)

module.exports = router;