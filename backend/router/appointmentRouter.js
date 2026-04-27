import express from "express";
import {
  approveAppointment,
  cancelAppointment,
  cancelMyAppointment,
  completeAppointment,
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
import roleMiddleware from "../middlewares/roleMiddleware.js";

const router = express.Router();

router.post("/post", isPatientAuthenticated, postAppointment);
router.get("/patient/my", isPatientAuthenticated, getMyAppointments);
router.get("/doctor/my", isDoctorAuthenticated, getDoctorAppointments);
router.get("/getall", isAdminAuthenticated, getAllAppointments);
router.get("/admin/all", roleMiddleware("Admin"), getAllAppointments);
router.put("/update/:id", isAdminAuthenticated, updateAppointmentStatus);
router.put("/approve/:id", isDoctorAuthenticated, approveAppointment);
router.put("/complete/:id", isDoctorAuthenticated, completeAppointment);
router.put("/cancel/:id", isDoctorAuthenticated, cancelAppointment);
router.delete("/patient/cancel/:id", isPatientAuthenticated, cancelMyAppointment);
router.delete("/delete/:id", isAdminAuthenticated, deleteAppointment);

export default router;
