import express from "express";
import { protect } from "./middleware/auth.js";
import authRouter from "./routers/authRouter.js";
import walletRouter from "./routers/walletRouter.js";
import eventRouter from "./routers/eventRouter.js";
import bookingRouter from "./routers/bookingRouter.js";
import adminRouter from "./routers/adminRouter.js";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

// CORS - allowing all the plateform to access
app.use(cors());

//built-in middleware
app.use(express.json());

// Routes
app.use('/api/auth', authRouter);
app.use('/api/wallet', walletRouter);
app.use('/api/events', eventRouter);
app.use('/api/bookings', bookingRouter);
app.use('/api/admin', adminRouter);

// Health check
app.get('/api/health', (req, res) =>
  res.json({ status: 'OK', message: 'Taski API Running' })
);

// Get own profile
// app.get('/me', protect, async (req, res) => {
//   try {
//     const User = (await import('./models/User.js')).default;
//     const user = await User.findById(req.user._id).select('-password');
//     res.json(user);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// });

export default app;