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
  const [bills, setBills] = useState([]);

  const formatAppointmentDate = (rawDate) => {
    const parsedDate = new Date(rawDate);
    return Number.isNaN(parsedDate.getTime())
      ? rawDate
      : parsedDate.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: { background: '#fef9c3', color: '#854d0e' },
      approved: { background: '#dbeafe', color: '#1e40af' },
      completed: { background: '#dcfce7', color: '#166534' },
      cancelled: { background: '#fee2e2', color: '#991b1b' },
    };
    return styles[status.toLowerCase()] || {};
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

    const fetchBills = async () => {
      try {
        const { data } = await api.get(`/api/v1/billing/patient/${user._id}`);
        setBills(data || []);
      } catch (error) {
        console.error("Failed to load bills", error);
      }
    };

    fetchMyAppointments();
    fetchBills();
    const interval = setInterval(fetchMyAppointments, 30000);
    return () => clearInterval(interval);
  }, [user._id]);

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

  const handlePayBill = async (billId) => {
    try {
      await api.put(`/api/v1/billing/${billId}`, { status: 'paid', paymentMethod: 'UPI' });
      setBills((prev) => prev.map((bill) => bill._id === billId ? { ...bill, status: 'paid' } : bill));
      toast.success("Payment successful");
    } catch (error) {
      toast.error("Payment failed");
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
                  <td style={{ padding: "10px" }}>
                    <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', ...getStatusBadge(appointment.status) }}>
                      {appointment.status}
                    </span>
                    {appointment.status.toLowerCase() === 'approved' && (
                      <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#16a34a' }}>
                        Your appointment has been confirmed by the doctor.
                      </p>
                    )}
                    {appointment.status.toLowerCase() === 'completed' && appointment.doctorNotes && (
                      <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#2563eb' }}>
                        Doctor's notes: {appointment.doctorNotes}
                      </p>
                    )}
                  </td>
                  <td style={{ padding: "10px" }}>
                    {(() => {
                      const canCancel =
                        String(appointment.status || "").toLowerCase() === "pending";

                      return (
                    <button
                      type="button"
                      disabled={
                        !canCancel ||
                        cancellingAppointmentId === appointment._id
                      }
                      onClick={() => handleCancelAppointment(appointment._id)}
                      style={{
                        padding: "4px 12px",
                        borderRadius: "6px",
                        border: "none",
                        fontSize: "13px",
                        lineHeight: 1.2,
                        whiteSpace: "nowrap",
                        background:
                          canCancel &&
                          cancellingAppointmentId !== appointment._id
                            ? "#dc2626"
                            : "#999",
                        color: "#fff",
                        cursor:
                          canCancel &&
                          cancellingAppointmentId !== appointment._id
                            ? "pointer"
                            : "not-allowed",
                      }}
                    >
                      {cancellingAppointmentId === appointment._id
                        ? "Cancelling..."
                        : "Cancel"}
                    </button>
                      );
                    })()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <h2 style={{ color: "#000", marginTop: "40px" }}>My Bills</h2>
      {bills.length === 0 ? (
        <p>No bills found.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: "10px" }}>Invoice Date</th>
                <th style={{ textAlign: "left", padding: "10px" }}>Doctor</th>
                <th style={{ textAlign: "left", padding: "10px" }}>Consultation Fee</th>
                <th style={{ textAlign: "left", padding: "10px" }}>Tax</th>
                <th style={{ textAlign: "left", padding: "10px" }}>Total</th>
                <th style={{ textAlign: "left", padding: "10px" }}>Status</th>
                <th style={{ textAlign: "left", padding: "10px" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {bills.map((bill) => (
                <tr key={bill._id}>
                  <td style={{ padding: "10px" }}>{new Date(bill.invoiceDate).toLocaleDateString('en-IN')}</td>
                  <td style={{ padding: "10px" }}>
                    {bill.doctorId?.firstName
                      ? `${bill.doctorId.firstName} ${bill.doctorId?.lastName || ""}`.trim()
                      : "N/A"}
                  </td>
                  <td style={{ padding: "10px" }}>₹{bill.amount}</td>
                  <td style={{ padding: "10px" }}>₹{bill.tax}</td>
                  <td style={{ padding: "10px" }}>₹{bill.totalAmount}</td>
                  <td style={{ padding: "10px" }}>
                    <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', ...getStatusBadge(bill.status) }}>
                      {bill.status}
                    </span>
                  </td>
                  <td style={{ padding: "10px" }}>
                    {bill.status === 'unpaid' && (
                      <button
                        onClick={() => handlePayBill(bill._id)}
                        style={{ padding: '4px 12px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}
                      >
                        Pay Now
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

export default MyAppointments;
