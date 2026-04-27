import {  useEffect  } from "react";
import { useState } from "react";
import { toast } from "react-toastify";
import { api } from "../api/client";

const unknownDoctorModeValue = import.meta.env.VITE_APPOINTMENT_ALLOW_UNKNOWN_DOCTOR;
const isUnknownDoctorModeEnabled =
  typeof unknownDoctorModeValue === "undefined"
    ? true
    : String(unknownDoctorModeValue).toLowerCase() === "true";

const sanitizeDigits = (value, maxLength) => {
  return value.replace(/\D/g, "").slice(0, maxLength);
};

const getTodayAsInputDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const fallbackDoctors = [
  {
    firstName: "Ayesha",
    lastName: "Khan",
    doctorDepartment: "Pediatrics",
  },
  {
    firstName: "Maira",
    lastName: "Shah",
    doctorDepartment: "Pediatrics",
  },
  {
    firstName: "Bilal",
    lastName: "Riaz",
    doctorDepartment: "Orthopedics",
  },
  {
    firstName: "Farhan",
    lastName: "Siddiqui",
    doctorDepartment: "Orthopedics",
  },
  {
    firstName: "Hina",
    lastName: "Farooq",
    doctorDepartment: "Cardiology",
  },
  {
    firstName: "Rehan",
    lastName: "Iqbal",
    doctorDepartment: "Cardiology",
  },
  {
    firstName: "Usman",
    lastName: "Tariq",
    doctorDepartment: "Neurology",
  },
  {
    firstName: "Komal",
    lastName: "Aslam",
    doctorDepartment: "Neurology",
  },
  {
    firstName: "Sana",
    lastName: "Ali",
    doctorDepartment: "Oncology",
  },
  {
    firstName: "Taimoor",
    lastName: "Qazi",
    doctorDepartment: "Oncology",
  },
  {
    firstName: "Hamza",
    lastName: "Qureshi",
    doctorDepartment: "Radiology",
  },
  {
    firstName: "Noreen",
    lastName: "Fatima",
    doctorDepartment: "Radiology",
  },
  {
    firstName: "Nadia",
    lastName: "Javed",
    doctorDepartment: "Physical Therapy",
  },
  {
    firstName: "Danish",
    lastName: "Malik",
    doctorDepartment: "Physical Therapy",
  },
  {
    firstName: "Areeba",
    lastName: "Iqbal",
    doctorDepartment: "Dermatology",
  },
  {
    firstName: "Mehwish",
    lastName: "Rauf",
    doctorDepartment: "Dermatology",
  },
  {
    firstName: "Sameer",
    lastName: "Nawaz",
    doctorDepartment: "ENT",
  },
  {
    firstName: "Urooj",
    lastName: "Nadeem",
    doctorDepartment: "ENT",
  },
];

const AppointmentForm = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [nic, setNic] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [department, setDepartment] = useState("Pediatrics");
  const [doctorFirstName, setDoctorFirstName] = useState("");
  const [doctorLastName, setDoctorLastName] = useState("");
  const [isManualDoctorEntry, setIsManualDoctorEntry] = useState(false);
  const [address, setAddress] = useState("");
  const [hasVisited, setHasVisited] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const minAppointmentDate = getTodayAsInputDate();

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

  const [doctors, setDoctors] = useState([]);
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(true);
  const [isUsingFallbackDoctors, setIsUsingFallbackDoctors] = useState(false);

  useEffect(() => {
    const fetchDoctors = async () => {
      setIsLoadingDoctors(true);
      try {
        const { data } = await api.get("/api/v1/user/doctors");
        if (data?.doctors?.length > 0) {
          setDoctors(data.doctors);
          setIsUsingFallbackDoctors(false);
          return;
        }

        setDoctors(fallbackDoctors);
        setIsUsingFallbackDoctors(true);
        toast.info("No doctors were found in backend. Showing demo doctors only.");
      } catch (error) {
        setDoctors(fallbackDoctors);
        setIsUsingFallbackDoctors(true);
        toast.info(
          isUnknownDoctorModeEnabled
            ? "Using demo doctors list. Demo mode allows booking unknown doctors."
            : "Using demo doctors list. Booking is disabled until backend doctors load."
        );
      } finally {
        setIsLoadingDoctors(false);
      }
    };

    fetchDoctors();
  }, []);

  const handleAppointment = async (e) => {
    e.preventDefault();

    if (phone.length !== 10) {
      toast.error("Phone number must be exactly 10 digits.");
      return;
    }

    if (nic.length !== 13) {
      toast.error("NIC must be exactly 13 digits.");
      return;
    }

    if (isLoadingDoctors) {
      if (isManualDoctorEntry) {
        // Manual entry in demo mode does not depend on doctor list loading.
      } else {
        toast.error("Doctor list is still loading. Please wait.");
        return;
      }
    }

    if (
      isUsingFallbackDoctors &&
      !isUnknownDoctorModeEnabled &&
      !isManualDoctorEntry
    ) {
      toast.error("Demo doctors cannot be booked. Please reload after backend is available.");
      return;
    }

    if (!doctorFirstName || !doctorLastName) {
      toast.error("Please select a doctor.");
      return;
    }

    const selectedDate = appointmentDate
      ? new Date(`${appointmentDate}T00:00:00`)
      : null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate && selectedDate < today) {
      toast.error("Appointment date cannot be in the past.");
      return;
    }

    setIsSubmitting(true);
    try {
      const hasVisitedBool = Boolean(hasVisited);
      const { data } = await api.post(
        "/api/v1/appointment/post",
        {
          firstName,
          lastName,
          email,
          phone,
          nic,
          dob,
          gender,
          appointment_date: appointmentDate,
          department,
          doctor_firstName: doctorFirstName,
          doctor_lastName: doctorLastName,
          hasVisited: hasVisitedBool,
          address,
        },
        {
          headers: { "Content-Type": "application/json" },
        }
      );
      toast.success(data.message);
      setFirstName("");
      setLastName("");
      setEmail("");
      setPhone("");
      setNic("");
      setDob("");
      setGender("");
      setAppointmentDate("");
      setDepartment("Pediatrics");
      setDoctorFirstName("");
      setDoctorLastName("");
      setIsManualDoctorEntry(false);
      setHasVisited(false);
      setAddress("");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to book appointment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedDoctorValue =
    !isManualDoctorEntry && doctorFirstName && doctorLastName
      ? JSON.stringify({ firstName: doctorFirstName, lastName: doctorLastName })
      : "";

  const filteredDoctors = doctors.filter(
    (doctor) => doctor.doctorDepartment === department
  );

  const isDoctorSelectionBlockingSubmit =
    (isLoadingDoctors && !isManualDoctorEntry) ||
    (isUsingFallbackDoctors &&
      !isUnknownDoctorModeEnabled &&
      !isManualDoctorEntry);

  return (
    <>
      <div className="container form-component appointment-form">
        <h2>Appointment</h2>
        <form onSubmit={handleAppointment}>
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
              type="date"
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
              type="date"
              placeholder="Appointment Date"
              value={appointmentDate}
              min={minAppointmentDate}
              onChange={(e) => setAppointmentDate(e.target.value)}
            />
          </div>
          <div>
            <select
              value={department}
              onChange={(e) => {
                setDepartment(e.target.value);
                setDoctorFirstName("");
                setDoctorLastName("");
                setIsManualDoctorEntry(false);
              }}
            >
              {departmentsArray.map((depart, index) => {
                return (
                  <option value={depart} key={index}>
                    {depart}
                  </option>
                );
              })}
            </select>
            {/* <select
              value={`${doctorFirstName} ${doctorLastName}`}
              onChange={(e) => {
                const [firstName, lastName] = e.target.value.split(" ");
                setDoctorFirstName(firstName);
                setDoctorLastName(lastName);
              }}
              disabled={!department}
            >
              <option value="">Select Doctor</option>
              {doctors
                .filter((doctor) => doctor.doctorDepartment === department)
                .map((doctor, index) => (
                  <option
                    value={`${doctor.firstName} ${doctor.lastName}`}
                    key={index}
                  >
                    {doctor.firstName} {doctor.lastName}
                  </option>
                ))}
            </select> */}
            <select
              value={selectedDoctorValue}
              onChange={(e) => {
                if (!e.target.value) {
                  setDoctorFirstName("");
                  setDoctorLastName("");
                  return;
                }
                const selectedDoctor = JSON.parse(e.target.value);
                setDoctorFirstName(selectedDoctor.firstName);
                setDoctorLastName(selectedDoctor.lastName);
              }}
              disabled={!department || isLoadingDoctors || isManualDoctorEntry}
            >
              <option value="">
                {isLoadingDoctors ? "Loading doctors..." : "Select Doctor"}
              </option>
              {filteredDoctors.map((doctor, index) => (
                <option
                  key={index}
                  value={JSON.stringify({
                    firstName: doctor.firstName,
                    lastName: doctor.lastName,
                  })}
                >
                  {doctor.firstName} {doctor.lastName}
                </option>
              ))}
            </select>
          </div>
          {isUnknownDoctorModeEnabled ? (
            <div
              style={{
                gap: "10px",
                justifyContent: "flex-start",
                flexDirection: "row",
              }}
            >
              <p style={{ marginBottom: 0 }}>Enter doctor manually (demo mode)?</p>
              <input
                type="checkbox"
                checked={isManualDoctorEntry}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setIsManualDoctorEntry(checked);
                  setDoctorFirstName("");
                  setDoctorLastName("");
                }}
                style={{ flex: "none", width: "25px" }}
              />
            </div>
          ) : null}
          {isManualDoctorEntry ? (
            <div>
              <input
                type="text"
                placeholder="Doctor First Name"
                value={doctorFirstName}
                onChange={(e) => setDoctorFirstName(e.target.value)}
              />
              <input
                type="text"
                placeholder="Doctor Last Name"
                value={doctorLastName}
                onChange={(e) => setDoctorLastName(e.target.value)}
              />
            </div>
          ) : null}
          {isUsingFallbackDoctors ? (
            <p style={{ color: "#8a1f11", marginTop: "8px" }}>
              {isUnknownDoctorModeEnabled
                ? "Demo doctor list is active. Demo mode allows booking unknown doctors."
                : "Demo doctor list is active. Booking is disabled until backend doctors are loaded."}
            </p>
          ) : null}
          <textarea
            rows="10"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Address"
          />
          <div
            style={{
              gap: "10px",
              justifyContent: "flex-end",
              flexDirection: "row",
            }}
          >
            <p style={{ marginBottom: 0 }}>Have you visited before?</p>
            <input
              type="checkbox"
              checked={hasVisited}
              onChange={(e) => setHasVisited(e.target.checked)}
              style={{ flex: "none", width: "25px" }}
            />
          </div>
          <button
            type="submit"
            style={{ margin: "0 auto" }}
            disabled={isSubmitting || isDoctorSelectionBlockingSubmit}
          >
            {isSubmitting ? "Booking Appointment..." : "GET APPOINTMENT"}
          </button>
        </form>
      </div>
    </>
  );
};

export default AppointmentForm;
