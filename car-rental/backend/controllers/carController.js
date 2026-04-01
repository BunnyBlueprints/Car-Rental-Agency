const mongoose = require('mongoose');
require('../models/User');
const Car = require('../models/Car');

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const formatCar = (car) => ({
  id: car._id.toString(),
  vehicle_model: car.vehicle_model,
  vehicle_number: car.vehicle_number,
  seating_capacity: car.seating_capacity,
  rent_per_day: car.rent_per_day,
  agency_id: car.agency_id && car.agency_id._id ? car.agency_id._id.toString() : car.agency_id.toString(),
  agency_name: car.agency_id && car.agency_id.name ? car.agency_id.name : undefined,
});

const addCar = async (req, res) => {
  try {
    const { vehicle_model, vehicle_number, seating_capacity, rent_per_day } = req.body;
    const agencyId = req.user.userId;

    if (!vehicle_model || !vehicle_number || !seating_capacity || !rent_per_day) {
      return res.status(400).json({ message: 'All car fields are required.' });
    }

    if (seating_capacity <= 0) {
      return res.status(400).json({ message: 'Seating capacity must be greater than 0.' });
    }

    if (rent_per_day <= 0) {
      return res.status(400).json({ message: 'Rent per day must be greater than 0.' });
    }

    const normalizedVehicleNumber = vehicle_number.toUpperCase().trim();
    const existing = await Car.findOne({ vehicle_number: normalizedVehicleNumber }).select('_id');
    if (existing) {
      return res.status(409).json({ message: 'A car with this vehicle number already exists.' });
    }

    const car = await Car.create({
      agency_id: agencyId,
      vehicle_model: vehicle_model.trim(),
      vehicle_number: normalizedVehicleNumber,
      seating_capacity,
      rent_per_day,
    });

    return res.status(201).json({
      message: 'Car added successfully.',
      carId: car._id.toString(),
    });
  } catch (err) {
    console.error('Add car error:', err);
    return res.status(500).json({ message: 'Server error. Please try again.' });
  }
};

const editCar = async (req, res) => {
  try {
    const carId = req.params.id;
    const agencyId = req.user.userId;
    const { vehicle_model, vehicle_number, seating_capacity, rent_per_day } = req.body;

    if (!isValidObjectId(carId)) {
      return res.status(404).json({ message: 'Car not found.' });
    }

    if (!vehicle_model || !vehicle_number || !seating_capacity || !rent_per_day) {
      return res.status(400).json({ message: 'All car fields are required.' });
    }

    const car = await Car.findById(carId).select('_id agency_id');
    if (!car) {
      return res.status(404).json({ message: 'Car not found.' });
    }

    if (car.agency_id.toString() !== agencyId) {
      return res.status(403).json({ message: 'You are not authorized to edit this car.' });
    }

    const normalizedVehicleNumber = vehicle_number.toUpperCase().trim();
    const duplicate = await Car.findOne({
      vehicle_number: normalizedVehicleNumber,
      _id: { $ne: carId },
    }).select('_id');
    if (duplicate) {
      return res.status(409).json({ message: 'Another car with this vehicle number already exists.' });
    }

    await Car.findByIdAndUpdate(carId, {
      vehicle_model: vehicle_model.trim(),
      vehicle_number: normalizedVehicleNumber,
      seating_capacity,
      rent_per_day,
    });

    return res.status(200).json({ message: 'Car updated successfully.' });
  } catch (err) {
    console.error('Edit car error:', err);
    return res.status(500).json({ message: 'Server error. Please try again.' });
  }
};

const getAllCars = async (req, res) => {
  try {
    const cars = await Car.find()
      .populate('agency_id', 'name')
      .sort({ createdAt: -1 });

    return res.status(200).json({ cars: cars.map(formatCar) });
  } catch (err) {
    console.error('Get cars error:', err);
    return res.status(500).json({ message: 'Server error. Please try again.' });
  }
};

const getCarById = async (req, res) => {
  try {
    const carId = req.params.id;
    const agencyId = req.user.userId;

    if (!isValidObjectId(carId)) {
      return res.status(404).json({ message: 'Car not found or access denied.' });
    }

    const car = await Car.findOne({ _id: carId, agency_id: agencyId });
    if (!car) {
      return res.status(404).json({ message: 'Car not found or access denied.' });
    }

    return res.status(200).json({ car: formatCar(car) });
  } catch (err) {
    console.error('Get car by id error:', err);
    return res.status(500).json({ message: 'Server error. Please try again.' });
  }
};

module.exports = { addCar, editCar, getAllCars, getCarById };
