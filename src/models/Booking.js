import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  seats: [{
    seatId: mongoose.Schema.Types.ObjectId,
    seatNumber: String,
    class: String,
    price: Number
  }],
  totalAmount: { type: Number, required: true }, // in paise
  status: { type: String, enum: ['pending', 'confirmed', 'cancelled', 'refunded'], default: 'pending' },
  idempotencyKey: { type: String, unique: true, required: true },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'refunded'], default: 'pending' },
  cancelledAt: Date,
  refundedAt: Date,
  cancelReason: String
}, { timestamps: true });

export default  mongoose.model('Booking', bookingSchema);
