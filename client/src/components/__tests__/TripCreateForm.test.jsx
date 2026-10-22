import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import toast from "react-hot-toast";
import TripCreateForm from "../features/trips/TripCreateForm";
import { tripApi } from "../../services/api.service";
import { makeAuth, renderWithProviders } from "../../test/utils";

vi.mock("../../services/api.service", () => ({
  tripApi: { createTrip: vi.fn() },
}));
vi.mock("react-hot-toast", () => ({
  default: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn() }),
}));

const verifiedUser = {
  id: "u1",
  domesticVerification: { status: "verified" },
  internationalVerification: { status: "unverified" },
};

const fillBasics = async () => {
  await userEvent.type(screen.getByLabelText("Trip Title"), "Beach week");
  fireEvent.change(screen.getByLabelText("Start Date"), {
    target: { value: "2030-01-10" },
  });
  fireEvent.change(screen.getByLabelText("End Date"), {
    target: { value: "2030-01-15" },
  });
};

describe("TripCreateForm", () => {
  beforeEach(() => {
    tripApi.createTrip.mockReset();
    toast.error.mockClear();
  });

  it("leaves out an unselected destination type", async () => {
    tripApi.createTrip.mockResolvedValue({ id: "t1" });
    const onSuccess = vi.fn();
    renderWithProviders(
      <TripCreateForm onSuccess={onSuccess} onCancel={vi.fn()} />,
      { auth: makeAuth({ user: verifiedUser, isAuthenticated: true }) }
    );

    await fillBasics();
    await userEvent.click(screen.getByRole("button", { name: "Create Trip" }));

    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith({ id: "t1" }));
    const payload = tripApi.createTrip.mock.calls[0][0];
    expect(payload).not.toHaveProperty("destinationType");
    expect(payload).toMatchObject({
      title: "Beach week",
      tripCategory: "domestic",
      startDate: "2030-01-10",
      endDate: "2030-01-15",
    });
  });

  it("sends the destination type when one is chosen", async () => {
    tripApi.createTrip.mockResolvedValue({ id: "t1" });
    renderWithProviders(
      <TripCreateForm onSuccess={vi.fn()} onCancel={vi.fn()} />,
      { auth: makeAuth({ user: verifiedUser, isAuthenticated: true }) }
    );

    await fillBasics();
    await userEvent.selectOptions(
      screen.getByLabelText("Destination Type"),
      "beach"
    );
    await userEvent.click(screen.getByRole("button", { name: "Create Trip" }));

    await waitFor(() => expect(tripApi.createTrip).toHaveBeenCalled());
    expect(tripApi.createTrip.mock.calls[0][0].destinationType).toBe("beach");
  });

  it("rejects an end date before the start date", async () => {
    renderWithProviders(
      <TripCreateForm onSuccess={vi.fn()} onCancel={vi.fn()} />,
      { auth: makeAuth({ user: verifiedUser, isAuthenticated: true }) }
    );

    await userEvent.type(screen.getByLabelText("Trip Title"), "Beach week");
    fireEvent.change(screen.getByLabelText("Start Date"), {
      target: { value: "2030-01-10" },
    });
    fireEvent.change(screen.getByLabelText("End Date"), {
      target: { value: "2030-01-05" },
    });
    await userEvent.click(screen.getByRole("button", { name: "Create Trip" }));

    expect(
      await screen.findByText("End date must be on or after start date")
    ).toBeInTheDocument();
    expect(tripApi.createTrip).not.toHaveBeenCalled();
  });

  it("stops unverified users from creating a trip in that category", async () => {
    renderWithProviders(
      <TripCreateForm onSuccess={vi.fn()} onCancel={vi.fn()} />,
      { auth: makeAuth({ user: verifiedUser, isAuthenticated: true }) }
    );

    await fillBasics();
    await userEvent.click(screen.getByLabelText(/International/));
    await userEvent.click(screen.getByRole("button", { name: "Create Trip" }));

    expect(toast.error).toHaveBeenCalledWith(
      expect.stringMatching(/verify your passport/)
    );
    expect(tripApi.createTrip).not.toHaveBeenCalled();
  });
});
