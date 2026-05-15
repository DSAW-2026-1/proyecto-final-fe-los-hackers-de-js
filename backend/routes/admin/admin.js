const express = require('express');
const adminDashboardRouter = require("./dashboard");
const tokenValidatorMiddleware = require("../../middleware/auth/tokenValidator");
const adminValidatorMiddleware = require("../../middleware/auth/adminValidator");
const router = express.Router();

router.use('/', tokenValidatorMiddleware)
router.use('/', adminValidatorMiddleware)
router.use('/dashboard', adminDashboardRouter);
const adminProductsRouter = require('./products')
router.use('/products', adminProductsRouter)
const adminUsersRouter = require('./users')
router.use('/users', adminUsersRouter)
const adminReportsRouter = require('./reports')
router.use('/reports', adminReportsRouter)

module.exports = router;