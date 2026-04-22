import { config } from "dotenv";
import mongoose from "mongoose";
import { dbConnection } from "../database/dbConnection.js";
import { User } from "../models/userSchema.js";

config({ path: "./config.env" });

const defaults = {
  firstName: process.env.BOOTSTRAP_ADMIN_FIRST_NAME || "Local",
  lastName: process.env.BOOTSTRAP_ADMIN_LAST_NAME || "Admin",
  email: process.env.BOOTSTRAP_ADMIN_EMAIL || "admin@hms.local",
  password: process.env.BOOTSTRAP_ADMIN_PASSWORD || "Admin@12345",
  phone: process.env.BOOTSTRAP_ADMIN_PHONE || "03001234567",
  nic: process.env.BOOTSTRAP_ADMIN_NIC || "1234567890123",
  dob: process.env.BOOTSTRAP_ADMIN_DOB || "1990-01-01",
  gender: process.env.BOOTSTRAP_ADMIN_GENDER || "Male",
};

const createBootstrapAdmin = async () => {
  await dbConnection();

  const existingAdmin = await User.findOne({ email: defaults.email });
  if (existingAdmin) {
    console.log(`Admin already exists for ${defaults.email}`);
    return;
  }

  await User.create({
    firstName: defaults.firstName,
    lastName: defaults.lastName,
    email: defaults.email,
    password: defaults.password,
    phone: defaults.phone,
    nic: defaults.nic,
    dob: defaults.dob,
    gender: defaults.gender,
    role: "Admin",
  });

  console.log(`Bootstrap admin created for ${defaults.email}`);
};

createBootstrapAdmin()
  .catch((error) => {
    console.error("Failed to bootstrap admin user:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  });
