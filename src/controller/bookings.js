
import mongoose from 'mongoose';
import Event from '../models/Event.js';
import Booking from '../models/Booking.js';
import User from '../models/User.js';
import { v4 as uuidv4 } from "uuid";

// Reserve seats (5 min lock)

export const reserveSeat =  async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { eventId, seatIds } = req.body;
    if (!eventId || !seatIds?.length) return res.status(400).json({ message: 'eventId and seatIds required' });

    const event = await Event.findById(eventId).session(session);
    if (!event) return res.status(404).json({ message: 'Flight not found' });

    const now = new Date();
    const expiry = new Date(now.getTime() + 5 * 60 * 1000); // 5 min

    const reservedSeats = [];
    for (const seatId of seatIds) {
      const seat = event.seats.id(seatId);
      if (!seat) throw new Error(`Seat ${seatId} not found`);

      // Release if expired
      if (seat.status === 'reserved' && seat.reservationExpiry < now) {
        seat.status = 'available';
        seat.reservedBy = null;
        seat.reservationExpiry = null;
      }

      if (seat.status !== 'available') throw new Error(`Seat ${seat.seatNumber} is not available`);

      seat.status = 'reserved';
      seat.reservedBy = req.user._id;
      seat.reservedAt = now;
      seat.reservationExpiry = expiry;
      reservedSeats.push({ seatId: seat._id, seatNumber: seat.seatNumber, class: seat.class, price: seat.price });
    }

    await event.save({ session });
    await session.commitTransaction();

    res.json({ message: 'Seats reserved for 5 minutes', seats: reservedSeats, expiry });
  } catch (err) {
    await session.abortTransaction();
    res.status(400).json({ message: err.message });
  } finally {
    session.endSession();
  }
}

// Confirm booking (atomic: debit wallet + confirm seats)

export const confirmBooking = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { eventId, seatIds, idempotencyKey } = req.body;
    const key = idempotencyKey || uuidv4();

    // Idempotency: check if booking already exists
    const existingBooking = await Booking.findOne({ idempotencyKey: key }).session(session);
    if (existingBooking) {
      await session.abortTransaction();
      return res.json({ message: 'Already booked', booking: existingBooking });
    }

    const event = await Event.findById(eventId).session(session);
    if (!event || event.status !== 'active') throw new Error('Flight not available');

    const user = await User.findById(req.user._id).session(session);
    const now = new Date();

    let totalAmount = 0;
    const bookedSeats = [];

    for (const seatId of seatIds) {
      const seat = event.seats.id(seatId);
      if (!seat) throw new Error(`Seat not found`);

      // Must be reserved by this user and not expired
      if (seat.status !== 'reserved') throw new Error(`Seat ${seat.seatNumber} is not reserved`);
      if (String(seat.reservedBy) !== String(req.user._id)) throw new Error(`Seat ${seat.seatNumber} reserved by another user`);
      if (seat.reservationExpiry < now) throw new Error(`Reservation for seat ${seat.seatNumber} has expired`);

      totalAmount += seat.price;
      bookedSeats.push({ seatId: seat._id, seatNumber: seat.seatNumber, class: seat.class, price: seat.price });
    }

    // Check wallet balance
    if (user.wallet.balance < totalAmount) throw new Error('Insufficient wallet balance');

    // Debit wallet
    user.wallet.balance -= totalAmount;
    user.wallet.transactions.push({
      type: 'debit',
      amount: totalAmount,
      description: `Booking: ${event.flightNumber || event.title} - ${bookedSeats.map(s => s.seatNumber).join(', ')}`,
      idempotencyKey: key
    });

    // Mark seats as booked
    for (const seatId of seatIds) {
      const seat = event.seats.id(seatId);
      seat.status = 'booked';
      seat.bookedBy = req.user._id;
      seat.reservedBy = null;
      seat.reservationExpiry = null;
    }

    event.availableSeats = event.seats.filter(s => s.status === 'available').length;

    // Create booking record
    const booking = new Booking({
      user: req.user._id,
      event: eventId,
      seats: bookedSeats,
      totalAmount,
      status: 'confirmed',
      paymentStatus: 'paid',
      idempotencyKey: key
    });

    await user.save({ session });
    await event.save({ session });
    await booking.save({ session });
    await session.commitTransaction();

    res.status(201).json({ message: 'Booking confirmed!', booking, walletBalance: user.wallet.balance });
  } catch (err) {
    await session.abortTransaction();
    res.status(400).json({ message: err.message });
  } finally {
    session.endSession();
  }
}

// Get user bookings

export const getUserBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate('event', 'title origin destination departureTime arrivalTime flightNumber airline')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// Cancel booking (user)
export const cancelUserBooking =  async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const booking = await Booking.findOne({ _id: req.params.id, user: req.user._id }).session(session);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.status === 'cancelled') return res.status(400).json({ message: 'Already cancelled' });

    const event = await Event.findById(booking.event).session(session);
    const user = await User.findById(req.user._id).session(session);

    // Free seats
    if (event) {
      booking.seats.forEach(bs => {
        const seat = event.seats.id(bs.seatId);
        if (seat) { seat.status = 'available'; seat.bookedBy = null; }
      });
      event.availableSeats = event.seats.filter(s => s.status === 'available').length;
      await event.save({ session });
    }

    // Refund wallet
    user.wallet.balance += booking.totalAmount;
    user.wallet.transactions.push({
      type: 'refund',
      amount: booking.totalAmount,
      description: `Refund for booking #${booking._id}`
    });
    await user.save({ session });

    booking.status = 'cancelled';
    booking.paymentStatus = 'refunded';
    booking.cancelledAt = new Date();
    await booking.save({ session });

    await session.commitTransaction();
    res.json({ message: 'Booking cancelled and refunded', booking });
  } catch (err) {
    await session.abortTransaction();
    res.status(500).json({ message: err.message });
  } finally {
    session.endSession();
  }
}


