import mongoose from "mongoose";

const billingSchema = new mongoose.Schema(
  {
    appointmentId: {
      type: mongoose.Schema.ObjectId,
      ref: "Appointment",
      required: true,
    },
    patientId: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },
    doctorId: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    tax: {
      type: Number,
      required: true,
    },
    discount: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["paid", "unpaid"],
      default: "unpaid",
    },
    paymentMethod: {
      type: String,
      default: "",
    },
    invoiceDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

export const Billing = mongoose.model("Billing", billingSchema);