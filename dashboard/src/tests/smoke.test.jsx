import React from "react";
import { describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import Login from "../components/Login";
import AddNewAdmin from "../components/AddNewAdmin";
import AddNewDoctor from "../components/AddNewDoctor";
import { Context } from "../context";

const renderWithContext = (ui, isAuthenticated = false) => {
  return render(
    <Context.Provider
      value={{
        isAuthenticated,
        setIsAuthenticated: vi.fn(),
        admin: {},
        setAdmin: vi.fn(),
      }}
    >
      <MemoryRouter>{ui}</MemoryRouter>
    </Context.Provider>
  );
};

describe("dashboard smoke tests", () => {
  it("renders admin login form", () => {
    renderWithContext(<Login />);
    expect(screen.getByRole("button", { name: /login/i })).toBeInTheDocument();
  });

  it("renders add admin form for authenticated sessions", () => {
    renderWithContext(<AddNewAdmin />, true);
    expect(
      screen.getByRole("button", { name: /add new admin/i })
    ).toBeInTheDocument();
  });

  it("renders add doctor form for authenticated sessions", () => {
    renderWithContext(<AddNewDoctor />, true);
    expect(
      screen.getByRole("button", { name: /register new doctor/i })
    ).toBeInTheDocument();
  });
});
