const express = require('express');
const tokenValidatorMiddleware = require("../../middleware/auth/tokenValidator");
const userrAuthMiddleware = require("../../middleware/auth/userValidator");
const router = express.Router();
const findUser = require("./find")
const getUserReviews = require("./reviews")
const getSelf = require("./getSelf")
const editSelf = require("./edit")
const reportUser = require("./report")

router.use('/', getUserReviews)
router.use('/', findUser)
router.use('/', tokenValidatorMiddleware)
router.use('/', userrAuthMiddleware)
router.use('/', reportUser)
router.use('/', getSelf)
router.use('/', editSelf)

module.exports = router;