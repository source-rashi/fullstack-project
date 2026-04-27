import {  useContext, useEffect, useRef, useState  } from "react";
import "./App.css";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Home from "./Pages/Home";
import Appointment from "./Pages/Appointment";
import AboutUs from "./Pages/AboutUs";
import Register from "./Pages/Register";
import MyAppointments from "./Pages/MyAppointments";
import DoctorAppointments from "./Pages/DoctorAppointments";
import ContactUs from "./Pages/ContactUs";
import AdminDashboard from "./Pages/AdminDashboard";
import NotFound from "./Pages/NotFound";
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Context } from "./context";
import Login from "./Pages/Login";
import { api } from "./api/client";

const isAuthError = (error) => {
  const status = error?.response?.status;
  return [400, 401, 403, 404].includes(status);
};

const AdminRoute = ({ children }) => {
  const { user } = useContext(Context);
  if (!user || user.role !== "Admin") return <Navigate to="/login" />;
  return children;
};

const App = () => {
  const { isAuthenticated, user, setIsAuthenticated, setUser } =
    useContext(Context);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const hasCachedSessionRef = useRef(
    isAuthenticated && Object.keys(user || {}).length > 0
  );

  useEffect(() => {
    const clearAuthState = () => {
      window.localStorage.removeItem("token");
      setIsAuthenticated(false);
      setUser({});
    };

    const fetchUser = async () => {
      try {
        const response = await api.get("/api/v1/user/me");
        if (response?.data?.isAuthenticated && response?.data?.user) {
          setIsAuthenticated(true);
          setUser(response.data.user);
        } else {
          clearAuthState();
        }
      } catch (error) {
        if (!hasCachedSessionRef.current || isAuthError(error)) {
          clearAuthState();
        } else {
          toast.info(
            "Could not verify session with server. Using cached login state."
          );
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
          <Route path="/contact" element={<ContactUs />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Footer />
        <ToastContainer position="top-center" />
      </Router>
    </>
  );
};

export default App;
