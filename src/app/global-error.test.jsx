import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";

const mockCaptureException = vi.fn();
vi.mock("@sentry/nextjs", () => ({
  captureException: (...args) => mockCaptureException(...args),
}));

vi.mock("next/error", () => ({
  default: ({ statusCode }) => <div data-testid="next-error">{statusCode}</div>,
}));

const { default: GlobalError } = await import("./global-error");

describe("GlobalError", () => {
  beforeEach(() => {
    mockCaptureException.mockClear();
  });

  it("reports the error to Sentry", () => {
    const error = new Error("boom");

    render(<GlobalError error={error} />);

    expect(mockCaptureException).toHaveBeenCalledWith(error);
  });

  it("re-reports when the error instance changes", () => {
    const error1 = new Error("first");
    const { rerender } = render(<GlobalError error={error1} />);
    expect(mockCaptureException).toHaveBeenCalledWith(error1);

    const error2 = new Error("second");
    rerender(<GlobalError error={error2} />);
    expect(mockCaptureException).toHaveBeenCalledWith(error2);
    expect(mockCaptureException).toHaveBeenCalledTimes(2);
  });
});
