import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import LiveViewers from "../features/trips/LiveViewers";

const members = [
  { id: "me", name: "Test User" },
  { _id: "m2", name: "Rina Akter" },
];

describe("LiveViewers", () => {
  it("names the other members viewing the trip", () => {
    render(
      <LiveViewers isLive viewerIds={["me", "m2"]} members={members} currentUserId='me' />
    );
    expect(screen.getByRole("status")).toHaveTextContent("Also viewing: Rina Akter");
  });

  it("says updates are live when nobody else is here", () => {
    render(<LiveViewers isLive viewerIds={["me"]} members={members} currentUserId='me' />);
    expect(screen.getByRole("status")).toHaveTextContent(/appear here instantly/);
  });

  it("shows nothing while offline", () => {
    const { container } = render(
      <LiveViewers isLive={false} viewerIds={[]} members={members} currentUserId='me' />
    );
    expect(container).toBeEmptyDOMElement();
  });
});
