import { beforeEach, describe, expect, it, vi } from "vitest";
import { Resend } from "resend";
import { sendEmail } from "./emailer.js";

vi.mock("resend", () => ({ Resend: vi.fn() }));

// emailer.js caches its Resend client in a module-scope `resendClient`
// variable after the first successful construction, so `Resend` itself is
// only actually invoked once across this whole file (subsequent sendEmail
// calls reuse the cached client) — mockSend is what every test actually
// controls per-case. Re-establishing the constructor's mock implementation
// fresh in beforeEach (rather than once at module scope) also protects
// against vitest.setup.js's global `vi.restoreAllMocks()` wiping it between
// tests, regardless of which order tests run in.
const mockSend = vi.fn();

describe("sendEmail", () => {
  beforeEach(() => {
    process.env.RESEND_API_KEY = "test-resend-key";
    process.env.EMAIL_FROM = "Test <test@example.com>";
    mockSend.mockReset();
    Resend.mockReset();
    // Must be a real function (not an arrow function) — emailer.js calls
    // `new Resend(...)`, and arrow functions can't be invoked as
    // constructors.
    Resend.mockImplementation(function MockResend() {
      return { emails: { send: mockSend } };
    });
  });

  it("sends via Resend and returns the response data on success", async () => {
    mockSend.mockResolvedValue({ data: { id: "msg_1" }, error: null });

    const result = await sendEmail({ to: "a@b.com", subject: "Hi", html: "<p>Hi</p>" });

    expect(result).toEqual({ id: "msg_1" });
    expect(mockSend).toHaveBeenCalledWith({
      from: "Test <test@example.com>",
      to: "a@b.com",
      subject: "Hi",
      html: "<p>Hi</p>",
    });
  });

  it("falls back to the default from-address when EMAIL_FROM is unset", async () => {
    delete process.env.EMAIL_FROM;
    mockSend.mockResolvedValue({ data: { id: "msg_1" }, error: null });

    await sendEmail({ to: "a@b.com", subject: "Hi", html: "<p>Hi</p>" });

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ from: "MochaReads <onboarding@resend.dev>" })
    );
  });

  it("throws when RESEND_API_KEY is not configured", async () => {
    delete process.env.RESEND_API_KEY;
    vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(sendEmail({ to: "a@b.com", subject: "Hi", html: "<p>Hi</p>" })).rejects.toThrow(
      "Server is not configured to send emails."
    );
  });

  it("throws Resend's error message when the API call returns an error", async () => {
    mockSend.mockResolvedValue({ data: null, error: { message: "Invalid recipient" } });
    vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(sendEmail({ to: "bad", subject: "Hi", html: "<p>Hi</p>" })).rejects.toThrow(
      "Invalid recipient"
    );
  });

  it("propagates a thrown/rejected error from the Resend client", async () => {
    mockSend.mockRejectedValue(new Error("network unreachable"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(sendEmail({ to: "a@b.com", subject: "Hi", html: "<p>Hi</p>" })).rejects.toThrow(
      "network unreachable"
    );
  });
});
