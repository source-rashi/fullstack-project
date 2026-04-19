import React, { useEffect } from "react";
import { useState } from "react";
import { toast } from "react-toastify";
import { api } from "../api/client";

const fallbackDoctors = [
  {
    firstName: "Ayesha",
    lastName: "Khan",
    doctorDepartment: "Pediatrics",
  },
  {
    firstName: "Bilal",
    lastName: "Riaz",
    doctorDepartment: "Orthopedics",
  },
  {
    firstName: "Hina",
    lastName: "Farooq",
    doctorDepartment: "Cardiology",
  },
  {
    firstName: "Usman",
    lastName: "Tariq",
    doctorDepartment: "Neurology",
  },
  {
    firstName: "Sana",
    lastName: "Ali",
    doctorDepartment: "Oncology",
  },
  {
    firstName: "Hamza",
    lastName: "Qureshi",
    doctorDepartment: "Radiology",
  },
  {
    firstName: "Nadia",
    lastName: "Javed",
    doctorDepartment: "Physical Therapy",
  },
  {
    firstName: "Areeba",
    lastName: "Iqbal",
    doctorDepartment: "Dermatology",
  },
  {
    firstName: "Sameer",
    lastName: "Nawaz",
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
  const [address, setAddress] = useState("");
  const [hasVisited, setHasVisited] = useState(false);
  const [isFetchingDoctors, setIsFetchingDoctors] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const { data } = await api.get("/api/v1/user/doctors");
        if (data?.doctors?.length > 0) {
          setDoctors(data.doctors);
        } else {
          setDoctors(fallbackDoctors);
          toast.info("Using demo doctors list.");
        }
      } catch (error) {
        setDoctors(fallbackDoctors);
        toast.info("Using demo doctors list.");
      } finally {
        setIsFetchingDoctors(false);
      }
    };
    fetchDoctors();
  }, []);
  const handleAppointment = async (e) => {
    e.preventDefault();
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
      setHasVisited(false);
      setAddress("");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to book appointment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedDoctorValue =
    doctorFirstName && doctorLastName
      ? JSON.stringify({ firstName: doctorFirstName, lastName: doctorLastName })
      : "";

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
              type="number"
              placeholder="Mobile Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div>
            <input
              type="number"
              placeholder="NIC"
              value={nic}
              onChange={(e) => setNic(e.target.value)}
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
              disabled={!department || isFetchingDoctors}
            >
              <option value="">Select Doctor</option>
              {doctors
                .filter((doctor) => doctor.doctorDepartment === department)
                .map((doctor, index) => (
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
            disabled={isSubmitting || isFetchingDoctors}
          >
            {isSubmitting ? "Booking Appointment..." : "GET APPOINTMENT"}
          </button>
        </form>
      </div>
    </>
  );
};

export default AppointmentForm;
