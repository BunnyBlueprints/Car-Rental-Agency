const express = require('express');
const router  = express.Router();
const { rentCar, getAgencyBookings } = require('../controllers/bookingController');
const { authenticate, authorizeRole } = require('../middleware/authMiddleware');

router.post('/', authenticate, authorizeRole('CUSTOMER'), rentCar);

router.get('/agency', authenticate, authorizeRole('AGENCY'), getAgencyBookings);

module.exports = router;
