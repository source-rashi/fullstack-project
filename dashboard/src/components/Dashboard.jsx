import {  useContext, useEffect, useState  } from "react";
import { Context } from "../context";
import { Navigate } from "react-router-dom";
import { toast } from "react-toastify";
import { GoCheckCircleFill } from "react-icons/go";
import { AiFillCloseCircle } from "react-icons/ai";
import { api } from "../api/client";

const Dashboard = () => {
  const [appointments, setAppointments] = useState([]);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(true);
  const [updatingAppointmentId, setUpdatingAppointmentId] = useState("");
  const [deletingAppointmentId, setDeletingAppointmentId] = useState("");

  const formatAppointmentDate = (rawDate) => {
    const parsedDate = new Date(rawDate);
    return Number.isNaN(parsedDate.getTime())
      ? rawDate
      : parsedDate.toLocaleString();
  };

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const { data } = await api.get("/api/v1/appointment/getall");
        setAppointments(data.appointments);
      } catch (error) {
        setAppointments([]);
      } finally {
        setIsLoadingAppointments(false);
      }
    };
    fetchAppointments();
  }, []);

  const handleUpdateStatus = async (appointmentId, status) => {
    setUpdatingAppointmentId(appointmentId);
    try {
      const { data } = await api.put(
        `/api/v1/appointment/update/${appointmentId}`,
        { status },
        {
          headers: { "Content-Type": "application/json" },
        }
      );
      setAppointments((prevAppointments) =>
        prevAppointments.map((appointment) =>
          appointment._id === appointmentId
            ? { ...appointment, status }
            : appointment
        )
      );
      toast.success(data.message);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to update appointment");
    } finally {
      setUpdatingAppointmentId("");
    }
  };

  const handleDeleteAppointment = async (appointmentId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this appointment?"
    );

    if (!confirmDelete) {
      return;
    }

    setDeletingAppointmentId(appointmentId);
    try {
      const { data } = await api.delete(`/api/v1/appointment/delete/${appointmentId}`);
      setAppointments((prevAppointments) =>
        prevAppointments.filter((appointment) => appointment._id !== appointmentId)
      );
      toast.success(data.message);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to delete appointment");
    } finally {
      setDeletingAppointmentId("");
    }
  };

  const { isAuthenticated, admin } = useContext(Context);
  if (!isAuthenticated) {
    return <Navigate to={"/login"} />;
  }

  return (
    <>
      <section className="dashboard page">
        <div className="banner">
          <div className="firstBox">
            <img src="/doc.png" alt="docImg" />
            <div className="content">
              <div>
                <p>Hello ,</p>
                <h5>
                  {admin &&
                    `${admin.firstName} ${admin.lastName}`}{" "}
                </h5>
              </div>
              <p>
                Lorem ipsum dolor sit, amet consectetur adipisicing elit.
                Facilis, nam molestias. Eaque molestiae ipsam commodi neque.
                Assumenda repellendus necessitatibus itaque.
              </p>
            </div>
          </div>
          <div className="secondBox">
            <p>Total Appointments</p>
            <h3>1500</h3>
          </div>
          <div className="thirdBox">
            <p>Registered Doctors</p>
            <h3>10</h3>
          </div>
        </div>
        <div className="banner">
          <h5>Appointments</h5>
          <table>
            <thead>
              <tr>
                <th>Patient</th>
                <th>Date</th>
                <th>Doctor</th>
                <th>Department</th>
                <th>Status</th>
                <th>Visited</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoadingAppointments ? (
                <tr>
                  <td colSpan="7">Loading appointments...</td>
                </tr>
              ) : appointments && appointments.length > 0
                ? appointments.map((appointment) => (
                    <tr key={appointment._id}>
                      <td>{`${appointment.firstName} ${appointment.lastName}`}</td>
                      <td>{formatAppointmentDate(appointment.appointment_date)}</td>
                      <td>
                        {appointment.doctor
                          ? `${appointment.doctor.firstName} ${appointment.doctor.lastName}`
                          : "Not Assigned"}
                      </td>
                      <td>{appointment.department}</td>
                      <td>
                        <select
                          className={
                            appointment.status === "Pending"
                              ? "value-pending"
                              : appointment.status === "Accepted"
                              ? "value-accepted"
                              : "value-rejected"
                          }
                          value={appointment.status}
                          disabled={updatingAppointmentId === appointment._id}
                          onChange={(e) =>
                            handleUpdateStatus(appointment._id, e.target.value)
                          }
                        >
                          <option value="Pending" className="value-pending">
                            Pending
                          </option>
                          <option value="Accepted" className="value-accepted">
                            Accepted
                          </option>
                          <option value="Rejected" className="value-rejected">
                            Rejected
                          </option>
                        </select>
                      </td>
                      <td>
                        {appointment.hasVisited === true ? (
                          <GoCheckCircleFill className="green" />
                        ) : (
                          <AiFillCloseCircle className="red" />
                        )}
                      </td>
                      <td>
                        <button
                          type="button"
                          onClick={() => handleDeleteAppointment(appointment._id)}
                          disabled={deletingAppointmentId === appointment._id}
                        >
                          {deletingAppointmentId === appointment._id
                            ? "Deleting..."
                            : "Delete"}
                        </button>
                      </td>
                    </tr>
                  ))
                : (
                  <tr>
                    <td colSpan="7">No Appointments Found!</td>
                  </tr>
                )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
};

export default Dashboard;
