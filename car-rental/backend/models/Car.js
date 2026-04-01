const mongoose = require('mongoose');

const carSchema = new mongoose.Schema(
  {
    legacy_mysql_id: {
      type: Number,
      unique: true,
      sparse: true,
    },
    agency_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    vehicle_model: {
      type: String,
      required: true,
      trim: true,
    },
    vehicle_number: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    seating_capacity: {
      type: Number,
      required: true,
      min: 1,
    },
    rent_per_day: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Car', carSchema);
