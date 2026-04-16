import Event from "../models/Event.js";

export const releaseExpiredReservations = async () => {
  try {
    const now = new Date();
    const events = await Event.find({ 'seats.status': 'reserved', 'seats.reservationExpiry': { $lt: now } });

    for (const event of events) {
      let changed = false;
      event.seats.forEach(seat => {
        if (seat.status === 'reserved' && seat.reservationExpiry && seat.reservationExpiry < now) {
          seat.status = 'available';
          seat.reservedBy = null;
          seat.reservedAt = null;
          seat.reservationExpiry = null;
          changed = true;
        }
      });
      if (changed) {
        event.availableSeats = event.seats.filter(s => s.status === 'available').length;
        await event.save();
      }
    }
  } catch (err) {
    console.error('Error releasing expired reservations:', err.message);
  }
};
