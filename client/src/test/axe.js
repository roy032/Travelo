import axe from "axe-core";
import { expect } from "vitest";

/**
 * Run axe-core on a rendered container and fail with a readable list of
 * WCAG A/AA violations. Colour contrast is checked in the Playwright suite
 * (e2e/tests/accessibility.spec.js) because jsdom does not compute styles.
 */
export async function expectNoAxeViolations(container) {
  const results = await axe.run(container, {
    runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] },
    rules: { "color-contrast": { enabled: false } },
  });
  const summary = results.violations.map(
    (violation) =>
      `${violation.id}: ${violation.help}\n  ${violation.nodes
        .map((node) => node.target.join(" "))
        .join("\n  ")}`
  );
  expect(summary).toEqual([]);
}
