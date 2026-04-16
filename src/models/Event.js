import mongoose from "mongoose";

const seatSchema = new mongoose.Schema({
  seatNumber: { type: String, required: true },
  row: String,
  class: { type: String, enum: ['economy', 'business', 'first'], default: 'economy' },
  price: { type: Number, required: true }, // in paise
  status: { type: String, enum: ['available', 'reserved', 'booked'], default: 'available' },
  reservedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  reservedAt: { type: Date, default: null },
  reservationExpiry: { type: Date, default: null },
  bookedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  idempotencyKey: { type: String, default: null }
});

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  origin: { type: String, required: true },
  destination: { type: String, required: true },
  originCode: String,
  destinationCode: String,
  departureTime: { type: Date, required: true },
  arrivalTime: { type: Date, required: true },
  airline: String,
  flightNumber: String,
  image: String,
  totalSeats: { type: Number, default: 0 },
  availableSeats: { type: Number, default: 0 },
  seats: [seatSchema],
  status: { type: String, enum: ['active', 'cancelled', 'completed'], default: 'active' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

export default mongoose.model('Event', eventSchema);
