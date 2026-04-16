import express from "express";
import { getAllEvents, getSingleEvent} from "../controller/events.js";
import { protect } from "../middleware/auth.js";


const router = express.Router();


router.get("/", getAllEvents);
router.get("/:id", protect, getSingleEvent);

export default router;