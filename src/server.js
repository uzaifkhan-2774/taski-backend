import app from "./app.js";
import connectDb from "./config/connectDb.js";
import {releaseExpiredReservations} from "./utils/scheduler.js";
const PORT = process.env.PORT;



  //calling the DB.
   
  connectDb();
  
//making server and listening it to port 
 app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`)
    });



// Auto-release expired reservations every minute it 


setInterval(releaseExpiredReservations, 60 * 1000);

export default app;
