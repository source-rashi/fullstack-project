import {  useContext, useEffect, useState  } from "react";
import { toast } from "react-toastify";
import { Context } from "../context";
import { Link, useNavigate, Navigate, useSearchParams } from "react-router-dom";
import { api } from "../api/client";

const resolveRole = (rawRole) => {
  if (rawRole === "Doctor") return "Doctor";
  if (rawRole === "Admin") return "Admin";
  return "Patient";
};

const Login = () => {
  const { isAuthenticated, user, setIsAuthenticated, setUser } = useContext(Context);
  const [searchParams, setSearchParams] = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(() => resolveRole(searchParams.get("role")));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigateTo = useNavigate();

  useEffect(() => {
    setRole(resolveRole(searchParams.get("role")));
  }, [searchParams]);

  const handleRoleChange = (nextRole) => {
    const resolvedRole = resolveRole(nextRole);
    setRole(resolvedRole);
    if (resolvedRole === "Doctor") {
      setSearchParams({ role: "Doctor" });
      return;
    }
    if (resolvedRole === "Admin") {
      setSearchParams({ role: "Admin" });
      return;
    }

    setSearchParams({});
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await api.post(
        "/api/v1/user/login",
        { email, password, role },
        {
          headers: { "Content-Type": "application/json" },
        }
      );
      toast.success(res.data.message);
      if (res?.data?.token) {
        window.localStorage.setItem("token", res.data.token);
      }
      setIsAuthenticated(true);
      setUser(res.data.user);
      navigateTo(role === "Doctor" ? "/doctor/appointments" : role === "Admin" ? "/admin" : "/");
      setEmail("");
      setPassword("");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isAuthenticated) {
    const targetUrl = user?.role === "Doctor" ? "/doctor/appointments" : user?.role === "Admin" ? "/admin" : "/";
    return <Navigate to={targetUrl} />;
  }

  return (
    <>
      <div className="container form-component login-form">
        <h2>Sign In</h2>
        <p>Please Login To Continue</p>
        <form onSubmit={handleLogin}>
          <input
            type="email"
            autoComplete="username"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: '100%', paddingRight: '40px' }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#888',
                fontSize: '14px',
                padding: 0
              }}
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>
          <select value={role} onChange={(e) => handleRoleChange(e.target.value)}>
            <option value="Patient">Patient</option>
            <option value="Doctor">Doctor</option>
            <option value="Admin">Admin</option>
          </select>
          <div
            style={{
              gap: "10px",
              justifyContent: "flex-end",
              flexDirection: "row",
            }}
          >
            <p style={{ marginBottom: 0 }}>Not Registered?</p>
            <Link
              to={role === "Doctor" ? "/register?role=Doctor" : "/register"}
              style={{ textDecoration: "none", color: "#271776ca" }}
            >
              Register Now
            </Link>
          </div>
          <div style={{ justifyContent: "center", alignItems: "center" }}>
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Logging in..." : "Login"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default Login;
