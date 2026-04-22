import { StrictMode, useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { Context } from "./context";

export { Context } from "./context";

const DASHBOARD_AUTH_KEY = "hms_dashboard_is_authenticated";
const DASHBOARD_ADMIN_KEY = "hms_dashboard_admin";

const readStorageValue = (key, fallbackValue) => {
  if (typeof window === "undefined") {
    return fallbackValue;
  }

  try {
    const storedValue = window.localStorage.getItem(key);
    if (storedValue === null) {
      return fallbackValue;
    }
    return JSON.parse(storedValue);
  } catch {
    return fallbackValue;
  }
};

const AppWrapper = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(() =>
    readStorageValue(DASHBOARD_AUTH_KEY, false)
  );
  const [admin, setAdmin] = useState(() => readStorageValue(DASHBOARD_ADMIN_KEY, {}));

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      window.localStorage.setItem(
        DASHBOARD_AUTH_KEY,
        JSON.stringify(Boolean(isAuthenticated))
      );

      if (isAuthenticated) {
        window.localStorage.setItem(DASHBOARD_ADMIN_KEY, JSON.stringify(admin || {}));
      } else {
        window.localStorage.removeItem(DASHBOARD_ADMIN_KEY);
      }
    } catch {
      // Ignore storage access issues in restrictive environments.
    }
  }, [admin, isAuthenticated]);

  return (
    <Context.Provider
      value={{ isAuthenticated, setIsAuthenticated, admin, setAdmin }}
    >
      <App />
    </Context.Provider>
  );
};

ReactDOM.createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AppWrapper />
  </StrictMode>
);
