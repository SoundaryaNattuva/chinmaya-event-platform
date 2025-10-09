import * as eventCtrl from '../controllers/events.js'
import express from 'express';

const router = express.Router();

router.get('/', eventCtrl.getAllEvents);
router.get('/:id', eventCtrl.getEventById);

export default router;