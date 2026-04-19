import React, { useContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Context } from "../context";
import { Navigate } from "react-router-dom";
import { api } from "../api/client";

const DoctorAppointments = () => {
  const { isAuthenticated, user } = useContext(Context);
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const formatAppointmentDate = (rawDate) => {
    const parsedDate = new Date(rawDate);
    return Number.isNaN(parsedDate.getTime())
      ? rawDate
      : parsedDate.toLocaleString();
  };

  useEffect(() => {
    const fetchDoctorAppointments = async () => {
      try {
        const { data } = await api.get("/api/v1/appointment/doctor/my");
        setAppointments(data.appointments || []);
      } catch (error) {
        toast.error(
          error?.response?.data?.message || "Failed to load doctor appointments"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchDoctorAppointments();
  }, []);

  if (!isAuthenticated || user?.role !== "Doctor") {
    return <Navigate to="/login" />;
  }

  return (
    <div className="container form-component" style={{ marginTop: "90px" }}>
      <h2 style={{ color: "#000" }}>Doctor Appointments</h2>
      {isLoading ? (
        <p>Loading appointments...</p>
      ) : appointments.length === 0 ? (
        <p>No appointments assigned yet.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: "10px" }}>Patient</th>
                <th style={{ textAlign: "left", padding: "10px" }}>Email</th>
                <th style={{ textAlign: "left", padding: "10px" }}>Date</th>
                <th style={{ textAlign: "left", padding: "10px" }}>Department</th>
                <th style={{ textAlign: "left", padding: "10px" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((appointment) => (
                <tr key={appointment._id}>
                  <td style={{ padding: "10px" }}>
                    {appointment.firstName} {appointment.lastName}
                  </td>
                  <td style={{ padding: "10px" }}>{appointment.email}</td>
                  <td style={{ padding: "10px" }}>
                    {formatAppointmentDate(appointment.appointment_date)}
                  </td>
                  <td style={{ padding: "10px" }}>{appointment.department}</td>
                  <td style={{ padding: "10px" }}>{appointment.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DoctorAppointments;
