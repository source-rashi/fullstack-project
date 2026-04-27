import {  useContext, useState  } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Context } from "../context";
import { api } from "../api/client";

const sanitizeDigits = (value, maxLength) => {
  return value.replace(/\D/g, "").slice(0, maxLength);
};

const AddNewDoctor = () => {
  const { isAuthenticated, setIsAuthenticated } = useContext(Context);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [nic, setNic] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [password, setPassword] = useState("");
  const [doctorDepartment, setDoctorDepartment] = useState("");
  const [docAvatar, setDocAvatar] = useState("");
  const [docAvatarPreview, setDocAvatarPreview] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [phoneError, setPhoneError] = useState("");

  const navigateTo = useNavigate();

  const departmentsArray = [
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

  const handleAvatar = (e) => {
    const file = e.target.files[0];
    if (!file) {
      setDocAvatar("");
      setDocAvatarPreview("");
      return;
    }
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      setDocAvatarPreview(reader.result);
      setDocAvatar(file);
    };
  };

  const handleAddNewDoctor = async (e) => {
    e.preventDefault();

    if (phone.length !== 10) {
      toast.error("Phone number must be exactly 10 digits.");
      return;
    }

    if (nic.length !== 13) {
      toast.error("NIC must be exactly 13 digits.");
      return;
    }

    if (!docAvatar) {
      toast.error("Doctor avatar is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("firstName", firstName);
      formData.append("lastName", lastName);
      formData.append("email", email);
      formData.append("phone", phone);
      formData.append("password", password);
      formData.append("nic", nic);
      formData.append("dob", dob);
      formData.append("gender", gender);
      formData.append("doctorDepartment", doctorDepartment);
      formData.append("docAvatar", docAvatar);
      const res = await api.post("/api/v1/user/doctor/addnew", formData, {
          headers: { "Content-Type": "multipart/form-data" },
      });
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
      setDoctorDepartment("");
      setDocAvatar("");
      setDocAvatarPreview("");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to add doctor");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return <Navigate to={"/login"} />;
  }
  return (
    <section className="page">
      <section className="container add-doctor-form">
        <img src="/logo.png" alt="logo" className="logo"/>
        <h1 className="form-title">REGISTER A NEW DOCTOR</h1>
        <form onSubmit={handleAddNewDoctor}>
          <div className="first-wrapper">
            <div>
              <img
                src={
                  docAvatarPreview ? `${docAvatarPreview}` : "/docHolder.jpg"
                }
                alt="Doctor Avatar"
              />
              <input type="file" onChange={handleAvatar} />
            </div>
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
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
              >
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
              <select
                value={doctorDepartment}
                onChange={(e) => {
                  setDoctorDepartment(e.target.value);
                }}
              >
                <option value="">Select Department</option>
                {departmentsArray.map((depart, index) => {
                  return (
                    <option value={depart} key={index}>
                      {depart}
                    </option>
                  );
                })}
              </select>
              <button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Registering Doctor..." : "Register New Doctor"}
              </button>
            </div>
          </div>
        </form>
      </section>
    </section>
  );
};

export default AddNewDoctor;
