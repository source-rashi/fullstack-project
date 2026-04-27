import {  useContext, useState  } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GiHamburgerMenu } from "react-icons/gi";
import { toast } from "react-toastify";
import { Context } from "../context";
import { api } from "../api/client";
import LiveClock from "./LiveClock";

const Navbar = () => {
  const [show, setShow] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { isAuthenticated, user, setIsAuthenticated, setUser } = useContext(Context);
  const navigateTo = useNavigate();

  const handleLogout = async () => {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);
    const logoutEndpoint =
      user?.role === "Doctor"
        ? "/api/v1/user/doctor/logout"
        : user?.role === "Admin"
        ? "/api/v1/user/admin/logout"
        : "/api/v1/user/patient/logout";

    await api
      .post(logoutEndpoint)
      .then((res) => {
        toast.success(res.data.message);
        window.localStorage.removeItem("token");
        setIsAuthenticated(false);
        setUser({});
        navigateTo("/login");
      })
      .catch((err) => {
        toast.error(err?.response?.data?.message || "Logout failed");
      })
      .finally(() => {
        setIsLoggingOut(false);
      });
  };

  const goToLogin = () => {
    navigateTo("/login");
  };

  const goToRegister = () => {
    navigateTo("/register");
  };

  return (
    <>
      <nav className={"container"}>
        <div className="logo">
          <img src="/logo.png" alt="logo" className="logo-img" />
        </div>
        <div className={show ? "navLinks showmenu" : "navLinks"}>
          <div className="links">
            <Link to={"/"} onClick={() => setShow(!show)}>
              Home
            </Link>
            {isAuthenticated && user?.role === "Patient" ? (
              <>
                <Link to={"/appointment"} onClick={() => setShow(!show)}>
                  Appointment
                </Link>
                <Link to={"/my-appointments"} onClick={() => setShow(!show)}>
                  My Appointments
                </Link>
              </>
            ) : null}
            {isAuthenticated && user?.role === "Doctor" ? (
              <Link to={"/doctor/appointments"} onClick={() => setShow(!show)}>
                Doctor Panel
              </Link>
            ) : null}
            {user?.role === 'Admin' && (
              <Link to={"/admin"} onClick={() => setShow(!show)}>
                Admin Panel
              </Link>
            )}
            {!isAuthenticated ? (
              <Link to={"/login?role=Doctor"} onClick={() => setShow(!show)}>
                Doctor
              </Link>
            ) : null}
            <Link to={"/about"} onClick={() => setShow(!show)}>
              About Us
            </Link>
          </div>
          <div className="navbar-actions">
            {isAuthenticated ? (
              <button className="logoutBtn btn" onClick={handleLogout} disabled={isLoggingOut}>
                {isLoggingOut ? "LOGGING OUT..." : "LOGOUT"}
              </button>
            ) : (
              <div className="navbar-auth-buttons">
                <button className="loginBtn btn" onClick={goToLogin}>
                  LOGIN
                </button>
                <button className="loginBtn btn" onClick={goToRegister}>
                  REGISTER
                </button>
              </div>
            )}
            <LiveClock />
          </div>
        </div>
        <div className="hamburger" onClick={() => setShow(!show)}>
          <GiHamburgerMenu />
        </div>
      </nav>
    </>
  );
};

export default Navbar;
