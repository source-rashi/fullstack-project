import express from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/userSchema.js";
import { Appointment } from "../models/appointmentSchema.js";
import { Billing } from "../models/billingSchema.js";
import roleMiddleware from "../middlewares/roleMiddleware.js";

const router = express.Router();

const buildFullName = (entity) => {
  if (!entity) {
    return "";
  }

  const fullName = `${entity.firstName || ""} ${entity.lastName || ""}`.trim();
  return fullName || "N/A";
};

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const bearerToken = authHeader.toLowerCase().startsWith("bearer ")
    ? authHeader.slice(7).trim()
    : null;
  const cookieToken = req.cookies?.adminToken;
  const candidateTokens = [bearerToken, cookieToken].filter(Boolean);

  if (candidateTokens.length === 0) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  for (const token of candidateTokens) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
      const user = await User.findById(decoded.id);

      if (user) {
        req.user = user;
        return next();
      }
    } catch (error) {
      // Try the next candidate token if present.
    }
  }

  return res.status(401).json({ error: "Invalid token" });
};

// All admin routes require auth + admin role
router.use(authMiddleware);
router.use(roleMiddleware("Admin"));

// GET all users
router.get("/users", async (req, res) => {
  try {
    const users = await User.find({}, "-password").sort({ createdAt: -1 });
    const normalizedUsers = users.map((user) => {
      const userObj = user.toObject();
      return {
        ...userObj,
        name: buildFullName(userObj),
      };
    });

    res.json(normalizedUsers);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE user
router.delete("/users/:id", async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET all appointments (with patient + doctor names)
router.get("/appointments", async (req, res) => {
  try {
    const appts = await Appointment.find()
      .populate("patientId", "firstName lastName email")
      .populate("doctorId", "firstName lastName doctorDepartment")
      .sort({ appointment_date: -1 });

    const normalizedAppointments = appts.map((appt) => {
      const appointment = appt.toObject();
      const patient = appointment.patientId;
      const doctor = appointment.doctorId;

      return {
        ...appointment,
        date: appointment.appointment_date,
        reason: appointment.department,
        patientId: patient
          ? {
              ...patient,
              name: buildFullName(patient),
            }
          : null,
        doctorId: doctor
          ? {
              ...doctor,
              name: buildFullName(doctor),
              specialization: doctor.doctorDepartment || "",
            }
          : null,
      };
    });

    res.json(normalizedAppointments);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET all billing
router.get("/billing", async (req, res) => {
  try {
    const bills = await Billing.find()
      .populate("patientId", "firstName lastName email")
      .populate("doctorId", "firstName lastName")
      .sort({ invoiceDate: -1 });

    const normalizedBills = bills.map((bill) => {
      const billing = bill.toObject();
      const patient = billing.patientId;
      const doctor = billing.doctorId;

      return {
        ...billing,
        patientId: patient
          ? {
              ...patient,
              name: buildFullName(patient),
            }
          : null,
        doctorId: doctor
          ? {
              ...doctor,
              name: buildFullName(doctor),
            }
          : null,
      };
    });

    res.json(normalizedBills);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Mark bill as paid
router.put("/billing/:id/pay", async (req, res) => {
  try {
    const bill = await Billing.findByIdAndUpdate(
      req.params.id,
      { status: "paid" },
      { new: true }
    );
    res.json(bill);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Cancel appointment from admin dashboard tab
router.put("/appointments/:id/cancel", async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status: "cancelled" },
      { new: true }
    );
    res.json(appointment);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;