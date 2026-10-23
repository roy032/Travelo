import { describe, expect, it } from "vitest";
import { CURRENCIES, currencyLabel, formatMoney } from "./currency";

describe("currency helpers", () => {
  it("formats amounts with the currency's symbol", () => {
    expect(formatMoney(1200, "BDT")).toBe("৳1,200.00");
    expect(formatMoney(10.5, "EUR")).toBe("€10.50");
    expect(formatMoney(1500, "JPY")).toBe("¥1,500");
  });

  it("falls back to the code for anything Intl cannot format", () => {
    expect(formatMoney(3, "NOT-A-CODE")).toBe("NOT-A-CODE 3.00");
  });

  it("labels currencies with their names", () => {
    expect(currencyLabel("BDT")).toBe("BDT – Bangladeshi Taka");
    expect(CURRENCIES).toContain("USD");
  });
});
