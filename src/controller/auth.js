import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js"

const JWT_SECRET = process.env.JWT_SECRET || 'taski_secret_2024';

// Registeration.

export const register =  async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'All fields required' });

    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ message: 'Email already registered' });

    const user = await User.create({ name, email, password });
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, wallet: user.wallet }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Login

export const login=  async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, wallet: user.wallet }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Seed means we are creating adming and a demo user.
export const seedDb = async (req, res) => {
  try {
    // Admin user
    const adminExists = await User.findOne({ email: 'uzaif123@gmail.com' });
    if (!adminExists) {
      const hashed = await bcrypt.hash('admin123', 12);
      await User.create({
        name: 'Uzaif',
        email: 'uzaif123@gmail.com',
        password: hashed,
        role: 'admin',
        wallet: { balance: 0, transactions: [] }
      });
    } else if (adminExists.role !== 'admin') {
      adminExists.role = 'admin';
      await adminExists.save();
    }

    // Demo user
    const userExists = await User.findOne({ email: 'aamish123@gmail.com' });
    if (!userExists) {
      const hashed = await bcrypt.hash('password123', 12);
      await User.create({
        name: 'Aamish',
        email: 'aamish123@gmail.com',
        password: hashed,
        role: 'user',
        wallet: { balance: 100000, transactions: [{ type: 'credit', amount: 100000, description: 'Welcome bonus' }] }
      });
    }

    res.json({
      message: 'Seeded successfully!',
      admin: 'uzaif123@gmail.com / admin123',
      user: 'aamish123@gmail.com / password123'
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};





