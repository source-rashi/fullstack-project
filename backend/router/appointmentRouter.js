import express from "express";
import {
  cancelMyAppointment,
  deleteAppointment,
  getDoctorAppointments,
  getAllAppointments,
  getMyAppointments,
  postAppointment,
  updateAppointmentStatus,
} from "../controller/appointmentController.js";
import {
  isAdminAuthenticated,
  isDoctorAuthenticated,
  isPatientAuthenticated,
} from "../middlewares/auth.js";

const router = express.Router();

router.post("/post", isPatientAuthenticated, postAppointment);
router.get("/patient/my", isPatientAuthenticated, getMyAppointments);
router.get("/doctor/my", isDoctorAuthenticated, getDoctorAppointments);
router.get("/getall", isAdminAuthenticated, getAllAppointments);
router.put("/update/:id", isAdminAuthenticated, updateAppointmentStatus);
router.delete("/patient/cancel/:id", isPatientAuthenticated, cancelMyAppointment);
router.delete("/delete/:id", isAdminAuthenticated, deleteAppointment);

export default router;
