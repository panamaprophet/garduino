const express = require('express');
const router = express.Router();


router.use('/log', require('./log'));
router.use('/config', require('./config'));
router.get('/', (request, response) => response.send('OK'));


module.exports = router;
