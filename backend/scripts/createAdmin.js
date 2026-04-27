import { config } from 'dotenv';
import mongoose from 'mongoose';
import { User } from '../models/userSchema.js';

config({ path: '../config.env' });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017';
const dbName = process.env.MONGO_DB_NAME || "MERN_STACK_HOSPITAL_MANAGEMENT_SYSTEM_DEPLOYED";

mongoose.connect(MONGO_URI, { dbName }).then(async () => {
  const exists = await User.findOne({ email: 'admin@srmap.edu.in' });
  if (exists) { console.log('Admin already exists'); return process.exit(0); }
  await User.create({
    firstName: 'System',
    lastName: 'Admin',
    email: 'admin@srmap.edu.in',
    password: 'Admin@1234',
    role: 'Admin',
    phone: '8639000100',
    nic: '1234567890123',
    dob: new Date('1990-01-01'),
    gender: 'Male'
  });
  console.log('Done. Login: admin@srmap.edu.in / Admin@1234');
  process.exit(0);
}).catch(e => { console.error(e); process.exit(1); });