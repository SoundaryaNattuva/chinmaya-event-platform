const express = require('express');
const router = express.Router();
const { processPurchase } = require('../controllers/purchaseController');

router.post('/process', processPurchase);

module.exports = router;