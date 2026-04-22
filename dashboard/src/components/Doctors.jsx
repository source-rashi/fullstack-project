import {  useContext, useEffect, useState  } from "react";
import { toast } from "react-toastify";
import { Context } from "../context";
import { Navigate } from "react-router-dom";
import { api } from "../api/client";

const Doctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated } = useContext(Context);

  const formatDate = (rawDate) => {
    const parsedDate = new Date(rawDate);
    return Number.isNaN(parsedDate.getTime())
      ? rawDate
      : parsedDate.toISOString().substring(0, 10);
  };

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const { data } = await api.get("/api/v1/user/doctors");
        setDoctors(data.doctors);
      } catch (error) {
        toast.error(error?.response?.data?.message || "Failed to load doctors");
      } finally {
        setIsLoading(false);
      }
    };
    fetchDoctors();
  }, []);

  if (!isAuthenticated) {
    return <Navigate to={"/login"} />;
  }
  return (
    <section className="page doctors">
      <h1>DOCTORS</h1>
      <div className="banner">
        {isLoading ? (
          <h1>Loading doctors...</h1>
        ) : doctors && doctors.length > 0 ? (
          doctors.map((element) => {
            return (
              <div className="card" key={element._id}>
                <img
                  src={element.docAvatar?.url || "/docHolder.jpg"}
                  alt="doctor avatar"
                />
                <h4>{`${element.firstName} ${element.lastName}`}</h4>
                <div className="details">
                  <p>
                    Email: <span>{element.email}</span>
                  </p>
                  <p>
                    Phone: <span>{element.phone}</span>
                  </p>
                  <p>
                    DOB: <span>{formatDate(element.dob)}</span>
                  </p>
                  <p>
                    Department: <span>{element.doctorDepartment}</span>
                  </p>
                  <p>
                    NIC: <span>{element.nic}</span>
                  </p>
                  <p>
                    Gender: <span>{element.gender}</span>
                  </p>
                </div>
              </div>
            );
          })
        ) : (
          <h1>No Registered Doctors Found!</h1>
        )}
      </div>
    </section>
  );
};

export default Doctors;
