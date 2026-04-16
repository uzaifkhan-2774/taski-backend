
import Event from "../models/Event.js";

// List all active events

export const getAllEvents =  async (req, res) => {
  try {
    const { origin, destination, date } = req.query;
    let query = { status: 'active' };

    if (origin) query.origin = new RegExp(origin, 'i');
    if (destination) query.destination = new RegExp(destination, 'i');
    if (date) {
      const start = new Date(date);
      const end = new Date(date);
      end.setDate(end.getDate() + 1);
      query.departureTime = { $gte: start, $lt: end };
    }

    const events = await Event.find(query).select('-seats.reservedBy -seats.bookedBy').sort({ departureTime: 1 });
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// Get single event with seats
export const getSingleEvent =  async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Flight not found' });

    // Release expired reservations
    const now = new Date();
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
    if (changed) await event.save();

    res.json(event);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


