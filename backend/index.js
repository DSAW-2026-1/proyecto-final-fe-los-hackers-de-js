const express = require('express');
const cors = require('cors');
const path = require('path');

const router = require('./server');

const app = express();

app.use(express.json());

const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:3001';

app.use(cors({ origin: FRONTEND_ORIGIN, credentials: true }));

app.use(router);

app.get('/', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`API listening on ${PORT} — CORS allowed for ${FRONTEND_ORIGIN}`);
});
