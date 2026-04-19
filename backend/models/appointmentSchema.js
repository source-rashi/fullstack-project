import mongoose from "mongoose";
import validator from "validator";
import { DEPARTMENTS } from "../utils/constants.js";

const appointmentSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, "First Name Is Required!"],
      minLength: [3, "First Name Must Contain At Least 3 Characters!"],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, "Last Name Is Required!"],
      minLength: [3, "Last Name Must Contain At Least 3 Characters!"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email Is Required!"],
      validate: [validator.isEmail, "Provide A Valid Email!"],
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: [true, "Phone Is Required!"],
      minLength: [11, "Phone Number Must Contain Exact 11 Digits!"],
      maxLength: [11, "Phone Number Must Contain Exact 11 Digits!"],
      match: [/^\d{11}$/, "Phone Number Must Contain Exact 11 Digits!"],
      trim: true,
    },
    nic: {
      type: String,
      required: [true, "NIC Is Required!"],
      minLength: [13, "NIC Must Contain Only 13 Digits!"],
      maxLength: [13, "NIC Must Contain Only 13 Digits!"],
      match: [/^\d{13}$/, "NIC Must Contain Only 13 Digits!"],
      trim: true,
    },
    dob: {
      type: Date,
      required: [true, "DOB Is Required!"],
    },
    gender: {
      type: String,
      required: [true, "Gender Is Required!"],
      enum: ["Male", "Female"],
    },
    appointment_date: {
      type: Date,
      required: [true, "Appointment Date Is Required!"],
    },
    department: {
      type: String,
      required: [true, "Department Name Is Required!"],
      enum: DEPARTMENTS,
    },
    doctor: {
      firstName: {
        type: String,
        required: [true, "Doctor Name Is Required!"],
        trim: true,
      },
      lastName: {
        type: String,
        required: [true, "Doctor Name Is Required!"],
        trim: true,
      },
    },
    hasVisited: {
      type: Boolean,
      default: false,
    },
    address: {
      type: String,
      required: [true, "Address Is Required!"],
      minLength: [10, "Address must contain at least 10 characters!"],
      maxLength: [500, "Address can contain up to 500 characters!"],
      trim: true,
    },
    doctorId: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "Doctor Id Is Invalid!"],
    },
    patientId: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "Patient Id Is Required!"],
    },
    status: {
      type: String,
      enum: ["Pending", "Accepted", "Rejected"],
      default: "Pending",
    },
  },
  {
    timestamps: true,
  }
);

export const Appointment = mongoose.model("Appointment", appointmentSchema);
