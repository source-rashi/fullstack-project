import {  useContext, useEffect, useState  } from "react";
import { toast } from "react-toastify";
import { Context } from "../context";
import { Navigate } from "react-router-dom";
import { api } from "../api/client";

const MyAppointments = () => {
  const { isAuthenticated, user } = useContext(Context);
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cancellingAppointmentId, setCancellingAppointmentId] = useState("");

  const formatAppointmentDate = (rawDate) => {
    const parsedDate = new Date(rawDate);
    return Number.isNaN(parsedDate.getTime())
      ? rawDate
      : parsedDate.toLocaleString();
  };

  useEffect(() => {
    const fetchMyAppointments = async () => {
      try {
        const { data } = await api.get("/api/v1/appointment/patient/my");
        setAppointments(data.appointments || []);
      } catch (error) {
        toast.error(error?.response?.data?.message || "Failed to load appointments");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMyAppointments();
  }, []);

  const handleCancelAppointment = async (appointmentId) => {
    setCancellingAppointmentId(appointmentId);
    try {
      const { data } = await api.delete(
        `/api/v1/appointment/patient/cancel/${appointmentId}`
      );
      setAppointments((prev) => prev.filter((item) => item._id !== appointmentId));
      toast.success(data.message);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to cancel appointment");
    } finally {
      setCancellingAppointmentId("");
    }
  };

  if (!isAuthenticated || user?.role !== "Patient") {
    return <Navigate to="/login" />;
  }

  return (
    <div className="container form-component" style={{ marginTop: "90px" }}>
      <h2 style={{ color: "#000" }}>My Appointments</h2>
      {isLoading ? (
        <p>Loading appointments...</p>
      ) : appointments.length === 0 ? (
        <p>No appointments found.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: "10px" }}>Doctor</th>
                <th style={{ textAlign: "left", padding: "10px" }}>Department</th>
                <th style={{ textAlign: "left", padding: "10px" }}>Date</th>
                <th style={{ textAlign: "left", padding: "10px" }}>Status</th>
                <th style={{ textAlign: "left", padding: "10px" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((appointment) => (
                <tr key={appointment._id}>
                  <td style={{ padding: "10px" }}>
                    {appointment.doctor?.firstName} {appointment.doctor?.lastName}
                  </td>
                  <td style={{ padding: "10px" }}>{appointment.department}</td>
                  <td style={{ padding: "10px" }}>
                    {formatAppointmentDate(appointment.appointment_date)}
                  </td>
                  <td style={{ padding: "10px" }}>{appointment.status}</td>
                  <td style={{ padding: "10px" }}>
                    <button
                      type="button"
                      disabled={
                        appointment.status !== "Pending" ||
                        cancellingAppointmentId === appointment._id
                      }
                      onClick={() => handleCancelAppointment(appointment._id)}
                      style={{
                        padding: "6px 14px",
                        borderRadius: "6px",
                        border: "none",
                        background:
                          appointment.status === "Pending" &&
                          cancellingAppointmentId !== appointment._id
                            ? "#271776ca"
                            : "#999",
                        color: "#fff",
                        cursor:
                          appointment.status === "Pending" &&
                          cancellingAppointmentId !== appointment._id
                            ? "pointer"
                            : "not-allowed",
                      }}
                    >
                      {cancellingAppointmentId === appointment._id
                        ? "Cancelling..."
                        : "Cancel"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MyAppointments;
