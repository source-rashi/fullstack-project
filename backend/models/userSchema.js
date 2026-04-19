import mongoose from "mongoose";
import validator from "validator";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { DEPARTMENTS } from "../utils/constants.js";

const userSchema = new mongoose.Schema(
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
      unique: true,
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
    password: {
      type: String,
      required: [true, "Password Is Required!"],
      minLength: [8, "Password Must Contain At Least 8 Characters!"],
      select: false,
    },
    role: {
      type: String,
      required: [true, "User Role Required!"],
      enum: ["Patient", "Doctor", "Admin"],
    },
    doctorDepartment: {
      type: String,
      enum: DEPARTMENTS,
      required: function () {
        return this.role === "Doctor";
      },
    },
    docAvatar: {
      public_id: String,
      url: String,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.generateJsonWebToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRES,
  });
};

export const User = mongoose.model("User", userSchema);
