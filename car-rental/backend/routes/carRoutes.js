const express = require('express');
const router  = express.Router();
const { addCar, editCar, getAllCars, getCarById } = require('../controllers/carController');
const { authenticate, authorizeRole }             = require('../middleware/authMiddleware');

router.get('/',    getAllCars);

router.get('/:id', authenticate, authorizeRole('AGENCY'), getCarById);

router.post('/',    authenticate, authorizeRole('AGENCY'), addCar);
router.put('/:id',  authenticate, authorizeRole('AGENCY'), editCar);

module.exports = router;
