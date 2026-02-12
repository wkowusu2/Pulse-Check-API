const express = require('express'); 
const { createMonitor } = require('../controllers/monitor-controller')

const router = express.Router(); 

router.post('/monitors', createMonitor)

module.exports = router;