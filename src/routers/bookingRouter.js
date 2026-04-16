import express from "express";
import { protect } from "../middleware/auth.js";
import { reserveSeat, confirmBooking, getUserBookings, cancelUserBooking} from "../controller/bookings.js";


const router = express.Router();

router.post("/reserve", protect, reserveSeat);
router.post("/confirm", protect, confirmBooking);
router.get("/my", protect,getUserBookings);
router.post("/:id/cancel", protect, cancelUserBooking);

export default router;