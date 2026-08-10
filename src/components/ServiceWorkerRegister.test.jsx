import { afterEach, describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import ServiceWorkerRegister from "./ServiceWorkerRegister";

describe("ServiceWorkerRegister", () => {
  afterEach(() => {
    delete navigator.serviceWorker;
  });

  it("renders nothing", () => {
    const { container } = render(<ServiceWorkerRegister />);
    expect(container).toBeEmptyDOMElement();
  });

  it("registers /sw.js when serviceWorker is supported", () => {
    const register = vi.fn(() => Promise.resolve());
    Object.defineProperty(navigator, "serviceWorker", {
      value: { register },
      configurable: true,
    });

    render(<ServiceWorkerRegister />);

    expect(register).toHaveBeenCalledWith("/sw.js");
  });

  it("does nothing (no throw) when serviceWorker isn't supported", () => {
    delete navigator.serviceWorker;
    expect(() => render(<ServiceWorkerRegister />)).not.toThrow();
  });

  it("logs an error if registration fails, without throwing", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const register = vi.fn(() => Promise.reject(new Error("nope")));
    Object.defineProperty(navigator, "serviceWorker", {
      value: { register },
      configurable: true,
    });

    render(<ServiceWorkerRegister />);
    await vi.waitFor(() => expect(consoleError).toHaveBeenCalled());
  });
});
