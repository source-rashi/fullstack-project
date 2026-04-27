import mongoose from "mongoose";
import validator from "validator";

const messageSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      minLength: [3, "First Name Must Contain At Least 3 Characters!"],
      maxLength: [30, "First Name can contain up to 30 characters!"],
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      minLength: [3, "Last Name Must Contain At Least 3 Characters!"],
      maxLength: [30, "Last Name can contain up to 30 characters!"],
      trim: true,
    },
    email: {
      type: String,
      required: true,
      validate: [validator.isEmail, "Provide A Valid Email!"],
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      minLength: [10, "Phone number must be exactly 10 digits."],
      maxLength: [10, "Phone number must be exactly 10 digits."],
      match: [/^\d{10}$/, "Phone number must be exactly 10 digits."],
      trim: true,
    },
    message: {
      type: String,
      required: true,
      minLength: [10, "Message Must Contain At Least 10 Characters!"],
      maxLength: [1000, "Message can contain up to 1000 characters!"],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Message = mongoose.model("Message", messageSchema);
