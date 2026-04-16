import express from "express";
import { protect } from "./middleware/auth.js";
import authRouter from "./routers/authRouter.js"
import walletRouter from "./routers/walletRouter.js";
import eventRouter from "./routers/eventRouter.js"
import bookingRouter from "./routers/bookingRouter.js"
import adminRouter from "./routers/adminRouter.js";
import cors from "cors";
import dotenv from "dotenv";

const app = express();
 
dotenv.config();

// Adds headers: Access-Control-Allow-Origin: *
app.use(cors());

//built-in middleware for taking the request payload from user and store it into body;
app.use(express.json());



// mounting the routers

app.use('/api/auth', authRouter);
app.use('/api/wallet', walletRouter);
app.use('/api/events', eventRouter);
app.use('/api/bookings', bookingRouter);
app.use('/api/admin', adminRouter);

app.get('/api/health', (req, res) => res.json({ status: 'OK', message: 'Taski API Running' }));

// get own profile.


app.get('/me', protect, async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');
  res.json(user);
});


export default app;