import {  useContext, useEffect, useState  } from "react";
import { toast } from "react-toastify";
import { Context } from "../context";
import { Link, useNavigate, Navigate, useSearchParams } from "react-router-dom";
import { api } from "../api/client";

const resolveRole = (rawRole) => {
  return rawRole === "Doctor" ? "Doctor" : "Patient";
};

const Login = () => {
  const { isAuthenticated, user, setIsAuthenticated, setUser } = useContext(Context);
  const [searchParams, setSearchParams] = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState(() => resolveRole(searchParams.get("role")));
  const [isSubmitting, setIsSubmitting] = useState(false);

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

    setSearchParams({});
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await api.post(
        "/api/v1/user/login",
        { email, password, confirmPassword, role },
        {
          headers: { "Content-Type": "application/json" },
        }
      );
      toast.success(res.data.message);
      setIsAuthenticated(true);
      setUser(res.data.user);
      navigateTo(role === "Doctor" ? "/doctor/appointments" : "/");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isAuthenticated) {
    return <Navigate to={user?.role === "Doctor" ? "/doctor/appointments" : "/"} />;
  }

  return (
    <>
      <div className="container form-component login-form">
        <h2>Sign In</h2>
        <p>Please Login To Continue</p>
        <p>
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Placeat culpa
          voluptas expedita itaque ex, totam ad quod error?
        </p>
        <form onSubmit={handleLogin}>
          <input
            type="text"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <select value={role} onChange={(e) => handleRoleChange(e.target.value)}>
            <option value="Patient">Patient</option>
            <option value="Doctor">Doctor</option>
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
