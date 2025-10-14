import express from 'express';
import * as purchasesCtrl from '../controllers/purchases.js';
const router = express.Router();

router.post('/', purchasesCtrl.processPurchase);

export default router;