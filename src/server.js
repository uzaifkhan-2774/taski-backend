import app from "./app.js";
import connectDb from "./config/connectDb.js";
import { releaseExpiredReservations } from "./utils/scheduler.js";

const PORT = process.env.PORT || 5000;

// DB connect 
connectDb();

// listening to server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Expired reservations auto-release every minute
setInterval(releaseExpiredReservations, 60 * 1000);

export default app;