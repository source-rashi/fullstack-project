import React, { useContext, useEffect, useState } from "react";
import "./App.css";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Home from "./Pages/Home";
import Appointment from "./Pages/Appointment";
import AboutUs from "./Pages/AboutUs";
import Register from "./Pages/Register";
import MyAppointments from "./Pages/MyAppointments";
import DoctorAppointments from "./Pages/DoctorAppointments";
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Context } from "./context";
import Login from "./Pages/Login";
import { api } from "./api/client";
const App = () => {
  const { isAuthenticated, user, setIsAuthenticated, setUser } =
    useContext(Context);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await api.get("/api/v1/user/patient/me");
        setIsAuthenticated(true);
        setUser(response.data.user);
      } catch (error) {
        try {
          const response = await api.get("/api/v1/user/doctor/me");
          setIsAuthenticated(true);
          setUser(response.data.user);
        } catch (doctorError) {
          setIsAuthenticated(false);
          setUser({});
        }
      } finally {
        setIsCheckingAuth(false);
      }
    };
    fetchUser();
  }, [setIsAuthenticated, setUser]);

  if (isCheckingAuth) {
    return <div className="container" style={{ marginTop: "120px" }}>Loading...</div>;
  }

  return (
    <>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/appointment"
            element={
              isAuthenticated && user?.role === "Patient" ? (
                <Appointment />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route
            path="/my-appointments"
            element={
              isAuthenticated && user?.role === "Patient" ? (
                <MyAppointments />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route
            path="/doctor/appointments"
            element={
              isAuthenticated && user?.role === "Doctor" ? (
                <DoctorAppointments />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
        </Routes>
        <Footer />
        <ToastContainer position="top-center" />
      </Router>
    </>
  );
};

export default App;
