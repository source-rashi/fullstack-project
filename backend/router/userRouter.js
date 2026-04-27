import express from "express";
import {
  addNewAdmin,
  addNewDoctor,
  deleteUser,
  doctorRegister,
  getAllDoctors,
  getAllUsers,
  getSessionUser,
  getUserDetails,
  login,
  logoutAdmin,
  logoutDoctor,
  logoutPatient,
  patientRegister,
} from "../controller/userController.js";
import {
  isAdminAuthenticated,
  isDoctorAuthenticated,
  isPatientAuthenticated,
} from "../middlewares/auth.js";
import roleMiddleware from "../middlewares/roleMiddleware.js";

const router = express.Router();

router.post("/patient/register", patientRegister);
router.post("/doctor/register", doctorRegister);
router.post("/login", login);
router.post("/admin/addnew", isAdminAuthenticated, addNewAdmin);
router.post("/doctor/addnew", isAdminAuthenticated, addNewDoctor);
router.get("/doctors", getAllDoctors);
router.get("/me", getSessionUser);
router.get("/getall", isAdminAuthenticated, getAllUsers);
router.get("/admin/all", roleMiddleware("Admin"), getAllUsers);
router.delete("/admin/:id", roleMiddleware("Admin"), deleteUser);
router.get("/patient/me", isPatientAuthenticated, getUserDetails);
router.get("/doctor/me", isDoctorAuthenticated, getUserDetails);
router.get("/admin/me", isAdminAuthenticated, getUserDetails);
router.get("/patient/logout", isPatientAuthenticated, logoutPatient);
router.get("/doctor/logout", isDoctorAuthenticated, logoutDoctor);
router.get("/admin/logout", isAdminAuthenticated, logoutAdmin);
router.post("/patient/logout", isPatientAuthenticated, logoutPatient);
router.post("/doctor/logout", isDoctorAuthenticated, logoutDoctor);
router.post("/admin/logout", isAdminAuthenticated, logoutAdmin);

export default router;
