import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import { User } from "../models/userSchema.js";
import { Appointment } from "../models/appointmentSchema.js";
import { Billing } from "../models/billingSchema.js";

// Get dashboard stats for admin
export const getDashboardStats = catchAsyncErrors(async (req, res, next) => {
  const totalPatients = await User.countDocuments({ role: "Patient" });
  const totalDoctors = await User.countDocuments({ role: "Doctor" });
  const todaysAppointments = await Appointment.countDocuments({
    appointment_date: {
      $gte: new Date().setHours(0, 0, 0, 0),
      $lt: new Date().setHours(23, 59, 59, 999),
    },
  });
  const unpaidBills = await Billing.countDocuments({ status: "unpaid" });

  res.status(200).json({
    success: true,
    totalPatients,
    totalDoctors,
    todaysAppointments,
    unpaidBills,
  });
});