const express = require('express'); 
const { createMonitor, resetTimer } = require('../controllers/monitor-controller')

const router = express.Router(); 

router.post('/monitors', createMonitor);

router.post('/monitors/:id/heartbeat', resetTimer);

module.exports = router;