const express = require('express');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

//const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users/user');
const loginRouter = require('./routes/auth/login');
const adminLoginRouter = require('./routes/auth/admin/login');
const adminRouter = require('./routes/admin/admin');
const registerRouter = require('./routes/auth/register');
const productRouter = require('./routes/products/product')
const jsonParseFailureHandler = require('./errorHandlers/jsonParseFailure')
const salesRouter = require('./routes/sales/sale')
const ordersRouter = require('./routes/orders/order')
const sellerRouter = require('./routes/seller/seller')
const notificationsRouter = require('./routes/notifications/notification')

const app = express();

const corsOptions = {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true
};
if(!process.env.CORS_ORIGIN) console.warn("Could not find CORS environment variable. Allowing all CORS requests...")

app.use(cors(corsOptions));

app.use(logger('dev'));
app.use(express.json({limit: "10mb"})); //TODO: Figure out how to allocate different request size limits
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//app.use('/', indexRouter);

app.use('/api/auth/login', loginRouter);
app.use('/api/auth/register', registerRouter);
app.use('/api/admin/login', adminLoginRouter);
app.use('/api/admin', adminRouter);
app.use('/api/seller', sellerRouter)
app.use('/api/users', usersRouter);

app.use('/api/products', productRouter)

app.use('/api/sales', salesRouter)

app.use('/api/shipping', ordersRouter)
app.use('/api/notifications', notificationsRouter)


app.use(jsonParseFailureHandler)

module.exports = app;
