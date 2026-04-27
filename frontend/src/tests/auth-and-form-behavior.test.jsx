import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import {
  cleanup,
  fireEvent,
  render,
  waitFor,
  within,
} from "@testing-library/react";
import Register from "../Pages/Register";
import MessageForm from "../components/MessageForm";
import AppointmentForm from "../components/AppointmentForm";
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

const renderWithContext = (ui) => {
  return render(
    <Context.Provider
      value={{
        isAuthenticated: false,
        setIsAuthenticated: vi.fn(),
        user: {},
        setUser: vi.fn(),
      }}
    >
      <MemoryRouter>{ui}</MemoryRouter>
    </Context.Provider>
  );
};

describe("frontend auth and form behavior", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("blocks register submit when phone is invalid", async () => {
    const view = renderWithContext(<Register />);
    const registerForm = view.container.querySelector(".register-form");
    const formQueries = within(registerForm);

    fireEvent.change(formQueries.getByPlaceholderText("First Name"), {
      target: { value: "Alice" },
    });
    fireEvent.change(formQueries.getByPlaceholderText("Last Name"), {
      target: { value: "Smith" },
    });
    fireEvent.change(formQueries.getByPlaceholderText("Email"), {
      target: { value: "alice@example.com" },
    });
    fireEvent.change(formQueries.getByPlaceholderText("Mobile Number"), {
      target: { value: "030011122" },
    });
    fireEvent.change(formQueries.getByPlaceholderText("NIC"), {
      target: { value: "1234567890123" },
    });
    fireEvent.change(formQueries.getByPlaceholderText("Date of Birth"), {
      target: { value: "1994-01-01" },
    });
    const registerSelects = formQueries.getAllByRole("combobox");
    fireEvent.change(registerSelects[1], {
      target: { value: "Female" },
    });
    fireEvent.change(formQueries.getByPlaceholderText("Password"), {
      target: { value: "Pass12345" },
    });

    fireEvent.click(formQueries.getByRole("button", { name: /register/i }));

    await waitFor(() => {
      expect(api.post).not.toHaveBeenCalled();
    });
  });

  it("submits message form with valid payload", async () => {
    api.post.mockResolvedValue({
      data: {
        message: "Message Sent!",
      },
    });

    const view = render(
      <MemoryRouter>
        <MessageForm />
      </MemoryRouter>
    );
    const messageForm = view.container.querySelector(".message-form");
    const formQueries = within(messageForm);

    fireEvent.change(formQueries.getByPlaceholderText("First Name"), {
      target: { value: "John" },
    });
    fireEvent.change(formQueries.getByPlaceholderText("Last Name"), {
      target: { value: "Doe" },
    });
    fireEvent.change(formQueries.getByPlaceholderText("Email"), {
      target: { value: "john@example.com" },
    });
    fireEvent.change(formQueries.getByPlaceholderText("Mobile Number"), {
      target: { value: "03001234567" },
    });
    fireEvent.change(formQueries.getByPlaceholderText("Message"), {
      target: { value: "This is a valid inquiry message body." },
    });

    fireEvent.click(formQueries.getByRole("button", { name: /send/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        "/api/v1/message/send",
        {
          firstName: "John",
          lastName: "Doe",
          email: "john@example.com",
          phone: "0300123456",
          message: "This is a valid inquiry message body.",
        },
        {
          headers: { "Content-Type": "application/json" },
        }
      );
    });

    expect(toast.success).toHaveBeenCalledWith("Message Sent!");
    expect(formQueries.getByPlaceholderText("First Name")).toHaveValue("");
    expect(formQueries.getByPlaceholderText("Last Name")).toHaveValue("");
    expect(formQueries.getByPlaceholderText("Email")).toHaveValue("");
    expect(formQueries.getByPlaceholderText("Mobile Number")).toHaveValue("");
    expect(formQueries.getByPlaceholderText("Message")).toHaveValue("");
  });

  it("uses backend doctors instead of fallback doctors when API succeeds", async () => {
    api.get.mockResolvedValueOnce({
      data: {
        doctors: [
          {
            firstName: "Real",
            lastName: "Doctor",
            doctorDepartment: "Pediatrics",
          },
        ],
      },
    });

    const view = render(
      <MemoryRouter>
        <AppointmentForm />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith("/api/v1/user/doctors");
    });

    const appointmentForm = view.container.querySelector(".appointment-form");
    const selects = appointmentForm.querySelectorAll("select");
    const doctorSelect = selects[2];
    const doctorOptions = within(doctorSelect);

    expect(
      doctorOptions.getByRole("option", { name: "Real Doctor" })
    ).toBeInTheDocument();
    expect(
      doctorOptions.queryByRole("option", { name: "Ayesha Khan" })
    ).not.toBeInTheDocument();
  });

  it("keeps booking available with demo doctors in permissive mode", async () => {
    api.get.mockRejectedValueOnce(new Error("network"));

    const view = render(
      <MemoryRouter>
        <AppointmentForm />
      </MemoryRouter>
    );
    const appointmentForm = view.container.querySelector(".appointment-form");
    const formQueries = within(appointmentForm);

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith("/api/v1/user/doctors");
    });

    expect(toast.info).toHaveBeenCalledWith(
      "Using demo doctors list. Demo mode allows booking unknown doctors."
    );

    const submitButton = formQueries.getByRole("button", {
      name: /get appointment/i,
    });

    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });
  });
});
