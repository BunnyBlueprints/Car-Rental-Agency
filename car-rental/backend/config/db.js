const mongoose = require('mongoose');

require('dotenv').config();

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error('MONGODB_URI is not defined in the environment.');
  }

  await mongoose.connect(mongoUri);
  console.log('MongoDB Atlas connected successfully');
};

module.exports = connectDB;
