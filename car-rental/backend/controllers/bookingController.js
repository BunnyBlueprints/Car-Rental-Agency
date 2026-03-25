const db = require('../config/db');

const rentCar = async (req, res) => {
  try {
    const customerId  = req.user.userId;
    const { car_id, start_date, number_of_days } = req.body;

    if (!car_id || !start_date || !number_of_days) {
      return res.status(400).json({ message: 'car_id, start_date and number_of_days are required.' });
    }

    if (number_of_days <= 0) {
      return res.status(400).json({ message: 'Number of days must be greater than 0.' });
    }

    const today     = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(start_date);
    if (startDate < today) {
      return res.status(400).json({ message: 'Start date cannot be in the past.' });
    }

    const [carRows] = await db.query(
      'SELECT id, rent_per_day FROM cars WHERE id = ?',
      [car_id]
    );
    if (carRows.length === 0) {
      return res.status(404).json({ message: 'Car not found.' });
    }

    const car       = carRows[0];
    const endDate   = new Date(startDate);
    endDate.setDate(endDate.getDate() + parseInt(number_of_days) - 1);

    const [overlapping] = await db.query(
      `SELECT id FROM bookings
       WHERE car_id = ?
         AND start_date <= ?
         AND DATE_ADD(start_date, INTERVAL number_of_days - 1 DAY) >= ?`,
      [car_id, endDate.toISOString().split('T')[0], start_date]
    );

    if (overlapping.length > 0) {
      return res.status(409).json({
        message: 'This car is already booked for the selected dates. Please choose different dates.',
      });
    }

    const totalCost = parseFloat(car.rent_per_day) * parseInt(number_of_days);

    const [result] = await db.query(
      `INSERT INTO bookings (car_id, customer_id, start_date, number_of_days, total_cost)
       VALUES (?, ?, ?, ?, ?)`,
      [car_id, customerId, start_date, number_of_days, totalCost]
    );

    return res.status(201).json({
      message: 'Car rented successfully!',
      bookingId: result.insertId,
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

    const [bookings] = await db.query(
      `SELECT
          b.id            AS booking_id,
          c.vehicle_model,
          c.vehicle_number,
          c.rent_per_day,
          u.name          AS customer_name,
          u.email         AS customer_email,
          b.start_date,
          b.number_of_days,
          b.total_cost,
          b.created_at
       FROM bookings b
       JOIN cars c    ON b.car_id      = c.id
       JOIN users u   ON b.customer_id = u.id
       WHERE c.agency_id = ?
       ORDER BY b.created_at DESC`,
      [agencyId]
    );

    return res.status(200).json({ bookings });
  } catch (err) {
    console.error('Get agency bookings error:', err);
    return res.status(500).json({ message: 'Server error. Please try again.' });
  }
};

module.exports = { rentCar, getAgencyBookings };
