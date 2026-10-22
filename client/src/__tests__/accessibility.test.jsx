import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { AuthContext } from "../context/auth-context";
import { ThemeProvider } from "../context/ThemeContext";
import Navbar from "../components/layout/Navbar";
import Modal from "../components/ui/Modal";
import FAQ from "../components/landing/FAQ";
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import ExplorePage from "../pages/ExplorePage";
import { makeAuth, renderWithProviders } from "../test/utils";
import { expectNoAxeViolations } from "../test/axe";

const trip = {
  id: "t1",
  title: "Cox's Bazar beach week",
  description: "Sun and sea",
  startDate: "2030-01-10",
  endDate: "2030-01-15",
  destinationType: "beach",
  tripCategory: "domestic",
  ownerId: "owner1",
  members: ["owner1"],
  activities: [],
  checklist: [],
};

const signedIn = makeAuth({
  isAuthenticated: true,
  user: { id: "me", name: "Test User", role: "user" },
});

const renderNavbar = (auth = signedIn) =>
  render(
    <AuthContext.Provider value={auth}>
      <ThemeProvider>
        <MemoryRouter initialEntries={["/explore"]}>
          <Navbar />
        </MemoryRouter>
      </ThemeProvider>
    </AuthContext.Provider>
  );

describe("accessibility (axe)", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(async (url) =>
        new Response(
          JSON.stringify(
            String(url).includes("/trips/explore")
              ? { trips: [trip] }
              : { count: 0, unreadCount: 0, notifications: [] }
          ),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      )
    );
  });

  it("sign-in page", async () => {
    const { container } = renderWithProviders(<LoginPage />);
    await expectNoAxeViolations(container);
  });

  it("sign-in page with validation errors", async () => {
    const { container } = renderWithProviders(<LoginPage />);
    fireEvent.submit(container.querySelector("form"));
    await screen.findByText("Email is required");
    await expectNoAxeViolations(container);
  });

  it("registration page", async () => {
    const { container } = renderWithProviders(<RegisterPage />);
    await expectNoAxeViolations(container);
  });

  it("explore page with results", async () => {
    const { container } = renderWithProviders(<ExplorePage />);
    await screen.findByText("Cox's Bazar beach week");
    await expectNoAxeViolations(container);
  });

  it("signed-out navigation", async () => {
    const { container } = renderNavbar(makeAuth());
    await expectNoAxeViolations(container);
  });

  it("signed-in navigation with the account menu open", async () => {
    const { container } = renderNavbar();
    await userEvent.click(screen.getByRole("button", { name: /^Account menu/ }));
    expect(screen.getByRole("button", { name: "Logout" })).toBeInTheDocument();
    await expectNoAxeViolations(container);
  });

  it("open modal dialog", async () => {
    render(
      <Modal isOpen onClose={() => {}} title='Add expense'>
        <label htmlFor='amount'>Amount</label>
        <input id='amount' />
      </Modal>
    );
    expect(screen.getByRole("dialog", { name: "Add expense" })).toBeInTheDocument();
    await expectNoAxeViolations(document.body);
  });

  it("FAQ accordion", async () => {
    const { container } = render(<FAQ />);
    const [first] = screen.getAllByRole("button", { expanded: false });
    await userEvent.click(first);
    expect(first).toHaveAttribute("aria-expanded", "true");
    await expectNoAxeViolations(container);
  });
});

describe("keyboard access", () => {
  it("Escape closes the account menu and returns focus to its button", async () => {
    renderNavbar();
    const button = screen.getByRole("button", { name: /^Account menu/ });
    await userEvent.click(button);
    expect(button).toHaveAttribute("aria-expanded", "true");

    await userEvent.keyboard("{Escape}");

    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(button).toHaveFocus();
  });

  it("marks the current page in the navigation", () => {
    renderNavbar();
    expect(screen.getByRole("link", { name: "Explore" })).toHaveAttribute(
      "aria-current",
      "page"
    );
  });

  it("keeps Tab inside an open modal and restores focus when it closes", async () => {
    const Harness = ({ open }) => (
      <>
        <button type='button'>Open</button>
        <Modal isOpen={open} onClose={() => {}} title='Edit trip'>
          <input aria-label='Title' />
        </Modal>
      </>
    );
    const { rerender } = render(<Harness open={false} />);
    const opener = screen.getByRole("button", { name: "Open" });
    opener.focus();

    rerender(<Harness open />);
    const close = screen.getByRole("button", { name: "Close modal" });
    const input = screen.getByRole("textbox", { name: "Title" });
    await userEvent.tab();
    expect(close).toHaveFocus();
    await userEvent.tab();
    expect(input).toHaveFocus();
    await userEvent.tab();
    expect(close).toHaveFocus();

    rerender(<Harness open={false} />);
    expect(opener).toHaveFocus();
  });
});
