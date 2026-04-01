require('dotenv').config();

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const mongoose = require('mongoose');

const User = require('../models/User');
const Car = require('../models/Car');
const Booking = require('../models/Booking');

const SQL_DUMP_PATH = path.resolve(__dirname, '..', '..', 'database.sql');

const buildMySqlPool = () => mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'car_rental_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const connectMongo = async () => {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not defined in the environment.');
  }

  await mongoose.connect(process.env.MONGODB_URI);
};

const toDateOnly = (value) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

const buildBookingEndDate = (startDateValue, numberOfDays) => {
  const endDate = toDateOnly(startDateValue);
  endDate.setDate(endDate.getDate() + Number(numberOfDays) - 1);
  endDate.setHours(23, 59, 59, 999);
  return endDate;
};

const parseSqlValue = (token) => {
  const trimmed = token.trim();

  if (/^null$/i.test(trimmed)) {
    return null;
  }

  if (trimmed.startsWith("'") && trimmed.endsWith("'")) {
    return trimmed.slice(1, -1).replace(/\\'/g, "'").replace(/\\\\/g, '\\');
  }

  if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
    return Number(trimmed);
  }

  return trimmed;
};

const splitRowValues = (rowText) => {
  const values = [];
  let current = '';
  let inString = false;

  for (let i = 0; i < rowText.length; i += 1) {
    const char = rowText[i];
    const prev = i > 0 ? rowText[i - 1] : '';

    if (char === "'" && prev !== '\\') {
      inString = !inString;
      current += char;
      continue;
    }

    if (char === ',' && !inString) {
      values.push(parseSqlValue(current));
      current = '';
      continue;
    }

    current += char;
  }

  if (current.trim().length > 0) {
    values.push(parseSqlValue(current));
  }

  return values;
};

const extractInsertRows = (sqlText, tableName) => {
  const regex = new RegExp(`INSERT INTO ${tableName} \\(([^)]+)\\) VALUES([\\s\\S]*?);`, 'gi');
  const rows = [];
  let match;
  let autoId = 1;

  while ((match = regex.exec(sqlText)) !== null) {
    const columns = match[1].split(',').map((column) => column.trim());
    const valuesBlock = match[2];
    const tupleRegex = /\(([^()]+)\)/g;
    let tupleMatch;

    while ((tupleMatch = tupleRegex.exec(valuesBlock)) !== null) {
      const values = splitRowValues(tupleMatch[1]);
      const row = { id: autoId };
      columns.forEach((column, index) => {
        row[column] = values[index];
      });
      rows.push(row);
      autoId += 1;
    }
  }

  return rows;
};

const getSqlDumpData = () => {
  if (!fs.existsSync(SQL_DUMP_PATH)) {
    throw new Error(`SQL dump not found at ${SQL_DUMP_PATH}`);
  }

  const sqlText = fs.readFileSync(SQL_DUMP_PATH, 'utf8');
  const users = extractInsertRows(sqlText, 'users').map((user) => ({
    ...user,
    created_at: user.created_at || null,
  }));
  const cars = extractInsertRows(sqlText, 'cars').map((car) => ({
    ...car,
    created_at: null,
  }));
  const bookings = extractInsertRows(sqlText, 'bookings').map((booking) => ({
    ...booking,
    created_at: booking.created_at || null,
  }));

  return { users, cars, bookings, source: `SQL dump (${path.basename(SQL_DUMP_PATH)})` };
};

const upsertUser = async (user) => {
  const email = String(user.email).toLowerCase();
  let existingUser = await User.findOne({ legacy_mysql_id: user.id });

  if (!existingUser) {
    existingUser = await User.findOne({ email });
  }

  if (existingUser) {
    existingUser.legacy_mysql_id = user.id;
    existingUser.name = user.name;
    existingUser.email = email;
    existingUser.password = user.password;
    existingUser.role = user.role;
    if (user.created_at && !existingUser.createdAt) {
      existingUser.createdAt = new Date(user.created_at);
    }
    await existingUser.save();
    return existingUser;
  }

  return User.create({
    legacy_mysql_id: user.id,
    name: user.name,
    email,
    password: user.password,
    role: user.role,
    createdAt: user.created_at ? new Date(user.created_at) : undefined,
    updatedAt: user.created_at ? new Date(user.created_at) : undefined,
  });
};

const migrateUsers = async (users) => {
  const userIdMap = new Map();

  for (const user of users) {
    const migratedUser = await upsertUser(user);
    userIdMap.set(user.id, migratedUser._id);
  }

  return userIdMap;
};

const upsertCar = async (car, agencyObjectId) => {
  const vehicleNumber = String(car.vehicle_number).toUpperCase().trim();
  let existingCar = await Car.findOne({ legacy_mysql_id: car.id });

  if (!existingCar) {
    existingCar = await Car.findOne({ vehicle_number: vehicleNumber });
  }

  if (existingCar) {
    existingCar.legacy_mysql_id = car.id;
    existingCar.agency_id = agencyObjectId;
    existingCar.vehicle_model = car.vehicle_model;
    existingCar.vehicle_number = vehicleNumber;
    existingCar.seating_capacity = Number(car.seating_capacity);
    existingCar.rent_per_day = Number(car.rent_per_day);
    await existingCar.save();
    return existingCar;
  }

  return Car.create({
    legacy_mysql_id: car.id,
    agency_id: agencyObjectId,
    vehicle_model: car.vehicle_model,
    vehicle_number: vehicleNumber,
    seating_capacity: Number(car.seating_capacity),
    rent_per_day: Number(car.rent_per_day),
    createdAt: car.created_at ? new Date(car.created_at) : undefined,
    updatedAt: car.created_at ? new Date(car.created_at) : undefined,
  });
};

const migrateCars = async (cars, userIdMap) => {
  const carIdMap = new Map();

  for (const car of cars) {
    const agencyObjectId = userIdMap.get(car.agency_id);
    if (!agencyObjectId) {
      throw new Error(`Missing migrated agency for MySQL user ID ${car.agency_id}`);
    }

    const migratedCar = await upsertCar(car, agencyObjectId);
    carIdMap.set(car.id, migratedCar._id);
  }

  return carIdMap;
};

const upsertBooking = async (booking, carObjectId, customerObjectId) => {
  const startDate = toDateOnly(booking.start_date);
  const endDate = buildBookingEndDate(booking.start_date, booking.number_of_days);

  let existingBooking = await Booking.findOne({ legacy_mysql_id: booking.id });

  if (!existingBooking) {
    existingBooking = await Booking.findOne({
      car_id: carObjectId,
      customer_id: customerObjectId,
      start_date: startDate,
      number_of_days: Number(booking.number_of_days),
      total_cost: Number(booking.total_cost),
    });
  }

  if (existingBooking) {
    existingBooking.legacy_mysql_id = booking.id;
    existingBooking.car_id = carObjectId;
    existingBooking.customer_id = customerObjectId;
    existingBooking.start_date = startDate;
    existingBooking.end_date = endDate;
    existingBooking.number_of_days = Number(booking.number_of_days);
    existingBooking.total_cost = Number(booking.total_cost);
    if (booking.created_at && !existingBooking.created_at) {
      existingBooking.created_at = new Date(booking.created_at);
    }
    await existingBooking.save();
    return existingBooking;
  }

  return Booking.create({
    legacy_mysql_id: booking.id,
    car_id: carObjectId,
    customer_id: customerObjectId,
    start_date: startDate,
    end_date: endDate,
    number_of_days: Number(booking.number_of_days),
    total_cost: Number(booking.total_cost),
    created_at: booking.created_at ? new Date(booking.created_at) : undefined,
    updatedAt: booking.created_at ? new Date(booking.created_at) : undefined,
  });
};

const migrateBookings = async (bookings, userIdMap, carIdMap) => {
  for (const booking of bookings) {
    const carObjectId = carIdMap.get(booking.car_id);
    const customerObjectId = userIdMap.get(booking.customer_id);

    if (!carObjectId) {
      throw new Error(`Missing migrated car for MySQL car ID ${booking.car_id}`);
    }

    if (!customerObjectId) {
      throw new Error(`Missing migrated customer for MySQL user ID ${booking.customer_id}`);
    }

    await upsertBooking(booking, carObjectId, customerObjectId);
  }
};

const getMySqlData = async (pool) => {
  const [users] = await pool.query('SELECT id, name, email, password, role, created_at FROM users ORDER BY id ASC');
  const [cars] = await pool.query('SELECT id, agency_id, vehicle_model, vehicle_number, seating_capacity, rent_per_day, NULL AS created_at FROM cars ORDER BY id ASC');
  const [bookings] = await pool.query('SELECT id, car_id, customer_id, start_date, number_of_days, total_cost, created_at FROM bookings ORDER BY id ASC');

  return { users, cars, bookings, source: 'MySQL database' };
};

const loadSourceData = async (pool) => {
  try {
    const connection = await pool.getConnection();
    connection.release();
    console.log('Connected to MySQL');
    return await getMySqlData(pool);
  } catch (error) {
    console.warn(`MySQL unavailable (${error.code || error.message}). Falling back to SQL dump.`);
    return getSqlDumpData();
  }
};

const printSummary = async (sourceLabel, sourceCounts) => {
  const [mongoUsers, mongoCars, mongoBookings] = await Promise.all([
    User.countDocuments({ legacy_mysql_id: { $exists: true } }),
    Car.countDocuments({ legacy_mysql_id: { $exists: true } }),
    Booking.countDocuments({ legacy_mysql_id: { $exists: true } }),
  ]);

  console.log(`Migration source: ${sourceLabel}`);
  console.log('Migration summary');
  console.log(`Source users: ${sourceCounts.users} -> Mongo users: ${mongoUsers}`);
  console.log(`Source cars: ${sourceCounts.cars} -> Mongo cars: ${mongoCars}`);
  console.log(`Source bookings: ${sourceCounts.bookings} -> Mongo bookings: ${mongoBookings}`);
};

const run = async () => {
  const pool = buildMySqlPool();

  try {
    await connectMongo();
    console.log('Connected to MongoDB Atlas');

    const { users, cars, bookings, source } = await loadSourceData(pool);
    const userIdMap = await migrateUsers(users);
    const carIdMap = await migrateCars(cars, userIdMap);
    await migrateBookings(bookings, userIdMap, carIdMap);
    await printSummary(source, { users: users.length, cars: cars.length, bookings: bookings.length });
  } finally {
    await pool.end();
    await mongoose.disconnect();
  }
};

run().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
