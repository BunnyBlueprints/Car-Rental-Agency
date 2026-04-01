const mongoose = require('mongoose');
require('../models/User');
const Booking = require('../models/Booking');
const Car = require('../models/Car');

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const rentCar = async (req, res) => {
  try {
    const customerId = req.user.userId;
    const { car_id, start_date, number_of_days } = req.body;

    if (!car_id || !start_date || !number_of_days) {
      return res.status(400).json({ message: 'car_id, start_date and number_of_days are required.' });
    }

    if (number_of_days <= 0) {
      return res.status(400).json({ message: 'Number of days must be greater than 0.' });
    }

    if (!isValidObjectId(car_id)) {
      return res.status(404).json({ message: 'Car not found.' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startDate = new Date(start_date);
    if (Number.isNaN(startDate.getTime())) {
      return res.status(400).json({ message: 'Invalid start date.' });
    }

    if (startDate < today) {
      return res.status(400).json({ message: 'Start date cannot be in the past.' });
    }

    const car = await Car.findById(car_id).select('_id rent_per_day');
    if (!car) {
      return res.status(404).json({ message: 'Car not found.' });
    }

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + parseInt(number_of_days, 10) - 1);
    endDate.setHours(23, 59, 59, 999);

    const overlapping = await Booking.findOne({
      car_id,
      start_date: { $lte: endDate },
      end_date: { $gte: startDate },
    }).select('_id');

    if (overlapping) {
      return res.status(409).json({
        message: 'This car is already booked for the selected dates. Please choose different dates.',
      });
    }

    const totalCost = parseFloat(car.rent_per_day) * parseInt(number_of_days, 10);

    const booking = await Booking.create({
      car_id,
      customer_id: customerId,
      start_date: startDate,
      end_date: endDate,
      number_of_days,
      total_cost: totalCost,
    });

    return res.status(201).json({
      message: 'Car rented successfully!',
      bookingId: booking._id.toString(),
      totalCost,
    });
  } catch (err) {
    console.error('Rent car error:', err);
    return res.status(500).json({ message: 'Server error. Please try again.' });
  }
};

const getAgencyBookings = async (req, res) => {
  try {
    const agencyId = req.user.userId;

    const bookings = await Booking.find()
      .populate({
        path: 'car_id',
        select: 'vehicle_model vehicle_number rent_per_day agency_id',
        match: { agency_id: agencyId },
      })
      .populate('customer_id', 'name email')
      .sort({ created_at: -1 });

    const filteredBookings = bookings
      .filter((booking) => booking.car_id && booking.customer_id)
      .map((booking) => ({
        booking_id: booking._id.toString(),
        vehicle_model: booking.car_id.vehicle_model,
        vehicle_number: booking.car_id.vehicle_number,
        rent_per_day: booking.car_id.rent_per_day,
        customer_name: booking.customer_id.name,
        customer_email: booking.customer_id.email,
        start_date: booking.start_date,
        number_of_days: booking.number_of_days,
        total_cost: booking.total_cost,
        created_at: booking.created_at,
      }));

    return res.status(200).json({ bookings: filteredBookings });
  } catch (err) {
    console.error('Get agency bookings error:', err);
    return res.status(500).json({ message: 'Server error. Please try again.' });
  }
};

module.exports = { rentCar, getAgencyBookings };
