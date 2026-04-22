import { describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import Login from "../Pages/Login";
import Register from "../Pages/Register";
import MessageForm from "../components/MessageForm";
import { Context } from "../context";

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

describe("frontend smoke tests", () => {
  it("renders login form", () => {
    renderWithContext(<Login />);
    expect(screen.getByRole("button", { name: /login/i })).toBeInTheDocument();
  });

  it("renders register form", () => {
    renderWithContext(<Register />);
    expect(
      screen.getByRole("button", { name: /register/i })
    ).toBeInTheDocument();
  });

  it("renders message form", () => {
    render(
      <MemoryRouter>
        <MessageForm />
      </MemoryRouter>
    );
    expect(screen.getByRole("button", { name: /send/i })).toBeInTheDocument();
  });
});
