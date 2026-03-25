const db = require('../config/db');

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

    const [existing] = await db.query(
      'SELECT id FROM cars WHERE vehicle_number = ?',
      [vehicle_number.toUpperCase()]
    );
    if (existing.length > 0) {
      return res.status(409).json({ message: 'A car with this vehicle number already exists.' });
    }

    const [result] = await db.query(
      `INSERT INTO cars (agency_id, vehicle_model, vehicle_number, seating_capacity, rent_per_day)
       VALUES (?, ?, ?, ?, ?)`,
      [agencyId, vehicle_model.trim(), vehicle_number.toUpperCase().trim(), seating_capacity, rent_per_day]
    );

    return res.status(201).json({
      message: 'Car added successfully.',
      carId: result.insertId,
    });
  } catch (err) {
    console.error('Add car error:', err);
    return res.status(500).json({ message: 'Server error. Please try again.' });
  }
};

const editCar = async (req, res) => {
  try {
    const carId    = req.params.id;
    const agencyId = req.user.userId;
    const { vehicle_model, vehicle_number, seating_capacity, rent_per_day } = req.body;

    if (!vehicle_model || !vehicle_number || !seating_capacity || !rent_per_day) {
      return res.status(400).json({ message: 'All car fields are required.' });
    }

    const [rows] = await db.query(
      'SELECT id, agency_id FROM cars WHERE id = ?',
      [carId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Car not found.' });
    }

    if (rows[0].agency_id !== agencyId) {
      return res.status(403).json({ message: 'You are not authorized to edit this car.' });
    }

    const [duplicate] = await db.query(
      'SELECT id FROM cars WHERE vehicle_number = ? AND id != ?',
      [vehicle_number.toUpperCase(), carId]
    );
    if (duplicate.length > 0) {
      return res.status(409).json({ message: 'Another car with this vehicle number already exists.' });
    }

    await db.query(
      `UPDATE cars
       SET vehicle_model = ?, vehicle_number = ?, seating_capacity = ?, rent_per_day = ?
       WHERE id = ?`,
      [vehicle_model.trim(), vehicle_number.toUpperCase().trim(), seating_capacity, rent_per_day, carId]
    );

    return res.status(200).json({ message: 'Car updated successfully.' });
  } catch (err) {
    console.error('Edit car error:', err);
    return res.status(500).json({ message: 'Server error. Please try again.' });
  }
};

const getAllCars = async (req, res) => {
  try {
    const [cars] = await db.query(
      `SELECT c.id, c.vehicle_model, c.vehicle_number, c.seating_capacity,
              c.rent_per_day, u.name AS agency_name
       FROM cars c
       JOIN users u ON c.agency_id = u.id
       ORDER BY c.id DESC`
    );

    return res.status(200).json({ cars });
  } catch (err) {
    console.error('Get cars error:', err);
    return res.status(500).json({ message: 'Server error. Please try again.' });
  }
};

const getCarById = async (req, res) => {
  try {
    const carId    = req.params.id;
    const agencyId = req.user.userId;

    const [rows] = await db.query(
      'SELECT * FROM cars WHERE id = ? AND agency_id = ?',
      [carId, agencyId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Car not found or access denied.' });
    }

    return res.status(200).json({ car: rows[0] });
  } catch (err) {
    console.error('Get car by id error:', err);
    return res.status(500).json({ message: 'Server error. Please try again.' });
  }
};

module.exports = { addCar, editCar, getAllCars, getCarById };
