import {  useContext, useState  } from "react";
import { Context } from "../context";
import { Navigate, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { api } from "../api/client";

const sanitizeDigits = (value, maxLength) => {
  return value.replace(/\D/g, "").slice(0, maxLength);
};

const AddNewAdmin = () => {
  const { isAuthenticated, setIsAuthenticated } = useContext(Context);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [nic, setNic] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [phoneError, setPhoneError] = useState("");

  const navigateTo = useNavigate();

  const handleAddNewAdmin = async (e) => {
    e.preventDefault();

    if (phone.length !== 10) {
      toast.error("Phone number must be exactly 10 digits.");
      return;
    }

    if (nic.length !== 13) {
      toast.error("NIC must be exactly 13 digits.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post(
        "/api/v1/user/admin/addnew",
        { firstName, lastName, email, phone, nic, dob, gender, password },
        {
          headers: { "Content-Type": "application/json" },
        }
      );
      toast.success(res.data.message);
      setIsAuthenticated(true);
      navigateTo("/");
      setFirstName("");
      setLastName("");
      setEmail("");
      setPhone("");
      setNic("");
      setDob("");
      setGender("");
      setPassword("");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to add admin");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return <Navigate to={"/login"} />;
  }

  return (
    <section className="page">
      <section className="container form-component add-admin-form">
      <img src="/logo.png" alt="logo" className="logo"/>
        <h1 className="form-title">ADD NEW ADMIN</h1>
        <form onSubmit={handleAddNewAdmin}>
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
              type="tel"
              inputMode="numeric"
              pattern="\d{10}"
              maxLength={10}
              placeholder="Mobile Number"
              value={phone}
              onChange={(e) => setPhone(sanitizeDigits(e.target.value, 10))}
              onKeyPress={(e) => {
                if (!/[0-9]/.test(e.key) || phone.length >= 10) e.preventDefault();
              }}
              onPaste={(e) => {
                e.preventDefault();
                const pasted = e.clipboardData.getData('text');
                const sanitized = sanitizeDigits(pasted, 10);
                setPhone(sanitized);
              }}
              onBlur={() => {
                if (phone.length !== 10) setPhoneError("Phone number must be exactly 10 digits.");
                else setPhoneError("");
              }}
            />
            {phoneError && <span className="error-message">{phoneError}</span>}
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
          <div style={{ justifyContent: "center", alignItems: "center" }}>
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating Admin..." : "ADD NEW ADMIN"}
            </button>
          </div>
        </form>
      </section>
    </section>
  );
};

export default AddNewAdmin;
