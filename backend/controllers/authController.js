import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const register = async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ error: 'Email already registered' });
    const passwordHash = await bcrypt.hash(password, 10);
    // Provide default name from email if not provided
    const userName = name || email.split('@')[0];
    const user = await User.create({ email, passwordHash, name: userName });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'changeme', { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, email: user.email, name: user.name } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'changeme', { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, email: user.email, name: user.name } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
