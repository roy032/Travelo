import { describe, expect, it, beforeAll } from "vitest";
import request from "supertest";

let app;
beforeAll(async () => {
  process.env.JWT_SECRET ||= "test-secret";
  app = (await import("#src/app.js")).default;
});

describe("request IDs", () => {
  it("gives every response an ID", async () => {
    const res = await request(app).get("/api");
    expect(res.headers["x-request-id"]).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("keeps a well-formed ID from the proxy and replaces a bad one", async () => {
    const kept = await request(app).get("/api").set("X-Request-Id", "lb-1234abcd");
    expect(kept.headers["x-request-id"]).toBe("lb-1234abcd");

    const replaced = await request(app)
      .get("/api")
      .set("X-Request-Id", "<script>alert(1)</script>");
    expect(replaced.headers["x-request-id"]).toMatch(/^[0-9a-f-]{36}$/);
  });
});
