const express = require('express');
const router = express.Router();
import * as eventCtrl from '../controllers/events.js'

router.get('/', eventCtrl.getAllEvents);
router.get('/:id', eventCtrl.getEventById);

module.exports = router;