import { config } from "dotenv";
import mongoose from "mongoose";
import { dbConnection } from "../database/dbConnection.js";
import { User } from "../models/userSchema.js";

config({ path: "./config.env" });

const defaults = {
  firstName: process.env.BOOTSTRAP_ADMIN_FIRST_NAME || "Local",
  lastName: process.env.BOOTSTRAP_ADMIN_LAST_NAME || "Admin",
  email: process.env.BOOTSTRAP_ADMIN_EMAIL || "admin@srmap.edu.in",
  password: process.env.BOOTSTRAP_ADMIN_PASSWORD || "Admin@1234",
  phone: process.env.BOOTSTRAP_ADMIN_PHONE || "8639000100",
  nic: process.env.BOOTSTRAP_ADMIN_NIC || "1234567890123",
  dob: process.env.BOOTSTRAP_ADMIN_DOB || "1990-01-01",
  gender: process.env.BOOTSTRAP_ADMIN_GENDER || "Male",
};

const createBootstrapAdmin = async () => {
  await dbConnection();

  const existingAdmin = await User.findOne({ email: defaults.email });
  if (existingAdmin) {
    existingAdmin.firstName = defaults.firstName;
    existingAdmin.lastName = defaults.lastName;
    existingAdmin.phone = defaults.phone;
    existingAdmin.nic = defaults.nic;
    existingAdmin.dob = defaults.dob;
    existingAdmin.gender = defaults.gender;
    existingAdmin.role = "Admin";
    existingAdmin.password = defaults.password;
    await existingAdmin.save();

    console.log(`Admin credentials refreshed for ${defaults.email}`);
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
