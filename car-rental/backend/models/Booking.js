const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    legacy_mysql_id: {
      type: Number,
      unique: true,
      sparse: true,
    },
    car_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Car',
      required: true,
    },
    customer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    start_date: {
      type: Date,
      required: true,
    },
    end_date: {
      type: Date,
      required: true,
    },
    number_of_days: {
      type: Number,
      required: true,
      min: 1,
    },
    total_cost: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: true },
  }
);

module.exports = mongoose.model('Booking', bookingSchema);
