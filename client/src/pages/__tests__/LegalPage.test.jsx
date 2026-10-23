import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import LegalPage from "../LegalPage";
import { renderWithProviders } from "../../test/utils";
import { expectNoAxeViolations } from "../../test/axe";

describe("LegalPage", () => {
  it("shows the privacy policy with how to export and delete data", async () => {
    const { container } = renderWithProviders(<LegalPage page='privacy' />);
    expect(
      screen.getByRole("heading", { level: 1, name: "Privacy Policy" })
    ).toBeInTheDocument();
    expect(screen.getByText(/download all of your data/i)).toBeInTheDocument();
    expect(document.title).toBe("Privacy Policy | Travelo");
    await expectNoAxeViolations(container);
  });

  it("shows the terms of service", async () => {
    const { container } = renderWithProviders(<LegalPage page='terms' />);
    expect(
      screen.getByRole("heading", { level: 1, name: "Terms of Service" })
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Privacy Policy" })).toHaveAttribute(
      "href",
      "/privacy"
    );
    await expectNoAxeViolations(container);
  });
});
