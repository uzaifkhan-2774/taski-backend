import express from "express"
import { protect, adminOnly } from "../middleware/auth.js";
import { createEvent, updateEvent, deleteEvent, seatsCreation, getAllEvents, getAllBookings, adminCancelBooking, getAllUsers, getAllTransactions, dashboardStats} from "../controller/admin.js";


const router = express.Router();

// All admin routes require auth + admin role.

router.post("/events", protect, adminOnly, createEvent);
router.put("/events/:id", protect, adminOnly, updateEvent);
router.delete("/events/:id", protect, adminOnly, deleteEvent);
router.post("/events/:id/seats", protect, adminOnly, seatsCreation);
router.get("/events", protect, adminOnly, getAllEvents);
router.get("/bookings", protect, adminOnly, getAllBookings);
router.post("/bookings/:id/cancel", protect, adminOnly, adminCancelBooking);
router.get("/users", protect, adminOnly, getAllUsers);
router.get("/transactions", protect, adminOnly, getAllTransactions);
router.get("/stats", protect, adminOnly, dashboardStats);


export default router;