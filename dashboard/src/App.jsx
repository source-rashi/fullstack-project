import {  useContext, useEffect, useRef, useState  } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
} from "react-router-dom";
import Dashboard from "./components/Dashboard";
import Login from "./components/Login";
import AddNewDoctor from "./components/AddNewDoctor";
import Messages from "./components/Messages";
import Doctors from "./components/Doctors";
import { Context } from "./context";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Sidebar from "./components/Sidebar";
import AddNewAdmin from "./components/AddNewAdmin";
import "./App.css";
import { api } from "./api/client";

const isAuthError = (error) => {
  const status = error?.response?.status;
  return [400, 401, 403, 404].includes(status);
};

const App = () => {
  const { isAuthenticated, setIsAuthenticated, setAdmin } =
    useContext(Context);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const hasCachedSessionRef = useRef(isAuthenticated);

  useEffect(() => {
    const clearAuthState = () => {
      setIsAuthenticated(false);
      setAdmin({});
    };

    const fetchUser = async () => {
      try {
        const response = await api.get("/api/v1/user/admin/me");
        setIsAuthenticated(true);
        setAdmin(response.data.user);
      } catch (error) {
        if (isAuthError(error) || !hasCachedSessionRef.current) {
          clearAuthState();
        } else {
          toast.info(
            "Could not verify admin session with server. Using cached login state."
          );
        }
      } finally {
        setIsCheckingAuth(false);
      }
    };
    fetchUser();
  }, [setIsAuthenticated, setAdmin]);

  if (isCheckingAuth) {
    return <div className="container" style={{ marginTop: "120px" }}>Loading...</div>;
  }

  return (
    <Router>
      {isAuthenticated && <Sidebar />}
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/login" element={<Login />} />
        <Route path="/doctor/addnew" element={<AddNewDoctor />} />
        <Route path="/admin/addnew" element={<AddNewAdmin />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/doctors" element={<Doctors />} />
      </Routes>
      <ToastContainer position="top-center" />
    </Router>
  );
};

export default App;
