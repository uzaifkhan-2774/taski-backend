 // file for creation of default admin and demo user.

import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "./src/models/User.js"

const MONGO_URI = process.env.MONGO_URI;

 // configureing dotenv file.
dotenv.config();


async function seed() {

  // connecting to mongodb.

  await mongoose.connect(MONGO_URI)
  console.log('MongoDB connected')

  //  creating Admin user
  const adminExists = await User.findOne({ email: 'uzaif123@gmailcom' })
  if (!adminExists) {
    await User.create({
      name: 'Uzaif',
      email: 'uzaif123@gmail.com',
      password: 'admin123',
      role: 'admin',
      wallet: { balance: 0, transactions: [] }
    })
    console.log(' Admin created: admin123@gmail.com / admin123')
  } else {
    //  if the admin role is not admin by any chance update the role as 
    
    if (adminExists.role !== 'admin') {
      adminExists.role = 'admin'
      await adminExists.save()
      console.log(' Admin role updated for admin123@gmail.com')
    } else {
      console.log(' Admin already exists')
    }
  }

  // creating Demo user
  const userExists = await User.findOne({ email: 'aamish123@gmail.com' })
  if (!userExists) {
    await User.create({
      name: ' Aamish',
      email: 'aamish123@gmail.com',
      password: 'password123',
      role: 'user',
      wallet: { balance: 100000, transactions: [{ type: 'credit', amount: 100000, description: 'Welcome bonus ₹1,000' }] }
    })
    console.log(' Demo user created: user123@gamil.com   password123  with ₹1,000 wallet')
  } else {
    console.log('  Demo user already exists')
  }

  console.log('admin and demo user created successfully ')
  process.exit(0)
}

// calling the function for creation of admin and demo user.

seed().then((res)=>{
  console.log(res, "admin and user demo created successfully.")
})
.catch(err => { console.error(err); process.exit(1) })
