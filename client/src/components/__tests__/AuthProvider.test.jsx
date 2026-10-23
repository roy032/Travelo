import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import toast from "react-hot-toast";
import { AuthProvider } from "../../context/AuthContext";
import { useAuth } from "../../hooks/useAuth";

vi.mock("react-hot-toast", () => ({
  default: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn() }),
}));

const json = (status, body) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const Probe = () => {
  const { user, loading, isAuthenticated, login, logout } = useAuth();
  if (loading) return <p>checking</p>;
  return (
    <div>
      <p>{isAuthenticated ? `signed in as ${user.name}` : "signed out"}</p>
      <button onClick={() => login({ email: "a@b.com", password: "x" })}>
        login
      </button>
      <button onClick={logout}>logout</button>
    </div>
  );
};

describe("AuthProvider", () => {
  beforeEach(() => {
    toast.error.mockClear();
    toast.success.mockClear();
  });

  it("treats a 401 on load as signed out without an error toast", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(json(401, { error: "Authentication required" }))
    );

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );

    expect(await screen.findByText("signed out")).toBeInTheDocument();
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("restores an existing session", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(json(200, { user: { id: "u1", name: "Ada" } }))
    );

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );

    expect(await screen.findByText("signed in as Ada")).toBeInTheDocument();
  });

  it("logs in and out", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(json(401, {})) // session check
      .mockResolvedValueOnce(json(200, { user: { id: "u1", name: "Ada" } })) // sign-in
      .mockResolvedValueOnce(json(200, { user: { id: "u1", name: "Ada" } })) // profile
      .mockResolvedValueOnce(json(200, { message: "signed out" })); // sign-out
    vi.stubGlobal("fetch", fetchMock);

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );
    await screen.findByText("signed out");

    await userEvent.click(screen.getByRole("button", { name: "login" }));
    expect(await screen.findByText("signed in as Ada")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "logout" }));
    await waitFor(() => expect(screen.getByText("signed out")).toBeInTheDocument());
    expect(fetchMock.mock.calls[3][0]).toMatch(/\/auth\/sign-out$/);
  });
});
