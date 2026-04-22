import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import {
  cleanup,
  fireEvent,
  render,
  waitFor,
  within,
} from "@testing-library/react";
import Login from "../components/Login";
import AddNewDoctor from "../components/AddNewDoctor";
import { Context } from "../context";
import { api } from "../api/client";
import { toast } from "react-toastify";

vi.mock("../api/client", () => ({
  api: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

vi.mock("react-toastify", async () => {
  const actual = await vi.importActual("react-toastify");
  return {
    ...actual,
    toast: {
      success: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
    },
  };
});

const renderWithContext = (ui, overrides = {}) => {
  const defaultValue = {
    isAuthenticated: false,
    setIsAuthenticated: vi.fn(),
    admin: {},
    setAdmin: vi.fn(),
  };

  return render(
    <Context.Provider value={{ ...defaultValue, ...overrides }}>
      <MemoryRouter>{ui}</MemoryRouter>
    </Context.Provider>
  );
};

describe("dashboard auth and form behavior", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("logs in admin and updates auth context", async () => {
    const setIsAuthenticated = vi.fn();
    const setAdmin = vi.fn();

    api.post.mockResolvedValue({
      data: {
        message: "Login Successfully!",
        user: { role: "Admin", email: "admin@example.com" },
      },
    });

    const view = renderWithContext(<Login />, {
      setIsAuthenticated,
      setAdmin,
    });
    const loginForm = view.container.querySelector(".form-component");
    const formQueries = within(loginForm);

    fireEvent.change(formQueries.getByPlaceholderText("Email"), {
      target: { value: "admin@example.com" },
    });
    fireEvent.change(formQueries.getByPlaceholderText("Password"), {
      target: { value: "Admin12345" },
    });
    fireEvent.change(formQueries.getByPlaceholderText("Confirm Password"), {
      target: { value: "Admin12345" },
    });

    fireEvent.click(formQueries.getByRole("button", { name: /login/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        "/api/v1/user/login",
        {
          email: "admin@example.com",
          password: "Admin12345",
          confirmPassword: "Admin12345",
          role: "Admin",
        },
        {
          headers: { "Content-Type": "application/json" },
        }
      );
    });

    expect(setIsAuthenticated).toHaveBeenCalledWith(true);
    expect(setAdmin).toHaveBeenCalledWith({
      role: "Admin",
      email: "admin@example.com",
    });
    expect(toast.success).toHaveBeenCalledWith("Login Successfully!");
  });

  it("requires avatar before submitting add doctor form", async () => {
    const view = renderWithContext(<AddNewDoctor />, {
      isAuthenticated: true,
    });
    const addDoctorForm = view.container.querySelector(".add-doctor-form");
    const formQueries = within(addDoctorForm);

    fireEvent.change(formQueries.getByPlaceholderText("First Name"), {
      target: { value: "Mina" },
    });
    fireEvent.change(formQueries.getByPlaceholderText("Last Name"), {
      target: { value: "Khan" },
    });
    fireEvent.change(formQueries.getByPlaceholderText("Email"), {
      target: { value: "mina.khan@example.com" },
    });
    fireEvent.change(formQueries.getByPlaceholderText("Mobile Number"), {
      target: { value: "03001234567" },
    });
    fireEvent.change(formQueries.getByPlaceholderText("NIC"), {
      target: { value: "1234567890123" },
    });
    fireEvent.change(formQueries.getByPlaceholderText("Date of Birth"), {
      target: { value: "1992-02-02" },
    });
    fireEvent.change(formQueries.getByPlaceholderText("Password"), {
      target: { value: "Doctor12345" },
    });

    const selects = formQueries.getAllByRole("combobox");
    fireEvent.change(selects[0], { target: { value: "Female" } });
    fireEvent.change(selects[1], { target: { value: "Cardiology" } });

    fireEvent.click(
      formQueries.getByRole("button", { name: /register new doctor/i })
    );

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Doctor avatar is required.");
    });
    expect(api.post).not.toHaveBeenCalled();
  });
});
