import {  useContext, useEffect, useState  } from "react";
import { toast } from "react-toastify";
import { Context } from "../context";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../api/client";

const sanitizeDigits = (value, maxLength) => {
  return value.replace(/\D/g, "").slice(0, maxLength);
};

const resolveRole = (rawRole) => {
  return rawRole === "Doctor" ? "Doctor" : "Patient";
};

const Register = () => {
  const { isAuthenticated, user, setIsAuthenticated, setUser } = useContext(Context);
  const [searchParams, setSearchParams] = useSearchParams();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [nic, setNic] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [role, setRole] = useState(() => resolveRole(searchParams.get("role")));
  const [doctorDepartment, setDoctorDepartment] = useState("Pediatrics");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const departmentOptions = [
    "Pediatrics",
    "Orthopedics",
    "Cardiology",
    "Neurology",
    "Oncology",
    "Radiology",
    "Physical Therapy",
    "Dermatology",
    "ENT",
  ];

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

  const handleRegistration = async (e) => {
    e.preventDefault();

    if (phone.length !== 11) {
      toast.error("Phone number must be exactly 11 digits.");
      return;
    }

    if (nic.length !== 13) {
      toast.error("NIC must be exactly 13 digits.");
      return;
    }

    if (role === "Doctor" && !doctorDepartment) {
      toast.error("Please select a doctor department.");
      return;
    }

    const payload = {
      firstName,
      lastName,
      email,
      phone,
      nic,
      dob,
      gender,
      password,
    };

    const registrationEndpoint =
      role === "Doctor"
        ? "/api/v1/user/doctor/register"
        : "/api/v1/user/patient/register";

    if (role === "Doctor") {
      payload.doctorDepartment = doctorDepartment;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post(
        registrationEndpoint,
        payload,
        {
          headers: { "Content-Type": "application/json" },
        }
      );
      toast.success(res.data.message);
      setIsAuthenticated(true);
      setUser(res.data.user);
      navigateTo(role === "Doctor" ? "/doctor/appointments" : "/");
      setFirstName("");
      setLastName("");
      setEmail("");
      setPhone("");
      setNic("");
      setDob("");
      setGender("");
      setDoctorDepartment("Pediatrics");
      setPassword("");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Registration failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isAuthenticated) {
    return <Navigate to={user?.role === "Doctor" ? "/doctor/appointments" : "/"} />;
  }

  return (
    <>
      <div className="container form-component register-form">
        <h2>Sign Up</h2>
        <p>Please Sign Up To Continue</p>
        <p>
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Placeat culpa
          voluptas expedita itaque ex, totam ad quod error?
        </p>
        <form onSubmit={handleRegistration}>
          <div>
            <input
              type="text"
              placeholder="First Name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
            <input
              type="text"
              placeholder="Last Name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
          <div>
            <input
              type="text"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]{11}"
              maxLength={11}
              placeholder="Mobile Number"
              value={phone}
              onChange={(e) => setPhone(sanitizeDigits(e.target.value, 11))}
            />
          </div>
          <div>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]{13}"
              maxLength={13}
              placeholder="NIC"
              value={nic}
              onChange={(e) => setNic(sanitizeDigits(e.target.value, 13))}
            />
            <input
              type={"date"}
              placeholder="Date of Birth"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
            />
          </div>
          <div>
            <select value={role} onChange={(e) => handleRoleChange(e.target.value)}>
              <option value="Patient">Register as Patient</option>
              <option value="Doctor">Register as Doctor</option>
            </select>
            {role === "Doctor" ? (
              <select
                value={doctorDepartment}
                onChange={(e) => setDoctorDepartment(e.target.value)}
              >
                {departmentOptions.map((department) => (
                  <option key={department} value={department}>
                    {department}
                  </option>
                ))}
              </select>
            ) : null}
          </div>
          <div>
            <select value={gender} onChange={(e) => setGender(e.target.value)}>
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div
            style={{
              gap: "10px",
              justifyContent: "flex-end",
              flexDirection: "row",
            }}
          >
            <p style={{ marginBottom: 0 }}>Already Registered?</p>
            <Link
              to={role === "Doctor" ? "/login?role=Doctor" : "/login"}
              style={{ textDecoration: "none", color: "#271776ca" }}
            >
              Login Now
            </Link>
          </div>
          <div style={{ justifyContent: "center", alignItems: "center" }}>
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Registering..." : "Register"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default Register;
