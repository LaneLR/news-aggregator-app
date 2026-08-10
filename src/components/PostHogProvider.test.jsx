import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

let mockSession = null;
let mockStatus = "unauthenticated";
vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: mockSession, status: mockStatus }),
}));

const identify = vi.fn();
const reset = vi.fn();
vi.mock("posthog-js", () => ({
  default: { identify: (...args) => identify(...args), reset: (...args) => reset(...args) },
}));
vi.mock("posthog-js/react", () => ({
  PostHogProvider: ({ children }) => <div data-testid="ph-provider">{children}</div>,
}));

const { default: PostHogProvider } = await import("./PostHogProvider");

describe("PostHogProvider", () => {
  const originalKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;

  beforeEach(() => {
    identify.mockClear();
    reset.mockClear();
    process.env.NEXT_PUBLIC_POSTHOG_KEY = "phc_test_key";
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_POSTHOG_KEY = originalKey;
  });

  it("renders its children through PostHog's own provider", () => {
    mockSession = null;
    mockStatus = "unauthenticated";
    render(
      <PostHogProvider>
        <p>page content</p>
      </PostHogProvider>
    );
    expect(screen.getByTestId("ph-provider")).toBeInTheDocument();
    expect(screen.getByText("page content")).toBeInTheDocument();
  });

  it("does not identify while the session is still loading", () => {
    mockSession = null;
    mockStatus = "loading";
    render(<PostHogProvider>child</PostHogProvider>);
    expect(identify).not.toHaveBeenCalled();
  });

  it("identifies the user once a session with an id is available", () => {
    mockSession = { user: { id: "user-1", email: "test@example.com" } };
    mockStatus = "authenticated";
    render(<PostHogProvider>child</PostHogProvider>);

    expect(identify).toHaveBeenCalledWith("user-1", { email: "test@example.com" });
  });

  it("does not call posthog at all when NEXT_PUBLIC_POSTHOG_KEY isn't set", () => {
    process.env.NEXT_PUBLIC_POSTHOG_KEY = "";
    mockSession = { user: { id: "user-1", email: "test@example.com" } };
    mockStatus = "authenticated";
    render(<PostHogProvider>child</PostHogProvider>);

    expect(identify).not.toHaveBeenCalled();
    expect(reset).not.toHaveBeenCalled();
  });

  it("resets posthog once the user logs out of a previously-identified session", () => {
    mockSession = { user: { id: "user-1", email: "test@example.com" } };
    mockStatus = "authenticated";
    const { rerender } = render(<PostHogProvider>child</PostHogProvider>);
    expect(identify).toHaveBeenCalledWith("user-1", { email: "test@example.com" });

    mockSession = null;
    mockStatus = "unauthenticated";
    rerender(<PostHogProvider>child</PostHogProvider>);

    expect(reset).toHaveBeenCalled();
  });

  it("does not re-identify on a re-render with the same user id (avoids refiring on every session object reference change)", () => {
    mockSession = { user: { id: "user-1", email: "test@example.com" } };
    mockStatus = "authenticated";
    const { rerender } = render(<PostHogProvider>child</PostHogProvider>);
    expect(identify).toHaveBeenCalledTimes(1);

    // New object reference, same id — useSession() commonly returns a new
    // object on every render even when nothing meaningfully changed.
    mockSession = { user: { id: "user-1", email: "test@example.com" } };
    rerender(<PostHogProvider>child</PostHogProvider>);

    expect(identify).toHaveBeenCalledTimes(1);
  });
});
