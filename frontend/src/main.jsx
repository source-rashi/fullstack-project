import { StrictMode, useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { Context } from "./context";

export { Context } from "./context";

const FRONTEND_AUTH_KEY = "hms_frontend_is_authenticated";
const FRONTEND_USER_KEY = "hms_frontend_user";

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
    readStorageValue(FRONTEND_AUTH_KEY, false)
  );
  const [user, setUser] = useState(() => readStorageValue(FRONTEND_USER_KEY, {}));

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      window.localStorage.setItem(
        FRONTEND_AUTH_KEY,
        JSON.stringify(Boolean(isAuthenticated))
      );

      if (isAuthenticated) {
        window.localStorage.setItem(FRONTEND_USER_KEY, JSON.stringify(user || {}));
      } else {
        window.localStorage.removeItem(FRONTEND_USER_KEY);
      }
    } catch {
      // Ignore storage access issues in restrictive environments.
    }
  }, [isAuthenticated, user]);

  return (
    <Context.Provider
      value={{
        isAuthenticated,
        setIsAuthenticated,
        user,
        setUser,
      }}
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
