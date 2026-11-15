// @vitest-environment jsdom

import React from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App.jsx";
import { confirmPasswordReset, getToken } from "./api.js";

vi.mock("./api.js", () => ({
  getFootprintAnalytics: vi.fn(),
  getActivities: vi.fn(),
  addActivity: vi.fn(),
  getToken: vi.fn(() => null),
  login: vi.fn(),
  logout: vi.fn(),
  register: vi.fn(),
  getGoals: vi.fn(),
  createGoal: vi.fn(),
  updateGoal: vi.fn(),
  deleteGoal: vi.fn(),
  getGoalProgress: vi.fn(),
  getMyBadges: vi.fn(),
  getMyProfile: vi.fn(),
  updateMyProfile: vi.fn(),
  getEmissionFactors: vi.fn(),
  getLeaderboard: vi.fn(),
  getMyBenchmark: vi.fn(),
  getOrganisationSummary: vi.fn(),
  getOrganisationEmployees: vi.fn(),
  getAllBadges: vi.fn(),
  downloadCsrReport: vi.fn(),
  requestPasswordReset: vi.fn(),
  confirmPasswordReset: vi.fn(),
}));

describe("password reset navigation", () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.replaceState(null, "", "/");
    vi.mocked(getToken).mockReturnValue(null);
    vi.mocked(confirmPasswordReset).mockReset().mockResolvedValue({});
  });

  afterEach(() => {
    cleanup();
  });

  it("cleans the token URL and returns to sign in after reset succeeds", async () => {
    const user = userEvent.setup();
    window.history.replaceState(
      null,
      "",
      "/#/reset-password?token=reset-test-token"
    );

    render(<App />);

    expect(
      screen.getByRole("heading", { name: "Choose a new password" })
    ).not.toBeNull();
    await waitFor(() => {
      expect(window.location.hash).toBe("");
    });

    await user.type(
      screen.getByPlaceholderText("Choose a new password"),
      "NewCarbonPassword1!"
    );
    await user.type(
      screen.getByPlaceholderText("Re-enter your new password"),
      "NewCarbonPassword1!"
    );
    await user.click(screen.getByRole("button", { name: "Reset password" }));

    await waitFor(() => {
      expect(confirmPasswordReset).toHaveBeenCalledWith(
        "reset-test-token",
        "NewCarbonPassword1!"
      );
      expect(
        screen.getByRole("heading", { name: "Sign in" })
      ).not.toBeNull();
      expect(
        screen.getByRole("status").textContent
      ).toContain("Your password was reset successfully");
    });

    expect(window.location.href).not.toContain("reset-test-token");
    expect(window.location.href).not.toContain("reset-password");
    expect(
      screen.queryByRole("heading", { name: "Choose a new password" })
    ).toBeNull();
  });

  it("keeps the reset screen open and does not show success when confirmation fails", async () => {
    const user = userEvent.setup();
    vi.mocked(confirmPasswordReset).mockRejectedValue(
      new Error("This password reset link is invalid or has expired.")
    );
    window.history.replaceState(
      null,
      "",
      "/#/reset-password?token=expired-test-token"
    );

    render(<App />);
    await user.type(
      screen.getByPlaceholderText("Choose a new password"),
      "NewCarbonPassword1!"
    );
    await user.type(
      screen.getByPlaceholderText("Re-enter your new password"),
      "NewCarbonPassword1!"
    );
    await user.click(screen.getByRole("button", { name: "Reset password" }));

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain(
      "This password reset link is invalid or has expired."
    );
    expect(
      screen.getByRole("heading", { name: "Choose a new password" })
    ).not.toBeNull();
    expect(
      screen.queryByText(/Your password was reset successfully/)
    ).toBeNull();
  });
});
