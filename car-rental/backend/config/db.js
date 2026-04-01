const path = require('path');
const mongoose = require('mongoose');

require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const getMongoUri = () =>
  process.env.MONGODB_URI ||
  process.env.MONGO_URI ||
  process.env.MONGODB_URL ||
  process.env.DATABASE_URL;

const connectDB = async () => {
  const mongoUri = getMongoUri();

  if (!mongoUri) {
    throw new Error(
      'MongoDB connection string is missing. Set one of: MONGODB_URI, MONGO_URI, MONGODB_URL, or DATABASE_URL.'
    );
  }

  await mongoose.connect(mongoUri);
  console.log('MongoDB Atlas connected successfully');
};

module.exports = connectDB;
