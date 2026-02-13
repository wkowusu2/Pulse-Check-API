const express = require('express'); 
const { createMonitor, resetTimer, revertTimerState } = require('../controllers/monitor-controller')

const router = express.Router(); 

router.post('/monitors', createMonitor);

router.post('/monitors/:id/heartbeat', resetTimer);

router.post('/monitors/:id/pause', revertTimerState);



module.exports = router;