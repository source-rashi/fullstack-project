import {  useContext, useEffect, useState  } from "react";
import { toast } from "react-toastify";
import { Context } from "../context";
import { Navigate } from "react-router-dom";
import { api } from "../api/client";

const DoctorAppointments = () => {
  const { isAuthenticated, user } = useContext(Context);
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingAppointmentId, setUpdatingAppointmentId] = useState("");

  const formatAppointmentDate = (rawDate) => {
    const parsedDate = new Date(rawDate);
    return Number.isNaN(parsedDate.getTime())
      ? rawDate
      : parsedDate.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
  };

  const handleStatusUpdate = async (appointmentId, action) => {
    setUpdatingAppointmentId(appointmentId);
    try {
      const { data } = await api.put(`/api/v1/appointment/${action}/${appointmentId}`);
      setAppointments((prev) =>
        prev.map((appt) =>
          appt._id === appointmentId ? { ...appt, status: data.status || getNewStatus(action) } : appt
        )
      );
      toast.success(data.message);
    } catch (error) {
      toast.error(error?.response?.data?.message || `Failed to ${action} appointment`);
    } finally {
      setUpdatingAppointmentId("");
    }
  };

  const getNewStatus = (action) => {
    switch (action) {
      case "approve": return "Accepted";
      case "complete": return "Completed";
      case "cancel": return "Rejected";
      default: return "";
    }
  };

  const handleApprove = async (id) => {
    await api.put(`/api/v1/appointment/approve/${id}`);
    fetchDoctorAppointments(); // re-fetch list
  };
  const handleComplete = async (id) => {
    const notes = prompt('Add doctor notes (optional):') || '';
    await api.put(`/api/v1/appointment/complete/${id}`, { notes });
    fetchDoctorAppointments();
  };
  const handleCancel = async (id) => {
    if (window.confirm('Cancel this appointment?')) {
      await api.put(`/api/v1/appointment/cancel/${id}`);
      fetchDoctorAppointments();
    }
  };

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

  useEffect(() => {
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
                <th style={{ textAlign: "left", padding: "10px" }}>Actions</th>
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
                  <td style={{ padding: "10px" }}>
                    {appointment.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleApprove(appointment._id)}
                          style={{ marginRight: 8, padding: '4px 12px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleCancel(appointment._id)}
                          style={{ padding: '4px 12px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}
                        >
                          Cancel
                        </button>
                      </>
                    )}
                    {appointment.status === 'approved' && (
                      <button
                        onClick={() => handleComplete(appointment._id)}
                        style={{ padding: '4px 12px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}
                      >
                        Mark Complete
                      </button>
                    )}
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

export default DoctorAppointments;
