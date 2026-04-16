import Event from '../models/Event.js';
import Booking from '../models/Booking.js';
import User from '../models/User.js';

// Create event
export const createEvent = async (req, res) => {
  try {
    const event = await Event.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json(event);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Update event
export const updateEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(event);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Delete event
export const deleteEvent = async (req, res) => {
  try {
    await Event.findByIdAndDelete(req.params.id);
    res.json({ message: 'Event deleted' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Bulk create seats for event
export const seatsCreation = async (req, res) => {
  try {
    const { rows, seatsPerRow, classes } = req.body;
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    const seats = [];
    if (classes && Array.isArray(classes)) {
      for (const cls of classes) {
        for (const row of cls.rows) {
          for (let i = 1; i <= (seatsPerRow || 6); i++) {
            seats.push({ seatNumber: `${row}${i}`, row, class: cls.class, price: cls.price });
          }
        }
      }
    } else {
      const rowLetters = 'ABCDEFGHIJ'.slice(0, rows || 5);
      for (const row of rowLetters) {
        for (let i = 1; i <= (seatsPerRow || 6); i++) {
          seats.push({ seatNumber: `${row}${i}`, row, class: 'economy', price: req.body.price || 500000 });
        }
      }
    }

    event.seats.push(...seats);
    event.totalSeats = event.seats.length;
    event.availableSeats = event.seats.filter(s => s.status === 'available').length;
    await event.save();

    res.json({ message: `${seats.length} seats created`, event });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Get all events
export const getAllEvents = async (req, res) => {
  try {
    const events = await Event.find().sort({ createdAt: -1 });
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all bookings
export const getAllBookings = async (req, res) => {
  try {
    const { status, userId, eventId } = req.query;
    const query = {};
    if (status) query.status = status;
    if (userId) query.user = userId;
    if (eventId) query.event = eventId;

    const bookings = await Booking.find(query)
      .populate('user', 'name email')
      .populate('event', 'title origin destination flightNumber departureTime')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Admin cancel booking with refund
export const adminCancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.status === 'cancelled')
      return res.status(400).json({ message: 'Already cancelled' });

    const event = await Event.findById(booking.event);
    const user = await User.findById(booking.user);

    // Seats wapas available karo
    if (event) {
      booking.seats.forEach(bs => {
        const seat = event.seats.id(bs.seatId);
        if (seat) { seat.status = 'available'; seat.bookedBy = null; }
      });
      event.availableSeats = event.seats.filter(s => s.status === 'available').length;
      await event.save();
    }

    // Refund wallet
    if (user && booking.paymentStatus === 'paid') {
      user.wallet.balance += booking.totalAmount;
      user.wallet.transactions.push({
        type: 'refund',
        amount: booking.totalAmount,
        description: `Admin refund for booking #${booking._id}`,
      });
      await user.save();
    }

    booking.status = 'cancelled';
    booking.paymentStatus = 'refunded';
    booking.cancelledAt = new Date();
    booking.cancelReason = req.body.reason || 'Admin cancellation';
    await booking.save();

    res.json({ message: 'Booking cancelled and refunded', booking });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all users
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ role: 'user' }).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all transactions
export const getAllTransactions = async (req, res) => {
  try {
    const users = await User.find().select('name email wallet.transactions wallet.balance');
    const all = [];
    users.forEach(u => {
      u.wallet.transactions.forEach(t => {
        all.push({ ...t.toObject(), userName: u.name, userEmail: u.email, userId: u._id });
      });
    });
    all.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(all);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Dashboard stats
export const dashboardStats = async (req, res) => {
  try {
    const [totalUsers, totalBookings, confirmedBookings, cancelledBookings, events] =
      await Promise.all([
        User.countDocuments({ role: 'user' }),
        Booking.countDocuments(),
        Booking.countDocuments({ status: 'confirmed' }),
        Booking.countDocuments({ status: 'cancelled' }),
        Event.countDocuments({ status: 'active' }),
      ]);

    const revenueResult = await Booking.aggregate([
      { $match: { status: 'confirmed' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);

    res.json({
      totalUsers,
      totalBookings,
      confirmedBookings,
      cancelledBookings,
      activeEvents: events,
      totalRevenue: revenueResult[0]?.total || 0,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};