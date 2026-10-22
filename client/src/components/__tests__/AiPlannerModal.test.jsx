import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AiPlannerModal from "../features/trips/AiPlannerModal";
import { ApiError, plannerApi } from "../../services/api.service";
import { expectNoAxeViolations } from "../../test/axe";

vi.mock("react-hot-toast", () => ({
  default: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn() }),
}));

const location = (name) => ({
  name,
  address: "",
  country: "Bangladesh",
  coordinates: { lat: 24.9, lng: 91.8 },
});

const plan = {
  summary: "Two green days in Sylhet.",
  destination: "Sylhet",
  currency: "USD",
  estimatedTotalPerPerson: 80,
  tips: ["Book boats early"],
  days: [
    {
      date: "2030-01-10",
      theme: "Tea country",
      activities: [
        {
          title: "Tea estate walk",
          time: "09:00",
          description: "Guided walk.",
          location: location("Malnicherra"),
          estimatedCost: 5,
        },
        {
          title: "Night market",
          time: "19:00",
          description: "",
          location: location("Zindabazar"),
          estimatedCost: 0,
        },
      ],
    },
    { date: "2030-01-11", theme: "Rest", activities: [] },
  ],
};

const renderModal = (props = {}) =>
  render(
    <AiPlannerModal
      isOpen
      onClose={vi.fn()}
      tripId='trip1'
      trip={{ title: "Sylhet tea gardens" }}
      {...props}
    />
  );

describe("AiPlannerModal", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("asks for a plan and adds only the chosen activities", async () => {
    const user = userEvent.setup();
    const suggest = vi.spyOn(plannerApi, "suggestPlan").mockResolvedValue(plan);
    const apply = vi.spyOn(plannerApi, "applyPlan").mockResolvedValue({});
    const onApplied = vi.fn();
    const onClose = vi.fn();
    const { container } = renderModal({ onApplied, onClose });

    await expectNoAxeViolations(container.ownerDocument.body);

    await user.type(screen.getByLabelText(/Destination/), "Sylhet");
    await user.type(screen.getByLabelText(/Budget per person/), "100");
    await user.selectOptions(screen.getByLabelText("Pace"), "relaxed");
    await user.type(screen.getByLabelText(/Interests/), "tea, food");
    await user.click(screen.getByRole("button", { name: /Create plan/ }));

    expect(suggest).toHaveBeenCalledWith("trip1", {
      destination: "Sylhet",
      budget: { amount: 100, currency: "USD" },
      pace: "relaxed",
      interests: ["tea", "food"],
      notes: "",
    });

    expect(await screen.findByText("Two green days in Sylhet.")).toBeInTheDocument();
    expect(screen.getByText("Free day")).toBeInTheDocument();
    expect(screen.getByText("Book boats early")).toBeInTheDocument();
    await expectNoAxeViolations(container.ownerDocument.body);

    await user.click(screen.getByLabelText(/Night market/));
    await user.click(screen.getByRole("button", { name: "Add 1 activity" }));

    expect(apply).toHaveBeenCalledWith("trip1", [
      {
        title: "Tea estate walk",
        time: "09:00",
        description: "Guided walk.",
        location: location("Malnicherra"),
        date: "2030-01-10",
      },
    ]);
    expect(onApplied).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it("shows what went wrong", async () => {
    const user = userEvent.setup();
    vi.spyOn(plannerApi, "suggestPlan").mockRejectedValue(
      new ApiError("The AI planner can plan trips of up to 14 days", 400, {})
    );
    renderModal();

    await user.click(screen.getByRole("button", { name: /Create plan/ }));
    expect(screen.getByRole("alert")).toHaveTextContent("Enter where you're going");

    await user.type(screen.getByLabelText(/Destination/), "Sylhet");
    await user.click(screen.getByRole("button", { name: /Create plan/ }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/up to 14 days/);
  });
});
