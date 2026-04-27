import { useContext, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Context } from "../context";
import api from "../utils/axiosInstance";

const TABS = ["Overview", "Appointments", "Billing", "Users"];

const statusColor = (value) =>
  ({
    pending: { background: "#fef9c3", color: "#854d0e" },
    approved: { background: "#dbeafe", color: "#1e40af" },
    accepted: { background: "#dbeafe", color: "#1e40af" },
    completed: { background: "#dcfce7", color: "#166534" },
    cancelled: { background: "#fee2e2", color: "#991b1b" },
    rejected: { background: "#fee2e2", color: "#991b1b" },
    paid: { background: "#dcfce7", color: "#166534" },
    unpaid: { background: "#fee2e2", color: "#991b1b" },
    partial: { background: "#fef9c3", color: "#854d0e" },
  }[String(value || "").toLowerCase()] || {
    background: "#f3f4f6",
    color: "#374151",
  });

const formatDate = (value) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "N/A";
  }
  return parsed.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (value) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "N/A";
  }
  return parsed.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const fullName = (entity) => {
  if (!entity) {
    return "N/A";
  }
  if (entity.name && String(entity.name).trim().length > 0) {
    return entity.name;
  }
  const fallback = `${entity.firstName || ""} ${entity.lastName || ""}`.trim();
  return fallback || "N/A";
};

const roleBadgeStyle = (role) => {
  const normalized = String(role || "").toLowerCase();
  if (normalized === "admin") {
    return { background: "#fee2e2", color: "#9f1239" };
  }
  if (normalized === "doctor") {
    return { background: "#dbeafe", color: "#1e3a8a" };
  }
  if (normalized === "patient") {
    return { background: "#dcfce7", color: "#166534" };
  }
  return { background: "#e2e8f0", color: "#1f2937" };
};

const toTitleCase = (value) => {
  const text = String(value || "").trim();
  if (!text) {
    return "Unknown";
  }
  return `${text.charAt(0).toUpperCase()}${text.slice(1).toLowerCase()}`;
};

export default function AdminDashboard() {
  const { isAuthenticated, user } = useContext(Context);
  const isAdminSession = isAuthenticated && user?.role === "Admin";
  const [tab, setTab] = useState("Overview");
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalDoctors: 0,
    todayAppts: 0,
    unpaidBills: 0,
  });
  const [appointments, setAppointments] = useState([]);
  const [billing, setBilling] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const isUnauthorized = (error) => error?.response?.status === 401;

  useEffect(() => {
    const footer = document.querySelector("footer.container");
    if (!footer) {
      return undefined;
    }

    const previousDisplay = footer.style.display;
    footer.style.display = "none";

    return () => {
      footer.style.display = previousDisplay;
    };
  }, []);

  useEffect(() => {
    if (!isAdminSession) {
      return;
    }

    fetchStats();
  }, [isAdminSession]);

  useEffect(() => {
    if (!isAdminSession) {
      return;
    }

    if (tab === "Appointments") {
      fetchAppointments();
    }
    if (tab === "Billing") {
      fetchBilling();
    }
    if (tab === "Users") {
      fetchUsers();
    }
  }, [tab, isAdminSession]);

  const fetchStats = async () => {
    try {
      const { data } = await api.get("/dashboard/stats");
      setStats((prev) => ({ ...prev, ...data }));
    } catch (e) {
      if (!isUnauthorized(e)) {
        console.error("Stats fetch error:", e);
      }
    }
  };

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/appointments");
      setAppointments(Array.isArray(data) ? data : []);
    } catch (e) {
      if (!isUnauthorized(e)) {
        console.error(e);
      }
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchBilling = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/billing");
      setBilling(Array.isArray(data) ? data : []);
    } catch (e) {
      if (!isUnauthorized(e)) {
        console.error(e);
      }
      setBilling([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/users");
      setUsers(Array.isArray(data) ? data : []);
    } catch (e) {
      if (!isUnauthorized(e)) {
        console.error(e);
      }
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (id) => {
    if (!window.confirm("Delete this user?")) {
      return;
    }
    try {
      await api.delete(`/admin/users/${id}`);
      fetchUsers();
      fetchStats();
    } catch (e) {
      if (!isUnauthorized(e)) {
        console.error(e);
      }
    }
  };

  const markPaid = async (id) => {
    try {
      await api.put(`/admin/billing/${id}/pay`);
      fetchBilling();
      fetchStats();
    } catch (e) {
      if (!isUnauthorized(e)) {
        console.error(e);
      }
    }
  };

  const cancelAppt = async (id) => {
    try {
      await api.put(`/admin/appointments/${id}/cancel`);
      fetchAppointments();
      fetchStats();
    } catch (e) {
      if (!isUnauthorized(e)) {
        console.error(e);
      }
    }
  };

  const statCards = [
    {
      label: "Total Patients",
      value: stats.totalPatients,
      bg: "#EFF6FF",
      color: "#1D4ED8",
      icon: "👤",
    },
    {
      label: "Total Doctors",
      value: stats.totalDoctors,
      bg: "#F0FDF4",
      color: "#16A34A",
      icon: "🩺",
    },
    {
      label: "Today's Appointments",
      value: stats.todayAppts,
      bg: "#FFFBEB",
      color: "#D97706",
      icon: "📅",
    },
    {
      label: "Unpaid Bills",
      value: stats.unpaidBills,
      bg: "#FFF1F2",
      color: "#E11D48",
      icon: "💰",
    },
  ];

  if (!isAuthenticated || user?.role !== "Admin") {
    return <Navigate to="/login" />;
  }

  return (
    <div
      style={{
        marginTop: "78px",
        minHeight: "calc(100vh - 78px)",
        padding: "28px 0 56px",
        background:
          "radial-gradient(circle at 12% 12%, #e0f2fe 0%, #f8fafc 42%, #fff7ed 100%)",
      }}
    >
      <div className="container">
        <div
          style={{
            background: "rgba(255,255,255,0.85)",
            border: "1px solid #e2e8f0",
            borderRadius: "18px",
            padding: "18px 22px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
            backdropFilter: "blur(8px)",
          }}
        >
          <div>
            <h2 style={{ fontSize: "28px", color: "#0f172a", marginBottom: "4px" }}>
              Admin Dashboard
            </h2>
            <p style={{ fontSize: "14px", color: "#64748b" }}>
              Hospital management overview
            </p>
          </div>
          <div
            style={{
              background: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: "10px",
              padding: "8px 12px",
              fontSize: "13px",
              fontWeight: 600,
              color: "#334155",
            }}
          >
            {formatDate(new Date())}
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "14px",
            marginTop: "18px",
          }}
        >
          {statCards.map((card) => (
            <div
              key={card.label}
              style={{
                background: "#fff",
                borderRadius: "14px",
                padding: "14px",
                border: "1px solid #e2e8f0",
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <div
                style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "12px",
                  display: "grid",
                  placeItems: "center",
                  background: card.bg,
                  color: card.color,
                  fontSize: "20px",
                  border: `1px solid ${card.color}22`,
                }}
              >
                {card.icon}
              </div>
              <div>
                <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "2px" }}>
                  {card.label}
                </p>
                <h3 style={{ fontSize: "24px", color: "#0f172a" }}>{card.value || 0}</h3>
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            display: "inline-flex",
            background: "#e2e8f0",
            borderRadius: "10px",
            padding: "4px",
            marginTop: "20px",
            gap: "4px",
            flexWrap: "wrap",
          }}
        >
          {TABS.map((item) => (
            <button
              key={item}
              onClick={() => setTab(item)}
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                border: "none",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: 600,
                background: tab === item ? "#fff" : "transparent",
                color: tab === item ? "#0f172a" : "#64748b",
                boxShadow: tab === item ? "0 1px 2px rgba(0,0,0,0.08)" : "none",
                transition: "all 0.15s",
              }}
            >
              {item}
            </button>
          ))}
        </div>

        <div
          style={{
            marginTop: "16px",
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: "16px",
            padding: "16px",
          }}
        >
          {tab === "Overview" && (
            <div>
              <h3 style={{ color: "#0f172a", fontSize: "22px", marginBottom: "8px" }}>
                System Overview
              </h3>
              <p style={{ color: "#64748b", fontSize: "14px", marginBottom: "14px" }}>
                Select a tab above to view appointments, billing records, or manage users.
              </p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: "12px",
                }}
              >
                {statCards.map((card) => (
                  <div
                    key={`overview-${card.label}`}
                    style={{
                      padding: "12px",
                      borderRadius: "10px",
                      background: card.bg,
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    <p style={{ color: "#64748b", fontSize: "13px", marginBottom: "6px" }}>
                      {card.label}
                    </p>
                    <h4 style={{ color: "#0f172a", fontSize: "20px" }}>{card.value || 0}</h4>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "Appointments" && (
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "12px",
                  marginBottom: "10px",
                }}
              >
                <h3 style={{ color: "#0f172a", fontSize: "22px" }}>All Appointments</h3>
                <span style={{ fontSize: "13px", color: "#64748b" }}>
                  {appointments.length} total
                </span>
              </div>

              {loading ? (
                <p style={{ color: "#475569", fontSize: "14px" }}>Loading...</p>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "880px" }}>
                    <thead>
                      <tr style={{ background: "#f8fafc" }}>
                        {[
                          "Patient",
                          "Doctor",
                          "Date & Time",
                          "Reason",
                          "Status",
                          "Action",
                        ].map((heading) => (
                          <th
                            key={heading}
                            style={{
                              textAlign: "left",
                              padding: "10px",
                              borderBottom: "1px solid #e2e8f0",
                              color: "#334155",
                              fontSize: "13px",
                            }}
                          >
                            {heading}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {appointments.length === 0 ? (
                        <tr>
                          <td
                            colSpan={6}
                            style={{ padding: "14px", textAlign: "center", color: "#64748b" }}
                          >
                            No appointments found
                          </td>
                        </tr>
                      ) : (
                        appointments.map((appointment) => {
                          const normalizedStatus = String(appointment.status || "").toLowerCase();
                          const isTerminal = ["cancelled", "completed", "rejected"].includes(
                            normalizedStatus
                          );
                          return (
                            <tr key={appointment._id}>
                              <td
                                style={{
                                  padding: "10px",
                                  borderBottom: "1px solid #f1f5f9",
                                  color: "#0f172a",
                                  fontSize: "14px",
                                }}
                              >
                                {fullName(appointment.patientId)}
                              </td>
                              <td
                                style={{
                                  padding: "10px",
                                  borderBottom: "1px solid #f1f5f9",
                                  color: "#0f172a",
                                  fontSize: "14px",
                                }}
                              >
                                <div>{fullName(appointment.doctorId)}</div>
                                <div style={{ fontSize: "12px", color: "#64748b" }}>
                                  {appointment.doctorId?.specialization ||
                                    appointment.doctorId?.doctorDepartment ||
                                    "General"}
                                </div>
                              </td>
                              <td
                                style={{
                                  padding: "10px",
                                  borderBottom: "1px solid #f1f5f9",
                                  color: "#334155",
                                  fontSize: "13px",
                                }}
                              >
                                {formatDateTime(appointment.date || appointment.appointment_date)}
                              </td>
                              <td
                                style={{
                                  padding: "10px",
                                  borderBottom: "1px solid #f1f5f9",
                                  color: "#334155",
                                  fontSize: "13px",
                                }}
                              >
                                {appointment.reason || appointment.department || "-"}
                              </td>
                              <td
                                style={{
                                  padding: "10px",
                                  borderBottom: "1px solid #f1f5f9",
                                }}
                              >
                                <span
                                  style={{
                                    ...statusColor(normalizedStatus),
                                    padding: "4px 10px",
                                    borderRadius: "999px",
                                    fontSize: "12px",
                                    fontWeight: 600,
                                  }}
                                >
                                  {toTitleCase(normalizedStatus)}
                                </span>
                              </td>
                              <td
                                style={{
                                  padding: "10px",
                                  borderBottom: "1px solid #f1f5f9",
                                }}
                              >
                                {!isTerminal && (
                                  <button
                                    onClick={() => cancelAppt(appointment._id)}
                                    style={{
                                      fontSize: "12px",
                                      padding: "4px 10px",
                                      background: "#fff1f2",
                                      color: "#e11d48",
                                      border: "1px solid #fecdd3",
                                      borderRadius: "6px",
                                      cursor: "pointer",
                                    }}
                                  >
                                    Cancel
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {tab === "Billing" && (
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "12px",
                  marginBottom: "10px",
                }}
              >
                <h3 style={{ color: "#0f172a", fontSize: "22px" }}>Billing Records</h3>
                <span style={{ fontSize: "13px", color: "#64748b" }}>
                  {billing.length} invoices
                </span>
              </div>

              {loading ? (
                <p style={{ color: "#475569", fontSize: "14px" }}>Loading...</p>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "820px" }}>
                    <thead>
                      <tr style={{ background: "#f8fafc" }}>
                        {["Patient", "Date", "Amount", "Tax", "Total", "Status", "Action"].map(
                          (heading) => (
                            <th
                              key={heading}
                              style={{
                                textAlign: "left",
                                padding: "10px",
                                borderBottom: "1px solid #e2e8f0",
                                color: "#334155",
                                fontSize: "13px",
                              }}
                            >
                              {heading}
                            </th>
                          )
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {billing.length === 0 ? (
                        <tr>
                          <td
                            colSpan={7}
                            style={{ padding: "14px", textAlign: "center", color: "#64748b" }}
                          >
                            No billing records found
                          </td>
                        </tr>
                      ) : (
                        billing.map((bill) => {
                          const normalizedStatus = String(bill.status || "").toLowerCase();
                          return (
                            <tr key={bill._id}>
                              <td
                                style={{
                                  padding: "10px",
                                  borderBottom: "1px solid #f1f5f9",
                                  color: "#0f172a",
                                  fontSize: "14px",
                                }}
                              >
                                {fullName(bill.patientId)}
                              </td>
                              <td
                                style={{
                                  padding: "10px",
                                  borderBottom: "1px solid #f1f5f9",
                                  color: "#334155",
                                  fontSize: "13px",
                                }}
                              >
                                {formatDate(bill.invoiceDate)}
                              </td>
                              <td
                                style={{
                                  padding: "10px",
                                  borderBottom: "1px solid #f1f5f9",
                                  color: "#334155",
                                  fontSize: "13px",
                                }}
                              >
                                INR {bill.amount ?? 0}
                              </td>
                              <td
                                style={{
                                  padding: "10px",
                                  borderBottom: "1px solid #f1f5f9",
                                  color: "#334155",
                                  fontSize: "13px",
                                }}
                              >
                                INR {bill.tax ?? 0}
                              </td>
                              <td
                                style={{
                                  padding: "10px",
                                  borderBottom: "1px solid #f1f5f9",
                                  color: "#334155",
                                  fontSize: "13px",
                                }}
                              >
                                INR {bill.totalAmount ?? 0}
                              </td>
                              <td
                                style={{
                                  padding: "10px",
                                  borderBottom: "1px solid #f1f5f9",
                                }}
                              >
                                <span
                                  style={{
                                    ...statusColor(normalizedStatus),
                                    padding: "4px 10px",
                                    borderRadius: "999px",
                                    fontSize: "12px",
                                    fontWeight: 600,
                                  }}
                                >
                                  {toTitleCase(normalizedStatus)}
                                </span>
                              </td>
                              <td
                                style={{
                                  padding: "10px",
                                  borderBottom: "1px solid #f1f5f9",
                                }}
                              >
                                {normalizedStatus === "unpaid" && (
                                  <button
                                    onClick={() => markPaid(bill._id)}
                                    style={{
                                      fontSize: "12px",
                                      padding: "4px 10px",
                                      background: "#f0fdf4",
                                      color: "#16a34a",
                                      border: "1px solid #bbf7d0",
                                      borderRadius: "6px",
                                      cursor: "pointer",
                                    }}
                                  >
                                    Mark Paid
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {tab === "Users" && (
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "12px",
                  marginBottom: "10px",
                }}
              >
                <h3 style={{ color: "#0f172a", fontSize: "22px" }}>All Users</h3>
                <span style={{ fontSize: "13px", color: "#64748b" }}>
                  {users.length} registered
                </span>
              </div>

              {loading ? (
                <p style={{ color: "#475569", fontSize: "14px" }}>Loading...</p>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "860px" }}>
                    <thead>
                      <tr style={{ background: "#f8fafc" }}>
                        {["Name", "Email", "Phone", "Role", "Joined", "Action"].map((heading) => (
                          <th
                            key={heading}
                            style={{
                              textAlign: "left",
                              padding: "10px",
                              borderBottom: "1px solid #e2e8f0",
                              color: "#334155",
                              fontSize: "13px",
                            }}
                          >
                            {heading}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {users.length === 0 ? (
                        <tr>
                          <td
                            colSpan={6}
                            style={{ padding: "14px", textAlign: "center", color: "#64748b" }}
                          >
                            No users found
                          </td>
                        </tr>
                      ) : (
                        users.map((entry) => {
                          const name = fullName(entry);
                          const isAdmin = String(entry.role || "").toLowerCase() === "admin";
                          const roleStyle = roleBadgeStyle(entry.role);
                          return (
                            <tr key={entry._id}>
                              <td
                                style={{
                                  padding: "10px",
                                  borderBottom: "1px solid #f1f5f9",
                                }}
                              >
                                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                  <div
                                    style={{
                                      width: "30px",
                                      height: "30px",
                                      borderRadius: "50%",
                                      background: "#e2e8f0",
                                      color: "#0f172a",
                                      display: "grid",
                                      placeItems: "center",
                                      fontSize: "12px",
                                      fontWeight: 700,
                                    }}
                                  >
                                    {name.charAt(0).toUpperCase()}
                                  </div>
                                  <span style={{ color: "#0f172a", fontSize: "14px" }}>{name}</span>
                                </div>
                              </td>
                              <td
                                style={{
                                  padding: "10px",
                                  borderBottom: "1px solid #f1f5f9",
                                  color: "#334155",
                                  fontSize: "13px",
                                }}
                              >
                                {entry.email || "N/A"}
                              </td>
                              <td
                                style={{
                                  padding: "10px",
                                  borderBottom: "1px solid #f1f5f9",
                                  color: "#334155",
                                  fontSize: "13px",
                                }}
                              >
                                {entry.phone || "-"}
                              </td>
                              <td
                                style={{
                                  padding: "10px",
                                  borderBottom: "1px solid #f1f5f9",
                                }}
                              >
                                <span
                                  style={{
                                    ...roleStyle,
                                    borderRadius: "999px",
                                    padding: "4px 10px",
                                    fontSize: "12px",
                                    fontWeight: 600,
                                  }}
                                >
                                  {toTitleCase(entry.role)}
                                </span>
                              </td>
                              <td
                                style={{
                                  padding: "10px",
                                  borderBottom: "1px solid #f1f5f9",
                                  color: "#334155",
                                  fontSize: "13px",
                                }}
                              >
                                {formatDate(entry.createdAt)}
                              </td>
                              <td
                                style={{
                                  padding: "10px",
                                  borderBottom: "1px solid #f1f5f9",
                                }}
                              >
                                <button
                                  onClick={() => deleteUser(entry._id)}
                                  disabled={isAdmin}
                                  style={{
                                    fontSize: "12px",
                                    padding: "4px 10px",
                                    background: "#fff1f2",
                                    color: "#e11d48",
                                    border: "1px solid #fecdd3",
                                    borderRadius: "6px",
                                    cursor: isAdmin ? "not-allowed" : "pointer",
                                    opacity: isAdmin ? 0.45 : 1,
                                  }}
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}